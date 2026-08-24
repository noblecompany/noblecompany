import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export const THEME_KEY = "noble-theme";

/** 첫 페인트 전에 index.html 인라인 스크립트가 이미 적용해 둔 값을 읽는다. */
function readTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  // seed-design 컴포넌트(TextField 등)도 사이트 테마를 따르게 강제한다.
  // 기본 부트 스크립트는 'system'(OS 설정)으로 두기 때문에, OS 다크 + 사이트
  // 라이트 조합에서 폼 라벨이 흰색으로 렌더되던 문제를 막는다.
  document.documentElement.dataset.seedColorMode = theme === "dark" ? "dark-only" : "light-only";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  // 사용자가 직접 고른 적이 없으면 OS 설정 변경을 그대로 따라간다
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {
        /* localStorage 차단 환경 — OS 설정만 따른다 */
      }
      const next: Theme = e.matches ? "light" : "dark";
      applyTheme(next);
      setTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* 저장 실패해도 이번 세션에는 적용된다 */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
