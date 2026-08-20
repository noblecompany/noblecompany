import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";

/**
 * 접속 통계 (C2) — 일별·기간별·검색 포털별 유입.
 * 데이터는 page_views (POST /api/site 수집분), 집계는 서버 RPC.
 */

interface DailyRow {
  day: string; // YYYY-MM-DD (KST)
  visitors: number;
  pageviews: number;
}
interface RefRow {
  group: string;
  visitors: number;
  pageviews: number;
}
interface VisitsData {
  daily: DailyRow[];
  referrers: RefRow[];
}

const REF_LABEL: Record<string, string> = {
  naver: "네이버",
  google: "구글",
  daum: "다음",
  kakao: "카카오",
  meta: "인스타그램·페이스북",
  youtube: "유튜브",
  bing: "빙",
  direct: "직접 유입",
  etc: "기타",
};

const fmt = (n: number) => n.toLocaleString("ko-KR");

/** 로컬(KST) 기준 YYYY-MM-DD */
function dstr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export default function Visits() {
  // ---- 요약 카드용: 전월 1일 ~ 오늘 (전일·전주·전월 동기 대비 계산에 필요한 전 구간)
  const [cardRows, setCardRows] = useState<DailyRow[] | null>(null);
  // ---- 기간 선택 (차트·표·유입)
  const [from, setFrom] = useState(dstr(daysAgo(29)));
  const [to, setTo] = useState(dstr(new Date()));
  const [data, setData] = useState<VisitsData | null>(null);
  const [metric, setMetric] = useState<"visitors" | "pageviews">("visitors");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const prevMonthFirst = new Date();
    prevMonthFirst.setDate(1);
    prevMonthFirst.setMonth(prevMonthFirst.getMonth() - 1);
    adminApi<VisitsData>(`/visits?from=${dstr(prevMonthFirst)}&to=${dstr(new Date())}`)
      .then((d) => setCardRows(d.daily))
      .catch((e) => setErr((e as Error).message));
  }, []);

  useEffect(() => {
    if (from > to) return;
    setData(null);
    adminApi<VisitsData>(`/visits?from=${from}&to=${to}`)
      .then(setData)
      .catch((e) => setErr((e as Error).message));
  }, [from, to]);

  const preset = (days: number) => {
    setFrom(dstr(daysAgo(days - 1)));
    setTo(dstr(new Date()));
  };

  return (
    <>
      {err && <p className="adm-viz-error">{err}</p>}

      <SummaryCards rows={cardRows} />

      {/* ---- 기간 선택 — 프리셋 + 직접 입력 */}
      <div className="adm-viz-filters">
        {[7, 30, 90].map((d) => {
          const active = from === dstr(daysAgo(d - 1)) && to === dstr(new Date());
          return (
            <button
              key={d}
              type="button"
              className={`adm-btn adm-btn--sm ${active ? "adm-btn--primary" : ""}`}
              onClick={() => preset(d)}
            >
              최근 {d}일
            </button>
          );
        })}
        <span className="adm-viz-filters__dates">
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          <span className="adm-dim">~</span>
          <input
            type="date"
            value={to}
            min={from}
            max={dstr(new Date())}
            onChange={(e) => setTo(e.target.value)}
          />
        </span>
      </div>

      {/* ---- 일별 차트 */}
      <section className="adm-panel">
        <div className="adm-panel__head">
          <h2>일별 {metric === "visitors" ? "방문자" : "페이지뷰"}</h2>
          <div className="adm-viz-toggle" role="tablist" aria-label="지표 선택">
            <button
              type="button"
              role="tab"
              aria-selected={metric === "visitors"}
              className={metric === "visitors" ? "is-active" : ""}
              onClick={() => setMetric("visitors")}
            >
              방문자
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={metric === "pageviews"}
              className={metric === "pageviews" ? "is-active" : ""}
              onClick={() => setMetric("pageviews")}
            >
              페이지뷰
            </button>
          </div>
        </div>
        {data ? (
          <DailyChart rows={fillGaps(data.daily, from, to)} metric={metric} />
        ) : (
          <p className="adm-viz-empty">불러오는 중…</p>
        )}
      </section>

      <div className="adm-grid2">
        {/* ---- 검색 포털별 유입 */}
        <section className="adm-panel">
          <div className="adm-panel__head">
            <h2>유입 경로별 방문자</h2>
            <span className="adm-dim" style={{ fontSize: 12.5 }}>
              세션 첫 방문 기준
            </span>
          </div>
          {data && <ReferrerBars rows={data.referrers} />}
        </section>

        {/* ---- 일별 표 (차트와 같은 데이터의 표 보기) */}
        <section className="adm-panel">
          <div className="adm-panel__head">
            <h2>일별 상세</h2>
          </div>
          <div className="adm-viz-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th style={{ textAlign: "right" }}>방문자</th>
                  <th style={{ textAlign: "right" }}>페이지뷰</th>
                </tr>
              </thead>
              <tbody>
                {data &&
                  [...fillGaps(data.daily, from, to)].reverse().map((r) => (
                    <tr key={r.day}>
                      <td>{r.day}</td>
                      <td className="adm-viz-num">{fmt(r.visitors)}</td>
                      <td className="adm-viz-num adm-dim">{fmt(r.pageviews)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <p className="adm-dim" style={{ fontSize: 12.5, margin: 0 }}>
        방문자는 일 단위 익명 해시 기준(같은 사람이 날짜가 바뀌어 다시 오면 새 방문자로 집계),
        기간 합계는 일별 방문자의 합입니다. 봇·크롤러와 어드민 접속은 집계에서 제외됩니다.
      </p>
    </>
  );
}

/** 빠진 날짜를 0으로 채워 차트·표가 연속되게 한다 */
function fillGaps(rows: DailyRow[], from: string, to: string): DailyRow[] {
  const map = new Map(rows.map((r) => [r.day, r]));
  const out: DailyRow[] = [];
  const cur = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cur <= end) {
    const key = dstr(cur);
    out.push(map.get(key) ?? { day: key, visitors: 0, pageviews: 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/* ================================================= 요약 카드 */

function SummaryCards({ rows }: { rows: DailyRow[] | null }) {
  const cards = useMemo(() => {
    if (!rows) return null;
    const byDay = new Map(rows.map((r) => [r.day, r.visitors]));
    const v = (d: Date) => byDay.get(dstr(d)) ?? 0;
    const sum = (fromN: number, toN: number) => {
      let s = 0;
      for (let i = fromN; i <= toN; i++) s += v(daysAgo(i));
      return s;
    };

    const today = v(new Date());
    const yesterday = v(daysAgo(1));

    const week = sum(0, 6);
    const prevWeek = sum(7, 13);

    // 이번 달 누계 vs 전월 같은 일수(1일~오늘 일자)
    const now = new Date();
    const dayOfMonth = now.getDate();
    let month = 0;
    let prevMonth = 0;
    for (let i = 1; i <= dayOfMonth; i++) {
      const cur = new Date(now.getFullYear(), now.getMonth(), i);
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, i);
      month += byDay.get(dstr(cur)) ?? 0;
      if (prev.getMonth() === (now.getMonth() + 11) % 12) prevMonth += byDay.get(dstr(prev)) ?? 0;
    }

    const pv = rows.reduce((s, r) => (r.day.slice(0, 7) === dstr(now).slice(0, 7) ? s + r.pageviews : s), 0);

    return [
      { label: "오늘 방문자", value: today, delta: today - yesterday, vs: "전일" },
      { label: "최근 7일 방문자", value: week, delta: week - prevWeek, vs: "이전 7일" },
      { label: "이번 달 방문자", value: month, delta: month - prevMonth, vs: "전월 동기" },
      { label: "이번 달 페이지뷰", value: pv },
    ];
  }, [rows]);

  return (
    <div className="adm-cards">
      {(cards ?? [0, 1, 2, 3].map(() => null)).map((c, i) =>
        c ? (
          <div className="adm-stat" key={c.label}>
            <span>{c.label}</span>
            <strong>{fmt(c.value)}</strong>
            {c.delta !== undefined && (
              <em className={`adm-viz-delta ${c.delta > 0 ? "is-up" : c.delta < 0 ? "is-down" : ""}`}>
                {c.vs} 대비 {c.delta > 0 ? "+" : ""}
                {fmt(c.delta)}
              </em>
            )}
          </div>
        ) : (
          <div className="adm-stat" key={i}>
            <span>&nbsp;</span>
            <strong className="adm-dim">—</strong>
          </div>
        ),
      )}
    </div>
  );
}

/* ================================================= 일별 차트 (HTML 막대) */

function DailyChart({ rows, metric }: { rows: DailyRow[]; metric: "visitors" | "pageviews" }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...rows.map((r) => r[metric]));
  // 눈금은 1·2·5 배수로 딱 떨어지게
  const step = niceStep(max / 3);
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let t = step; t <= top; t += step) ticks.push(t);

  // 라벨은 6개 내외만 (매일 찍으면 겹친다)
  const labelEvery = Math.max(1, Math.ceil(rows.length / 6));

  const total = rows.reduce((s, r) => s + r[metric], 0);

  return (
    <div className="adm-viz-chart">
      <p className="adm-viz-chart__total">
        기간 합계 <b>{fmt(total)}</b>
      </p>
      <div className="adm-viz-plot" onMouseLeave={() => setHover(null)}>
        {/* 눈금·격자 */}
        {ticks.map((t) => (
          <div className="adm-viz-grid" key={t} style={{ bottom: `${(t / top) * 100}%` }}>
            <span>{fmt(t)}</span>
          </div>
        ))}
        {/* 막대 — 열마다 전체 높이 히트 영역, 막대는 최대 24px */}
        <div className="adm-viz-cols">
          {rows.map((r, i) => (
            <div
              className={`adm-viz-col ${hover === i ? "is-hover" : ""}`}
              key={r.day}
              onMouseEnter={() => setHover(i)}
            >
              <div
                className="adm-viz-bar"
                style={{ height: `${(r[metric] / top) * 100}%` }}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
        {/* 툴팁 */}
        {hover !== null && rows[hover] && (
          <div
            className="adm-viz-tip"
            style={{ left: `${((hover + 0.5) / rows.length) * 100}%` }}
            role="status"
          >
            <b>{rows[hover].day}</b>
            <span>방문자 {fmt(rows[hover].visitors)}</span>
            <span>페이지뷰 {fmt(rows[hover].pageviews)}</span>
          </div>
        )}
      </div>
      <div className="adm-viz-x">
        {rows.map((r, i) => (
          <span key={r.day}>{i % labelEvery === 0 ? r.day.slice(5).replace("-", "/") : ""}</span>
        ))}
      </div>
    </div>
  );
}

function niceStep(raw: number): number {
  const pow = 10 ** Math.floor(Math.log10(Math.max(1, raw)));
  for (const m of [1, 2, 5, 10]) if (raw <= m * pow) return m * pow;
  return 10 * pow;
}

/* ================================================= 유입 경로 막대 */

function ReferrerBars({ rows }: { rows: RefRow[] }) {
  const total = rows.reduce((s, r) => s + r.visitors, 0);
  if (!total) return <p className="adm-viz-empty">아직 유입 데이터가 없습니다.</p>;
  const max = Math.max(...rows.map((r) => r.visitors));
  return (
    <div className="adm-viz-refs">
      {rows.map((r) => (
        <div className="adm-viz-ref" key={r.group}>
          <span className="adm-viz-ref__label">{REF_LABEL[r.group] ?? r.group}</span>
          <span className="adm-viz-ref__track">
            <span className="adm-viz-ref__fill" style={{ width: `${(r.visitors / max) * 100}%` }} />
          </span>
          <span className="adm-viz-num">{fmt(r.visitors)}</span>
          <span className="adm-viz-ref__share adm-dim">
            {Math.round((r.visitors / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
