import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { adminDb } from "./_lib/db.js";
import { fail, ok } from "./_lib/http.js";

/**
 * GET  /api/brochure — 최신 회사소개서 메타 + 파일 URL (F13)
 * POST /api/brochure { id, action: 'view'|'download' } — 열람·다운로드 집계
 * file_path 가 '/'로 시작하면 public/ 정적 자산, 아니면 Storage 'brochures' 공개 버킷 경로.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = adminDb();

  if (req.method === "GET") {
    const { data, error } = await db
      .from("brochures")
      .select("*")
      .eq("is_current", true)
      .maybeSingle();
    if (error) return fail(res, "db_error", "조회에 실패했습니다.", 500);
    if (!data) return ok(res, null);

    const url = data.file_path.startsWith("/")
      ? data.file_path
      : db.storage.from("brochures").getPublicUrl(data.file_path).data.publicUrl;

    return ok(res, {
      id: data.id,
      version: data.version,
      url,
      fileSize: data.file_size,
    });
  }

  if (req.method === "POST") {
    const Body = z.object({
      id: z.string().uuid(),
      action: z.enum(["view", "download"]),
    });
    const p = Body.safeParse(req.body);
    if (!p.success) return fail(res, "invalid_body", "입력값을 확인해 주세요.", 422);
    await db.rpc("increment_brochure", { p_id: p.data.id, p_action: p.data.action });
    return ok(res);
  }

  return fail(res, "method_not_allowed", "GET/POST only", 405);
}
