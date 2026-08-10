import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./_lib/db.js";
import { fail, ok } from "./_lib/http.js";

/**
 * GET /api/cron-ping — Supabase 무료 플랜 일시정지 방지용 일일 활동 (§3.2 플랜 정책).
 * vercel.json 의 crons 가 매일 호출한다. CRON_SECRET 설정 시 Vercel 이
 * Authorization: Bearer <secret> 헤더를 붙여 외부 호출과 구분한다.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return fail(res, "unauthorized", "cron only", 401);
  }

  const { error } = await adminDb().from("site_settings").select("key").limit(1);
  if (error) return fail(res, "db_error", error.message, 500);
  return ok(res, { pinged: true });
}
