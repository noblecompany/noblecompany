import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./_lib/db.js";
import { fail, ok } from "./_lib/http.js";

/**
 * GET /api/site — 연혁·조직도·클라이언트·활성 팝업·기능 토글을 한 번에 (F14·C1·F16).
 * 공개 페이지가 첫 로드에 한 번 호출한다.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return fail(res, "method_not_allowed", "GET only", 405);

  const db = adminDb();
  const now = new Date().toISOString();

  const [historyQ, divisionsQ, teamsQ, clientsQ, popupsQ, settingsQ] = await Promise.all([
    db.from("history_entries").select("*").order("sort_order"),
    db.from("org_divisions").select("*").order("sort_order"),
    db.from("org_teams").select("*").order("sort_order"),
    db.from("clients").select("name").eq("visible", true).order("sort_order"),
    db.from("popups").select("*").eq("active", true).lte("starts_at", now).gte("ends_at", now)
      .order("created_at", { ascending: false }).limit(1),
    db.from("site_settings").select("key, value"),
  ]);

  // 평탄화된 연혁 행 → 프론트 HistoryPeriod 중첩 구조 (src/data/company.ts)
  const periods: { range: string; groups: { year: string | null; label?: string; items: string[] }[] }[] = [];
  for (const r of historyQ.data ?? []) {
    let period = periods.find((p) => p.range === r.range_label);
    if (!period) {
      period = { range: r.range_label, groups: [] };
      periods.push(period);
    }
    const key = r.year ?? r.group_label ?? "";
    let group = period.groups.find((g) => (g.year ?? g.label ?? "") === key);
    if (!group) {
      group = { year: r.year, label: r.group_label ?? undefined, items: [] };
      period.groups.push(group);
    }
    group.items.push(r.body);
  }

  const settings = Object.fromEntries((settingsQ.data ?? []).map((s) => [s.key, s.value]));
  const popup = popupsQ.data?.[0];

  return ok(res, {
    history: periods,
    org: (divisionsQ.data ?? []).map((d) => ({
      division: d.name,
      teams: (teamsQ.data ?? []).filter((t) => t.division_id === d.id).map((t) => t.name),
    })),
    clients: (clientsQ.data ?? []).map((c) => c.name),
    popup: popup && settings["feature.popup"] === true
      ? {
          id: popup.id,
          title: popup.title,
          imagePath: popup.image_path,
          linkUrl: popup.link_url,
        }
      : null,
    settings,
  });
}
