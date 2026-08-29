import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ActionButton } from "seed-design/ui/action-button";
import { IconLock } from "../components/Icons";
import Reveal from "../components/Reveal";
import { ACE_CONVERSION, aceVirtualPage } from "../lib/acecounter";
import { useSeo } from "../lib/seo";

/**
 * 방문자에게는 요약(등급·카운트·NRS 총점)만 내려온다 — 항목명·키워드·개선방안 등
 * 상세 내용은 서버가 아예 보내지 않고 DB에만 저장된다 (상담 유도 리드 퍼널).
 */
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
  totalChecks: number;
  ars: { score: number; max: number; potential: number };
  issueCount: number;
  keywordCount: number;
  topKeyword: string | null;
  aiPass: number;
  aiTotal: number;
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

/** 잠금 미리보기용 더미 행 — 실제 데이터가 아니라 시각 효과용 (서버는 상세를 보내지 않는다) */
const LOCKED_ROWS = [
  "◼◼◼◼◼◼ 요소 텍스트 길이 확인 — ◼◼자 (개선 방안: ◼◼◼◼◼◼◼◼◼◼◼◼)",
  "◼◼◼◼ 리소스 ◼◼개 존재 — ◼◼◼◼◼ 적용 필요 (JS ◼◼ / CSS ◼◼)",
  "핵심 키워드 '◼◼◼◼' 외 ◼◼개 — 타이틀 반영 ◼개 / 메타 반영 ◼개",
  "구조화 데이터 ◼◼◼◼◼ 누락 — ◼◼◼◼ 스키마 추가 권장",
  "◼◼◼◼◼◼ 스키마 필드 ◼/5 — name·description·◼◼◼◼◼◼◼◼",
];

/** 무료 사이트 진단 (AEO·GEO) — URL 입력 → 요약 결과 → 상담 신청 퍼널 */
export default function Diagnosis() {
  useSeo({
    title: "무료 사이트 진단 (AEO·GEO)",
    description:
      "URL 만 입력하면 33개 항목을 즉시 점검 — 검색엔진 최적화(AEO)·AI 검색 최적화(GEO)·키워드 분석과 광고연관 준비도 점수를 무료로 확인하세요.",
  });
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
      aceVirtualPage(ACE_CONVERSION.diagnosis); // 에이스카운터 전환(진단 완료)
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
              주소만 입력하면 수집·색인·AEO(검색엔진 최적화)·GEO(AI 검색 최적화)·키워드까지
              {" "}33개 항목을 즉시 점검해 등급을 알려드립니다.
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
                사이트에 접속해 33개 항목을 점검하고 있습니다… (최대 30초)
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
              <p className="eyebrow">진단 결과 요약</p>
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
                    {result.issueCount > 0 && (
                      <em>
                        개선 항목 {result.issueCount}개 해결 시{" "}
                        <b>{result.ars.potential}점</b> 도달 가능
                      </em>
                    )}
                  </div>
                  <p className="diag-ars__note">
                    수집·색인·콘텐츠 연관성·성능·구조화 5개 영역을 종합한 노블컴퍼니 자체
                    지표입니다. 영역별 점수와 감점 원인은 전체 리포트에서 확인할 수 있습니다.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="diag-panel">
                <h3>상세 진단 내용</h3>
                <p className="diag-summaryline">
                  개선 필요 항목 <b>{result.issueCount}개</b> · 핵심 키워드{" "}
                  <b>{result.keywordCount}개</b> 분석
                  {result.topKeyword && (
                    <>
                      {" "}
                      (1위: <b>{result.topKeyword}</b>)
                    </>
                  )}
                  {result.aiTotal > 0 && (
                    <>
                      {" "}
                      · AI 브리핑 준비도 <b>{result.aiPass}/{result.aiTotal}</b>
                    </>
                  )}
                </p>

                <div className="diag-lockbox" aria-hidden="true">
                  <ul>
                    {LOCKED_ROWS.map((row) => (
                      <li key={row}>{row}</li>
                    ))}
                  </ul>
                  <div className="diag-lockbox__overlay">
                    <b>
                      <IconLock className="diag-lockbox__icon" /> 상세 리포트 잠김
                    </b>
                    <p>
                      항목별 진단 결과·키워드 분석·개선 방안은
                      <br />
                      무료 상담 신청 시 담당 AE가 리포트로 제공해 드립니다.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="diag-cta">
                <h3>전체 진단 리포트와 개선 방안이 궁금하신가요?</h3>
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
