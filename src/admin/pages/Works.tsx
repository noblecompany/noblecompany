import { useEffect, useRef, useState } from "react";
import { adminApi, adminUpload, imageExt, resizeImage, type AdminWork } from "../api";
import { IconX } from "../../components/Icons";

const CATEGORIES: AdminWork["category"][] = ["IMC", "SA", "DA", "VIRAL"];

const EMPTY: AdminWork = {
  id: "",
  client: "",
  category: "IMC",
  industry: null,
  team: null,
  mediaType: null,
  objective: null,
  strategy: null,
  media: null,
  result: null,
  thumbPath: null,
  heroPath: null,
  rank: null,
  status: "draft",
  createdAt: "",
};

/** public/ 정적 경로와 Storage 절대 URL 을 모두 표시할 수 있게 처리 */
const imgSrc = (path: string | null) => (path ? (path.startsWith("http") ? path : path) : null);

/** 포트폴리오 CRUD (B1) — 이미지 업로드 시 sm(썸네일)·lg(상세) 자동 생성. owner·editor */
export default function Works() {
  const [rows, setRows] = useState<AdminWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminWork | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [query, setQuery] = useState("");

  const load = () => {
    adminApi<AdminWork[]>("/works")
      .then(setRows)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = (w: AdminWork) => {
    if (!confirm(`'${w.client}' 포트폴리오를 삭제할까요?`)) return;
    void adminApi(`/works/${w.id}`, { method: "DELETE" })
      .then(() => setRows((list) => list.filter((r) => r.id !== w.id)))
      .catch((e: Error) => alert(e.message));
  };

  const filtered = query.trim()
    ? rows.filter(
        (r) =>
          r.client.toLowerCase().includes(query.trim().toLowerCase()) ||
          (r.industry ?? "").includes(query.trim()),
      )
    : rows;

  if (error) return <p className="adm-pagemsg adm-pagemsg--error">{error}</p>;

  return (
    <>
      <div className="adm-toolbar">
        <p className="adm-toolbar__note">
          노출 순서는 '순위' 오름차순입니다. 게시 상태만 사이트에 노출됩니다.
        </p>
        <div className="adm-toolbar__right">
          <input
            className="adm-search"
            placeholder="브랜드·업종 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={() => {
              setEditing({ ...EMPTY });
              setIsNew(true);
            }}
          >
            + 새 포트폴리오
          </button>
        </div>
      </div>

      <section className="adm-panel">
        <table className="adm-table adm-table--rows">
          <thead>
            <tr>
              <th>순위</th>
              <th>썸네일</th>
              <th>브랜드</th>
              <th>유형</th>
              <th>업종</th>
              <th>담당</th>
              <th>상태</th>
              <th className="adm-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="adm-empty">
                  불러오는 중…
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => {
                    setEditing(w);
                    setIsNew(false);
                  }}
                >
                  <td className="adm-dim">{w.rank ?? "—"}</td>
                  <td>
                    {imgSrc(w.thumbPath) ? (
                      <img className="adm-thumb" src={imgSrc(w.thumbPath) as string} alt="" />
                    ) : (
                      <span className="adm-thumb adm-thumb--empty">없음</span>
                    )}
                  </td>
                  <td>
                    <b>{w.client}</b>
                  </td>
                  <td className="adm-dim">{w.category}</td>
                  <td className="adm-dim">{w.industry ?? "—"}</td>
                  <td className="adm-dim">{w.team ?? "—"}</td>
                  <td>
                    <span className={`adm-badge adm-badge--job-${w.status === "published" ? "published" : "draft"}`}>
                      {w.status === "published" ? "게시중" : "임시저장"}
                    </span>
                  </td>
                  <td className="adm-right">
                    <button
                      type="button"
                      className="adm-linkbtn adm-linkbtn--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(w);
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="adm-empty">
                  {rows.length === 0
                    ? "등록된 포트폴리오가 없습니다 — 시드(0003_seed.sql) 적용 또는 '새 포트폴리오'로 시작하세요"
                    : "조건에 맞는 항목이 없습니다"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {editing && (
        <Editor
          work={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

function Editor({
  work,
  isNew,
  onClose,
  onSaved,
}: {
  work: AdminWork;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<AdminWork>(work);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof AdminWork>(key: K, value: AdminWork[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  /** 이미지 1장 → sm(640px 썸네일)·lg(1600px 상세) 두 벌을 만들어 업로드 (F5) */
  const upload = async (file: File) => {
    setErr(null);
    setUploading(true);
    try {
      const [sm, lg] = await Promise.all([resizeImage(file, 640), resizeImage(file, 1600)]);
      const base = file.name.replace(/\.[^.]+$/, "");
      const [smUp, lgUp] = await Promise.all([
        adminUpload("portfolio", sm, `${base}-sm.${imageExt(sm)}`),
        adminUpload("portfolio", lg, `${base}-lg.${imageExt(lg)}`),
      ]);
      setF((prev) => ({ ...prev, thumbPath: smUp.publicUrl, heroPath: lgUp.publicUrl }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async (status: AdminWork["status"]) => {
    setErr(null);
    if (!f.id.trim() || !/^[a-z0-9-]{2,}$/.test(f.id)) {
      setErr("슬러그는 영문 소문자·숫자·하이픈 2자 이상이어야 합니다. 예) eduwill");
      return;
    }
    if (!f.client.trim()) {
      setErr("브랜드명은 필수입니다.");
      return;
    }

    const body = {
      id: f.id.trim(),
      client: f.client.trim(),
      category: f.category,
      industry: f.industry?.trim() || null,
      team: f.team?.trim() || null,
      mediaType: f.mediaType?.trim() || null,
      objective: f.objective?.trim() || null,
      strategy: f.strategy?.trim() || null,
      media: f.media?.trim() || null,
      result: f.result?.trim() || null,
      thumbPath: f.thumbPath,
      heroPath: f.heroPath,
      rank: f.rank,
      status,
    };

    setBusy(true);
    try {
      if (isNew) {
        await adminApi("/works", { method: "POST", body });
      } else {
        await adminApi(`/works/${work.id}`, { method: "PATCH", body });
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-drawer" role="dialog" aria-label={isNew ? "새 포트폴리오" : `${work.client} 수정`}>
      <div className="adm-drawer__scrim" onClick={onClose} />
      <div className="adm-drawer__panel adm-drawer__panel--wide">
        <header className="adm-drawer__head">
          <div>
            <span className={`adm-badge adm-badge--job-${f.status === "published" ? "published" : "draft"}`}>
              {isNew ? "새 항목" : f.status === "published" ? "게시중" : "임시저장"}
            </span>
            <h2>{isNew ? "포트폴리오 등록" : f.client}</h2>
          </div>
          <button type="button" className="adm-iconbtn" onClick={onClose} aria-label="닫기">
            <IconX size={18} />
          </button>
        </header>

        <div className="adm-drawer__block">
          <h3>캠페인 이미지</h3>
          <div className="adm-imgpick">
            <div className="adm-imgpick__preview">
              {imgSrc(f.thumbPath) ? (
                <img src={imgSrc(f.thumbPath) as string} alt="썸네일 미리보기" />
              ) : (
                <span>이미지 없음</span>
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <p className="adm-dim">
                {uploading
                  ? "업로드 중… (썸네일·상세 2벌 자동 생성)"
                  : "1장을 올리면 썸네일(640px)과 상세(1600px)가 자동 생성됩니다. JPG·PNG·WebP"}
              </p>
            </div>
          </div>
        </div>

        <div className="adm-drawer__block">
          <h3>기본 정보</h3>
          <div className="adm-formgrid">
            <label className="adm-field">
              <span>브랜드명 *</span>
              <input value={f.client} onChange={(e) => set("client", e.target.value)} placeholder="예) 에듀윌" />
            </label>
            <label className="adm-field">
              <span>URL 슬러그 *</span>
              <input
                value={f.id}
                onChange={(e) => set("id", e.target.value.toLowerCase())}
                placeholder="eduwill"
                disabled={!isNew}
              />
            </label>
            <label className="adm-field">
              <span>광고 유형</span>
              <select value={f.category} onChange={(e) => set("category", e.target.value as AdminWork["category"])}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span>업종</span>
              <input value={f.industry ?? ""} onChange={(e) => set("industry", e.target.value || null)} placeholder="예) 교육" />
            </label>
            <label className="adm-field">
              <span>담당 조직</span>
              <input value={f.team ?? ""} onChange={(e) => set("team", e.target.value || null)} placeholder="예) 기획1팀" />
            </label>
            <label className="adm-field">
              <span>노출 순위 (낮을수록 앞)</span>
              <input
                type="number"
                value={f.rank ?? ""}
                onChange={(e) => set("rank", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="비우면 맨 뒤"
              />
            </label>
            <label className="adm-field">
              <span>매체 유형</span>
              <input value={f.mediaType ?? ""} onChange={(e) => set("mediaType", e.target.value || null)} placeholder="예) 검색, DA" />
            </label>
            <label className="adm-field">
              <span>집행 매체</span>
              <input value={f.media ?? ""} onChange={(e) => set("media", e.target.value || null)} placeholder="예) 네이버, 카카오, 구글" />
            </label>
          </div>
        </div>

        <div className="adm-drawer__block">
          <h3>케이스 스터디</h3>
          <label className="adm-field">
            <span>Situation — 캠페인 목표</span>
            <textarea rows={3} value={f.objective ?? ""} onChange={(e) => set("objective", e.target.value || null)} />
          </label>
          <label className="adm-field">
            <span>Solution — 운영 전략</span>
            <textarea rows={5} value={f.strategy ?? ""} onChange={(e) => set("strategy", e.target.value || null)} />
          </label>
          <label className="adm-field">
            <span>Result — 성과 (선택 · 있을 때만 상세에 노출)</span>
            <textarea rows={3} value={f.result ?? ""} onChange={(e) => set("result", e.target.value || null)} />
          </label>
        </div>

        {err && <p className="adm-pagemsg adm-pagemsg--error">{err}</p>}

        <div className="adm-actionbar">
          <button type="button" className="adm-btn" disabled={busy || uploading} onClick={() => void save("draft")}>
            임시저장
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            disabled={busy || uploading}
            onClick={() => void save("published")}
          >
            {busy ? "저장 중…" : "게시하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
