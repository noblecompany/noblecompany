import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./_lib/db.js";
import { fail, ok } from "./_lib/http.js";

/**
 * GET /api/jobs           — 게시 중 공고 목록 (?group=퍼포먼스 필터)
 * GET /api/jobs?id=슬러그  — 공고 상세 (조회수 +1)
 * 프론트 JobPosting 타입과 같은 모양으로 반환한다 (src/data/careers.ts).
 */
const mapJob = (r: Record<string, unknown>) => ({
  id: r.id,
  title: r.title,
  group: r.job_group,
  team: r.team,
  employment: r.employment,
  career: r.career,
  location: r.location,
  deadline: r.deadline,
  summary: r.summary,
  responsibilities: r.responsibilities,
  requirements: r.requirements,
  preferred: r.preferred,
  // 외부 채용 플랫폼 지원 링크 — [{label, url}] (컬럼 미적용/없음이면 빈 배열)
  applyLinks: Array.isArray(r.apply_links) ? r.apply_links : [],
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return fail(res, "method_not_allowed", "GET only", 405);
  const db = adminDb();

  const id = req.query.id as string | undefined;
  if (id) {
    const { data, error } = await db
      .from("job_postings")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    if (error) return fail(res, "db_error", "조회에 실패했습니다.", 500);
    if (!data) return fail(res, "not_found", "공고를 찾을 수 없습니다.", 404);
    // 조회수는 실패해도 응답에는 영향 없음
    void db.rpc("increment_job_view", { p_id: id }).then(() => undefined, () => undefined);
    return ok(res, mapJob(data));
  }

  let q = db
    .from("job_postings")
    .select("*")
    .eq("status", "published")
    .order("sort_order")
    .order("created_at", { ascending: false });
  const group = req.query.group as string | undefined;
  if (group) q = q.eq("job_group", group);

  const { data, error } = await q;
  if (error) return fail(res, "db_error", "조회에 실패했습니다.", 500);
  return ok(res, (data ?? []).map(mapJob));
}
