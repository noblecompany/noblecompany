import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  adminApi,
  adminDownloadCsv,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STEPS,
  formatDate,
  timeAgo,
  type Application,
  type ApplicationStatus,
} from "../api";

const STATUS_FILTERS: Array<"ALL" | ApplicationStatus> = [
  "ALL",
  "received",
  "screening",
  "interview",
  "offer",
  "rejected",
];

/** 지원자 관리 (1-8) — 목록 + 전형 단계 스텝퍼 + 이력서 60초 signed URL 열람 */
export default function Applications() {
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | ApplicationStatus>("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    adminApi<Application[]>("/applications")
      .then((list) => {
        setRows(list);
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
        (r) => r.name.toLowerCase().includes(q) || r.postingTitle.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, filter, query]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const update = (id: string, patch: Partial<Application>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = (id: string, patch: Partial<Pick<Application, "status" | "memo">>) => {
    update(id, patch);
    void adminApi(`/applications/${id}`, { method: "PATCH", body: patch }).catch((e: Error) =>
      alert(`저장 실패: ${e.message}`),
    );
  };

  const close = () => {
    setSelectedId(null);
    if (params.get("id")) setParams({}, { replace: true });
  };

  if (error) return <p className="adm-pagemsg adm-pagemsg--error">{error}</p>;

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

        <div className="adm-toolbar__right">
          <input
            className="adm-search"
            placeholder="지원자·공고 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="adm-btn"
            onClick={() => void adminDownloadCsv("applications").catch((e: Error) => alert(e.message))}
            title="owner 전용 · 감사 로그에 기록됩니다"
          >
            CSV 내보내기
          </button>
        </div>
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
            {loading && (
              <tr>
                <td colSpan={6} className="adm-empty">
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
                    <b>{r.name}</b>
                  </td>
                  <td className="adm-dim">{r.postingTitle}</td>
                  <td className="adm-dim">{r.careerYears ?? "—"}</td>
                  <td className="adm-dim">{r.hasResume ? "📎 첨부" : "—"}</td>
                  <td>
                    <span className={`adm-badge adm-badge--app-${r.status}`}>
                      {APPLICATION_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="adm-dim adm-right">{timeAgo(r.createdAt)}</td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="adm-empty">
                  {rows.length === 0
                    ? "아직 접수된 지원서가 없습니다"
                    : "조건에 맞는 지원자가 없습니다"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {selected && (
        <DetailPanel
          app={selected}
          onClose={close}
          onSave={(patch) => save(selected.id, patch)}
          onReveal={(full) => update(selected.id, full)}
        />
      )}
    </>
  );
}

function DetailPanel({
  app: a,
  onClose,
  onSave,
  onReveal,
}: {
  app: Application;
  onClose: () => void;
  onSave: (patch: Partial<Pick<Application, "status" | "memo">>) => void;
  onReveal: (full: { phone: string; email: string }) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [memo, setMemo] = useState(a.memo ?? "");
  const [resumeBusy, setResumeBusy] = useState(false);
  const rejected = a.status === "rejected";

  useEffect(() => {
    setRevealed(false);
    setMemo(a.memo ?? "");
  }, [a.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const reveal = () => {
    adminApi<{ phone: string; email: string }>(`/applications/${a.id}/reveal`, { method: "POST" })
      .then((full) => {
        onReveal(full);
        setRevealed(true);
      })
      .catch((e: Error) => alert(e.message));
  };

  /** 이력서 — 60초 signed URL 을 받아 새 탭에서 연다 (감사 로그 기록됨) */
  const openResume = () => {
    setResumeBusy(true);
    adminApi<{ url: string }>(`/applications/${a.id}/resume`)
      .then(({ url }) => window.open(url, "_blank", "noopener"))
      .catch((e: Error) => alert(e.message))
      .finally(() => setResumeBusy(false));
  };

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
                onClick={() => onSave({ status: s })}
              >
                <i>{i + 1}</i>
                {APPLICATION_STATUS_LABEL[s]}
              </button>
            );
          })}
          <button
            type="button"
            className={`adm-steps__reject ${rejected ? "is-current" : ""}`}
            onClick={() => onSave({ status: "rejected" })}
          >
            불합격
          </button>
        </div>

        <dl className="adm-dl">
          <div>
            <dt>연락처</dt>
            <dd>{a.phone}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{a.email}</dd>
          </div>
          {!revealed && (
            <div className="adm-dl__action">
              <button type="button" onClick={reveal}>
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
              {a.hasResume ? (
                <button
                  type="button"
                  className="adm-linkbtn"
                  onClick={openResume}
                  disabled={resumeBusy}
                  title="60초 유효 링크로 열립니다 · 열람 기록이 남습니다"
                >
                  📎 {resumeBusy ? "링크 발급 중…" : "이력서 열기 (열람 기록 남음)"}
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
              value={memo}
              placeholder="면접 일정, 평가 내용 등 — 입력 후 바깥을 클릭하면 저장됩니다"
              onChange={(e) => setMemo(e.target.value)}
              onBlur={() => {
                if ((a.memo ?? "") !== memo) onSave({ memo: memo || null });
              }}
            />
          </label>
          <p className="adm-retention">보관기간 만료: {a.retentionUntil} (자동 파기 예정)</p>
        </div>
      </div>
    </div>
  );
}
