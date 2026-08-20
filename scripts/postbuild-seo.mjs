/**
 * 빌드 후 SEO 산출물 생성 (package.json build 마지막 단계)
 *
 *  1) sitemap.xml — 정적 라우트 + 게시 중 공고·포트폴리오
 *  2) 라우트별 정적 HTML 프리렌더링 (SSG-lite)
 *     dist/index.html 을 템플릿으로 55개 라우트 각각에
 *     고유 title·메타·캐노니컬·JSON-LD·본문 스냅샷을 넣어 dist/<경로>/index.html 로 저장.
 *     네이버처럼 JS 렌더링에 보수적인 크롤러도 첫 HTML 에서 전부 읽을 수 있다.
 *     방문자 브라우저에서는 React 가 곧바로 같은 화면을 다시 그린다(스냅샷 교체).
 *
 * 데이터: Supabase 공개(anon) REST → 실패 시 src/data 하드코딩 폴백.
 * 어드민에서 새 글을 게시하면 다음 배포 때 반영된다.
 */
import { build } from "esbuild";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const BASE = "https://e-noble.kr";
const DIST = "dist";

// ---------- env (Vercel 빌드 env → .env 폴백)
const env = { ...process.env };
if ((!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].trim();
  }
}

async function loadTs(entry) {
  const out = join(mkdtempSync(join(tmpdir(), "noble-seo-")), "mod.mjs");
  await build({ entryPoints: [entry], bundle: true, format: "esm", outfile: out, platform: "neutral" });
  return import(pathToFileURL(out).href);
}

async function fetchRows(table, select, extra = "") {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const r = await fetch(`${url}/rest/v1/${table}?select=${select}${extra}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

// ---------- 데이터 수집 (DB 우선, 로컬 폴백)
let works = await fetchRows(
  "works",
  "id,client,category,industry,objective,strategy,media,hero_path",
  "&status=eq.published&order=rank.asc.nullslast",
);
if (!works) {
  works = (await loadTs("src/data/works.ts")).works.map((w) => ({
    id: w.id, client: w.client, category: w.category, industry: w.industry,
    objective: w.objective, strategy: w.strategy, media: w.media, hero_path: w.hero,
  }));
}

let jobs = await fetchRows(
  "job_postings",
  "id,title,job_group,team,employment,career,location,deadline,summary,responsibilities,requirements,preferred",
  "&status=eq.published&order=sort_order.asc",
);
if (!jobs) {
  jobs = (await loadTs("src/data/careers.ts")).jobPostings.map((j) => ({
    id: j.id, title: j.title, job_group: j.group, team: j.team, employment: j.employment,
    career: j.career, location: j.location, deadline: j.deadline, summary: j.summary,
    responsibilities: j.responsibilities, requirements: j.requirements, preferred: j.preferred,
  }));
}

const { FAQ } = await loadTs("src/data/faq.ts");
const { solutionTools } = await loadTs("src/data/solutions.ts");
const { history } = await loadTs("src/data/company.ts");

// ---------- 헬퍼
const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const template = readFileSync(join(DIST, "index.html"), "utf8");

function renderPage({ path, title, desc, image, jsonLd, body, ogType }) {
  const fullTitle = title ? `${title} | 노블컴퍼니` : "노블컴퍼니 | NOBLE COMPANY";
  const url = BASE + path;
  const img = image ? (image.startsWith("http") ? image : BASE + image) : `${BASE}/og-image.png`;

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${esc(desc)}$2`,
    )
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(fullTitle)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(img)}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1${esc(ogType ?? "website")}$2`);

  const headExtra = [
    `<link rel="canonical" href="${esc(url)}" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : "",
  ]
    .filter(Boolean)
    .join("\n    ");
  html = html.replace("</head>", `    ${headExtra}\n  </head>`);

  // 본문 스냅샷 — React 가 로드되면 같은 내용의 실제 화면으로 교체된다
  if (body) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"><div style="max-width:960px;margin:0 auto;padding:110px 24px 60px;line-height:1.75">${body}</div></div>`,
    );
  }
  return html;
}

