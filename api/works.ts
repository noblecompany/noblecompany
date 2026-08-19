import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./_lib/db.js";
import { fail, ok } from "./_lib/http.js";

/**
 * GET /api/works — 게시 중 포트폴리오 목록 (F5).
 * 프론트 WorkItem 타입과 같은 모양으로 반환한다 (src/data/works.ts).
 * thumb/hero 가 '/'로 시작하면 public/ 정적 자산, 아니면 Storage 공개 URL 이다.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return fail(res, "method_not_allowed", "GET only", 405);

  const db = adminDb();
  const { data, error } = await db
    .from("works")
    .select("*")
    .eq("status", "published")
    .order("rank", { ascending: true, nullsFirst: false });
  if (error) return fail(res, "db_error", "조회에 실패했습니다.", 500);

  return ok(res, (data ?? []).map((r) => ({
    id: r.id,
    client: r.client,
    category: r.category,
    industry: r.industry,
    team: r.team ?? "",
    mediaType: r.media_type ?? "",
    objective: r.objective ?? "",
    strategy: r.strategy ?? "",
    media: r.media ?? "",
    result: r.result,
    thumb: r.thumb_path ?? "",
    hero: r.hero_path ?? "",
    rank: r.rank,
  })));
}
