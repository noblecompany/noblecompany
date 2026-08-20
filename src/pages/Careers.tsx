import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import {
  benefits,
  deadlineLabel,
  hiringProcess,
  isClosed,
  jobGroups,
  RECRUIT_EMAIL,
  RECRUIT_TEL,
  type JobGroup,
} from "../data/careers";
import { useJobs } from "../lib/content";
import { useSeo } from "../lib/seo";

/** CAREERS — 채용공고 목록. 직군 필터 + 전형 절차 + 복리후생 */
export default function Careers() {
  useSeo({
    title: "채용",
    description:
      "노블컴퍼니 채용 — 광고기획(AE)·퍼포먼스 마케터·콘텐츠 디자이너·바이럴 등 진행 중인 공고를 확인하고 온라인으로 바로 지원하세요.",
  });
  const [filter, setFilter] = useState<"ALL" | JobGroup>("ALL");
  const { jobs } = useJobs();

  // 진행 중인 공고를 위로, 그 안에서는 마감 임박 순으로 정렬한다.
  const sorted = useMemo(() => {
    return [...jobs].sort((a, b) => {
      const closedDiff = Number(isClosed(a)) - Number(isClosed(b));
      if (closedDiff !== 0) return closedDiff;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      // 상시채용은 마감일이 있는 공고 뒤에 둔다
      return a.deadline ? -1 : b.deadline ? 1 : 0;
    });
  }, [jobs]);

  const visible = filter === "ALL" ? sorted : sorted.filter((j) => j.group === filter);
  const openCount = jobs.filter((j) => !isClosed(j)).length;

  const tabs: { key: "ALL" | JobGroup; label: string }[] = [
    { key: "ALL", label: "ALL" },
    ...jobGroups.map((g) => ({ key: g.key, label: g.label })),
  ];

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 40 }}>
        <div className="container">
          <Reveal>
            <h1 className="page-hero__title">CAREERS</h1>
            <p className="page-hero__sub">
              작은 날갯짓을 <span className="accent">나비효과</span>로 만드는 사람을 찾습니다
            </p>
          </Reveal>

          <div className="filter-tabs" role="tablist" aria-label="채용 직군 필터">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={filter === t.key}
                className={`filter-tab ${filter === t.key ? "is-active" : ""}`}
                onClick={() => setFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <p className="job-count">
            현재 <strong>{openCount}건</strong>의 공고가 진행 중입니다.
          </p>

          <div className="job-list">
            {visible.map((job, i) => {
              const closed = isClosed(job);
              return (
                <Reveal key={job.id} delay={(i % 3) * 70}>
                  <Link
                    to={`/careers/${job.id}`}
                    className={`job-card ${closed ? "is-closed" : ""}`}
                  >
                    <div className="job-card__head">
                      <span className={`job-status ${closed ? "is-closed" : ""}`}>
                        {closed ? "마감" : "채용중"}
                      </span>
                      <span className="job-card__deadline">{deadlineLabel(job)}</span>
                    </div>
                    <h2 className="job-card__title">{job.title}</h2>
                    <p className="job-card__summary">{job.summary}</p>
                    <div className="job-card__badges">
                      <span className="job-badge">{job.team}</span>
                      <span className="job-badge">{job.employment}</span>
                      <span className="job-badge">{job.career}</span>
                    </div>
                    <span className="job-card__more">자세히 보기 →</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>

          {visible.length === 0 && (
            <p className="job-empty">
              해당 직군에 진행 중인 공고가 없습니다. 관심 있는 직무는 언제든{" "}
              <a className="accent" href={`mailto:${RECRUIT_EMAIL}`}>
                {RECRUIT_EMAIL}
              </a>{" "}
              로 상시 지원해 주세요.
            </p>
          )}
        </div>
      </section>

      <section className="section section--soft">
        <div className="container">
          <Reveal>
            <span className="eyebrow">HIRING PROCESS</span>
            <h2 className="section-title">전형 절차</h2>
            <div className="sol-flow sol-flow--five">
              {hiringProcess.map((p) => (
                <div className="sol-step" key={p.step}>
                  <em>{p.step}</em>
                  <h4>{p.title}</h4>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <span className="eyebrow">BENEFITS</span>
            <h2 className="section-title">함께 일하는 방식</h2>
            <div className="about-values about-values--four">
              {benefits.map((b) => (
                <div className="value-card" key={b.title}>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>맞는 공고가 없어도 괜찮습니다</h2>
          <p>
            채용문의 {RECRUIT_TEL} · {RECRUIT_EMAIL} — 이력서와 포트폴리오는 상시 접수합니다.
          </p>
          <a
            className="btn btn--dark"
            href={`mailto:${RECRUIT_EMAIL}?subject=${encodeURIComponent("[상시지원] 지원자명 / 희망 직무")}`}
          >
            상시 지원하기
          </a>
        </div>
      </section>
    </main>
  );
}
