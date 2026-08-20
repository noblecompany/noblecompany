import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * 우측 하단 플로팅 퀵메뉴.
 * - PC: 나비 버튼을 누르면 'AEO 무료진단'(위)·'문의하기'(좌) 두 메뉴가
 *   버튼을 축으로 궤도를 그리며 펼쳐진다 (자전 모션).
 * - 모바일: 토글 없이 두 개의 버튼으로 상시 노출.
 */
export default function ButterflyCta() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  // 페이지 이동 시 접기
  useEffect(() => setOpen(false), [pathname]);

  // 바깥 클릭 시 접기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className={`qmenu ${open ? "is-open" : ""}`} ref={ref}>
      <Link
        to="/diagnosis"
        className="qmenu__item qmenu__item--diag"
        onClick={() => setOpen(false)}
        tabIndex={open ? 0 : undefined}
      >
        <SearchIcon />
        AEO 무료진단
      </Link>

      <Link
        to="/contact"
        className="qmenu__item qmenu__item--contact"
        onClick={() => setOpen(false)}
        tabIndex={open ? 0 : undefined}
      >
        <MailIcon />
        문의하기
      </Link>

      <button
        type="button"
        className="qmenu__fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "퀵메뉴 닫기" : "퀵메뉴 열기 — 무료진단·문의하기"}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M12 7.5c1.2-2.8 3.4-4.5 5.6-4.5 2.4 0 3.9 1.8 3.9 4 0 3-2.6 5.5-6.3 6.1M12 7.5C10.8 4.7 8.6 3 6.4 3 4 3 2.5 4.8 2.5 7c0 3 2.6 5.5 6.3 6.1M12 7.5v6M12 13.5c-.9 2.6-3 4.9-5.2 4.9-1.7 0-2.8-1.2-2.8-2.9 0-1.6 1.2-3.1 3-3.6m5 1.6c.9 2.6 3 4.9 5.2 4.9 1.7 0 2.8-1.2 2.8-2.9 0-1.6-1.2-3.1-3-3.6M12 13.5V21"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.2-4.2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