function writeRoute(path, html) {
  const file = path === "/" ? join(DIST, "index.html") : join(DIST, path.slice(1), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html, "utf8");
}

const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const a = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;

/* ================================================= 라우트 정의 */

const NAV_LINKS = list([
  a("/about", "회사소개"), a("/work", "포트폴리오"), a("/solution", "솔루션"),
  a("/diagnosis", "무료 사이트 진단"), a("/careers", "채용"), a("/contact", "프로젝트 문의"),
]);

const pages = [];

// 홈 — FAQ 전문 포함 (네이버가 본문으로 읽는다) + FAQPage JSON-LD
pages.push({
  path: "/",
  title: null,
  desc: "네이버 프리미어 파트너사 노블컴퍼니. IMC·SA·DA·VIRAL 통합 광고 대행, 데이터 기반 퍼포먼스 마케팅으로 800개 이상 브랜드의 성장을 만들었습니다.",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a.join(" ") },
    })),
  },
  body: `<h1>노블컴퍼니 — 성과의 차이를 만드는 퍼포먼스 마케팅</h1>
<p>노블컴퍼니는 브랜드를 분석하고 경쟁사를 이해한 후 시작합니다. 목표를 분석하고 데이터를 읽고 전략을 도출해내는 광고회사입니다. IMC · SA · DA · VIRAL, 광고의 시작부터 성과까지 함께합니다.</p>
${NAV_LINKS}
<h2>자주묻는 질문</h2>
${FAQ.map((f) => `<h3>${esc(f.q)}</h3>${f.a.map((p) => `<p>${esc(p)}</p>`).join("")}`).join("")}`,
});

// 포트폴리오 목록
pages.push({
  path: "/work",
  title: "포트폴리오",
  desc: "노블컴퍼니가 집행한 IMC·검색광고·디스플레이·바이럴 캠페인 사례. 교육·병의원·커머스·패션 등 다양한 업종의 실제 광고 운영 전략을 확인하세요.",
  body: `<h1>포트폴리오 — 성과의 차이를 경험한 브랜드</h1>
<p>노블컴퍼니가 집행한 캠페인 사례 ${works.length}건.</p>
${list(works.map((w) => a(`/work/${w.id}`, `${w.client} — ${w.category} 캠페인`)))}`,
});

// 포트폴리오 상세
for (const w of works) {
  pages.push({
    path: `/work/${w.id}`,
    title: `${w.client} ${w.category} 캠페인`,
    desc: `${w.client} ${w.category} 캠페인 사례 — ${w.objective ?? ""}`.slice(0, 160),
    image: w.hero_path,
    ogType: "article",
    body: `<h1>${esc(w.client)} — ${esc(w.category)} 캠페인</h1>
${w.industry ? `<p>업종: ${esc(w.industry)}</p>` : ""}
${w.objective ? `<h2>Situation</h2><p>${esc(w.objective)}</p>` : ""}
${w.strategy ? `<h2>Solution</h2><p>${esc(w.strategy)}</p>` : ""}
${w.media ? `<p>집행 매체: ${esc(w.media)}</p>` : ""}
<p>${a("/work", "포트폴리오 전체 보기")} · ${a("/contact", "프로젝트 문의")}</p>`,
  });
}

// 솔루션
pages.push({
  path: "/solution",
  title: "솔루션",
  desc: "부정클릭 차단, 순위 추적, 데이터 분석 등 노블컴퍼니가 운용하는 디지털 마케팅 솔루션. 새는 광고 예산을 막고 성과를 데이터로 관리합니다.",
  body: `<h1>솔루션 — 디지털 마케팅에 필요한 모든 솔루션</h1>
${list(solutionTools.map((t) => `${esc(t.name)} — ${esc(t.tagline ?? t.desc ?? "")}`))}
${NAV_LINKS}`,
});

