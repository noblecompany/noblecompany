/**
 * 에이스카운터(AceCounter) SPA 연동.
 *
 * index.html 의 공통 스크립트(ac.js)는 최초 로드 때 페이지뷰를 1회만 보낸다.
 * React Router 로 화면이 바뀌어도 문서가 다시 로드되지 않으므로, 라우트 이동마다
 * ac.js 가 노출하는 가상 페이지뷰 함수 `AM_PL('/경로')` 를 직접 호출해야
 * 페이지별 조회수·이동경로·반송률이 정상 집계된다. (실측: 2026-08-29)
 *
 * 또한 문의·지원·진단처럼 URL 이 바뀌지 않는 완료 상태는 가상 URL 로 보내
 * 에이스카운터 [설정 > 페이지 > 전환페이지] 에서 전환으로 잡을 수 있게 한다.
 */

declare global {
  interface Window {
    /** ac.js 가 정의하는 가상 페이지뷰 함수 — '/' 로 시작하는 경로만 유효 */
    AM_PL?: (path: string) => void;
  }
}

/** 전환페이지로 등록할 가상 URL — 에이스카운터 설정 화면에서 그대로 지정한다 */
export const ACE_CONVERSION = {
  contact: "/contact/complete",
  apply: "/careers/apply/complete",
  diagnosis: "/diagnosis/complete",
} as const;

function enabled(): boolean {
  // 로컬 dev·GH Pages 프리뷰는 index.html 스크립트가 있어도 실데이터에 섞이지 않게 막는다
  return import.meta.env.PROD && import.meta.env.BASE_URL === "/";
}

/** 가상 페이지뷰 전송. ac.js 가 아직 안 내려왔거나 실패해도 방문자에게 영향 없음 */
export function aceVirtualPage(path: string): void {
  if (!enabled()) return;
  if (!path.startsWith("/") || path.startsWith("/admin")) return;
  try {
    window.AM_PL?.(path);
  } catch {
    // 통계 실패는 무시
  }
}
