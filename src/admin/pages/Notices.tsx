import { useEffect, useRef, useState } from "react";
import { adminApi, adminUpload, formatDate, type AdminNotice, type NoticeImage } from "../api";
import { IconX } from "../../components/Icons";

const EMPTY: AdminNotice = {
  id: "",
  slug: "",
  title: "",
  body: "",
  sourceUrl: null,
  sourceName: null,
  images: [],
  pinned: false,
  status: "draft",
  publishedAt: new Date().toISOString().slice(0, 10),
  viewCount: 0,
  createdAt: "",
  updatedAt: "",
};

/** 제목·게시일로 슬러그 초안 — 한글은 날짜 + 짧은 난수로 대체 */
const suggestSlug = (date: string, title: string) => {
  const latin = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${date.slice(0, 10)}-${latin || Math.random().toString(36).slice(2, 7)}`;
};

/** 공지사항 관리 — 목록 + 편집 드로어 (이미지 다중 업로드). owner·editor */
export default function Notices() {
  const [rows, setRows] = useState<AdminNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminNotice | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = () => {
    adminApi<AdminNotice[]>("/notices")
      .then(setRows)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = (n: AdminNotice) => {
    if (!confirm(`'${n.title}' 공지를 삭제할까요? 첨부 이미지도 함께 삭제됩니다.`)) return;
    void adminApi(`/notices/${n.id}`, { method: "DELETE" })
      .then(() => setRows((list) => list.filter((r) => r.id !== n.id)))
      .catch((e: Error) => alert(e.message));
  };

  if (error) return <p className="adm-pagemsg adm-pagemsg--error">{error}</p>;

  return (
    <>
      <div className="adm-toolbar">
        <p className="adm-toolbar__note">
          게시 상태만 사이트 공지사항에 노출됩니다. 고정 공지는 목록 맨 위에 옵니다.
        </p>
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          onClick={() => {
            setEditing({ ...EMPTY });
            setIsNew(true);
          }}
        >
          + 새 공지
        </button>
      </div>

      <section className="adm-panel">
        <table className="adm-table adm-table--rows">
          <thead>
            <tr>
              <th>제목</th>
              <th>게시일</th>
              <th>이미지</th>
              <th>상태</th>
              <th className="adm-right">조회</th>
              <th className="adm-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="adm-empty">불러오는 중…</td>
              </tr>
            )}
            {!loading &&
              rows.map((n) => (
                <tr
                  key={n.id}
                  onClick={() => {
                    setEditing({ ...n, publishedAt: n.publishedAt.slice(0, 10) });
                    setIsNew(false);
                  }}
                >
                  <td>
                    {n.pinned && <span className="adm-badge adm-badge--pop-live" style={{ marginRight: 6 }}>고정</span>}
                    <b>{n.title}</b>
                    <span className="adm-dim adm-cell-sub">/notice/{n.slug}</span>
                  </td>
                  <td className="adm-dim">{formatDate(n.publishedAt)}</td>
                  <td className="adm-dim">{n.images.length ? `${n.images.length}장` : "—"}</td>
                  <td>
                    <span className={`adm-badge adm-badge--job-${n.status === "published" ? "published" : "draft"}`}>
                      {n.status === "published" ? "게시중" : "임시저장"}
                    </span>
                  </td>
                  <td className="adm-dim adm-right">{n.viewCount.toLocaleString()}</td>
                  <td className="adm-right">
                    <button
                      type="button"
                      className="adm-linkbtn adm-linkbtn--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(n);
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="adm-empty">등록된 공지가 없습니다 — '새 공지'로 시작하세요</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {editing && (
        <Editor
          notice={editing}
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
  notice,
  isNew,
  onClose,
  onSaved,
}: {
  notice: AdminNotice;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<AdminNotice>(notice);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof AdminNotice>(key: K, value: AdminNotice[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  /** 여러 장 업로드 — 원본 그대로 저장 (방문자 다운로드용) */
  const upload = async (files: FileList) => {
    setErr(null);
    setUploading(files.length);
    try {
      for (const file of Array.from(files)) {
        const dims = await readDims(file);
        const up = await adminUpload("notices", file, file.name);
        const img: NoticeImage = {
          path: up.path, name: file.name, size: file.size, url: up.publicUrl, ...dims,
        };
        setF((prev) => ({ ...prev, images: [...prev.images, img] }));
        setUploading((n) => n - 1);
      }
    } catch (e) {
      setErr((e as Error).message);
      setUploading(0);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const moveImage = (i: number, dir: -1 | 1) =>
    setF((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.images.length) return prev;
      const next = [...prev.images];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...prev, images: next };
    });

  const save = async (status: AdminNotice["status"]) => {
    setErr(null);
    const slug = (f.slug || suggestSlug(f.publishedAt, f.title)).trim();
    if (!/^[a-z0-9-]{3,}$/.test(slug)) {
      setErr("슬러그는 영문 소문자·숫자·하이픈 3자 이상이어야 합니다.");
      return;
    }
    if (!f.title.trim() || !f.body.trim()) {
      setErr("제목과 본문은 필수입니다.");
      return;
    }
    const body = {
      slug,
      title: f.title.trim(),
      body: f.body.trim(),
      sourceUrl: f.sourceUrl?.trim() || null,
      sourceName: f.sourceName?.trim() || null,
      // 서버 저장 필드만 — url 은 서버가 매번 계산
      images: f.images.map(({ path, name, size, width, height }) => ({ path, name, size, width, height })),
      pinned: f.pinned,
      status,
      publishedAt: `${f.publishedAt.slice(0, 10)}T09:00:00+09:00`,
    };
    setBusy(true);
    try {
      if (isNew) await adminApi("/notices", { method: "POST", body });
      else await adminApi(`/notices/${notice.id}`, { method: "PATCH", body });
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-drawer" role="dialog" aria-label={isNew ? "새 공지" : `${notice.title} 수정`}>
      <div className="adm-drawer__scrim" onClick={onClose} />
      <div className="adm-drawer__panel adm-drawer__panel--wide">
        <header className="adm-drawer__head">
          <div>
            <span className={`adm-badge adm-badge--job-${f.status === "published" ? "published" : "draft"}`}>
              {isNew ? "새 공지" : f.status === "published" ? "게시중" : "임시저장"}
            </span>
            <h2>{isNew ? "공지 작성" : f.title}</h2>
            {!isNew && <p className="adm-dim">조회 {notice.viewCount.toLocaleString()}회</p>}
          </div>
          <button type="button" className="adm-iconbtn" onClick={onClose} aria-label="닫기">
            <IconX size={18} />
          </button>
        </header>

        <div className="adm-drawer__block">
          <h3>기본 정보</h3>
          <label className="adm-field">
            <span>제목 *</span>
            <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="예) 노블컴퍼니, 네이버 프리미어 파트너사로 선정" />
          </label>
          <div className="adm-formgrid">
            <label className="adm-field">
              <span>게시일</span>
              <input type="date" value={f.publishedAt.slice(0, 10)} onChange={(e) => set("publishedAt", e.target.value)} />
            </label>
            <label className="adm-field">
              <span>URL 슬러그 <em className="adm-dim">(비우면 자동 생성)</em></span>
              <input value={f.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} placeholder={suggestSlug(f.publishedAt, f.title)} disabled={!isNew} />
            </label>
            <label className="adm-field">
              <span>출처 매체명</span>
              <input value={f.sourceName ?? ""} onChange={(e) => set("sourceName", e.target.value || null)} placeholder="예) 데일리시큐" />
            </label>
            <label className="adm-field">
              <span>출처 링크</span>
              <input value={f.sourceUrl ?? ""} onChange={(e) => set("sourceUrl", e.target.value || null)} placeholder="https://…" />
            </label>
          </div>
          <label className="adm-check" style={{ marginTop: 6 }}>
            <input type="checkbox" checked={f.pinned} onChange={(e) => set("pinned", e.target.checked)} />
            상단 고정 공지
          </label>
        </div>

        <div className="adm-drawer__block">
          <h3>본문 *</h3>
          <label className="adm-field">
            <textarea
              rows={12}
              value={f.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder={"단락은 빈 줄로 구분됩니다.\n줄바꿈은 그대로 표시됩니다."}
            />
          </label>
        </div>

        <div className="adm-drawer__block">
          <h3>첨부 이미지 <span className="adm-dim">({f.images.length}장 · 방문자가 원본 다운로드 가능)</span></h3>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => e.target.files?.length && void upload(e.target.files)}
          />
          {uploading > 0 && <p className="adm-dim">업로드 중… (남은 파일 {uploading})</p>}
          {f.images.length > 0 && (
            <ul className="adm-imggrid">
              {f.images.map((img, i) => (
                <li key={img.path} className="adm-imggrid__item">
                  <img src={img.url} alt={img.name} />
                  <div className="adm-imggrid__name" title={img.name}>{img.name}</div>
                  <div className="adm-rowlist__ops">
                    <button type="button" onClick={() => moveImage(i, -1)} title="앞으로">←</button>
                    <button type="button" onClick={() => moveImage(i, 1)} title="뒤로">→</button>
                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => set("images", f.images.filter((_, idx) => idx !== i))}
                      title="제거"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="adm-hint">첫 번째 이미지가 목록 썸네일로 쓰입니다. 화살표로 순서를 바꿀 수 있습니다.</p>
        </div>

        {err && <p className="adm-pagemsg adm-pagemsg--error">{err}</p>}

        <div className="adm-actionbar">
          <button type="button" className="adm-btn" disabled={busy || uploading > 0} onClick={() => void save("draft")}>
            임시저장
          </button>
          <button type="button" className="adm-btn adm-btn--primary" disabled={busy || uploading > 0} onClick={() => void save("published")}>
            {busy ? "저장 중…" : "게시하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 브라우저에서 이미지 크기 읽기 — 실패해도 업로드는 진행 */
function readDims(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    img.src = url;
  });
}
