import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import ApplyModal from "../components/ApplyModal";
import Reveal from "../components/Reveal";
import { deadlineLabel, hiringProcess, isClosed, RECRUIT_EMAIL } from "../data/careers";
import { useJobs, useJobViewPing } from "../lib/content";

/** 채용공고 상세 — 주요업무 / 자격요건 / 우대사항 / 전형절차 + 온라인 지원 (F2) */
export default function CareerDetail() {
  const { id } = useParams<{ id: string }>();
  const { jobs, loading } = useJobs();
  const [applying, setApplying] = useState(false);

  // 상세 조회수 집계 (F11 간이 통계)
  useJobViewPing(id);

  const job = jobs.find((j) => j.id === id);

  if (!job) {
    // 목록을 아직 불러오는 중이면 판단을 미룬다 — 새로고침 직후 잘못된 리다이렉트 방지
    if (loading) return <main style={{ minHeight: "60vh" }} />;
    return <Navigate to="/careers" replace />;
  }

  const closed = isClosed(job);
  const at = jobs.findIndex((j) => j.id === job.id);
  const prev = jobs[(at - 1 + jobs.length) % jobs.length];
  const next = jobs[(at + 1) % jobs.length];

  const sections: { title: string; items: string[] }[] = [
    { title: "주요 업무", items: job.responsibilities },
    { title: "자격 요건", items: job.requirements },
    { title: "우대 사항", items: job.preferred },
  ].filter((s) => s.items.length > 0);

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 32 }}>
        <div className="container">
          <Reveal>
            <p className="eyebrow">CAREERS · {job.group}</p>
            <h1 className="section-title" style={{ fontSize: "clamp(30px, 4.6vw, 52px)" }}>
              {job.title}
            </h1>
            <p className="section-desc">{job.summary}</p>
          </Reveal>

          <Reveal>
            <dl className="detail-facts">
              <div>
                <dt>모집 상태</dt>
                <dd>
                  <span className={`job-status ${closed ? "is-closed" : ""}`}>
                    {closed ? "마감" : "채용중"}
                  </span>
                </dd>
              </div>
              <div>
                <dt>접수 기간</dt>
                <dd>{deadlineLabel(job)}</dd>
              </div>
              <div>
                <dt>소속</dt>
                <dd>{job.team}</dd>
              </div>
              <div>
                <dt>고용 형태</dt>
                <dd>{job.employment}</dd>
              </div>
              <div>
                <dt>경력</dt>
                <dd>{job.career}</dd>
              </div>
              <div>
                <dt>근무지</dt>
                <dd>{job.location}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          {sections.map((s, i) => (
            <Reveal key={s.title} delay={i * 70}>
              <div className="ssr-block">
                <div>
                  <h3>{s.title}</h3>
                </div>
                <ul className="job-bullets">
                  {s.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}

          <Reveal>
            <div className="ssr-block">
              <div>
                <h3>전형 절차</h3>
              </div>
              <ol className="job-steps">
                {hiringProcess.map((p) => (
                  <li key={p.step}>
                    <b>{p.title}</b>
                    <span>{p.desc}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          <Reveal>
            <div className="job-apply">
              <div>
                <h3>지원 방법</h3>
                <p>
                  아래 버튼으로 이력서를 첨부해 바로 지원할 수 있습니다. 온라인 지원이 어려우면{" "}
                  <b>{RECRUIT_EMAIL}</b> 로 <b>[{job.title}] 지원자명</b> 제목의 메일로 보내주셔도
                  됩니다.
                </p>
              </div>
              {closed ? (
                <span className="btn btn--ghost" aria-disabled="true">
                  접수 마감된 공고입니다
                </span>
              ) : (
                <button type="button" className="btn btn--primary" onClick={() => setApplying(true)}>
                  이 공고에 지원하기
                </button>
              )}
            </div>
          </Reveal>

          <div className="detail-nav">
            <Link to={`/careers/${prev.id}`}>← {prev.title}</Link>
            <span className="is-current" aria-current="page">
              {job.title}
            </span>
            <Link to={`/careers/${next.id}`}>{next.title} →</Link>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>다른 공고도 확인해 보세요</h2>
          <p>노블컴퍼니의 모든 채용 공고를 한 곳에서 볼 수 있습니다.</p>
          <Link to="/careers" className="btn btn--dark">
            채용공고 전체보기
          </Link>
        </div>
      </section>

      {applying && <ApplyModal job={job} onClose={() => setApplying(false)} />}
    </main>
  );
}
