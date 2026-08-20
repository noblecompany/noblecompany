import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ActionButton } from "seed-design/ui/action-button";
import Reveal from "../components/Reveal";

interface TopKeyword {
  word: string;
  count: number;
  rate: number;
  inTitle: boolean;
  inDesc: boolean;
}

interface AuditSummary {
  auditId: string | null;
  url: string;
  pageTitle: string | null;
  grade: string;
  passCount: number;
  warnCount: number;
  failCount: number;
  categories: Record<"collect" | "index" | "aeo" | "geo", "pass" | "warn" | "fail">;
  timeMs: number;
  sizeKb: number;
  topKeywords: TopKeyword[];
  keywordTotal: number;
  teaserIssues: Array<{ label: string; status: string; value: string }>;
  lockedIssueCount: number;
  totalChecks: number;
  ars: {
    score: number;
    max: number;
    potential: number;
    categories: Array<{ label: string; max: number; score: number }>;
  };
  aiBriefing: Array<{ key: string; label: string; status: "pass" | "missing" | "na" }>;
}

const CATEGORY_LABEL: Record<string, string> = {
  collect: "수집 점검",
  index: "색인 점검",
  aeo: "AEO 점검",
  geo: "GEO 점검 (AI 검색)",
};

const GRADE_COMMENT: Record<string, string> = {
  "A+": "훌륭합니다. 세부 최적화만 남았습니다.",
  A: "좋은 상태입니다. 한 단계 더 끌어올릴 수 있습니다.",
  B: "더 발전할 수 있습니다.",
  C: "개선 여지가 많습니다.",
  D: "검색 노출에 손해를 보고 있습니다.",
  F: "시급한 개선이 필요합니다.",
};

/**
 * 무료 사이트 진단 (AEO·GEO) — URL 을 넣으면 서버가 분석해 요약을 보여준다.
 * 전체 리포트는 잠그고 상담(Contact) 신청으로 유도하는 리드 퍼널.
 */
