import { useMemo, useState } from "react";
import {
  formatDate,
  INQUIRY_STATUS_LABEL,
  maskEmail,
  maskPhone,
  mockInquiries,
  timeAgo,
  type Inquiry,
  type InquiryStatus,
} from "../mockData";

const STATUS_FILTERS: Array<"ALL" | InquiryStatus> = [
  "ALL",
  "new",
  "contacted",
  "proposal",
  "won",
  "lost",
];

/** 문의 관리 — 목록 + 우측 슬라이드 패널 상세 (목데이터) */
export default function Inquiries() {
  const [rows, setRows] = useState<Inquiry[]>(mockInquiries);
  const [filter, setFilter] = useState<"ALL" | InquiryStatus>("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "ALL") list = list.filter((r) => r.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.company.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.types.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [rows, filter, query]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const update = (id: string, patch: Partial<Inquiry>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-chips" role="tablist" aria-label="상태 필터">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={filter === s}
              className={`adm-chip ${filter === s ? "is-active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s === "ALL" ? "전체" : INQUIRY_STATUS_LABEL[s]}
              <em>
                {s === "ALL" ? rows.length : rows.filter((r) => r.status === s).length}
              </em>
            </button>
          ))}
        </div>

        <input
          className="adm-search"
          placeholder="회사명·담당자·문의유형 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <section className="adm-panel">
        <table className="adm-table adm-table--rows">
          <thead>
            <tr>
              <th>회사명</th>
              <th>담당자</th>
              <th>문의 유형</th>
              <th>예산</th>
              <th>상태</th>
              <th>담당 AE</th>
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
                  <b>{r.company}</b>
                </td>
                <td>{r.name}</td>
                <td className="adm-dim">{r.types.join(" · ")}</td>
                <td className="adm-dim">{r.budget ?? "—"}</td>
                <td>
                  <span className={`adm-badge adm-badge--inq-${r.status}`}>
                    {INQUIRY_STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="adm-dim">{r.assignee ?? "—"}</td>
                <td className="adm-dim adm-right">{timeAgo(r.createdAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="adm-empty">
                  조건에 맞는 문의가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {selected && (
        <DetailPanel
          inquiry={selected}
          onClose={() => setSelectedId(null)}
          onChange={(patch) => update(selected.id, patch)}
        />
      )}
    </>
  );
}

function DetailPanel({
  inquiry: q,
  onClose,
  onChange,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onChange: (patch: Partial<Inquiry>) => void;
}) {
  // 개인정보는 기본 마스킹 — 전체 보기 시 감사 로그(F15) 기록 지점
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="adm-drawer" role="dialog" aria-label={`${q.company} 문의 상세`}>
      <div className="adm-drawer__scrim" onClick={onClose} />
      <div className="adm-drawer__panel">
        <header className="adm-drawer__head">
          <div>
            <span className={`adm-badge adm-badge--inq-${q.status}`}>
              {INQUIRY_STATUS_LABEL[q.status]}
            </span>
            <h2>{q.company}</h2>
            <p className="adm-dim">
              {formatDate(q.createdAt)} 접수 · 보관기한 {q.retentionUntil}
            </p>
          </div>
          <button type="button" className="adm-iconbtn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <dl className="adm-dl">
          <div>
            <dt>담당자</dt>
            <dd>{q.name}</dd>
          </div>
          <div>
            <dt>연락처</dt>
            <dd>{revealed ? q.phone : maskPhone(q.phone)}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{revealed ? q.email : maskEmail(q.email)}</dd>
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
            <dt>문의 유형</dt>
            <dd>{q.types.join(", ")}</dd>
          </div>
          <div>
            <dt>예산 / 기간</dt>
            <dd>
              {q.budget ?? "미입력"} / {q.period ?? "미입력"}
            </dd>
          </div>
        </dl>

        {q.message && (
          <div className="adm-drawer__block">
            <h3>문의 내용</h3>
            <p>{q.message}</p>
          </div>
        )}

        <div className="adm-drawer__block">
          <h3>처리</h3>
          <label className="adm-field">
            <span>상태</span>
            <select
              value={q.status}
              onChange={(e) => onChange({ status: e.target.value as InquiryStatus })}
            >
              {(Object.keys(INQUIRY_STATUS_LABEL) as InquiryStatus[]).map((s) => (
                <option key={s} value={s}>
                  {INQUIRY_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="adm-field">
            <span>담당 AE</span>
            <input
              value={q.assignee ?? ""}
              placeholder="예) 기획1팀 최AE"
              onChange={(e) => onChange({ assignee: e.target.value || null })}
            />
          </label>
          <label className="adm-field">
            <span>내부 메모</span>
            <textarea
              rows={4}
              value={q.memo ?? ""}
              placeholder="상담 내용, 다음 액션 등"
              onChange={(e) => onChange({ memo: e.target.value || null })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
