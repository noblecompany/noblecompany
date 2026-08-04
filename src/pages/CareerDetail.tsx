import { Link, Navigate, useParams } from "react-router-dom";
import Reveal from "../components/Reveal";
import {
  deadlineLabel,
  hiringProcess,
  isClosed,
  jobPostings,
  RECRUIT_EMAIL,
  type JobPosting,
} from "../data/careers";

/** 채용공고 상세 — 주요업무 / 자격요건 / 우대사항 / 전형절차 */
export default function CareerDetail() {
  const { id } = useParams<{ id: string }>();
  const job = jobPostings.find((j) => j.id === id);

  if (!job) return <Navigate to="/careers" replace />;

  const closed = isClosed(job);
  const at = jobPostings.findIndex((j) => j.id === job.id);
  const prev = jobPostings[(at - 1 + jobPostings.length) % jobPostings.length];
  const next = jobPostings[(at + 1) % jobPostings.length];

  const sections: { title: string; items: string[] }[] = [
    { title: "주요 업무", items: job.responsibilities },
    { title: "자격 요건", items: job.requirements },
    { title: "우대 사항", items: job.preferred },
  ].filter((s) => s.items.length > 0);

  const applyHref = applyMailto(job);

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
                  이력서·포트폴리오를 <b>{RECRUIT_EMAIL}</b> 로 보내주세요. 메일 제목은{" "}
                  <b>[{job.title}] 지원자명</b> 형식으로 부탁드립니다.
                  {/* TODO: 지원서 접수 백엔드(파일 업로드) 연동 시 온라인 지원 폼으로 교체 */}
                </p>
              </div>
              {closed ? (
                <span className="btn btn--ghost" aria-disabled="true">
                  접수 마감된 공고입니다
                </span>
              ) : (
                <a className="btn btn--primary" href={applyHref}>
                  이 공고에 지원하기
                </a>
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
    </main>
  );
}

/** 지원 메일 초안 — 접수 백엔드 도입 전까지 메일 클라이언트로 넘긴다 */
function applyMailto(job: JobPosting): string {
  const body = [
    `지원 공고: ${job.title} (${job.team} / ${job.employment})`,
    "지원자 성함:",
    "연락처:",
    "이메일:",
    "",
    "※ 이력서와 포트폴리오 파일을 첨부해 주세요.",
  ].join("\n");
  return `mailto:${RECRUIT_EMAIL}?subject=${encodeURIComponent(
    `[${job.title}] 지원자명`,
  )}&body=${encodeURIComponent(body)}`;
}
