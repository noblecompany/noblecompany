import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { works } from "../data/works";
import WorkCard from "./WorkCard";

/**
 * 메인 PORTFOLIO 섹션 — 레퍼런스(PLAY.D) 방식.
 * 좌측 텍스트는 sticky로 고정되고, 우측 2열 이미지 그리드가
 * 스크롤에 따라 열마다 다른 속도로 순차적으로 위로 올라갑니다.
 */
export default function PortfolioScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const col1Ref = useRef<HTMLDivElement>(null);
  const col2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const section = sectionRef.current;
      const col1 = col1Ref.current;
      const col2 = col2Ref.current;
      if (!section || !col1 || !col2) return;

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // 섹션이 뷰포트에 들어와서 빠져나갈 때까지 0 → 1
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)));

      // 열마다 다른 속도로 상승 → 순차적으로 움직이는 패럴랙스
      col1.style.transform = `translateY(${(0.5 - progress) * 90}px)`;
      col2.style.transform = `translateY(${(1 - progress) * 200}px)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const items = works.slice(0, 8);
  const col1Items = items.filter((_, i) => i % 2 === 0);
  const col2Items = items.filter((_, i) => i % 2 === 1);

  return (
    <section className="pf-scroll" ref={sectionRef}>
      <div className="container pf-scroll__grid">
        <div className="pf-scroll__text">
          <h2 className="section-title">
            <span className="accent">성과의 차이</span>를<br />
            경험한 브랜드
          </h2>
          <p className="section-desc">
            다양한 산업과 브랜드의 성장을 함께하며 실제 캠페인 성과로 증명해왔습니다.
          </p>
          <Link to="/work" className="btn btn--primary" style={{ marginTop: 36 }}>
            포트폴리오 확인
          </Link>
        </div>

        <div className="pf-scroll__cols pf-desktop-only">
          <div className="pf-col" ref={col1Ref}>
            {col1Items.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
          <div className="pf-col pf-col--offset" ref={col2Ref}>
            {col2Items.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        </div>
      </div>

      {/* 모바일: 기존 가로 롤링(마퀴) 유지 */}
      <div className="marquee pf-mobile-only">
        <div className="marquee__track">
          {[...items, ...items].map((work, i) => (
            <WorkCard key={`${work.id}-${i}`} work={work} />
          ))}
        </div>
      </div>
    </section>
  );
}
