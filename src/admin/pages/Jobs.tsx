import { useEffect, useState } from "react";
import { adminApi, formatDate, JOB_STATUS_LABEL, type AdminJob } from "../api";
import { IconX } from "../../components/Icons";

const GROUPS = ["기획", "퍼포먼스", "콘텐츠", "바이럴", "경영지원"];
const EMPLOYMENTS = ["정규직", "계약직", "인턴"];

const EMPTY: AdminJob = {
  id: "",
  title: "",
  group: "기획",
  team: "",
  employment: "정규직",
  career: "",
  location: "서울 강동구 성내동 (본사)",
  deadline: null,
  summary: "",
  responsibilities: [],
  requirements: [],
  preferred: [],
  status: "draft",
  sortOrder: 0,
  viewCount: 0,
  createdAt: "",
  updatedAt: "",
};

/** 채용공고 CRUD (B2) — 임시저장 → 게시 → 마감. owner·hr 만 쓰기 가능 */
export default function Jobs() {
  const [rows, setRows] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminJob | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = () => {
    adminApi<AdminJob[]>("/jobs")
      .then(setRows)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = (job: AdminJob) => {
    if (!confirm(`'${job.title}' 공고를 삭제할까요?\n지원서는 남지만 공고 연결이 끊어집니다. 게시 종료가 목적이면 '마감'을 권장합니다.`)) return;
    void adminApi(`/jobs/${job.id}`, { method: "DELETE" })
      .then(() => setRows((list) => list.filter((r) => r.id !== job.id)))
      .catch((e: Error) => alert(e.message));
  };

  if (error) return <p className="adm-pagemsg adm-pagemsg--error">{error}</p>;

  return (
    <>
      <div className="adm-toolbar">
        <p className="adm-toolbar__note">
          게시중 공고만 사이트에 노출됩니다. 조회수는 상세 페이지 방문 기준입니다.
        </p>
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          onClick={() => {
            setEditing({ ...EMPTY, sortOrder: rows.length });
            setIsNew(true);
          }}
        >
          + 새 공고
        </button>
      </div>

      <section className="adm-panel">
        <table className="adm-table adm-table--rows">
          <thead>
            <tr>
              <th>공고명</th>
              <th>직군</th>
              <th>소속</th>
              <th>마감일</th>
              <th>상태</th>
              <th className="adm-right">조회수</th>
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
              rows.map((j) => (
                <tr
                  key={j.id}
                  onClick={() => {
                    setEditing(j);
                    setIsNew(false);
                  }}
                >
                  <td>
                    <b>{j.title}</b>
                    <span className="adm-dim adm-cell-sub">/careers/{j.id}</span>
                  </td>
                  <td className="adm-dim">{j.group}</td>
                  <td className="adm-dim">{j.team}</td>
                  <td className="adm-dim">{j.deadline ?? "상시채용"}</td>
                  <td>
                    <span className={`adm-badge adm-badge--job-${j.status}`}>
                      {JOB_STATUS_LABEL[j.status]}
                    </span>
                  </td>
                  <td className="adm-dim adm-right">{j.viewCount.toLocaleString()}</td>
                  <td className="adm-right">
                    <button
                      type="button"
                      className="adm-linkbtn adm-linkbtn--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(j);
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
                  등록된 공고가 없습니다 — '새 공고'로 시작하세요
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {editing && (
        <Editor
          job={editing}
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

/** 공고 작성·수정 드로어 (설계 §6.3) */
function Editor({
  job,
  isNew,
  onClose,
  onSaved,
}: {
  job: AdminJob;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<AdminJob>(job);
  const [always, setAlways] = useState(job.deadline === null); // 상시채용
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof AdminJob>(key: K, value: AdminJob[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  /** 저장 — status 를 함께 지정 (임시저장/게시하기/마감) */
  const save = async (status: AdminJob["status"]) => {
    setErr(null);
    if (!f.id.trim() || !/^[a-z0-9-]{2,}$/.test(f.id)) {
      setErr("URL 슬러그는 영문 소문자·숫자·하이픈 2자 이상이어야 합니다. 예) ae-planner");
      return;
    }
    if (!f.title.trim() || !f.team.trim() || !f.career.trim() || !f.summary.trim()) {
      setErr("공고명·소속 팀·경력·한 줄 소개는 필수입니다.");
      return;
    }
    if (!always && !f.deadline) {
      setErr("마감일을 선택하거나 상시채용에 체크해 주세요.");
      return;
    }

    const body = {
      id: f.id.trim(),
      title: f.title.trim(),
      group: f.group,
      team: f.team.trim(),
      employment: f.employment,
      career: f.career.trim(),
      location: f.location.trim(),
      deadline: always ? null : f.deadline,
      summary: f.summary.trim(),
      responsibilities: f.responsibilities,
      requirements: f.requirements,
      preferred: f.preferred,
      status,
      sortOrder: f.sortOrder,
    };

    setBusy(true);
    try {
      if (isNew) {
        await adminApi("/jobs", { method: "POST", body });
      } else {
        await adminApi(`/jobs/${job.id}`, { method: "PATCH", body });
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-drawer" role="dialog" aria-label={isNew ? "새 공고 작성" : `${job.title} 수정`}>
      <div className="adm-drawer__scrim" onClick={onClose} />
      <div className="adm-drawer__panel adm-drawer__panel--wide">
        <header className="adm-drawer__head">
          <div>
            <span className={`adm-badge adm-badge--job-${f.status}`}>
              {isNew ? "새 공고" : JOB_STATUS_LABEL[f.status]}
            </span>
            <h2>{isNew ? "공고 작성" : f.title}</h2>
            {!isNew && (
              <p className="adm-dim">
                {formatDate(job.createdAt)} 등록 · 조회 {job.viewCount.toLocaleString()}회
              </p>
            )}
          </div>
          <button type="button" className="adm-iconbtn" onClick={onClose} aria-label="닫기">
            <IconX size={18} />
          </button>
        </header>

        <div className="adm-drawer__block">
          <h3>기본 정보</h3>
          <div className="adm-formgrid">
            <label className="adm-field">
              <span>공고명 *</span>
              <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="예) 광고기획(AE) 경력" />
            </label>
            <label className="adm-field">
              <span>URL 슬러그 * {!isNew && <em className="adm-warn">(게시 후 변경 시 기존 링크가 깨집니다)</em>}</span>
              <input
                value={f.id}
                onChange={(e) => set("id", e.target.value.toLowerCase())}
                placeholder="ae-planner"
                disabled={!isNew}
              />
            </label>
            <label className="adm-field">
              <span>직군</span>
              <select value={f.group} onChange={(e) => set("group", e.target.value)}>
                {GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span>소속 팀 *</span>
              <input value={f.team} onChange={(e) => set("team", e.target.value)} placeholder="예) 기획1팀" />
            </label>
            <label className="adm-field">
              <span>고용 형태</span>
              <select value={f.employment} onChange={(e) => set("employment", e.target.value)}>
                {EMPLOYMENTS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span>경력 *</span>
              <input value={f.career} onChange={(e) => set("career", e.target.value)} placeholder="예) 경력 3년 이상, 신입, 경력무관" />
            </label>
            <label className="adm-field">
              <span>근무지</span>
              <input value={f.location} onChange={(e) => set("location", e.target.value)} />
            </label>
            <div className="adm-field">
              <span>접수 기간</span>
              <div className="adm-inline">
                <input
                  type="date"
                  value={f.deadline ?? ""}
                  disabled={always}
                  onChange={(e) => set("deadline", e.target.value || null)}
                />
                <label className="adm-check">
                  <input
                    type="checkbox"
                    checked={always}
                    onChange={(e) => {
                      setAlways(e.target.checked);
                      if (e.target.checked) set("deadline", null);
                    }}
                  />
                  상시채용
                </label>
              </div>
            </div>
          </div>

          <label className="adm-field">
            <span>
              한 줄 소개 * <em className="adm-dim">(목록 카드에 노출 · {f.summary.length}/80자)</em>
            </span>
            <input
              value={f.summary}
              maxLength={80}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="예) 브랜드의 과제를 정의하고 IMC 캠페인 전략과 실행을 리드합니다."
            />
          </label>
        </div>

        <div className="adm-drawer__block">
          <h3>상세 내용 — 한 줄에 한 항목씩 입력</h3>
          <ListField label="주요 업무" value={f.responsibilities} onChange={(v) => set("responsibilities", v)} />
          <ListField label="자격 요건" value={f.requirements} onChange={(v) => set("requirements", v)} />
          <ListField label="우대 사항" value={f.preferred} onChange={(v) => set("preferred", v)} />
        </div>

        {err && <p className="adm-pagemsg adm-pagemsg--error">{err}</p>}

        <div className="adm-actionbar">
          <button type="button" className="adm-btn" disabled={busy} onClick={() => void save("draft")}>
            임시저장
          </button>
          {!isNew && f.status === "published" && (
            <button type="button" className="adm-btn" disabled={busy} onClick={() => void save("closed")}>
              마감하기
            </button>
          )}
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            disabled={busy}
            onClick={() => void save("published")}
          >
            {busy ? "저장 중…" : "게시하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 줄 단위 리스트 입력 — 저장 시 빈 줄은 제거된다 */
function ListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState(value.join("\n"));

  useEffect(() => {
    setText(value.join("\n"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.join("\n")]);

  return (
    <label className="adm-field">
      <span>
        {label} <em className="adm-dim">({value.length}항목)</em>
      </span>
      <textarea
        rows={Math.max(3, value.length + 1)}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() =>
          onChange(
            text
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
      />
    </label>
  );
}
