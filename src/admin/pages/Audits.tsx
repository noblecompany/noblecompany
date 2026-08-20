import { useEffect, useState } from "react";
import { adminApi, formatDate, timeAgo } from "../api";
import { IconCheck, IconMinus, IconX } from "../../components/Icons";

type Status = "pass" | "warn" | "fail";

interface AuditRow {
  id: string;
  url: string;
  finalUrl: string | null;
  pageTitle: string | null;
  grade: string;
  passCount: number;
  warnCount: number;
  failCount: number;
  categories: Record<string, Status>;
  createdAt: string;
}

interface AuditDetail extends AuditRow {
  checks: Array<{
    id: string;
    category: "collect" | "index" | "aeo" | "geo";
    label: string;
    status: Status;
    value: string;
    advice?: string;
    evidence?: string;
  }>;
  keywords: {
    words: Array<{ word: string; count: number; rate: number; inTitle: boolean; inDesc: boolean }>;
    phrases: Array<{ phrase: string; count: number }>;
    totalTokens: number;
  };
  meta: {
    sizeKb?: number;
    timeMs?: number;
    description?: string | null;
    schemaTypes?: string[];
    ars?: {
      score: number;
      max: number;
      potential: number;
      categories: Array<{ label: string; max: number; score: number }>;
    };
    aiBriefing?: Array<{ key: string; label: string; status: "pass" | "missing" | "na" }>;
  };
  ip: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  collect: "수집 점검",
  index: "색인 점검",
  aeo: "AEO 점검",
  geo: "GEO 점검 (AI 검색)",
};

const STATUS_LABEL: Record<Status, string> = { pass: "통과", warn: "경고", fail: "실패" };

/**
 * 사이트 진단 결과 관리 — 방문자가 돌린 무료 진단(/diagnosis)의 전체 리포트.
 * 상담·미팅 자료로 쓰고, JSON 다운로드·인쇄를 지원한다. (owner·sales)
 */
