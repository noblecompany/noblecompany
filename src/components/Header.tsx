import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { DESIGN_PORTFOLIO_URL } from "../data/company";
import { asset } from "../lib/asset";
import { useTheme } from "../lib/theme";

const NAV = [
  { to: "/about", label: "ABOUT" },
  { to: "/work", label: "WORK" },
  { to: "/solution", label: "SOLUTION" },
  { to: "/notice", label: "NOTICE" },
  { to: "/careers", label: "CAREERS" },
  { to: "/contact", label: "CONTACT" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { theme, toggle } = useTheme();

  // 메인 최상단에서는 헤더가 히어로 영상(항상 어두움) 위에 뜬다
  const overHero = location.pathname === "/" && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <header
      className={`header ${scrolled || open ? "header--scrolled" : ""} ${
        overHero ? "header--over-hero" : ""
      }`}
    >
      <div className="container header__inner">
        <Link to="/" className="header__logo" aria-label="노블컴퍼니 홈">
          {/* 라이트 테마의 흰 배경에서는 화이트 로고가 보이지 않는다 */}
          <img
            src={asset(
              overHero || theme === "dark" ? "/logo-noble-white.webp" : "/logo-noble.webp",
            )}
            alt="noble company"
          />
        </Link>

        <nav className={`header__nav ${open ? "is-open" : ""}`} aria-label="주 메뉴">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `header__link ${isActive ? "is-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}

          {/* 모바일 드롭다운용 세그먼트 (데스크톱에서는 숨김) */}
          <SegButtons className="header__seg--menu" />
        </nav>

        {/* 우측 액션 클러스터 — 세그먼트 CTA + 테마 토글을 한 묶음으로 */}
        <div className="header__actions">
          <SegButtons className="header__seg--bar" />
          <button
            type="button"
            className="header__theme"
            onClick={toggle}
            aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            title={theme === "dark" ? "라이트 모드" : "다크 모드"}
          >
          {theme === "dark" ? (
            /* 해 — 누르면 라이트로 */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
            </svg>
          ) : (
            /* 달 — 누르면 다크로 */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z" />
            </svg>
          )}
          </button>
        </div>

        <button
          type="button"
          className="header__toggle"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}

/** AEO 무료진단(내부) + 디자인 포트폴리오(외부) 세그먼트 CTA — 데스크톱 바·모바일 메뉴 양쪽에서 재사용 */
function SegButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`header__seg ${className}`}>
      <NavLink
        to="/diagnosis"
        className={({ isActive }) =>
          `header__seg-btn header__seg-btn--diag ${isActive ? "is-active" : ""}`
        }
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20.5 20.5-4.2-4.2" />
        </svg>
        AEO 무료진단
      </NavLink>
      <a
        className="header__seg-btn header__seg-btn--design"
        href={DESIGN_PORTFOLIO_URL}
        target="_blank"
        rel="noreferrer"
      >
        디자인 포트폴리오
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 6h10v10" />
          <path d="M18 6 6 18" />
        </svg>
      </a>
    </div>
  );
}
