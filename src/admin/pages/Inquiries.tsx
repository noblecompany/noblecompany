import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  adminApi,
  adminDownloadCsv,
  formatDate,
  INQUIRY_STATUS_LABEL,
  timeAgo,
  type Inquiry,
  type InquiryStatus,
} from "../api";
import { IconX } from "../../components/Icons";

const STATUS_FILTERS: Array<"ALL" | InquiryStatus> = [
  "ALL",
  "new",
  "contacted",
  "proposal",
  "won",
  "lost",
];

/** 문의 관리 (1-8) — 목록 + 우측 슬라이드 패널 상세. 개인정보는 기본 마스킹 */
export default function Inquiries() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | InquiryStatus>("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    adminApi<Inquiry[]>("/inquiries")
      .then((list) => {
        setRows(list);
        // 알림 링크(?id=)로 진입하면 해당 상세를 바로 연다
        const deepLink = params.get("id");
        if (deepLink && list.some((r) => r.id === deepLink)) setSelectedId(deepLink);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  /** 화면 먼저 갱신 → 서버 PATCH. 실패 시 알림만 (다음 로드에서 동기화) */
  const save = (id: string, patch: Partial<Pick<Inquiry, "status" | "assignee" | "memo">>) => {
    update(id, patch);
    void adminApi(`/inquiries/${id}`, { method: "PATCH", body: patch }).catch((e: Error) =>
      alert(`저장 실패: ${e.message}`),
    );
  };

  const close = () => {
    setSelectedId(null);
    if (params.get("id")) setParams({}, { replace: true });
  };

  const exportCsv = () => {
    void adminDownloadCsv("inquiries").catch((e: Error) => alert(e.message));
  };

  if (error) return <p className="adm-pagemsg adm-pagemsg--error">{error}</p>;

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

        <div className="adm-toolbar__right">
          <input
            className="adm-search"
            placeholder="회사명·담당자·문의유형 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="adm-btn" onClick={exportCsv} title="owner 전용 · 감사 로그에 기록됩니다">
            CSV 내보내기
          </button>
        </div>
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
            {loading && (
              <tr>
                <td colSpan={7} className="adm-empty">
                  불러오는 중…
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((r) => (
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
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="adm-empty">
                  {rows.length === 0 ? "아직 접수된 문의가 없습니다" : "조건에 맞는 문의가 없습니다"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {selected && (
        <DetailPanel
          inquiry={selected}
          onClose={close}
          onSave={(patch) => save(selected.id, patch)}
          onReveal={(full) => update(selected.id, full)}
        />
      )}
    </>
  );
}

function DetailPanel({
  inquiry: q,
  onClose,
  onSave,
  onReveal,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onSave: (patch: Partial<Pick<Inquiry, "status" | "assignee" | "memo">>) => void;
  onReveal: (full: { phone: string; email: string }) => void;
}) {
  // 개인정보 기본 마스킹 — 전체 보기 시 서버가 감사 로그(F15)를 남기고 원본을 준다
  const [revealed, setRevealed] = useState(false);
  const [assignee, setAssignee] = useState(q.assignee ?? "");
  const [memo, setMemo] = useState(q.memo ?? "");

  // 다른 행을 선택하면 로컬 편집값을 그 행 기준으로 리셋한다
  useEffect(() => {
    setRevealed(false);
    setAssignee(q.assignee ?? "");
    setMemo(q.memo ?? "");
  }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const reveal = () => {
    adminApi<{ phone: string; email: string }>(`/inquiries/${q.id}/reveal`, { method: "POST" })
      .then((full) => {
        onReveal(full);
        setRevealed(true);
      })
      .catch((e: Error) => alert(e.message));
  };

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
            <IconX size={18} />
          </button>
        </header>

        <dl className="adm-dl">
          <div>
            <dt>담당자</dt>
            <dd>{q.name}</dd>
          </div>
          <div>
            <dt>연락처</dt>
            <dd>{q.phone}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{q.email}</dd>
          </div>
          {!revealed && (
            <div className="adm-dl__action">
              <button type="button" onClick={reveal}>
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
          {q.source && (
            <div>
              <dt>유입 경로</dt>
              <dd>{q.source}</dd>
            </div>
          )}
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
              onChange={(e) => onSave({ status: e.target.value as InquiryStatus })}
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
              value={assignee}
              placeholder="예) 기획1팀 최AE"
              onChange={(e) => setAssignee(e.target.value)}
              onBlur={() => {
                if ((q.assignee ?? "") !== assignee) onSave({ assignee: assignee || null });
              }}
            />
          </label>
          <label className="adm-field">
            <span>내부 메모</span>
            <textarea
              rows={4}
              value={memo}
              placeholder="상담 내용, 다음 액션 등 — 입력 후 바깥을 클릭하면 저장됩니다"
              onChange={(e) => setMemo(e.target.value)}
              onBlur={() => {
                if ((q.memo ?? "") !== memo) onSave({ memo: memo || null });
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
