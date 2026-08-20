import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi, INQUIRY_STATUS_LABEL, timeAgo, type InquiryStatus } from "../api";

interface DashboardData {
  todayInquiries: number;
  todayApplications: number;
  openPostings: number;
  week: Array<{ day: string; inq: number; app: number }>;
  recentInquiries: Array<{
    id: string;
    company: string;
    types: string[];
    status: InquiryStatus;
    createdAt: string;
  }>;
  closingPostings: Array<{ id: string; title: string; team: string; deadline: string }>;
}

/** 대시보드 — 오늘의 접수·마감 임박 공고·최근 7일 추이 (설계 §6.2) */
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi<DashboardData>("/dashboard").then(setData).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="adm-pagemsg adm-pagemsg--error">{error}</p>;
  if (!data) return <p className="adm-pagemsg">불러오는 중…</p>;

  const weekTotal = data.week.reduce((s, w) => s + w.inq + w.app, 0);
  const max = Math.max(1, ...data.week.map((w) => Math.max(w.inq, w.app)));

  const dday = (deadline: string) => {
    const diff = Math.ceil(
      (new Date(`${deadline}T23:59:59`).getTime() - Date.now()) / 86400000,
    );
    return diff <= 0 ? "D-DAY" : `D-${diff}`;
  };

  return (
    <>
      <div className="adm-cards">
        <StatCard label="오늘 신규 문의" value={data.todayInquiries} to="/admin/inquiries" />
        <StatCard label="오늘 신규 지원" value={data.todayApplications} to="/admin/applications" />
        <StatCard label="게시 중 공고" value={data.openPostings} to="/admin/jobs" />
        <StatCard label="최근 7일 접수" value={weekTotal} />
      </div>

      <div className="adm-grid2">
        <section className="adm-panel">
          <header className="adm-panel__head">
            <h2>최근 문의</h2>
            <Link to="/admin/inquiries">전체 보기 →</Link>
          </header>
          <table className="adm-table">
            <tbody>
              {data.recentInquiries.map((q) => (
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
              {data.recentInquiries.length === 0 && (
                <tr>
                  <td className="adm-dim">아직 접수된 문의가 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="adm-panel">
          <header className="adm-panel__head">
            <h2>마감 임박 공고</h2>
            <Link to="/admin/jobs">공고 관리 →</Link>
          </header>
          <table className="adm-table">
            <tbody>
              {data.closingPostings.map((j) => (
                <tr key={j.id}>
                  <td>
                    <b>{j.title}</b>
                  </td>
                  <td className="adm-dim">{j.team}</td>
                  <td className="adm-right">
                    <span className="adm-badge adm-badge--deadline">{dday(j.deadline)}</span>
                  </td>
                </tr>
              ))}
              {data.closingPostings.length === 0 && (
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
          {data.week.map((w) => (
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
