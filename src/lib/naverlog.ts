/**
 * 네이버 광고 전환추적(프리미엄 로그분석, wcslog.js) SPA 연동.
 * 가이드: https://navercts.gitbook.io/guide
 *
 * index.html 의 공통 스크립트는 최초 로드 때만 wcs_do() 로 페이지뷰를 보낸다.
 * React Router 이동은 문서를 다시 로드하지 않으므로(가이드 FAQ "SPA 구조" 항목)
 * 라우트가 바뀔 때마다 wcs_do() 를 다시 호출해 페이지뷰를 보충한다.
 * (실측: wcs_do === wcs.pageview 이며 반복 호출 가능)
 *
 * 전환은 가이드의 전환 이벤트 전송 스크립트 그대로 wcs.trans({ type }) 로 보낸다.
 * 문의·지원·진단은 URL 이 바뀌지 않는 완료 상태이므로 완료 시점 코드에서 직접 호출한다.
 *
 * 전환 이벤트명: lead(신청완료) · schedule(예약완료) · sign_up(회원가입) · purchase(구매완료)
 *              · custom001~custom010(사용자 정의 — 시점을 구분해 분석할 때)
 */

declare global {
  interface Window {
    wcs?: {
      inflow: (domain?: string) => void;
      trans: (conv: { type: string; value?: string | number }) => void;
      pageview: (nasa?: Record<string, unknown>) => void;
    };
    /** index.html 공통 스크립트가 만드는 설정 객체 — wa 가 비어 있으면 미설치 상태 */
    wcs_add?: { wa?: string };
    wcs_do?: (nasa?: Record<string, unknown>) => void;
  }
}

/**
 * 완료 지점별 전환 이벤트명. 광고주센터 전환 보고서에서 각각 별도 항목으로 잡힌다.
 * - 문의 접수: 상담·문의 신청의 표준 이벤트 lead
 * - 사이트 진단·채용 지원: 표준 이벤트에 맞는 항목이 없어 사용자 정의로 구분
 */
export const NAVER_CONVERSION = {
  contact: "lead", // 문의 접수 → 신청완료
  diagnosis: "custom001", // 무료 사이트 진단 완료
  apply: "custom002", // 채용 지원 완료
} as const;

function enabled(): boolean {
  // 로컬 dev·프리뷰는 실데이터에 섞이지 않게 막고, 공통 스크립트에 광고주 ID 가 없으면 아무것도 안 보낸다
  if (!(import.meta.env.PROD && import.meta.env.BASE_URL === "/")) return false;
  return Boolean(window.wcs && window.wcs_do && window.wcs_add?.wa);
}

/** 라우트 이동 시 페이지뷰 재전송 */
export function naverPageview(path: string): void {
  if (!enabled()) return;
  if (path.startsWith("/admin")) return;
  try {
    window.wcs_do!();
  } catch {
    // 통계 실패는 무시
  }
}

/** 전환 이벤트 전송 — 완료 상태 진입 시 1회 호출 */
export function naverConversion(type: (typeof NAVER_CONVERSION)[keyof typeof NAVER_CONVERSION]): void {
  if (!enabled()) return;
  try {
    window.wcs!.trans({ type });
  } catch {
    // 통계 실패는 무시
  }
}
