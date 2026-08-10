import { useMemo, useState } from "react";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STEPS,
  formatDate,
  maskEmail,
  maskPhone,
  mockApplications,
  timeAgo,
  type Application,
  type ApplicationStatus,
} from "../mockData";

const STATUS_FILTERS: Array<"ALL" | ApplicationStatus> = [
  "ALL",
  "received",
  "screening",
  "interview",
  "offer",
  "rejected",
];

/** 지원자 관리 — 목록 + 슬라이드 패널 상세 (목데이터) */
export default function Applications() {
  const [rows, setRows] = useState<Application[]>(mockApplications);
  const [filter, setFilter] = useState<"ALL" | ApplicationStatus>("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "ALL") list = list.filter((r) => r.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || r.postingTitle.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, filter, query]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const update = (id: string, patch: Partial<Application>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-chips" role="tablist" aria-label="전형 단계 필터">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={filter === s}
              className={`adm-chip ${filter === s ? "is-active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s === "ALL" ? "전체" : APPLICATION_STATUS_LABEL[s]}
              <em>
                {s === "ALL" ? rows.length : rows.filter((r) => r.status === s).length}
              </em>
            </button>
          ))}
        </div>

        <input
          className="adm-search"
          placeholder="지원자·공고 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <section className="adm-panel">
        <table className="adm-table adm-table--rows">
          <thead>
            <tr>
              <th>지원자</th>
              <th>지원 공고</th>
              <th>경력</th>
              <th>이력서</th>
              <th>전형 단계</th>
              <th className="adm-right">접수</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={selectedId === r.id ? "is-selected" : ""}
                onClick={() => setSelectedId(r.id)}
              >
                <td>
                  <b>{r.name}</b>
                </td>
                <td className="adm-dim">{r.postingTitle}</td>
                <td className="adm-dim">{r.careerYears ?? "—"}</td>
                <td className="adm-dim">{r.resumeName ? "📎 첨부" : "—"}</td>
                <td>
                  <span className={`adm-badge adm-badge--app-${r.status}`}>
                    {APPLICATION_STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="adm-dim adm-right">{timeAgo(r.createdAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="adm-empty">
                  조건에 맞는 지원자가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {selected && (
        <DetailPanel
          app={selected}
          onClose={() => setSelectedId(null)}
          onChange={(patch) => update(selected.id, patch)}
        />
      )}
    </>
  );
}

function DetailPanel({
  app: a,
  onClose,
  onChange,
}: {
  app: Application;
  onClose: () => void;
  onChange: (patch: Partial<Application>) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const rejected = a.status === "rejected";

  return (
    <div className="adm-drawer" role="dialog" aria-label={`${a.name} 지원 상세`}>
      <div className="adm-drawer__scrim" onClick={onClose} />
      <div className="adm-drawer__panel">
        <header className="adm-drawer__head">
          <div>
            <span className={`adm-badge adm-badge--app-${a.status}`}>
              {APPLICATION_STATUS_LABEL[a.status]}
            </span>
            <h2>{a.name}</h2>
            <p className="adm-dim">
              {a.postingTitle} · {formatDate(a.createdAt)} 접수
            </p>
          </div>
          <button type="button" className="adm-iconbtn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        {/* 전형 단계 스텝퍼 — 불합격은 별도 상태라 스텝에서 제외 */}
        <div className={`adm-steps ${rejected ? "is-rejected" : ""}`}>
          {APPLICATION_STEPS.map((s, i) => {
            const activeIdx = APPLICATION_STEPS.indexOf(a.status);
            const state = rejected ? "" : i < activeIdx ? "is-done" : i === activeIdx ? "is-current" : "";
            return (
              <button
                key={s}
                type="button"
                className={`adm-steps__item ${state}`}
                onClick={() => onChange({ status: s })}
              >
                <i>{i + 1}</i>
                {APPLICATION_STATUS_LABEL[s]}
              </button>
            );
          })}
          <button
            type="button"
            className={`adm-steps__reject ${rejected ? "is-current" : ""}`}
            onClick={() => onChange({ status: "rejected" })}
          >
            불합격
          </button>
        </div>

        <dl className="adm-dl">
          <div>
            <dt>연락처</dt>
            <dd>{revealed ? a.phone : maskPhone(a.phone)}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{revealed ? a.email : maskEmail(a.email)}</dd>
          </div>
          {!revealed && (
            <div className="adm-dl__action">
              {/* TODO(F15): 열람 시 audit_logs INSERT */}
              <button type="button" onClick={() => setRevealed(true)}>
                개인정보 전체 보기 (열람 기록 남음)
              </button>
            </div>
          )}
          <div>
            <dt>경력</dt>
            <dd>{a.careerYears ?? "미입력"}</dd>
          </div>
          <div>
            <dt>이력서</dt>
            <dd>
              {a.resumeName ? (
                // TODO(1-8): 60초 signed URL 발급으로 교체
                <button type="button" className="adm-linkbtn" title="Storage 연동 후 열람 가능">
                  📎 {a.resumeName}
                </button>
              ) : (
                "미첨부"
              )}
            </dd>
          </div>
          {a.portfolioUrl && (
            <div>
              <dt>포트폴리오</dt>
              <dd>
                <a href={a.portfolioUrl} target="_blank" rel="noreferrer" className="adm-link">
                  {a.portfolioUrl} ↗
                </a>
              </dd>
            </div>
          )}
        </dl>

        {a.message && (
          <div className="adm-drawer__block">
            <h3>자기소개</h3>
            <p>{a.message}</p>
          </div>
        )}

        <div className="adm-drawer__block">
          <h3>내부 메모</h3>
          <label className="adm-field">
            <textarea
              rows={4}
              value={a.memo ?? ""}
              placeholder="면접 일정, 평가 내용 등"
              onChange={(e) => onChange({ memo: e.target.value || null })}
            />
          </label>
          <p className="adm-retention">보관기간 만료: {a.retentionUntil} (자동 파기 예정)</p>
        </div>
      </div>
    </div>
  );
}
