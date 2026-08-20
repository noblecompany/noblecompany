import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { adminDb } from "./_lib/db.js";
import { clientIp, fail, ok, rateLimited } from "./_lib/http.js";

/**
 * POST /api/analyze — 웹사이트 AEO·GEO 진단 (역기획: 네이버 애드부스트 진단보고서).
 * 대상 URL 의 HTML 을 서버에서 받아 수집·색인·AEO·GEO 4개 카테고리를 점검하고
 * 키워드 요약을 만든 뒤 등급(A+~F)을 매긴다.
 *
 * 방문자에게는 요약(등급·카운트·키워드 상위·경고 티저)만 돌려주고,
 * 전체 리포트는 seo_audits 에 저장해 어드민 상담 자료로 쓴다 (리드 확보 퍼널).
 */

export const config = { maxDuration: 30 };

const Body = z.object({
  url: z.string().trim().min(4).max(500),
  website: z.string().max(0).optional(), // 허니팟
});

type Status = "pass" | "warn" | "fail";
type Category = "collect" | "index" | "aeo" | "geo";

interface Check {
  id: string;
  category: Category;
  label: string;
  status: Status;
  value: string;
  advice?: string;
  evidence?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return fail(res, "method_not_allowed", "POST only", 405);

  const ip = clientIp(req);
  if (rateLimited(`analyze:${ip}`, 3, 60_000)) {
    return fail(res, "rate_limited", "잠시 후 다시 시도해 주세요. (분당 3회 제한)", 429);
  }

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return fail(res, "invalid_body", "URL 을 확인해 주세요.", 422);
  if (parsed.data.website) return fail(res, "bot_suspected", "요청을 처리할 수 없습니다.", 403);

  // URL 정규화 — 스킴 없이 들어오면 https 를 붙인다
  let target: URL;
  try {
    const raw = parsed.data.url.match(/^https?:\/\//) ? parsed.data.url : `https://${parsed.data.url}`;
    target = new URL(raw);
    if (!/\./.test(target.hostname)) throw new Error("host");
  } catch {
    return fail(res, "invalid_url", "올바른 주소가 아닙니다. 예) www.example.com", 422);
  }
  // 내부망 주소 차단 (SSRF 방지)
  if (/^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|\[::1\])/.test(target.hostname)) {
    return fail(res, "invalid_url", "진단할 수 없는 주소입니다.", 422);
  }

  // ---------- 페이지 수집
  const UA =
    "Mozilla/5.0 (compatible; NobleAudit/1.0; +https://e-noble.kr) AppleWebKit/537.36 Chrome/120 Safari/537.36";
  const started = Date.now();
  let resp: Response;
  let html = "";
  try {
    resp = await fetch(target.href, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    html = await resp.text();
  } catch {
    return fail(
      res,
      "fetch_failed",
      "사이트에 접속할 수 없습니다. 주소를 확인하거나, 방화벽이 봇 접근을 차단하는 사이트일 수 있습니다.",
      422,
    );
  }
  const timeMs = Date.now() - started;
  const finalUrl = new URL(resp.url || target.href);
  const sizeKb = Math.round((Buffer.byteLength(html, "utf8") / 1024) * 10) / 10;

  // ---------- 부속 파일 (실패해도 진단은 계속)
  const probe = async (path: string): Promise<{ ok: boolean; text: string }> => {
    try {
      const r = await fetch(new URL(path, finalUrl.origin).href, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(5_000),
      });
      return { ok: r.ok, text: r.ok ? (await r.text()).slice(0, 20_000) : "" };
    } catch {
      return { ok: false, text: "" };
    }
  };
  const [robots, sitemap, llms] = await Promise.all([
    probe("/robots.txt"),
    probe("/sitemap.xml"),
    probe("/llms.txt"),
  ]);

