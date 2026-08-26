/**
 * 배포본 SEO·OG 전수 감사 — sitemap.xml 의 모든 URL 을 돌며 메타·OG·JSON-LD·본문·OG 이미지 응답을 검사한다.
 * 실행: node scripts/seo-audit.mjs [host]   (기본 https://noblecompany.vercel.app)
 * 커트오버 전에는 e-noble.kr 로 박힌 절대 URL 을 현재 호스트로 치환해 검사한다.
 */
const HOST = (process.argv[2] ?? "https://noblecompany.vercel.app").replace(/\/$/, "");
const CANON = "https://e-noble.kr";
const toHost = (u) => u.replace(CANON, HOST);

const get = async (url, opts = {}) => {
  const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000), ...opts });
  return r;
};
// 속성값의 HTML 엔티티를 되돌려 실제 노출 길이로 측정한다
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const pick = (html, re) => { const m = html.match(re)?.[1]; return m ? unesc(m.trim()) : null; };
const meta = (html, attr, key) =>
  pick(html, new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*content="([^"]*)"`, "i")) ??
  pick(html, new RegExp(`<meta[^>]+content="([^"]*)"[^>]*${attr}=["']${key}["']`, "i"));

// ---------- 정적 파일
console.log(`== 호스트: ${HOST}\n`);
for (const f of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/og-image-v2.png", "/favicon.png", "/apple-touch-icon.png"]) {
  const r = await get(HOST + f, { method: "HEAD" });
  console.log(`${r.ok ? "✓" : "✗"} ${f}  ${r.status} ${r.headers.get("content-type") ?? ""}`);
}

const sm = await (await get(HOST + "/sitemap.xml")).text();
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`\n== sitemap URL ${locs.length}개\n`);

const rows = [];
const imgCache = new Map();
const checkImg = async (u) => {
  if (!u) return "없음";
  const target = toHost(u);
  if (imgCache.has(target)) return imgCache.get(target);
  let res;
  try {
    const r = await get(target, { method: "HEAD" });
    res = r.ok && /image\//.test(r.headers.get("content-type") ?? "") ? "OK" : `HTTP ${r.status}`;
  } catch (e) {
    res = "ERR";
  }
  imgCache.set(target, res);
  return res;
};

for (const loc of locs) {
  const url = toHost(loc);
  let html = "";
  let status = 0;
  try {
    const r = await get(url);
    status = r.status;
    html = await r.text();
  } catch {
    rows.push({ path: loc.replace(CANON, ""), status: "ERR" });
    continue;
  }
  const title = pick(html, /<title>([\s\S]*?)<\/title>/i);
  const desc = meta(html, "name", "description");
  const ogTitle = meta(html, "property", "og:title");
  const ogDesc = meta(html, "property", "og:description");
  const ogImage = meta(html, "property", "og:image");
  const ogUrl = meta(html, "property", "og:url");
  const ogType = meta(html, "property", "og:type");
  const canonical = pick(html, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const jsonld = (html.match(/application\/ld\+json/g) ?? []).length;
  const h1 = pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const imgState = await checkImg(ogImage);
  rows.push({
    path: loc.replace(CANON, ""), status, title, desc, ogTitle, ogDesc, ogImage, ogUrl, ogType,
    canonical, jsonld, h1: h1 ? h1.replace(/<[^>]+>/g, "").slice(0, 40) : null, imgState,
  });
}

// ---------- 문제 탐지
const issues = [];
const titles = new Map();
const descs = new Map();
for (const r of rows) {
  const p = r.path || "/";
  if (r.status !== 200) issues.push(`[${p}] HTTP ${r.status}`);
  if (!r.title) issues.push(`[${p}] title 없음`);
  else if (r.title.length > 60) issues.push(`[${p}] title ${r.title.length}자 (60자 초과)`);
  if (!r.desc) issues.push(`[${p}] description 없음`);
  else if (r.desc.length < 40) issues.push(`[${p}] description ${r.desc.length}자 (너무 짧음)`);
  else if (r.desc.length > 160) issues.push(`[${p}] description ${r.desc.length}자 (160자 초과 — 검색결과에서 잘림)`);
  if (!r.ogTitle || !r.ogDesc || !r.ogImage || !r.ogUrl) issues.push(`[${p}] OG 태그 누락 (${["ogTitle","ogDesc","ogImage","ogUrl"].filter((k) => !r[k]).join(",")})`);
  if (r.imgState !== "OK") issues.push(`[${p}] og:image 응답 이상: ${r.imgState} — ${r.ogImage}`);
  if (!r.canonical) issues.push(`[${p}] canonical 없음`);
  else if (r.canonical !== CANON + (r.path || "/") && r.canonical !== CANON + r.path) issues.push(`[${p}] canonical 불일치: ${r.canonical}`);
  if (r.ogUrl && r.ogUrl !== r.canonical) issues.push(`[${p}] og:url ≠ canonical`);
  if (!r.h1) issues.push(`[${p}] 본문 스냅샷 h1 없음 (프리렌더 미적용?)`);
  if (r.title) titles.set(r.title, [...(titles.get(r.title) ?? []), p]);
  if (r.desc) descs.set(r.desc, [...(descs.get(r.desc) ?? []), p]);
}
for (const [t, ps] of titles) if (ps.length > 1) issues.push(`중복 title "${t.slice(0, 40)}…" ← ${ps.join(", ")}`);
for (const [d, ps] of descs) if (ps.length > 1) issues.push(`중복 description ← ${ps.join(", ")}`);

// ---------- 출력
const pad = (s, n) => String(s ?? "").padEnd(n).slice(0, n);
console.log(pad("경로", 46) + pad("HTTP", 5) + pad("T", 3) + pad("D", 4) + pad("OG", 3) + pad("img", 9) + pad("canon", 6) + pad("LD", 3) + "h1");
for (const r of rows) {
  console.log(
    pad(r.path || "/", 46) + pad(r.status, 5) + pad(r.title ? r.title.length : "-", 3) + pad(r.desc ? r.desc.length : "-", 4) +
    pad(r.ogTitle && r.ogImage ? "✓" : "✗", 3) + pad(r.imgState, 9) + pad(r.canonical ? "✓" : "✗", 6) + pad(r.jsonld, 3) + (r.h1 ? "✓ " + r.h1 : "✗"),
  );
}
console.log(`\n== 발견된 문제 ${issues.length}건`);
issues.forEach((i) => console.log(" -", i));
