import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { adminDb, retentionDate } from "./_lib/db";
import { clientIp, fail, ok, rateLimited, verifyTurnstile } from "./_lib/http";
import { sendNotificationMail } from "./_lib/mail";

/**
 * POST /api/applications — 채용 지원 접수 (F2).
 * 이력서는 사전 발급된 signed URL 로 Storage 에 직접 업로드한 뒤(uploads-resume),
 * 그 경로(resumePath)만 여기로 전달한다.
 */
const Body = z.object({
  postingId: z.string().trim().min(1).max(80),
  postingTitle: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(120),
  careerYears: z.string().max(30).optional(),
  message: z.string().max(4000).optional(),
  resumePath: z.string().max(300).optional(),
  portfolioUrl: z.string().url().max(300).optional(),
  agree: z.literal(true),
  turnstileToken: z.string().optional(),
  website: z.string().max(0).optional(),     // 허니팟
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

  // 게시 중인 공고인지 검증 — 마감·비공개 공고로의 접수 차단
  const { data: posting } = await db
    .from("job_postings")
    .select("id,status,deadline")
    .eq("id", b.postingId)
    .maybeSingle();
  // 공고 CRUD(Phase 2) 전까지는 DB에 공고가 없을 수 있어 스냅샷 제목으로 접수를 허용한다
  if (posting && posting.status !== "published") {
    return fail(res, "posting_closed", "마감되었거나 접수할 수 없는 공고입니다.", 409);
  }

  const { data: row, error } = await db
    .from("job_applications")
    .insert({
      posting_id: posting ? b.postingId : null,
      posting_title: b.postingTitle,
      name: b.name,
      phone: b.phone,
      email: b.email,
      career_years: b.careerYears ?? null,
      message: b.message ?? null,
      resume_path: b.resumePath ?? null,
      portfolio_url: b.portfolioUrl ?? null,
      privacy_agreed_at: new Date().toISOString(),
      retention_until: retentionDate(1),     // 지원서 1년 (§7-2)
    })
    .select("id")
    .single();

  if (error) return fail(res, "db_error", "접수 처리 중 오류가 발생했습니다.", 500);

  await db.from("notifications").insert({
    type: "application",
    title: `${b.name} — ${b.postingTitle} 지원`,
    link: `/admin/applications?id=${row.id}`,
  });

  try {
    await sendNotificationMail({
      subject: `[채용 지원] ${b.postingTitle} — ${b.name}`,
      replyTo: b.email,
      text: [
        `지원 공고: ${b.postingTitle}`,
        `지원자: ${b.name}`,
        `연락처: ${b.phone}`,
        `이메일: ${b.email}`,
        `경력: ${b.careerYears ?? "미입력"}`,
        `이력서: ${b.resumePath ? "첨부됨 (어드민에서 열람)" : "미첨부"}`,
        `포트폴리오: ${b.portfolioUrl ?? "없음"}`,
        "",
        b.message ?? "",
        "",
        `— 어드민에서 확인: https://e-noble.kr/admin/applications?id=${row.id}`,
      ].join("\n"),
    });
  } catch (e) {
    console.error("mail send failed", e);
  }

  return ok(res, { id: row.id }, 201);
}
