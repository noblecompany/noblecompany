import { useEffect, useState } from "react";
import { adminApi } from "../api";

type Tab = "history" | "org" | "clients";

interface HistoryRow {
  rangeLabel: string;
  year: string | null;
  groupLabel: string | null;
  body: string;
}

interface OrgDivision {
  division: string;
  teams: string[];
}

interface ClientRow {
  name: string;
  visible: boolean;
}

/**
 * 연혁·조직·클라이언트 관리 (F14 / B3~B5).
 * 세 항목 모두 '전체 교체 저장' 방식 — 화면에서 편집한 뒤 저장을 눌러야 반영된다.
 */
export default function SiteContent() {
  const [tab, setTab] = useState<Tab>("history");

  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-chips" role="tablist" aria-label="콘텐츠 종류">
          {(
            [
              ["history", "연혁"],
              ["org", "조직도"],
              ["clients", "클라이언트"],
            ] as Array<[Tab, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`adm-chip ${tab === key ? "is-active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="adm-toolbar__note">수정 후 하단의 저장 버튼을 눌러야 사이트에 반영됩니다.</p>
      </div>

      {tab === "history" && <HistoryEditor />}
      {tab === "org" && <OrgEditor />}
      {tab === "clients" && <ClientsEditor />}
    </>
  );
}

/* ================================================= 연혁 (ABOUT > 연혁 탭) */

function HistoryEditor() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    adminApi<HistoryRow[]>("/history")
      .then(setRows)
      .catch((e: Error) => setMsg(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (i: number, patch: Partial<HistoryRow>) =>
    setRows((list) => list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const move = (i: number, dir: -1 | 1) => {
    setRows((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const addAfter = (i: number) =>
    setRows((list) => {
      const base = list[i];
      const next = [...list];
      next.splice(i + 1, 0, {
        rangeLabel: base?.rangeLabel ?? "",
        year: base?.year ?? null,
        groupLabel: base?.groupLabel ?? null,
        body: "",
      });
      return next;
    });

  const save = () => {
    const clean = rows.filter((r) => r.rangeLabel.trim() && r.body.trim());
    setBusy(true);
    setMsg(null);
    adminApi("/history", {
      method: "PUT",
      body: clean.map((r) => ({
        rangeLabel: r.rangeLabel.trim(),
        year: r.year?.trim() || null,
        groupLabel: r.groupLabel?.trim() || null,
        body: r.body.trim(),
      })),
    })
      .then(() => setMsg(`저장 완료 — ${clean.length}개 항목`))
      .catch((e: Error) => setMsg(`저장 실패: ${e.message}`))
      .finally(() => setBusy(false));
  };

  if (loading) return <p className="adm-pagemsg">불러오는 중…</p>;

  return (
    <section className="adm-panel adm-panel--pad">
      <p className="adm-hint">
        구간(예: 2023 ~ 2025) 안에서 <b>연도</b>가 있으면 연도별 이력으로, 연도 대신{" "}
        <b>묶음 이름</b>(예: 광고 수주)을 쓰면 묶음으로 표시됩니다. 순서가 곧 화면 순서입니다.
      </p>

      <div className="adm-rowlist">
        <div className="adm-rowlist__head adm-rowlist__grid-history">
          <span>구간</span>
          <span>연도</span>
          <span>묶음 이름</span>
          <span>내용</span>
          <span />
        </div>
        {rows.map((r, i) => (
          <div className="adm-rowlist__row adm-rowlist__grid-history" key={i}>
            <input value={r.rangeLabel} placeholder="2023 ~ 2025" onChange={(e) => set(i, { rangeLabel: e.target.value })} />
            <input value={r.year ?? ""} placeholder="2025" onChange={(e) => set(i, { year: e.target.value || null })} />
            <input value={r.groupLabel ?? ""} placeholder="광고 수주" onChange={(e) => set(i, { groupLabel: e.target.value || null })} />
            <input value={r.body} placeholder="네이버 프리미어 파트너사 선정" onChange={(e) => set(i, { body: e.target.value })} />
            <span className="adm-rowlist__ops">
              <button type="button" onClick={() => move(i, -1)} title="위로">↑</button>
              <button type="button" onClick={() => move(i, 1)} title="아래로">↓</button>
              <button type="button" onClick={() => addAfter(i)} title="아래에 추가">＋</button>
              <button
                type="button"
                className="is-danger"
                onClick={() => setRows((list) => list.filter((_, idx) => idx !== i))}
                title="삭제"
              >
                ✕
              </button>
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <button type="button" className="adm-btn" onClick={() => addAfter(-1)}>
            + 첫 항목 추가
          </button>
        )}
      </div>

      {msg && <p className={`adm-pagemsg ${msg.startsWith("저장 실패") ? "adm-pagemsg--error" : ""}`}>{msg}</p>}

      <div className="adm-actionbar">
        <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={save}>
          {busy ? "저장 중…" : "연혁 저장"}
        </button>
      </div>
    </section>
  );
}

/* ================================================= 조직도 (ABOUT > 소개) */

function OrgEditor() {
  const [divisions, setDivisions] = useState<OrgDivision[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    adminApi<OrgDivision[]>("/org")
      .then(setDivisions)
      .catch((e: Error) => setMsg(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (i: number, patch: Partial<OrgDivision>) =>
    setDivisions((list) => list.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const move = (i: number, dir: -1 | 1) =>
    setDivisions((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = () => {
    const clean = divisions
      .map((d) => ({
        division: d.division.trim(),
        teams: d.teams.map((t) => t.trim()).filter(Boolean),
      }))
      .filter((d) => d.division);
    setBusy(true);
    setMsg(null);
    adminApi("/org", { method: "PUT", body: clean })
      .then(() => setMsg(`저장 완료 — 본부 ${clean.length}개`))
      .catch((e: Error) => setMsg(`저장 실패: ${e.message}`))
      .finally(() => setBusy(false));
  };

  if (loading) return <p className="adm-pagemsg">불러오는 중…</p>;

  return (
    <section className="adm-panel adm-panel--pad">
      <p className="adm-hint">본부 순서가 그대로 조직도의 좌→우 배치가 됩니다. 팀은 한 줄에 하나씩.</p>

      <div className="adm-orggrid">
        {divisions.map((d, i) => (
          <div className="adm-orgcard" key={i}>
            <div className="adm-orgcard__head">
              <input
                value={d.division}
                placeholder="본부명"
                onChange={(e) => set(i, { division: e.target.value })}
              />
              <span className="adm-rowlist__ops">
                <button type="button" onClick={() => move(i, -1)} title="앞으로">←</button>
                <button type="button" onClick={() => move(i, 1)} title="뒤로">→</button>
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => setDivisions((list) => list.filter((_, idx) => idx !== i))}
                  title="본부 삭제"
                >
                  ✕
                </button>
              </span>
            </div>
            <textarea
              rows={Math.max(4, d.teams.length + 1)}
              value={d.teams.join("\n")}
              placeholder={"기획 1팀\n기획 2팀"}
              onChange={(e) => set(i, { teams: e.target.value.split("\n") })}
            />
          </div>
        ))}
        <button
          type="button"
          className="adm-orgcard adm-orgcard--add"
          onClick={() => setDivisions((list) => [...list, { division: "", teams: [] }])}
        >
          + 본부 추가
        </button>
      </div>

      {msg && <p className={`adm-pagemsg ${msg.startsWith("저장 실패") ? "adm-pagemsg--error" : ""}`}>{msg}</p>}

      <div className="adm-actionbar">
        <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={save}>
          {busy ? "저장 중…" : "조직도 저장"}
        </button>
      </div>
    </section>
  );
}

/* ================================================= 클라이언트 (메인 롤링 밴드) */

function ClientsEditor() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    adminApi<Array<ClientRow & { sortOrder: number }>>("/clients")
      .then((list) => setRows(list.map((c) => ({ name: c.name, visible: c.visible }))))
      .catch((e: Error) => setMsg(e.message))
      .finally(() => setLoading(false));
  }, []);

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    if (rows.some((r) => r.name === name)) {
      setMsg(`'${name}' 은 이미 목록에 있습니다.`);
      return;
    }
    setRows((list) => [{ name, visible: true }, ...list]);
    setNewName("");
    setMsg(null);
  };

  const save = () => {
    setBusy(true);
    setMsg(null);
    adminApi("/clients", { method: "PUT", body: rows })
      .then(() => setMsg(`저장 완료 — ${rows.length}개 브랜드`))
      .catch((e: Error) => setMsg(`저장 실패: ${e.message}`))
      .finally(() => setBusy(false));
  };

  if (loading) return <p className="adm-pagemsg">불러오는 중…</p>;

  return (
    <section className="adm-panel adm-panel--pad">
      <p className="adm-hint">
        메인 페이지 롤링 밴드에 노출되는 브랜드 목록입니다. 체크를 해제하면 저장은 되지만 노출되지 않습니다.
      </p>

      <div className="adm-inline adm-inline--gap">
        <input
          className="adm-search"
          value={newName}
          placeholder="새 브랜드명"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button type="button" className="adm-btn" onClick={add}>
          + 추가
        </button>
      </div>

      <div className="adm-clientgrid">
        {rows.map((c, i) => (
          <div className={`adm-clientchip ${c.visible ? "" : "is-hidden"}`} key={c.name}>
            <label>
              <input
                type="checkbox"
                checked={c.visible}
                onChange={(e) =>
                  setRows((list) =>
                    list.map((r, idx) => (idx === i ? { ...r, visible: e.target.checked } : r)),
                  )
                }
              />
              {c.name}
            </label>
            <button
              type="button"
              className="is-danger"
              onClick={() => setRows((list) => list.filter((_, idx) => idx !== i))}
              aria-label={`${c.name} 삭제`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {msg && <p className={`adm-pagemsg ${msg.startsWith("저장 실패") ? "adm-pagemsg--error" : ""}`}>{msg}</p>}

      <div className="adm-actionbar">
        <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={save}>
          {busy ? "저장 중…" : "클라이언트 저장"}
        </button>
      </div>
    </section>
  );
}