// 무료 진단
pages.push({
  path: "/diagnosis",
  title: "무료 사이트 진단 (AEO·GEO)",
  desc: "URL 만 입력하면 33개 항목을 즉시 점검 — 검색엔진 최적화(AEO)·AI 검색 최적화(GEO)·키워드 분석과 광고연관 준비도 점수를 무료로 확인하세요.",
  body: `<h1>무료 사이트 진단 — AEO·GEO 최적화 점검</h1>
<p>주소만 입력하면 수집·색인·AEO(검색엔진 최적화)·GEO(AI 검색 최적화)·키워드까지 33개 항목을 즉시 점검해 등급을 알려드립니다.</p>
${list(["수집 점검 — 응답 상태·속도·robots.txt", "색인 점검 — noindex·캐노니컬·사이트맵", "AEO 점검 — 타이틀·메타·H1·OG·구조화 데이터", "GEO 점검 — AI 검색(ChatGPT·Perplexity) 인용 최적화"])}
<p>${a("/contact", "전체 리포트 무료 상담 신청")}</p>`,
});

// 회사소개 3탭
const historyText = history
  .map((p) => `<h3>${esc(p.range)}</h3>${p.groups.map((g) => `<p>${esc(g.year ?? g.label ?? "")}: ${esc(g.items.join(", "))}</p>`).join("")}`)
  .join("");
pages.push({
  path: "/about",
  title: "회사소개",
  desc: "노블컴퍼니는 데이터와 크리에이티브로 브랜드의 성장을 만드는 퍼포먼스 마케팅 기업입니다. 조직 구성과 회사 정보를 확인하세요.",
  body: `<h1>노블컴퍼니 소개</h1>
<p>노블컴퍼니는 데이터와 크리에이티브로 브랜드의 성장을 만드는 퍼포먼스 마케팅 기업입니다. 2011년 법인 설립 이후 병의원·교육·커머스·공공 등 다양한 업종의 캠페인을 집행하며 데이터 기반의 광고 운영 역량을 쌓아왔습니다. 네이버 프리미어 파트너사이자 카카오 공식대행사입니다.</p>
${NAV_LINKS}`,
});
pages.push({
  path: "/about/vision",
  title: "비전",
  desc: "Be the Best Growth Partner — No.1 Performance Marketing Company. 데이터로 증명하고 크리에이티브로 완성하는 통합 마케팅 파트너.",
  body: `<h1>노블컴퍼니 비전</h1><p>미션: Be the Best Growth Partner</p><p>비전: No.1 Performance Marketing Company</p><p>목표: 데이터로 증명하고 크리에이티브로 완성하는 통합 마케팅 파트너</p>${NAV_LINKS}`,
});
pages.push({
  path: "/about/history",
  title: "연혁",
  desc: "2011년 설립부터 네이버 프리미어 파트너사 선정까지 — 노블컴퍼니의 성장 연혁과 주요 인증·수상 이력.",
  body: `<h1>노블컴퍼니 연혁</h1>${historyText}${NAV_LINKS}`,
});

