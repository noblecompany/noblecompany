import { createHash } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./_lib/db.js";
import { clientIp, fail, ok, rateLimited } from "./_lib/http.js";

/**
 * GET /api/site — 연혁·조직도·클라이언트·활성 팝업·기능 토글을 한 번에 (F14·C1·F16).
 * 공개 페이지가 첫 로드에 한 번 호출한다.
 *
 * POST /api/site — 접속 통계 수집 (C2). 라우트 이동마다 sendBeacon 으로 1행.
 * 별도 /api/track 함수를 만들지 않는 이유: Vercel Hobby 함수 12개 제한 (현재 11개).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") return trackView(req, res);
  if (req.method !== "GET") return fail(res, "method_not_allowed", "GET only", 405);

  const db = adminDb();
  // GET /api/site?resource=notices[&slug=…] — 공지사항 (함수 12개 제한으로 site 에 동거)
  if (req.query.resource === "notices") return notices(req, res, db);

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

/* ================================================= 공지사항 (공개) */

const mapNotice = (db: ReturnType<typeof adminDb>, r: Record<string, unknown>, full: boolean) => {
  const images = (Array.isArray(r.images) ? r.images : []) as Array<{
    path: string; name: string; size?: number; width?: number; height?: number;
  }>;
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    pinned: r.pinned,
    publishedAt: r.published_at,
    viewCount: r.view_count,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    thumb: images[0] ? db.storage.from("notices").getPublicUrl(images[0].path).data.publicUrl : null,
    ...(full
      ? {
          body: r.body,
          images: images.map((img) => {
            const url = db.storage.from("notices").getPublicUrl(img.path).data.publicUrl;
            return {
              name: img.name,
              size: img.size ?? null,
              width: img.width ?? null,
              height: img.height ?? null,
              url,
              // Supabase 공개 URL 의 download 파라미터 → Content-Disposition: attachment
              downloadUrl: `${url}?download=${encodeURIComponent(img.name)}`,
            };
          }),
        }
      : {}),
  };
};

async function notices(req: VercelRequest, res: VercelResponse, db: ReturnType<typeof adminDb>) {
  const slug = req.query.slug as string | undefined;
  if (slug) {
    const { data, error } = await db
      .from("notices").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
    if (error) return fail(res, "db_error", "조회에 실패했습니다.", 500);
    if (!data) return fail(res, "not_found", "공지를 찾을 수 없습니다.", 404);
    void db.rpc("increment_notice_view", { p_id: data.id }).then(() => undefined, () => undefined);
    return ok(res, mapNotice(db, data, true));
  }
  const { data, error } = await db
    .from("notices")
    .select("id, slug, title, pinned, published_at, view_count, source_name, source_url, images")
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(200);
  if (error) return fail(res, "db_error", "조회에 실패했습니다.", 500);
  return ok(res, (data ?? []).map((r) => mapNotice(db, r, false)));
}

/* ================================================= 접속 통계 수집 (C2) */

const BOT_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|prerender|facebookexternalhit|preview|monitor|pingdom|uptime/i;

async function trackView(req: VercelRequest, res: VercelResponse) {
  // sendBeacon 은 content-type 이 제각각이라 문자열 본문도 직접 파싱한다
  let body: unknown = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  const b = body as { path?: unknown; ref?: unknown; landing?: unknown } | null;
  const path = typeof b?.path === "string" ? b.path.slice(0, 300) : "";
  if (!path.startsWith("/") || path.startsWith("/admin")) return ok(res);
  const ref = typeof b?.ref === "string" ? b.ref.slice(0, 500) : "";
  const landing = b?.landing === true;

  const ua = String(req.headers["user-agent"] ?? "");
  if (!ua || BOT_UA.test(ua)) return ok(res); // 봇·모니터링은 조용히 무시
  const ip = clientIp(req);
  if (rateLimited(`pv:${ip}`, 30)) return ok(res);

  // KST 기준 일자 + 일 단위 익명 방문자 해시 (IP·UA 원문은 저장하지 않는다)
  const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const salt = process.env.TRACK_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "noble";
  const visitorHash = createHash("sha256")
    .update(`${salt}|${ip}|${ua}|${day}`)
    .digest("hex")
    .slice(0, 32);

  const { group, host } = classifyReferrer(ref, landing);
  // 통계는 실패해도 방문자 경험에 영향이 없어야 한다 — 오류는 삼킨다
  await adminDb()
    .from("page_views")
    .insert({ day, path, ref_group: group, ref_host: host, visitor_hash: visitorHash })
    .then(({ error }) => {
      if (error) console.error("track insert", error.message);
    });
  return ok(res);
}

/** 유입 분류 — 랜딩 페이지뷰만 유입처를 가지며, 이후 내부 이동은 internal */
function classifyReferrer(ref: string, landing: boolean): { group: string; host: string | null } {
  if (!landing) return { group: "internal", host: null };
  if (!ref) return { group: "direct", host: null };
  try {
    const host = new URL(ref).hostname.toLowerCase();
    if (host.endsWith("e-noble.kr") || host === "localhost") return { group: "internal", host };
    if (host.includes("naver")) return { group: "naver", host };
    if (host.includes("google")) return { group: "google", host };
    if (host.includes("daum")) return { group: "daum", host };
    if (host.includes("kakao")) return { group: "kakao", host };
    if (host.includes("instagram") || host.includes("facebook") || host.includes("fb.com"))
      return { group: "meta", host };
    if (host.includes("youtube") || host === "youtu.be") return { group: "youtube", host };
    if (host.includes("bing")) return { group: "bing", host };
    return { group: "etc", host };
  } catch {
    return { group: "direct", host: null };
  }
}