export default function Diagnosis() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditSummary | null>(null);
  const [website, setWebsite] = useState(""); // 허니팟

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError("진단할 사이트 주소를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), website }),
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        data?: AuditSummary;
        error?: { message?: string };
      } | null;
      if (!res.ok || !body?.ok || !body.data) {
        setError(body?.error?.message ?? "진단에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setResult(body.data);
    } catch {
      setError("진단 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const contactHref = result
    ? `/contact?diag=${encodeURIComponent(result.url)}${result.auditId ? `&audit=${result.auditId}` : ""}`
    : "/contact";

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 40 }}>
        <div className="container">
          <Reveal>
            <h1 className="page-hero__title">FREE DIAGNOSIS</h1>
            <p className="page-hero__sub">
              내 사이트, 검색과 AI에 잘 노출되고 있을까요? <span className="accent">무료 진단</span>
            </p>
            <p className="section-desc" style={{ marginTop: 14 }}>
              주소만 입력하면 수집·색인·AEO(검색엔진 최적화)·GEO(AI 검색 최적화) {`·`} 키워드까지
              {" "}30여 개 항목을 즉시 점검해 등급을 알려드립니다.
            </p>
          </Reveal>

          <Reveal>
            <form className="diag-form" onSubmit={submit} noValidate>
              <input
                className="diag-form__input"
                type="text"
                inputMode="url"
                placeholder="www.example.com 또는 페이지 URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={busy}
              />
              {/* 허니팟 */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
              />
              <ActionButton size="large" type="submit" loading={busy}>
                {busy ? "분석 중…" : "무료 진단하기"}
              </ActionButton>
            </form>
            {busy && (
              <p className="diag-progress">
                사이트에 접속해 30여 개 항목을 점검하고 있습니다… (최대 30초)
              </p>
            )}
            {error && <p className="diag-error">{error}</p>}
          </Reveal>
        </div>
      </section>

      {result && (
        <section className="section section--soft" id="diag-result">
          <div className="container">
            <Reveal>
              <p className="eyebrow">진단 결과</p>
              <h2 className="section-title" style={{ wordBreak: "break-all" }}>{result.url}</h2>
              {result.pageTitle && <p className="section-desc">{result.pageTitle}</p>}
            </Reveal>

            <Reveal>
              <div className="diag-grade">
                <div className={`diag-grade__circle diag-grade__circle--${result.grade.replace("+", "p")}`}>
                  {result.grade}
                </div>
                <div>
                  <strong className="diag-grade__comment">{GRADE_COMMENT[result.grade] ?? ""}</strong>
                  <p className="diag-grade__meta">
                    {result.totalChecks}개 항목 점검 · 응답 {result.timeMs.toLocaleString()}ms ·{" "}
                    {(result.sizeKb / 1024).toFixed(2)}MB
                  </p>
                  <div className="diag-counts">
                    <span className="diag-count diag-count--pass">통과 {result.passCount}</span>
                    <span className="diag-count diag-count--warn">경고 {result.warnCount}</span>
                    <span className="diag-count diag-count--fail">실패 {result.failCount}</span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="diag-cats">
                {(Object.keys(CATEGORY_LABEL) as Array<keyof typeof result.categories>).map((k) => (
                  <div key={k} className={`diag-cat diag-cat--${result.categories[k]}`}>
                    <b>{result.categories[k] === "pass" ? "PASS" : result.categories[k] === "warn" ? "점검 필요" : "FAIL"}</b>
                    <span>{CATEGORY_LABEL[k]}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal>
              <div className="diag-panel">
                <h3>NRS — 광고연관 준비도 점수</h3>
                <div className="diag-ars">
                  <div className="diag-ars__score">
                    <strong>{result.ars.score}</strong>
                    <span>/ {result.ars.max}점</span>
                    {result.warnCount + result.failCount > 0 && (
                      <em>
                        개선 항목 {result.warnCount + result.failCount}개 해결 시{" "}
                        <b>{result.ars.potential}점</b> 도달 가능
                      </em>
                    )}
                  </div>
                  <div className="diag-ars__cats">
                    {result.ars.categories.map((c) => (
                      <div className="diag-ars__row" key={c.label}>
                        <span>{c.label}</span>
                        <div className="diag-ars__bar">
                          <i style={{ width: `${(c.score / c.max) * 100}%` }} />
                        </div>
                        <b>
                          {c.score} / {c.max}
                        </b>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="diag-dim" style={{ fontSize: 12.5, marginTop: 12 }}>
                  * NRS(Noble Readiness Score)는 노블컴퍼니가 산출하는 랜딩페이지 준비도
                  지표로, 네이버 광고연관지수와 상관성은 있으나 동일하지 않습니다.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="diag-panel">
                <h3>AI 브리핑 정보 준비도</h3>
                <p className="diag-dim" style={{ marginBottom: 14 }}>
                  AI 검색(네이버 AI 브리핑·ChatGPT 등)이 페이지를 이해하는 데 필요한 구조화
                  정보 5가지를 점검합니다.
                </p>
                <div className="diag-ai">
                  {result.aiBriefing.map((f) => (
                    <div className={`diag-ai__chip diag-ai__chip--${f.status}`} key={f.key}>
                      <b>{f.status === "pass" ? "통과" : f.status === "na" ? "해당 없음" : "누락"}</b>
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="diag-panel">
                <h3>키워드 요약 (상위 {result.topKeywords.length}개 공개)</h3>
                <table className="diag-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>키워드</th>
                      <th className="diag-right">빈도수</th>
                      <th className="diag-right">페이지 빈도율</th>
                      <th>타이틀 태그</th>
                      <th>메타 디스크립션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.topKeywords.map((k, i) => (
                      <tr key={k.word}>
                        <td className="diag-dim">{i + 1}</td>
                        <td>
                          <b>{k.word}</b>
                        </td>
                        <td className="diag-right">{k.count}</td>
                        <td className="diag-right">{k.rate}%</td>
                        <td>{k.inTitle ? "✅" : "❌"}</td>
                        <td>{k.inDesc ? "✅" : "❌"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.keywordTotal > result.topKeywords.length && (
                  <p className="diag-locked">
                    🔒 나머지 {result.keywordTotal - result.topKeywords.length}개 키워드와 2어절
                    프레이즈 분석은 상담 시 전체 리포트로 제공됩니다.
                  </p>
                )}
              </div>
            </Reveal>

            <Reveal>
              <div className="diag-panel">
                <h3>개선이 필요한 항목</h3>
                {result.teaserIssues.length === 0 ? (
                  <p className="diag-dim">발견된 개선 항목이 없습니다. 훌륭합니다! 🎉</p>
                ) : (
                  <ul className="diag-issues">
                    {result.teaserIssues.map((iss) => (
                      <li key={iss.label} className={`diag-issue diag-issue--${iss.status}`}>
                        <b>{iss.status === "fail" ? "실패" : "경고"}</b>
                        <span>{iss.label}</span>
                        <em>{iss.value}</em>
                      </li>
                    ))}
                    {result.lockedIssueCount > 0 && (
                      <li className="diag-issue diag-issue--locked">
                        🔒 그 외 {result.lockedIssueCount}개 항목의 상세 진단과 항목별 개선 방안은
                        전체 리포트에서 확인할 수 있습니다.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </Reveal>

            <Reveal>
              <div className="diag-cta">
                <h3>
                  전체 진단 리포트와 개선 방안이 궁금하신가요?
                </h3>
                <p>
                  노블컴퍼니 AE가 {result.totalChecks}개 항목 상세 리포트를 바탕으로{" "}
                  <b>무료 상담</b>을 도와드립니다. 항목별 개선 방법과 광고·검색 노출 전략까지
                  함께 제안드려요.
                </p>
                <Link to={contactHref} className="btn btn--primary">
                  전체 리포트 무료 상담 신청 →
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {!result && (
        <section className="section">
          <div className="container">
            <Reveal>
              <span className="eyebrow">WHAT WE CHECK</span>
              <h2 className="section-title">무엇을 진단하나요?</h2>
              <div className="about-values about-values--four">
                <div className="value-card">
                  <h3>수집 점검</h3>
                  <p>응답 상태·속도·robots.txt 등 검색 봇이 페이지를 가져갈 수 있는지 확인합니다.</p>
                </div>
                <div className="value-card">
                  <h3>색인 점검</h3>
                  <p>noindex·캐노니컬·사이트맵 등 검색 결과에 등록될 수 있는 상태인지 확인합니다.</p>
                </div>
                <div className="value-card">
                  <h3>AEO 점검</h3>
                  <p>타이틀·메타·H1·OG·구조화 데이터 등 검색엔진 친화도를 점검합니다.</p>
                </div>
                <div className="value-card">
                  <h3>GEO 점검</h3>
                  <p>ChatGPT·Perplexity 등 AI 검색에 인용되기 위한 구조를 점검합니다.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </main>
  );
}
