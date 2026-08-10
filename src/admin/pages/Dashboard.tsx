import { Link } from "react-router-dom";
import { deadlineLabel, isClosed, jobPostings } from "../../data/careers";
import {
  INQUIRY_STATUS_LABEL,
  mockApplications,
  mockInquiries,
  timeAgo,
} from "../mockData";

/** 최근 7일 접수 추이 목데이터 (문의/지원 건수) */
const WEEK: Array<{ day: string; inq: number; app: number }> = [
  { day: "7/30", inq: 1, app: 0 },
  { day: "7/31", inq: 0, app: 1 },
  { day: "8/1", inq: 1, app: 1 },
  { day: "8/2", inq: 1, app: 0 },
  { day: "8/3", inq: 1, app: 1 },
  { day: "8/4", inq: 1, app: 1 },
  { day: "8/5", inq: 2, app: 1 },
];

export default function Dashboard() {
  const today = "2026-08-05";
  const newInquiries = mockInquiries.filter((i) => i.createdAt.startsWith(today)).length;
  const newApplications = mockApplications.filter((a) => a.createdAt.startsWith(today)).length;
  const openPostings = jobPostings.filter((j) => !isClosed(j, new Date(today))).length;
  const max = Math.max(...WEEK.map((w) => w.inq + w.app));

  // 마감일 있는 공고를 임박순으로
  const closing = jobPostings
    .filter((j) => j.deadline && !isClosed(j, new Date(today)))
    .sort((a, b) => (a.deadline as string).localeCompare(b.deadline as string));

  return (
    <>
      <div className="adm-cards">
        <StatCard label="오늘 신규 문의" value={newInquiries} to="/admin/inquiries" />
        <StatCard label="오늘 신규 지원" value={newApplications} to="/admin/applications" />
        <StatCard label="게시 중 공고" value={openPostings} />
        <StatCard
          label="이번 주 접수"
          value={WEEK.reduce((s, w) => s + w.inq + w.app, 0)}
        />
      </div>

      <div className="adm-grid2">
        <section className="adm-panel">
          <header className="adm-panel__head">
            <h2>최근 문의</h2>
            <Link to="/admin/inquiries">전체 보기 →</Link>
          </header>
          <table className="adm-table">
            <tbody>
              {mockInquiries.slice(0, 5).map((q) => (
                <tr key={q.id}>
                  <td>
                    <b>{q.company}</b>
                  </td>
                  <td className="adm-dim">{q.types.join(" · ")}</td>
                  <td>
                    <span className={`adm-badge adm-badge--inq-${q.status}`}>
                      {INQUIRY_STATUS_LABEL[q.status]}
                    </span>
                  </td>
                  <td className="adm-dim adm-right">{timeAgo(q.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="adm-panel">
          <header className="adm-panel__head">
            <h2>마감 임박 공고</h2>
          </header>
          <table className="adm-table">
            <tbody>
              {closing.map((j) => (
                <tr key={j.id}>
                  <td>
                    <b>{j.title}</b>
                  </td>
                  <td className="adm-dim">{j.team}</td>
                  <td className="adm-right">
                    <span className="adm-badge adm-badge--deadline">{deadlineLabel(j)}</span>
                  </td>
                </tr>
              ))}
              {closing.length === 0 && (
                <tr>
                  <td className="adm-dim">마감일이 설정된 공고가 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="adm-panel">
        <header className="adm-panel__head">
          <h2>최근 7일 접수 추이</h2>
          <div className="adm-legend">
            <span className="adm-legend__dot adm-legend__dot--inq" /> 문의
            <span className="adm-legend__dot adm-legend__dot--app" /> 지원
          </div>
        </header>
        <div className="adm-chart" role="img" aria-label="최근 7일 문의·지원 접수 추이">
          {WEEK.map((w) => (
            <div className="adm-chart__col" key={w.day}>
              <div className="adm-chart__bars">
                <div
                  className="adm-chart__bar adm-chart__bar--inq"
                  style={{ height: `${(w.inq / max) * 100}%` }}
                  title={`문의 ${w.inq}건`}
                />
                <div
                  className="adm-chart__bar adm-chart__bar--app"
                  style={{ height: `${(w.app / max) * 100}%` }}
                  title={`지원 ${w.app}건`}
                />
              </div>
              <span>{w.day}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function StatCard({ label, value, to }: { label: string; value: number; to?: string }) {
  const body = (
    <>
      <strong>{value}</strong>
      <span>{label}</span>
    </>
  );
  return to ? (
    <Link to={to} className="adm-stat adm-stat--link">
      {body}
    </Link>
  ) : (
    <div className="adm-stat">{body}</div>
  );
}
