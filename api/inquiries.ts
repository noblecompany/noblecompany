import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { adminDb, retentionDate } from "./_lib/db.js";
import { clientIp, fail, ok, rateLimited, verifyTurnstile } from "./_lib/http.js";
import { sendNotificationMail } from "./_lib/mail.js";

/** POST /api/inquiries — 프로젝트 문의 접수 (F1). Contact.tsx 폼과 1:1 */
const Body = z.object({
  company: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(120),
  types: z.array(z.string().max(30)).min(1).max(8),
  budget: z.string().max(30).optional(),
  period: z.string().max(50).optional(),
  message: z.string().max(4000).optional(),
  agree: z.literal(true),                    // 개인정보 수집 동의 (§7-1)
  turnstileToken: z.string().optional(),
  website: z.string().max(0).optional(),     // 허니팟 — 값이 있으면 봇
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return fail(res, "method_not_allowed", "POST only", 405);

  const ip = clientIp(req);
  if (rateLimited(ip)) return fail(res, "rate_limited", "잠시 후 다시 시도해 주세요.", 429);

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "invalid_body", "입력값을 확인해 주세요.", 422);
  }
  const b = parsed.data;

  if (!(await verifyTurnstile(b.turnstileToken, ip))) {
    return fail(res, "bot_suspected", "자동 입력 방지 확인에 실패했습니다.", 403);
  }

  const db = adminDb();
  const { data: row, error } = await db
    .from("inquiries")
    .insert({
      company: b.company,
      name: b.name,
      phone: b.phone,
      email: b.email,
      types: b.types,
      budget: b.budget ?? null,
      period: b.period ?? null,
      message: b.message ?? null,
      source: (req.query.utm_source as string) ?? null,
      privacy_agreed_at: new Date().toISOString(),
      retention_until: retentionDate(3),     // 문의 3년 (§7-2)
    })
    .select("id")
    .single();

  if (error) return fail(res, "db_error", "접수 처리 중 오류가 발생했습니다.", 500);

  // 어드민 알림센터 (F6-①) — 실패해도 접수 자체는 성공으로 처리
  await db.from("notifications").insert({
    type: "inquiry",
    title: `${b.company} 프로젝트 문의`,
    link: `/admin/inquiries?id=${row.id}`,
  });

  // 메일 알림 (F6-②) — Reply-To 를 고객 주소로 달아 '바로 회신' 워크플로 유지
  try {
    await sendNotificationMail({
      subject: `[프로젝트 문의] ${b.company}`,
      replyTo: b.email,
      text: [
        `회사명: ${b.company}`,
        `담당자: ${b.name}`,
        `연락처: ${b.phone}`,
        `이메일: ${b.email}`,
        `문의 종류: ${b.types.join(", ")}`,
        `예산: ${b.budget ?? "미입력"}`,
        `기간: ${b.period ?? "미입력"}`,
        "",
        b.message ?? "",
        "",
        `— 어드민에서 확인: https://e-noble.kr/admin/inquiries?id=${row.id}`,
      ].join("\n"),
    });
  } catch (e) {
    console.error("mail send failed", e);
  }

  return ok(res, { id: row.id }, 201);
}
