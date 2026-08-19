import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./_lib/db.js";
import { fail, ok } from "./_lib/http.js";

/**
 * GET /api/cron-ping — 매일 1회 실행 (vercel.json crons).
 *  1) Supabase 무료 플랜 일시정지 방지용 활동 (§3.2 플랜 정책)
 *  2) 개인정보 보관기간 만료 건 자동 파기 (F7, §7-2)
 *     - 문의: retention_until 경과 시 삭제
 *     - 지원서: 이력서 Storage 파일까지 함께 삭제
 * CRON_SECRET 설정 시 Vercel 이 Authorization: Bearer <secret> 를 붙여 외부 호출과 구분한다.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return fail(res, "unauthorized", "cron only", 401);
  }

  const db = adminDb();
  const todayKst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

  // ---- 만료 문의 삭제
  const { data: expiredInq, error: e1 } = await db
    .from("inquiries")
    .delete()
    .lt("retention_until", todayKst)
    .select("id");
  if (e1) return fail(res, "db_error", e1.message, 500);

  // ---- 만료 지원서: 이력서 파일 먼저 지우고 행 삭제
  const { data: expiredApps, error: e2 } = await db
    .from("job_applications")
    .select("id, resume_path")
    .lt("retention_until", todayKst);
  if (e2) return fail(res, "db_error", e2.message, 500);

  const resumePaths = (expiredApps ?? [])
    .map((a) => a.resume_path)
    .filter((p): p is string => Boolean(p));
  if (resumePaths.length) {
    // Storage 삭제 실패는 다음 실행에서 재시도되도록 행 삭제를 중단하지 않는다
    await db.storage.from("resumes").remove(resumePaths).catch(() => undefined);
  }
  if (expiredApps?.length) {
    const { error: e3 } = await db
      .from("job_applications")
      .delete()
      .in("id", expiredApps.map((a) => a.id));
    if (e3) return fail(res, "db_error", e3.message, 500);
  }

  // ---- 90일 지난 알림 정리 (알림센터가 무한히 쌓이지 않게)
  const cutoff = new Date(Date.now() - 90 * 86400 * 1000).toISOString();
  await db.from("notifications").delete().lt("created_at", cutoff);

  return ok(res, {
    pinged: true,
    purgedInquiries: expiredInq?.length ?? 0,
    purgedApplications: expiredApps?.length ?? 0,
  });
}