// 채용 목록·상세
pages.push({
  path: "/careers",
  title: "채용",
  desc: "노블컴퍼니 채용 — 광고기획(AE)·퍼포먼스 마케터·콘텐츠 디자이너·바이럴 등 진행 중인 공고를 확인하고 온라인으로 바로 지원하세요.",
  body: `<h1>노블컴퍼니 채용</h1>
<p>진행 중인 공고 ${jobs.length}건.</p>
${list(jobs.map((j) => a(`/careers/${j.id}`, `${j.title} — ${j.team} · ${j.employment} · ${j.career}`)))}`,
});
for (const j of jobs) {
  pages.push({
    path: `/careers/${j.id}`,
    title: `${j.title} 채용`,
    desc: `${j.summary} — ${j.team} · ${j.employment} · ${j.career}. 노블컴퍼니에서 온라인으로 바로 지원하세요.`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: j.title,
      description: [j.summary, ...(j.responsibilities ?? [])].join(" "),
      employmentType: j.employment === "정규직" ? "FULL_TIME" : j.employment === "계약직" ? "CONTRACTOR" : "INTERN",
      ...(j.deadline ? { validThrough: `${j.deadline}T23:59:59+09:00` } : {}),
      hiringOrganization: { "@type": "Organization", name: "주식회사 노블컴퍼니", sameAs: BASE },
      jobLocation: {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressCountry: "KR", addressLocality: "서울특별시 강동구", streetAddress: "성내로 48 (성내동, 씨네월드) 6층" },
      },
    },
    body: `<h1>${esc(j.title)} — 노블컴퍼니 채용</h1>
<p>${esc(j.summary)}</p>
<p>${esc(j.job_group)} · ${esc(j.team)} · ${esc(j.employment)} · ${esc(j.career)} · ${esc(j.location)} · ${j.deadline ? `~${esc(j.deadline)}` : "상시채용"}</p>
${j.responsibilities?.length ? `<h2>주요 업무</h2>${list(j.responsibilities.map(esc))}` : ""}
${j.requirements?.length ? `<h2>자격 요건</h2>${list(j.requirements.map(esc))}` : ""}
${j.preferred?.length ? `<h2>우대 사항</h2>${list(j.preferred.map(esc))}` : ""}
<p>${a("/careers", "채용공고 전체 보기")}</p>`,
  });
}

// 문의·정책
pages.push({
  path: "/contact",
  title: "프로젝트 문의",
  desc: "노블컴퍼니에 광고·마케팅 프로젝트를 문의하세요. 문의 유형만 선택하면 담당 AE가 브랜드 상황에 맞는 방향을 무료로 제안합니다. 02-474-1941",
  body: `<h1>프로젝트 문의 — 노블컴퍼니</h1>
<p>광고문의 02-474-1941 · noble@e-noble.kr</p><p>제휴문의 02-2088-7062 · kbn@e-noble.kr</p><p>채용문의 02-2088-7047 · hrm@e-noble.kr</p>
<p>주소: 서울 강동구 성내로 48 (성내동, 씨네월드) 6층</p>${NAV_LINKS}`,
});
pages.push({
  path: "/privacy",
  title: "개인정보처리방침",
  desc: "주식회사 노블컴퍼니의 개인정보 수집·이용·보관·파기에 관한 처리방침입니다.",
  body: `<h1>개인정보처리방침</h1><p>주식회사 노블컴퍼니의 개인정보 수집·이용·보관·파기에 관한 처리방침입니다.</p>${NAV_LINKS}`,
});
pages.push({
  path: "/email-policy",
  title: "이메일무단수집거부",
  desc: "노블컴퍼니 웹사이트의 이메일 주소 무단 수집 거부 고지입니다.",
  body: `<h1>이메일무단수집거부</h1><p>본 웹사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적 장치를 이용하여 무단으로 수집되는 것을 거부합니다.</p>${NAV_LINKS}`,
});

/* ================================================= 실행 */

for (const page of pages) {
  writeRoute(page.path, renderPage(page));
}

// sitemap.xml
const today = new Date().toISOString().slice(0, 10);
const priorities = { "/": "1.0", "/work": "0.9", "/solution": "0.8", "/diagnosis": "0.8", "/about": "0.8", "/careers": "0.7", "/contact": "0.8" };
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map((p) => `  <url><loc>${BASE + p.path}</loc><lastmod>${today}</lastmod><priority>${priorities[p.path] ?? "0.5"}</priority></url>`)
  .join("\n")}
</urlset>
`;
writeFileSync(join(DIST, "sitemap.xml"), xml, "utf8");

console.log(`프리렌더링 완료 — 페이지 ${pages.length}개 (포트폴리오 ${works.length}, 공고 ${jobs.length}) + sitemap.xml`);
