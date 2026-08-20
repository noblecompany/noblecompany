import { Link } from "react-router-dom";
import { DESIGN_PORTFOLIO_URL } from "../data/company";

/**
 * 우측 하단 퀵 도크 — AEO 무료진단 · 문의하기 · 디자인 포트폴리오.
 * 토글 없이 상시 노출되는 동일 폭 버튼 스택 (진입 시 순차 슬라이드 인).
 */
export default function ButterflyCta() {
  return (
    <nav className="qdock" aria-label="빠른 메뉴">
      <Link to="/diagnosis" className="qdock__item qdock__item--diag">
        <span className="qdock__ico">
          <SearchIcon />
        </span>
        AEO 무료진단
      </Link>

      <Link to="/contact" className="qdock__item">
        <span className="qdock__ico">
          <MailIcon />
        </span>
        문의하기
      </Link>

      <a
        href={DESIGN_PORTFOLIO_URL}
        target="_blank"
        rel="noreferrer"
        className="qdock__item qdock__item--design"
      >
        <span className="qdock__ico">
          <PenIcon />
        </span>
        디자인 포트폴리오
        <ArrowIcon />
      </a>
    </nav>
  );
}

const p = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function SearchIcon() {
  return (
    <svg {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.2-4.2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg {...p}>
      <path d="m14.5 4.5 5 5L8 21H3v-5L14.5 4.5z" />
      <path d="m12.5 6.5 5 5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg {...p} width={13} height={13} className="qdock__ext">
      <path d="M8 6h10v10" />
      <path d="M18 6 6 18" />
    </svg>
  );
}
