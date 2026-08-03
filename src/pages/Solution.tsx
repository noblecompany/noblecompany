import { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { solutionTools } from "../data/solutions";

/** 슬라이드 39~43 — 솔루션: 툴 탭 + 추천 대상 → 작동 원리 → 이점 플로우 */
export default function Solution() {
  const [activeId, setActiveId] = useState(solutionTools[0].id);
  const active = solutionTools.find((t) => t.id === activeId)!;

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 50 }}>
        <div className="container">
          <Reveal>
            <h1 className="page-hero__title">SOLUTION</h1>
            <p className="page-hero__sub">
              디지털 마케팅에 필요한 <span className="accent">모든 솔루션</span>을 운용합니다
            </p>
            <p className="section-desc" style={{ marginTop: 16, maxWidth: 640 }}>
              노블컴퍼니는 검증된 마케팅 솔루션 툴로 광고 성과를 데이터로 관리합니다. 툴이
              어떻게 작동하고, 클라이언트가 무엇을 얻는지 그대로 보여드립니다.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--soft" style={{ paddingTop: 70 }}>
        <div className="container">
          {/* 툴 탭 — 슬라이드 41 */}
          <div className="sol-tabs" role="tablist" aria-label="솔루션 툴 선택">
            {solutionTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                role="tab"
                aria-selected={tool.id === activeId}
                className={`sol-tab ${tool.id === activeId ? "is-active" : ""}`}
                onClick={() => setActiveId(tool.id)}
              >
                {tool.name}
              </button>
            ))}
          </div>

          <Reveal key={active.id}>
            <h2 className="section-title" style={{ fontSize: "clamp(24px, 3vw, 34px)" }}>
              <span className="accent" style={{ color: "var(--noble-blue)" }}>
                {active.name}
              </span>
              , 이럴 때 추천합니다
            </h2>
            <p className="section-desc" style={{ marginBottom: 36 }}>
              {active.tagline}
            </p>

            <div className="sol-cards">
              {active.recommends.map((r, i) => (
                <div key={i} className="sol-card">
                  <div className="sol-card__icon" aria-hidden="true">
                    {r.icon}
                  </div>
                  <p>{r.text}</p>
                </div>
              ))}
            </div>

            {/* 소비자 플로우: 작동 원리 → 이점 — 슬라이드 42~43 */}
            <h3 style={{ margin: "56px 0 4px", fontSize: 22, fontWeight: 800 }}>
              어떻게 작동하나요?
            </h3>
            <div className="sol-flow">
              {active.steps.map((s) => (
                <div key={s.label} className="sol-step">
                  <em>{s.label}</em>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>우리 브랜드에 맞는 솔루션이 궁금하다면</h2>
          <p>현재 운영 상황을 알려주시면 최적의 솔루션 조합을 제안해 드립니다.</p>
          <Link to="/contact" className="btn btn--dark">
            무료 진단 받기
          </Link>
        </div>
      </section>
    </main>
  );
}