export default function Audits() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  useEffect(() => {
    adminApi<AuditRow[]>("/audits")
      .then(setRows)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const open = (id: string) => {
    setDetailBusy(true);
    adminApi<AuditDetail>(`/audits/${id}`)
      .then(setDetail)
      .catch((e: Error) => alert(e.message))
      .finally(() => setDetailBusy(false));
  };

  const remove = (r: AuditRow) => {
    if (!confirm(`'${r.url}' 진단 기록을 삭제할까요?`)) return;
    void adminApi(`/audits/${r.id}`, { method: "DELETE" })
      .then(() => setRows((list) => list.filter((x) => x.id !== r.id)))
      .catch((e: Error) => alert(e.message));
  };

  if (error) return <p className="adm-pagemsg adm-pagemsg--error">{error}</p>;

  return (
    <>
      <div className="adm-toolbar">
        <p className="adm-toolbar__note">
          방문자가 무료 진단을 돌리면 여기에 전체 리포트가 쌓입니다. 상담 전에 열어 개선
          포인트를 미리 확인하세요.
        </p>
      </div>

      <section className="adm-panel">
        <table className="adm-table adm-table--rows">
          <thead>
            <tr>
              <th>URL</th>
              <th>등급</th>
              <th className="adm-right">통과</th>
              <th className="adm-right">경고</th>
              <th className="adm-right">실패</th>
              <th className="adm-right">진단 시각</th>
              <th className="adm-right">관리</th>
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
              rows.map((r) => (
                <tr key={r.id} onClick={() => open(r.id)}>
                  <td>
                    <b style={{ wordBreak: "break-all" }}>{r.url}</b>
                    {r.pageTitle && <span className="adm-dim adm-cell-sub">{r.pageTitle}</span>}
                  </td>
                  <td>
                    <span className={`adm-badge adm-grade adm-grade--${r.grade.replace("+", "p")}`}>
                      {r.grade}
                    </span>
                  </td>
                  <td className="adm-dim adm-right">{r.passCount}</td>
                  <td className="adm-right" style={{ color: r.warnCount ? "#d68f2c" : undefined }}>
                    {r.warnCount}
                  </td>
                  <td className="adm-right" style={{ color: r.failCount ? "#d64545" : undefined }}>
                    {r.failCount}
                  </td>
                  <td className="adm-dim adm-right">{timeAgo(r.createdAt)}</td>
                  <td className="adm-right">
                    <button
                      type="button"
                      className="adm-linkbtn adm-linkbtn--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(r);
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="adm-empty">
                  아직 진단 기록이 없습니다 — 사이트의 '무료진단' 메뉴에서 접수됩니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {detailBusy && <p className="adm-pagemsg">리포트 여는 중…</p>}
      {detail && <DetailDrawer audit={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

function DetailDrawer({ audit: a, onClose }: { audit: AuditDetail; onClose: () => void }) {
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(a, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `진단리포트_${a.url.replace(/[^\w.-]+/g, "_").slice(0, 60)}_${formatDate(a.createdAt)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const grouped = (["collect", "index", "aeo", "geo"] as const).map((cat) => ({
    cat,
    items: a.checks.filter((c) => c.category === cat),
  }));

  return (
    <div className="adm-drawer" role="dialog" aria-label={`${a.url} 진단 리포트`}>
      <div className="adm-drawer__scrim" onClick={onClose} />
      <div className="adm-drawer__panel adm-drawer__panel--wide">
        <header className="adm-drawer__head">
          <div>
            <span className={`adm-badge adm-grade adm-grade--${a.grade.replace("+", "p")}`}>
              등급 {a.grade}
            </span>
            <h2 style={{ wordBreak: "break-all" }}>{a.url}</h2>
            <p className="adm-dim">
              {formatDate(a.createdAt)} 진단 · 통과 {a.passCount} / 경고 {a.warnCount} / 실패{" "}
              {a.failCount}
              {a.meta.timeMs ? ` · 응답 ${a.meta.timeMs}ms` : ""}
              {a.ip ? ` · IP ${a.ip}` : ""}
            </p>
          </div>
          <div className="adm-inline">
            <button type="button" className="adm-btn" onClick={downloadJson}>
              JSON 다운로드
            </button>
            <button type="button" className="adm-btn" onClick={() => window.print()}>
              인쇄 / PDF
            </button>
            <button type="button" className="adm-iconbtn" onClick={onClose} aria-label="닫기">
              <IconX size={18} />
            </button>
          </div>
        </header>

        {a.pageTitle && (
          <p>
            <b>페이지 제목:</b> {a.pageTitle}
          </p>
        )}
        {a.meta.description && (
          <p className="adm-dim">
            <b>메타 디스크립션:</b> {a.meta.description}
          </p>
        )}

        {a.meta.ars && (
          <div className="adm-drawer__block">
            <h3>
              NRS 광고연관 준비도{" "}
              <span className="adm-dim">
                {a.meta.ars.score} / {a.meta.ars.max}점 (개선 시 {a.meta.ars.potential}점)
              </span>
            </h3>
            <table className="adm-table">
              <tbody>
                {a.meta.ars.categories.map((c) => (
                  <tr key={c.label}>
                    <td>{c.label}</td>
                    <td className="adm-right">
                      <b>{c.score}</b> <span className="adm-dim">/ {c.max}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {a.meta.aiBriefing && (
          <div className="adm-drawer__block">
            <h3>AI 브리핑 정보 준비도</h3>
            <div className="adm-clientgrid">
              {a.meta.aiBriefing.map((f) => (
                <span
                  className="adm-clientchip"
                  key={f.key}
                  style={{
                    color:
                      f.status === "pass" ? "#2e9e5b" : f.status === "missing" ? "#d64545" : undefined,
                  }}
                >
                  {f.status === "pass" ? <IconCheck /> : f.status === "missing" ? <IconX /> : <IconMinus />} {f.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {grouped.map(({ cat, items }) => (
          <div className="adm-drawer__block" key={cat}>
            <h3>
              {CATEGORY_LABEL[cat]}{" "}
              <span className="adm-dim">
                ({items.filter((c) => c.status === "pass").length}/{items.length} 통과)
              </span>
            </h3>
            <ul className="adm-checklist">
              {items.map((c) => (
                <li key={c.id} className={`adm-checkitem adm-checkitem--${c.status}`}>
                  <b>{STATUS_LABEL[c.status]}</b>
                  <div>
                    <span className="adm-checkitem__label">{c.label}</span>
                    <span className="adm-dim"> — {c.value}</span>
                    {c.advice && <p className="adm-checkitem__advice">개선 방안: {c.advice}</p>}
                    {c.evidence && <pre className="adm-checkitem__evidence">{c.evidence}</pre>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="adm-drawer__block">
          <h3>
            키워드 요약 <span className="adm-dim">(총 토큰 {a.keywords.totalTokens?.toLocaleString?.() ?? "-"})</span>
          </h3>
          <table className="adm-table">
            <thead>
              <tr>
                <th>키워드</th>
                <th className="adm-right">빈도</th>
                <th className="adm-right">빈도율</th>
                <th>타이틀</th>
                <th>메타</th>
              </tr>
            </thead>
            <tbody>
              {a.keywords.words.map((k) => (
                <tr key={k.word}>
                  <td>
                    <b>{k.word}</b>
                  </td>
                  <td className="adm-right">{k.count}</td>
                  <td className="adm-right">{k.rate}%</td>
                  <td>{k.inTitle ? <IconCheck className="adm-ico-ok" /> : <IconX className="adm-ico-no" />}</td>
                  <td>{k.inDesc ? <IconCheck className="adm-ico-ok" /> : <IconX className="adm-ico-no" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {a.keywords.phrases.length > 0 && (
            <>
              <h3 style={{ marginTop: 16 }}>프레이즈 (2어절)</h3>
              <div className="adm-clientgrid">
                {a.keywords.phrases.map((p) => (
                  <span className="adm-clientchip" key={p.phrase}>
                    {p.phrase} <em className="adm-dim">×{p.count}</em>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
