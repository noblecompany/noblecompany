import { Link, Navigate, useParams } from "react-router-dom";
import Reveal from "../components/Reveal";
import { asset } from "../lib/asset";
import { works } from "../data/works";

/** 슬라이드 35~36 — 상세: Situation / Solution / Result 케이스 스터디 */
export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const work = works.find((w) => w.id === id);

  if (!work) return <Navigate to="/work" replace />;

  // p33 — 이전/다음은 같은 광고 유형 안에서 롤링
  const siblings = works.filter((w) => w.category === work.category);
  const at = siblings.findIndex((w) => w.id === work.id);
  const prev = siblings[(at - 1 + siblings.length) % siblings.length];
  const next = siblings[(at + 1) % siblings.length];

  const blocks = [
    { key: "Situation", desc: "광고주가 요청한 광고 진행에 대한 요청", body: work.objective },
    { key: "Solution", desc: "노블컴퍼니가 진행한 광고에 대한 내용", body: work.strategy },
    // Result는 취합 양식에 성과 항목이 없어 데이터가 있을 때만 노출한다.
    { key: "Result", desc: "노블컴퍼니가 진행한 광고에 대한 결과", body: work.result },
  ].filter((b) => Boolean(b.body));

  // 원문 예: "SA, DA, VIRAL (네이버, 구글, META, KAKAO, GFA, 온드미디어)"
  // 괄호는 매체 목록을 감싸는 용도라 구분자로 취급해 개별 칩으로 펼친다.
  const mediaList = Array.from(
    new Set(
      work.media
        .replace(/[()]/g, ",")
        .split(/[,/·]/)
        .map((m) => m.trim())
        .filter(Boolean),
    ),
  );

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 40 }}>
        <div className="container">
          <Reveal>
            <p className="eyebrow">{work.category} CAMPAIGN</p>
            <h1 className="section-title" style={{ fontSize: "clamp(32px, 5vw, 56px)" }}>
              {work.client}
            </h1>
            <p className="section-desc">{work.objective}</p>
          </Reveal>

          <Reveal>
            <div className="detail-hero">
              <div
                className="detail-hero__backdrop"
                style={{ backgroundImage: `url(${asset(work.hero)})` }}
                aria-hidden="true"
              />
              <img
                className="detail-hero__img"
                src={asset(work.hero)}
                alt={`${work.client} 캠페인 이미지`}
                width={380}
                height={340}
              />
              <div className="work-card__meta">
                <span>{work.category}</span>
                <strong style={{ fontSize: 24 }}>{work.client}</strong>
              </div>
            </div>
          </Reveal>

          {mediaList.length > 0 && (
            <Reveal>
              <dl className="detail-facts">
                <div>
                  <dt>집행 매체</dt>
                  <dd className="chips">
                    {mediaList.map((m) => (
                      <span className="chip" key={m}>
                        {m}
                      </span>
                    ))}
                  </dd>
                </div>
                {work.industry && (
                  <div>
                    <dt>업종</dt>
                    <dd>{work.industry}</dd>
                  </div>
                )}
              </dl>
            </Reveal>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 30 }}>
        <div className="container">
          {blocks.map((b, i) => (
            <Reveal key={b.key} delay={i * 80}>
              <div className="ssr-block">
                <div>
                  <h3>{b.key}</h3>
                  <p style={{ color: "var(--noble-text-dim)", fontSize: 14, marginTop: 6 }}>
                    {b.desc}
                  </p>
                </div>
                <p>{b.body}</p>
              </div>
            </Reveal>
          ))}

          {/* 슬라이드 33·37 — 같은 유형 내 이전/다음 롤링 */}
          <div className="detail-nav">
            <Link to={`/work/${prev.id}`}>← {prev.client}</Link>
            <span className="is-current" aria-current="page">
              {work.client}
            </span>
            <Link to={`/work/${next.id}`}>{next.client} →</Link>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>이런 성과, 우리 브랜드에도 필요하다면</h2>
          <p>진행 방식과 예상 성과를 무료로 상담해 드립니다.</p>
          <Link to="/contact" className="btn btn--dark">
            Contact US
          </Link>
        </div>
      </section>
    </main>
  );
}
