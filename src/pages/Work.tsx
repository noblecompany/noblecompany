import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Accordion from "../components/Accordion";
import Reveal from "../components/Reveal";
import WorkCard from "../components/WorkCard";
import { workCategories, type WorkCategory } from "../data/works";
import { useWorks } from "../lib/content";

/** 그리드는 4×3 (썸네일 원본 폭 300px에 맞춰 4열 — 확대로 인한 화질 저하 방지) */
const PER_PAGE = 12;

/** 슬라이드 30~34 — WORK 메인: 유형 필터 + 그리드 + 하단 아코디언 */
export default function Work() {
  const [filter, setFilter] = useState<"ALL" | WorkCategory>("ALL");
  const [page, setPage] = useState(0);
  /** p33 — 유형 전환 시 페이지 리로드가 아닌 슬라이드로 넘어가는 연출 */
  const [slide, setSlide] = useState<"in" | "out">("in");
  const firstRender = useRef(true);
  const { works } = useWorks();

  const filtered = useMemo(
    () => (filter === "ALL" ? works : works.filter((w) => w.category === filter)),
    [filter, works],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  // 필터/페이지가 바뀌면 슬라이드 아웃 → 인
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSlide("out");
    const t = window.setTimeout(() => setSlide("in"), 180);
    return () => window.clearTimeout(t);
  }, [filter, page]);

  const changeFilter = (key: "ALL" | WorkCategory) => {
    setFilter(key);
    setPage(0);
  };

  const accordionItems = workCategories
    .filter((c) => c.key !== "ALL")
    .map((c) => ({ title: c.label, content: <p>{c.desc}</p> }));

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <h1 className="page-hero__title">WORK</h1>
            <p className="page-hero__sub">
              <span className="accent">성과의 차이</span>를 경험한 브랜드
            </p>
          </Reveal>

          <div className="filter-tabs" role="tablist" aria-label="광고 유형 필터">
            {workCategories.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={filter === c.key}
                className={`filter-tab ${filter === c.key ? "is-active" : ""}`}
                onClick={() => changeFilter(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className={`work-grid work-grid--${slide}`}>
            {visible.map((work, i) => (
              <Reveal key={work.id} delay={(i % 4) * 80}>
                <WorkCard work={work} />
              </Reveal>
            ))}
          </div>

          {pageCount > 1 && (
            <nav className="pager" aria-label="포트폴리오 페이지">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pager__dot ${page === i ? "is-active" : ""}`}
                  aria-current={page === i ? "page" : undefined}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
            </nav>
          )}
        </div>
      </section>

      {/* 슬라이드 31 — IMC/SA/DA/VIRAL 업무 방식 아코디언 */}
      <section className="section" style={{ background: "var(--noble-black-soft)" }}>
        <div className="container">
          <Reveal>
            <span className="eyebrow">HOW WE WORK</span>
            <h2 className="section-title">노블컴퍼니의 광고, 이렇게 진행합니다</h2>
            <Accordion items={accordionItems} />
          </Reveal>
        </div>
      </section>

      {/* 슬라이드 37 — 모든 페이지 하단 Contact US */}
      <section className="cta-band">
        <div className="container">
          <h2>다음 나비효과의 주인공은 당신의 브랜드입니다</h2>
          <p>포트폴리오에서 본 성과, 우리 브랜드에서도 만들 수 있습니다.</p>
          <Link to="/contact" className="btn btn--dark">
            Contact US
          </Link>
        </div>
      </section>
    </main>
  );
}
