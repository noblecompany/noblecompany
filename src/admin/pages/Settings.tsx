import { useEffect, useRef, useState } from "react";
import {
  adminApi,
  adminUpload,
  formatBytes,
  formatDate,
  imageExt,
  resizeImage,
  type AdminBrochure,
  type AdminPopup,
} from "../api";

/** 사이트 설정 — 기능 토글(F16) · 팝업 배너(C1) · 회사소개서(B6) · 접속 통계(C2 간이판) */
export default function Settings() {
  return (
    <>
      <FeatureToggles />
      <PopupManager />
      <BrochureManager />
      <StatsPanel />
    </>
  );
}

/* ================================================= 기능 토글 (owner) */

function FeatureToggles() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    adminApi<Record<string, unknown>>("/settings")
      .then(setSettings)
      .catch((e: Error) => setMsg(e.message));
  }, []);

  const toggle = (key: string) => {
    if (!settings) return;
    const next = !(settings[key] === true);
    setSettings((s) => ({ ...s, [key]: next }));
    void adminApi("/settings", { method: "PATCH", body: { [key]: next } }).catch((e: Error) => {
      setSettings((s) => ({ ...s, [key]: !next })); // 실패 시 되돌림
      setMsg(`저장 실패: ${e.message}`);
    });
  };

  const FEATURES: Array<{ key: string; label: string; desc: string }> = [
    { key: "feature.popup", label: "공지·팝업 배너", desc: "켜면 게시 기간 중인 팝업이 사이트에 노출됩니다" },
    { key: "feature.clients", label: "클라이언트 롤링 밴드", desc: "메인 페이지에 거래 브랜드 롤링 섹션을 노출합니다 (목록은 연혁·조직 > 클라이언트에서 편집)" },
    { key: "feature.stats", label: "접속 통계", desc: "공고 조회수·소개서 열람 집계를 대시보드에 표시합니다" },
  ];

  return (
    <section className="adm-panel adm-panel--pad">
      <header className="adm-panel__head">
        <h2>기능 토글</h2>
        <span className="adm-dim">owner 전용</span>
      </header>
      {msg && <p className="adm-pagemsg adm-pagemsg--error">{msg}</p>}
      <div className="adm-togglelist">
        {FEATURES.map((f) => (
          <div className="adm-togglelist__row" key={f.key}>
            <div>
              <b>{f.label}</b>
              <p className="adm-dim">{f.desc}</p>
            </div>
            <button
              type="button"
              className={`adm-switch ${settings?.[f.key] === true ? "is-on" : ""}`}
              role="switch"
              aria-checked={settings?.[f.key] === true}
              disabled={!settings}
              onClick={() => toggle(f.key)}
            >
              <i />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================================================= 팝업 배너 (C1, owner·editor) */

/** datetime-local 입력값 ↔ ISO 문자열 */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function PopupManager() {
  const [rows, setRows] = useState<AdminPopup[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    adminApi<AdminPopup[]>("/popups")
      .then(setRows)
      .catch((e: Error) => setMsg(e.message));
  };
  useEffect(load, []);

  const patch = (id: string, body: Partial<{ active: boolean }>) => {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...body } : r)));
    void adminApi(`/popups/${id}`, { method: "PATCH", body }).catch((e: Error) =>
      alert(`저장 실패: ${e.message}`),
    );
  };

  const remove = (r: AdminPopup) => {
    if (!confirm(`'${r.title}' 팝업을 삭제할까요?`)) return;
    void adminApi(`/popups/${r.id}`, { method: "DELETE" })
      .then(() => setRows((list) => list.filter((x) => x.id !== r.id)))
      .catch((e: Error) => alert(e.message));
  };

  const now = Date.now();
  const liveState = (r: AdminPopup) => {
    if (!r.active) return "꺼짐";
    if (now < new Date(r.startsAt).getTime()) return "예약";
    if (now > new Date(r.endsAt).getTime()) return "종료";
    return "게시중";
  };

  return (
    <section className="adm-panel adm-panel--pad">
      <header className="adm-panel__head">
        <h2>공지·팝업 배너</h2>
        <button type="button" className="adm-btn" onClick={() => setCreating(true)}>
          + 새 팝업
        </button>
      </header>
      <p className="adm-hint">
        게시 기간 안이고 켜짐 상태인 팝업 중 최신 1개가 노출됩니다. 사이트 노출은 '기능 토글 → 공지·팝업 배너'가 켜져 있어야 합니다.
      </p>
      {msg && <p className="adm-pagemsg adm-pagemsg--error">{msg}</p>}

      <table className="adm-table adm-table--rows">
        <thead>
          <tr>
            <th>제목</th>
            <th>게시 기간</th>
            <th>링크</th>
            <th>상태</th>
            <th className="adm-right">관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <b>{r.title}</b>
                {r.imagePath && <span className="adm-dim adm-cell-sub">이미지 있음</span>}
              </td>
              <td className="adm-dim">
                {formatDate(r.startsAt)} ~ {formatDate(r.endsAt)}
              </td>
              <td className="adm-dim">{r.linkUrl ?? "—"}</td>
              <td>
                <span className={`adm-badge adm-badge--pop-${liveState(r) === "게시중" ? "live" : "off"}`}>
                  {liveState(r)}
                </span>
              </td>
              <td className="adm-right">
                <button type="button" className="adm-linkbtn" onClick={() => patch(r.id, { active: !r.active })}>
                  {r.active ? "끄기" : "켜기"}
                </button>{" "}
                <button type="button" className="adm-linkbtn adm-linkbtn--danger" onClick={() => remove(r)}>
                  삭제
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="adm-empty">
                등록된 팝업이 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {creating && (
        <PopupForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </section>
  );
}

function PopupForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState(toLocalInput(new Date().toISOString()));
  const [endsAt, setEndsAt] = useState(
    toLocalInput(new Date(Date.now() + 7 * 86400 * 1000).toISOString()),
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setErr(null);
    try {
      // jpg·png 는 WebP 로 리사이즈·압축해서 올린다 (gif 애니메이션 등은 원본 유지)
      const convertible = file.type === "image/jpeg" || file.type === "image/png";
      const blob = convertible ? await resizeImage(file, 1600) : file;
      const name = convertible
        ? `${file.name.replace(/\.[^.]+$/, "")}.${imageExt(blob)}`
        : file.name;
      const up = await adminUpload("site-assets", blob, name);
      setImagePath(up.publicUrl);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = () => {
    setErr(null);
    if (!title.trim()) {
      setErr("제목을 입력해 주세요.");
      return;
    }
    if (new Date(startsAt) >= new Date(endsAt)) {
      setErr("종료 시각이 시작 시각보다 늦어야 합니다.");
      return;
    }
    setBusy(true);
    adminApi("/popups", {
      method: "POST",
      body: {
        title: title.trim(),
        imagePath,
        linkUrl: linkUrl.trim() || null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        active: true,
      },
    })
      .then(onSaved)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="adm-subform">
      <div className="adm-formgrid">
        <label className="adm-field">
          <span>제목 *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 여름 프로모션 안내" />
        </label>
        <label className="adm-field">
          <span>클릭 시 이동 링크 (선택)</span>
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
        </label>
        <label className="adm-field">
          <span>게시 시작</span>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </label>
        <label className="adm-field">
          <span>게시 종료</span>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </label>
      </div>
      <label className="adm-field">
        <span>배너 이미지 (선택 — 없으면 제목 텍스트로 노출)</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        {uploading && <em className="adm-dim">업로드 중…</em>}
        {imagePath && <img className="adm-popup-preview" src={imagePath} alt="팝업 이미지 미리보기" />}
      </label>
      {err && <p className="adm-pagemsg adm-pagemsg--error">{err}</p>}
      <div className="adm-actionbar">
        <button type="button" className="adm-btn" onClick={onClose}>
          취소
        </button>
        <button type="button" className="adm-btn adm-btn--primary" disabled={busy || uploading} onClick={save}>
          {busy ? "등록 중…" : "팝업 등록"}
        </button>
      </div>
    </div>
  );
}

/* ================================================= 회사소개서 (B6, owner) */

function BrochureManager() {
  const [rows, setRows] = useState<AdminBrochure[]>([]);
  const [version, setVersion] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    adminApi<AdminBrochure[]>("/brochures")
      .then(setRows)
      .catch((e: Error) => setMsg(e.message));
  };
  useEffect(load, []);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    setMsg(null);
    if (!file) {
      setMsg("PDF 파일을 선택해 주세요.");
      return;
    }
    if (!version.trim()) {
      setMsg("버전 표기를 입력해 주세요. 예) 2026.09");
      return;
    }
    setBusy(true);
    try {
      const up = await adminUpload("brochures", file, file.name);
      await adminApi("/brochures", {
        method: "POST",
        body: { version: version.trim(), filePath: up.path, fileSize: file.size },
      });
      setVersion("");
      if (fileRef.current) fileRef.current.value = "";
      setMsg("교체 완료 — 사이트의 '회사소개서 보기'가 새 파일로 바뀌었습니다.");
      load();
    } catch (e) {
      setMsg(`실패: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="adm-panel adm-panel--pad">
      <header className="adm-panel__head">
        <h2>회사소개서</h2>
        <span className="adm-dim">owner 전용 · 이전 버전은 이력으로 보관됩니다</span>
      </header>
      {msg && <p className={`adm-pagemsg ${msg.startsWith("실패") ? "adm-pagemsg--error" : ""}`}>{msg}</p>}

      <div className="adm-inline adm-inline--gap">
        <input
          className="adm-search"
          value={version}
          placeholder="버전 표기 — 예) 2026.09"
          onChange={(e) => setVersion(e.target.value)}
        />
        <input ref={fileRef} type="file" accept=".pdf" />
        <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => void upload()}>
          {busy ? "업로드 중…" : "새 버전으로 교체"}
        </button>
      </div>

      <table className="adm-table adm-table--rows">
        <thead>
          <tr>
            <th>버전</th>
            <th>파일</th>
            <th>등록일</th>
            <th className="adm-right">열람</th>
            <th className="adm-right">다운로드</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <td>
                <b>{b.version}</b>
              </td>
              <td className="adm-dim">{formatBytes(b.fileSize)}</td>
              <td className="adm-dim">{formatDate(b.createdAt)}</td>
              <td className="adm-dim adm-right">{b.viewCount.toLocaleString()}</td>
              <td className="adm-dim adm-right">{b.downloadCount.toLocaleString()}</td>
              <td>
                {b.isCurrent ? (
                  <span className="adm-badge adm-badge--pop-live">최신본</span>
                ) : (
                  <span className="adm-dim">보관</span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="adm-empty">
                등록된 소개서가 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

/* ================================================= 접속 통계 (C2 간이판, owner) */

interface StatsData {
  jobViews: Array<{ id: string; title: string; viewCount: number; status: string }>;
  brochures: Array<{ version: string; viewCount: number; downloadCount: number; isCurrent: boolean }>;
  totalInquiries: number;
  totalApplications: number;
}

function StatsPanel() {
  const [data, setData] = useState<StatsData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminApi<StatsData>("/stats")
      .then(setData)
      .catch((e: Error) => setErr(e.message));
  }, []);

  return (
    <section className="adm-panel adm-panel--pad">
      <header className="adm-panel__head">
        <h2>접속 통계</h2>
        <span className="adm-dim">공고 상세 조회·소개서 집계 기준 (GA4 연동 전 간이판)</span>
      </header>

      {err && <p className="adm-pagemsg adm-pagemsg--error">{err}</p>}
      {!data && !err && <p className="adm-pagemsg">불러오는 중…</p>}

      {data && (
        <>
          <div className="adm-cards">
            <div className="adm-stat">
              <strong>{data.totalInquiries.toLocaleString()}</strong>
              <span>누적 문의</span>
            </div>
            <div className="adm-stat">
              <strong>{data.totalApplications.toLocaleString()}</strong>
              <span>누적 지원</span>
            </div>
            <div className="adm-stat">
              <strong>
                {data.jobViews.reduce((s, j) => s + j.viewCount, 0).toLocaleString()}
              </strong>
              <span>공고 조회 합계</span>
            </div>
          </div>

          <table className="adm-table adm-table--rows">
            <thead>
              <tr>
                <th>공고</th>
                <th>상태</th>
                <th className="adm-right">조회수</th>
              </tr>
            </thead>
            <tbody>
              {data.jobViews.map((j) => (
                <tr key={j.id}>
                  <td>
                    <b>{j.title}</b>
                  </td>
                  <td className="adm-dim">{j.status}</td>
                  <td className="adm-right">{j.viewCount.toLocaleString()}</td>
                </tr>
              ))}
              {data.jobViews.length === 0 && (
                <tr>
                  <td colSpan={3} className="adm-empty">
                    집계된 공고가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
