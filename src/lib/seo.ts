import { useEffect } from "react";

/**
 * 페이지별 SEO·AEO·GEO 메타 관리 (SPA 런타임 방식).
 * 라우트 진입 시 title·description·OG·캐노니컬·JSON-LD 를 갱신한다.
 *
 * SPA 한계: 최초 HTML 에는 index.html 의 기본 메타가 실리고, JS 실행 후 교체된다.
 * 구글·네이버 모두 JS 렌더링을 색인하지만, 완전한 서버 렌더링이 필요해지면
 * 프리렌더링 도입을 검토한다.
 */

const SITE_NAME = "노블컴퍼니";
const SITE_TITLE = "노블컴퍼니 | 퍼포먼스 마케팅 광고대행사 · 네이버 프리미어 파트너";
const DEFAULT_DESCRIPTION =
  "네이버 프리미어 파트너사 노블컴퍼니 — 브랜드 분석과 데이터로 성과를 만드는 퍼포먼스 마케팅 광고대행사. IMC·검색광고(SA)·디스플레이(DA)·바이럴 캠페인 기획부터 운영·성과 관리까지 함께합니다.";

interface SeoOptions {
  /** 페이지 제목 — "제목 | 노블컴퍼니" 형태로 조합. 생략 시 사이트 기본 제목 */
  title?: string;
  description?: string;
  /** OG 이미지 경로 — 생략 시 기본 브랜드 이미지 */
  image?: string;
  /** JSON-LD 구조화 데이터 (단일 또는 배열) */
  jsonLd?: object | object[];
  /** og:type — 기본 website */
  ogType?: string;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(data: object | object[] | undefined) {
  const ID = "seo-jsonld";
  const prev = document.getElementById(ID);
  if (prev) prev.remove();
  if (!data) return;
  const el = document.createElement("script");
  el.id = ID;
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

export function useSeo(opts: SeoOptions = {}) {
  const { title, description, image, jsonLd, ogType } = opts;

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;
    const desc = description ?? DEFAULT_DESCRIPTION;
    // 도메인 커트오버 전후 모두 올바르도록 현재 호스트 기준 자기참조 캐노니컬을 쓴다
    const origin = window.location.origin;
    const url = origin + window.location.pathname;
    const img = image
      ? image.startsWith("http")
        ? image
        : origin + image
      : `${origin}/og-image-v2.png`;

    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", ogType ?? "website");
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", img);
    upsertMeta("property", "og:locale", "ko_KR");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", img);
    upsertCanonical(url);
    upsertJsonLd(jsonLd);
    // JSON.stringify 로 내용 변화만 감지 — 객체 리터럴 재생성으로 인한 재실행 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, ogType, JSON.stringify(jsonLd ?? null)]);
}

/** 회사 공통 Organization 스키마 — 필요 페이지에서 jsonLd 배열에 합쳐 쓴다 */
export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "주식회사 노블컴퍼니",
  alternateName: "NOBLE COMPANY",
  url: "https://e-noble.kr",
  logo: "https://e-noble.kr/apple-touch-icon.png",
  description:
    "네이버 프리미어 파트너사 · 카카오 공식대행사. IMC·SA·DA·VIRAL 통합 광고 대행과 퍼포먼스 마케팅 전문 기업.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "KR",
    addressLocality: "서울특별시 강동구",
    streetAddress: "성내로 48 (성내동, 씨네월드) 6층",
  },
  telephone: "+82-2-474-1941",
  email: "noble@e-noble.kr",
  foundingDate: "2011",
};
