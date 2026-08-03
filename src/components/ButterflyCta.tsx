import { Link } from "react-router-dom";

/** 기획안 슬라이드 17 — '나비' 아이콘 고정형 CTA. 클릭 시 부담 없는 문의 진입. */
export default function ButterflyCta() {
  return (
    <Link to="/contact" className="butterfly-cta" aria-label="프로젝트 문의하기">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d="M12 7.5c1.2-2.8 3.4-4.5 5.6-4.5 2.4 0 3.9 1.8 3.9 4 0 3-2.6 5.5-6.3 6.1M12 7.5C10.8 4.7 8.6 3 6.4 3 4 3 2.5 4.8 2.5 7c0 3 2.6 5.5 6.3 6.1M12 7.5v6M12 13.5c-.9 2.6-3 4.9-5.2 4.9-1.7 0-2.8-1.2-2.8-2.9 0-1.6 1.2-3.1 3-3.6m5 1.6c.9 2.6 3 4.9 5.2 4.9 1.7 0 2.8-1.2 2.8-2.9 0-1.6-1.2-3.1-3-3.6M12 13.5V21"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