  // ---------- HTML 파싱 (정규식 기반 — 진단 목적에는 충분)
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? html.slice(0, 30_000);
  const pick = (re: RegExp, s = html) => s.match(re)?.[1]?.trim() ?? null;
  const metaContent = (name: string) =>
    pick(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i")) ??
    pick(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i"));

  const titles = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => m[1].trim());
  const title = titles[0] ?? null;
  const description = metaContent("description");
  const h1s = [...html.matchAll(/<h1[\b\s>]/gi)];
  const h2s = [...html.matchAll(/<h2[\b\s>]/gi)];
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imgsNoAlt = imgs.filter((t) => !/\salt\s*=\s*["'][^"']+["']/i.test(t));
  const anchors = [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]);
  const httpLinks = finalUrl.protocol === "https:" ? anchors.filter((h) => h.startsWith("http://")) : [];
  const jsLinks = anchors.filter((h) => h === "#" || h.startsWith("javascript:"));
  const headScripts = [...head.matchAll(/<script\b[^>]*src=[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => !/\b(defer|async|type=["']module["'])/i.test(t));
  const headStyles = [...head.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)].map((m) => m[0]);
  const blocking = headScripts.length + headStyles.length;
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(head);
  const hasCharset = /<meta[^>]+charset/i.test(head) || /charset=/i.test(resp.headers.get("content-type") ?? "");
  const canonical = pick(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i, head);
  const langAttr = pick(/<html[^>]*\blang=["']([^"']*)["']/i);
  const favicon = /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(head);
  const robotsMeta = metaContent("robots") ?? "";
  const noindex = /noindex/i.test(robotsMeta);
  const ldJson = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const schemaTypes = new Set<string>();
  for (const m of ldJson) {
    for (const t of m[1].matchAll(/"@type"\s*:\s*"([^"]+)"/g)) schemaTypes.add(t[1]);
  }
  const hasMicrodata = /\bitemscope\b/i.test(html);
  const ogTitle = metaContent("og:title");
  const ogDesc = metaContent("og:description");
  const ogImage = metaContent("og:image");

  // robots.txt 차단 여부 (User-agent: * 블록의 Disallow 만 간이 검사)
  let robotsBlocked = false;
  if (robots.ok) {
    const lines = robots.text.split(/\r?\n/);
    let inStar = false;
    for (const line of lines) {
      const ua = line.match(/^\s*user-agent\s*:\s*(.+)$/i);
      if (ua) inStar = ua[1].trim() === "*";
      const dis = line.match(/^\s*disallow\s*:\s*(.+)$/i);
      if (inStar && dis) {
        const rule = dis[1].trim();
        if (rule === "/" || (rule.length > 1 && finalUrl.pathname.startsWith(rule))) robotsBlocked = true;
      }
    }
  }

  // ---------- 본문 텍스트·키워드
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const STOP = new Set([
    "있는", "있습니다", "합니다", "하는", "위한", "대한", "그리고", "또는", "및", "등",
    "the", "and", "for", "with", "you", "are", "this", "that", "from", "your", "not", "all",
  ]);
  const tokens = (visible.match(/[가-힣a-zA-Z0-9]+/g) ?? [])
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 2 && !/^\d+$/.test(t) && !STOP.has(t));
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  const phraseFreq = new Map<string, number>();
  for (let i = 0; i < tokens.length - 1; i++) {
    const p = `${tokens[i]} ${tokens[i + 1]}`;
    phraseFreq.set(p, (phraseFreq.get(p) ?? 0) + 1);
  }
  const titleLower = (title ?? "").toLowerCase();
  const descLower = (description ?? "").toLowerCase();
  const words = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => ({
      word,
      count,
      rate: Math.round((count / Math.max(1, tokens.length)) * 10000) / 100,
      inTitle: titleLower.includes(word),
      inDesc: descLower.includes(word),
    }));
  const phrases = [...phraseFreq.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([phrase, count]) => ({ phrase, count }));

  // ---------- 점검 항목
  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  // 수집
  add({
    id: "http-status", category: "collect", label: "HTTP 응답 상태",
    status: resp.ok ? "pass" : "fail", value: `${resp.status}`,
    advice: resp.ok ? undefined : "페이지가 정상 응답(200)하지 않습니다. 서버 상태를 확인하세요.",
  });
  add({
    id: "https", category: "collect", label: "HTTPS 보안 연결",
    status: finalUrl.protocol === "https:" ? "pass" : "warn", value: finalUrl.protocol.replace(":", ""),
    advice: finalUrl.protocol === "https:" ? undefined : "검색엔진과 브라우저가 HTTP 사이트의 신뢰도를 낮게 평가합니다. SSL 인증서를 적용하세요.",
  });
  add({
    id: "response-time", category: "collect", label: "다운로드 소요 시간",
    status: timeMs < 3000 ? "pass" : timeMs < 8000 ? "warn" : "fail", value: `${timeMs} ms`,
    advice: timeMs < 3000 ? undefined : "응답이 느리면 수집 봇이 페이지를 건너뛸 수 있습니다. 서버·이미지 최적화를 권장합니다.",
  });
  add({
    id: "page-size", category: "collect", label: "페이지 다운로드 크기",
    status: sizeKb < 1536 ? "pass" : sizeKb < 4096 ? "warn" : "fail", value: `${(sizeKb / 1024).toFixed(2)} MB`,
    advice: sizeKb < 1536 ? undefined : "HTML 이 지나치게 큽니다. 불필요한 인라인 리소스를 줄이세요.",
  });
  add({
    id: "redirect", category: "collect", label: "리다이렉트",
    status: resp.redirected ? "warn" : "pass",
    value: resp.redirected ? `최종: ${finalUrl.href.slice(0, 90)}` : "없음",
    advice: resp.redirected ? "리다이렉트 체인이 길면 수집 효율이 떨어집니다. 최종 URL 을 직접 사용하세요." : undefined,
  });
  add({
    id: "charset", category: "collect", label: "문자 인코딩 선언",
    status: hasCharset ? "pass" : "warn", value: hasCharset ? "선언됨" : "누락",
    advice: hasCharset ? undefined : "<meta charset=\"utf-8\"> 선언을 추가하세요.",
  });
  add({
    id: "robots-txt", category: "collect", label: "robots.txt",
    status: robots.ok ? "pass" : "warn", value: robots.ok ? "존재" : "없음",
    advice: robots.ok ? undefined : "robots.txt 가 없으면 수집 범위를 제어할 수 없습니다.",
  });
  add({
    id: "robots-block", category: "collect", label: "robots.txt 수집 차단",
    status: robotsBlocked ? "fail" : "pass", value: robotsBlocked ? "이 페이지가 차단됨" : "차단 없음",
    advice: robotsBlocked ? "robots.txt 가 이 경로의 수집을 막고 있어 검색 노출이 불가능합니다." : undefined,
  });
  const contentType = resp.headers.get("content-type") ?? "";
  add({
    id: "content-type", category: "collect", label: "Content-Type 정상",
    status: /text\/html/i.test(contentType) ? "pass" : "fail", value: contentType || "없음",
    advice: /text\/html/i.test(contentType) ? undefined : "서버가 웹 페이지 포맷(text/html)으로 응답하지 않아 색인에 실패할 수 있습니다.",
  });

  // 색인
  add({
    id: "noindex", category: "index", label: "meta robots(noindex)",
    status: noindex ? "fail" : "pass", value: noindex ? robotsMeta : "색인 허용",
    advice: noindex ? "noindex 가 설정돼 검색 결과에 나오지 않습니다. 의도가 아니면 제거하세요." : undefined,
  });
  add({
    id: "canonical", category: "index", label: "캐노니컬(canonical) URL",
    status: canonical ? "pass" : "warn", value: canonical ? canonical.slice(0, 90) : "누락",
    advice: canonical ? undefined : "대표 URL 을 지정하지 않으면 중복 페이지로 평가가 분산될 수 있습니다.",
  });
  add({
    id: "sitemap", category: "index", label: "sitemap.xml",
    status: sitemap.ok ? "pass" : "warn", value: sitemap.ok ? "존재" : "없음",
    advice: sitemap.ok ? undefined : "사이트맵을 제출하면 색인 속도와 커버리지가 개선됩니다.",
  });
  // 소프트 404 — 정상(200) 응답인데 내용은 오류 페이지인 경우
  const soft404 = resp.ok &&
    /(페이지를 찾을 수 없|존재하지 않는 페이지|not found|404)/i.test(`${title ?? ""} ${visible.slice(0, 400)}`);
  add({
    id: "soft-404", category: "index", label: "소프트 404",
    status: soft404 ? "fail" : "pass", value: soft404 ? "오류 페이지로 추정" : "정상",
    advice: soft404 ? "정상 응답(200)이지만 내용이 오류 페이지로 보입니다. 색인 신뢰도를 훼손하니 올바른 상태 코드를 반환하세요." : undefined,
  });

  // AEO
  add({
    id: "title", category: "aeo", label: "<title> 요소",
    status: title ? "pass" : "fail", value: title ? `${title.slice(0, 60)}` : "없음",
    advice: title ? undefined : "제목이 없으면 검색 결과 표시와 클릭률에 치명적입니다.",
  });
  add({
    id: "title-count", category: "aeo", label: "<title> 중복",
    status: titles.length <= 1 ? "pass" : "warn", value: `${titles.length}개`,
    advice: titles.length <= 1 ? undefined : "title 이 2개 이상이면 검색엔진이 임의로 선택합니다.",
  });
  if (title) {
    add({
      id: "title-length", category: "aeo", label: "<title> 길이",
      status: title.length >= 5 && title.length <= 60 ? "pass" : "warn", value: `${title.length}자`,
      advice: title.length < 5 ? "제목이 너무 짧습니다." : title.length > 60 ? "60자를 넘으면 검색 결과에서 잘립니다." : undefined,
    });
  }
  add({
    id: "meta-description", category: "aeo", label: "메타 디스크립션",
    status: description ? "pass" : "warn", value: description ? description.slice(0, 80) : "누락",
    advice: description ? undefined : "검색 결과 요약문이 비어 클릭률이 낮아집니다. 80~160자로 작성하세요.",
  });
  add({
    id: "h1", category: "aeo", label: "<H1> 요소",
    status: h1s.length === 1 ? "pass" : h1s.length === 0 ? "warn" : "warn",
    value: `${h1s.length}개`,
    advice: h1s.length === 1 ? undefined : h1s.length === 0 ? "핵심 제목(H1)이 없습니다. 페이지당 1개를 권장합니다." : "H1 이 여러 개면 주제가 분산됩니다.",
  });
  add({
    id: "img-alt", category: "aeo", label: "이미지 Alt 속성",
    status: imgsNoAlt.length === 0 ? "pass" : imgsNoAlt.length < 10 ? "warn" : "fail",
    value: imgsNoAlt.length === 0 ? `모두 충족 (${imgs.length}개)` : `${imgs.length}개 중 ${imgsNoAlt.length}개 누락`,
    advice: imgsNoAlt.length ? "이미지 검색 노출과 접근성을 위해 alt 텍스트를 채우세요." : undefined,
  });
  add({
    id: "og", category: "aeo", label: "Open Graph(OG) 마크업",
    status: ogTitle && ogDesc ? "pass" : "warn",
    value: ogTitle && ogDesc ? "OG 태그 존재" : `누락 (${[!ogTitle && "og:title", !ogDesc && "og:description"].filter(Boolean).join(", ")})`,
    advice: ogTitle && ogDesc ? undefined : "공유·메신저 미리보기가 깨집니다. og:title / og:description / og:image 를 넣으세요.",
  });
  add({
    id: "viewport", category: "aeo", label: "모바일 뷰포트",
    status: hasViewport ? "pass" : "fail", value: hasViewport ? "viewport 존재" : "누락",
    advice: hasViewport ? undefined : "모바일 최적화 평가에서 큰 감점 요인입니다.",
  });
  add({
    id: "mixed-protocol", category: "aeo", label: "프로토콜이 다른 내부 링크",
    status: httpLinks.length === 0 ? "pass" : "warn", value: httpLinks.length === 0 ? "없음" : `http:// 링크 ${httpLinks.length}개`,
    advice: httpLinks.length ? "https 페이지 안의 http 링크는 보안 경고·평가 분산을 만듭니다. 프로토콜을 통일하세요." : undefined,
    evidence: httpLinks.slice(0, 5).join("\n") || undefined,
  });
  add({
    id: "render-blocking", category: "aeo", label: "렌더 차단 리소스",
    status: blocking <= 10 ? "pass" : "warn",
    value: `총 ${blocking}개 (JS ${headScripts.length} / CSS ${headStyles.length})`,
    advice: blocking > 10 ? "head 의 동기 스크립트·스타일이 첫 화면 렌더링을 지연시킵니다. defer/async·비동기 로딩을 적용하세요." : undefined,
  });
  add({
    id: "js-links", category: "aeo", label: "접근이 제한된 내부 링크(#·JS)",
    status: jsLinks.length === 0 ? "pass" : "warn", value: jsLinks.length === 0 ? "없음" : `${jsLinks.length}개`,
    advice: jsLinks.length ? "href=\"#\"·javascript: 링크는 수집 봇이 따라갈 수 없습니다." : undefined,
  });
  add({
    id: "lang", category: "aeo", label: "html lang 속성",
    status: langAttr ? "pass" : "warn", value: langAttr ?? "누락",
    advice: langAttr ? undefined : "<html lang=\"ko\"> 를 지정해 언어를 명시하세요.",
  });
  add({
    id: "favicon", category: "aeo", label: "파비콘",
    status: favicon ? "pass" : "warn", value: favicon ? "존재" : "누락",
    advice: favicon ? undefined : "검색 결과·탭에 표시될 파비콘을 등록하세요.",
  });
  // 키워드-메타 매칭 (프리미엄 지표) — 고빈도 키워드가 타이틀·메타에 반영됐는지
  const top10 = words.slice(0, 10);
  const matched = top10.filter((k) => k.inTitle || k.inDesc).length;
  add({
    id: "keyword-meta-match", category: "aeo", label: "핵심 키워드 메타 반영",
    status: top10.length === 0 ? "warn" : matched >= 3 ? "pass" : "warn",
    value: `고빈도 키워드 ${top10.length}개 중 ${matched}개 반영`,
    advice: matched >= 3 ? undefined
      : "본문 핵심 키워드가 타이틀·메타 디스크립션에 반영되지 않아 텍스트 연관도(광고연관지수)가 낮게 평가될 수 있습니다.",
  });

  // GEO — AI 검색(생성형 엔진) 노출 최적화
  const hasSchema = ldJson.length > 0 || hasMicrodata;
  add({
    id: "structured-data", category: "geo", label: "구조화 데이터(Schema.org)",
    status: hasSchema ? "pass" : "warn",
    value: hasSchema ? `존재${schemaTypes.size ? ` (${[...schemaTypes].slice(0, 4).join(", ")})` : ""}` : "누락",
    advice: hasSchema ? undefined : "AI 검색엔진은 구조화 데이터로 페이지 성격을 파악합니다. JSON-LD 를 추가하세요.",
  });
  add({
    id: "llms-txt", category: "geo", label: "llms.txt (AI 크롤러 안내)",
    status: llms.ok ? "pass" : "warn", value: llms.ok ? "존재" : "없음",
    advice: llms.ok ? undefined : "ChatGPT·Perplexity 등 AI 검색에 사이트 핵심 정보를 안내하는 llms.txt 도입을 권장합니다.",
  });
  add({
    id: "heading-structure", category: "geo", label: "헤딩 구조(H1→H2)",
    status: h1s.length >= 1 && h2s.length >= 1 ? "pass" : "warn",
    value: `H1 ${h1s.length} / H2 ${h2s.length}`,
    advice: h1s.length >= 1 && h2s.length >= 1 ? undefined : "AI 가 내용을 요약·인용하려면 명확한 제목 계층이 필요합니다.",
  });
  add({
    id: "text-volume", category: "geo", label: "본문 텍스트 분량",
    status: visible.length >= 300 ? "pass" : "warn", value: `약 ${visible.length.toLocaleString()}자`,
    advice: visible.length >= 300 ? undefined : "텍스트가 적으면 AI·검색엔진 모두 페이지 주제를 파악하기 어렵습니다.",
  });
  add({
    id: "og-image", category: "geo", label: "대표 이미지(og:image)",
    status: ogImage ? "pass" : "warn", value: ogImage ? "존재" : "누락",
    advice: ogImage ? undefined : "AI 답변·공유 카드에 쓰일 대표 이미지를 지정하세요.",
  });
  add({
    id: "faq-schema", category: "geo", label: "FAQ·Article 스키마",
    status: [...schemaTypes].some((t) => /FAQPage|Article|Product|Organization/i.test(t)) ? "pass" : "warn",
    value: schemaTypes.size ? [...schemaTypes].slice(0, 5).join(", ") : "없음",
    advice: [...schemaTypes].some((t) => /FAQPage|Article|Product|Organization/i.test(t))
      ? undefined
      : "FAQ·Article 등 콘텐츠형 스키마는 AI 답변 인용 확률을 높입니다.",
  });

  // ---------- 집계·등급
  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const catStatus = (cat: Category): Status => {
    const list = checks.filter((c) => c.category === cat);
    if (list.some((c) => c.status === "fail")) return "fail";
    if (list.some((c) => c.status === "warn")) return "warn";
    return "pass";
  };
  const categories = {
    collect: catStatus("collect"),
    index: catStatus("index"),
    aeo: catStatus("aeo"),
    geo: catStatus("geo"),
  };
  const grade =
    failCount === 0 && warnCount === 0 ? "A+" :
    failCount === 0 && warnCount <= 1 ? "A" :
    failCount === 0 && warnCount <= 3 ? "B" :
    failCount === 0 ? "C" :
    failCount <= 1 ? "C" :
    failCount <= 3 ? "D" : "F";

  // ---------- NRS (Noble Readiness Score) — 광고연관 준비도 100점 점수제 (프리미엄 지표)
  // 카테고리별로 관련 항목을 pass=1 / warn=0.5 / fail=0 으로 환산해 배점한다.
  const ARS_MAP: Array<{ label: string; max: number; ids: string[] }> = [
    { label: "콘텐츠 연관성", max: 30, ids: ["keyword-meta-match", "title", "title-length", "meta-description", "h1", "text-volume", "heading-structure"] },
    { label: "수집 안정성", max: 25, ids: ["http-status", "https", "response-time", "page-size", "redirect", "charset", "robots-txt", "robots-block", "content-type"] },
    { label: "색인 가능성", max: 15, ids: ["noindex", "canonical", "sitemap", "soft-404"] },
    { label: "성능·모바일", max: 15, ids: ["render-blocking", "viewport", "img-alt", "js-links"] },
    { label: "메타·공유·구조화", max: 15, ids: ["og", "og-image", "structured-data", "faq-schema", "favicon", "lang", "llms-txt"] },
  ];
  const scoreOf = (s: Status) => (s === "pass" ? 1 : s === "warn" ? 0.5 : 0);
  const arsCategories = ARS_MAP.map(({ label, max, ids }) => {
    const list = checks.filter((c) => ids.includes(c.id));
    const ratio = list.length ? list.reduce((sum, c) => sum + scoreOf(c.status), 0) / list.length : 1;
    return { label, max, score: Math.round(ratio * max * 10) / 10 };
  });
  const arsScore = Math.round(arsCategories.reduce((s, c) => s + c.score, 0) * 10) / 10;
  const ars = {
    score: arsScore,
    max: 100,
    potential: 100, // 경고·실패 항목을 모두 해결했을 때
    categories: arsCategories,
  };

  // ---------- AI 브리핑 정보 준비도 — 구조화 데이터의 핵심 5개 필드 (프리미엄 지표)
  const ldText = ldJson.map((m) => m[1]).join(" ");
  const hasField = (re: RegExp) => re.test(ldText);
  const commerce = [...schemaTypes].some((t) => /Product|Offer|Service/i.test(t));
  const aiBriefing = [
    { key: "@type", label: "콘텐츠 유형(@type)", status: schemaTypes.size > 0 ? "pass" : "missing" },
    { key: "name", label: "공식 명칭(name)", status: hasField(/"name"\s*:/) ? "pass" : "missing" },
    { key: "description", label: "핵심 설명(description)", status: hasField(/"description"\s*:/) ? "pass" : "missing" },
    { key: "price", label: "가격(price)", status: hasField(/"price"\s*:/) ? "pass" : commerce ? "missing" : "na" },
    { key: "aggregateRating", label: "평점·리뷰(aggregateRating)", status: hasField(/"aggregateRating"\s*:/) ? "pass" : commerce ? "missing" : "na" },
  ];

  // ---------- 저장 (테이블 미생성 등 실패해도 진단 결과는 반환)
  let auditId: string | null = null;
  try {
    const db = adminDb();
    const { data } = await db
      .from("seo_audits")
      .insert({
        url: parsed.data.url,
        final_url: finalUrl.href,
        page_title: title,
        grade,
        pass_count: passCount,
        warn_count: warnCount,
        fail_count: failCount,
        categories,
        checks,
        keywords: { words, phrases, totalTokens: tokens.length },
        meta: { sizeKb, timeMs, description, status: resp.status, schemaTypes: [...schemaTypes], ars, aiBriefing },
        ip,
      })
      .select("id")
      .single();
    auditId = data?.id ?? null;
  } catch (e) {
    console.error("audit save failed", e);
  }

  // ---------- 방문자용 요약 — 전체 리포트는 상담(Contact) 유도용으로 잠근다
  const issues = checks.filter((c) => c.status !== "pass");
  return ok(res, {
    auditId,
    url: parsed.data.url,
    pageTitle: title,
    grade,
    passCount,
    warnCount,
    failCount,
    categories,
    timeMs,
    sizeKb,
    topKeywords: words.slice(0, 5),
    keywordTotal: words.length,
    teaserIssues: issues.slice(0, 2).map((c) => ({ label: c.label, status: c.status, value: c.value })),
    lockedIssueCount: Math.max(0, issues.length - 2),
    totalChecks: checks.length,
    ars,
    aiBriefing,
  });
}
