import { Link, useParams } from "react-router-dom";
import BrochureCta from "../components/BrochureCta";
import Reveal from "../components/Reveal";
import { companyInfo, history, orgChart } from "../data/company";
import { asset } from "../lib/asset";

const TABS = [
  { key: "intro", label: "소개", path: "/about" },
  { key: "vision", label: "비전", path: "/about/vision" },
  { key: "history", label: "연혁", path: "/about/history" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * ABOUT — 소개 / 비전 / 연혁 3개 탭.
 * 탭을 URL 경로로 두어 공유·즐겨찾기와 뒤로가기가 동작하게 했습니다.
 */
export default function About() {
  const { tab } = useParams<{ tab?: string }>();
  const active: TabKey = TABS.some((t) => t.key === tab) ? (tab as TabKey) : "intro";

  return (
    <main>
      <section className="about-head">
        <div className="container">
          <nav className="breadcrumb" aria-label="현재 위치">
            <Link to="/">홈</Link>
            <span aria-hidden="true">·</span>
            <span>회사소개</span>
            <span aria-hidden="true">·</span>
            <b>노블컴퍼니 소개</b>
          </nav>

          <h1 className="about-title">
            노블컴퍼니 소개<i aria-hidden="true">.</i>
          </h1>
          <p className="about-tagline">우리는 성과의 차이를 만듭니다</p>

          <div className="about-tabs" role="tablist" aria-label="회사소개 하위 메뉴">
            {TABS.map((t) => (
              <Link
                key={t.key}
                to={t.path}
                role="tab"
                aria-selected={active === t.key}
                className={`about-tab ${active === t.key ? "is-active" : ""}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {active === "intro" && <IntroTab />}
      {active === "vision" && <VisionTab />}
      {active === "history" && <HistoryTab />}
    </main>
  );
}

/* ---------------------------------------------------------------- 소개 */

function IntroTab() {
  return (
    <>
      <section className="about-section">
        <div className="container">
          <Reveal>
            <p className="about-lead">
              같은 매체, 같은 예산이라도
              <br />
              전략과 운영의 차이가 결과를 바꿉니다.
            </p>
          </Reveal>

          <Reveal>
            {/* 타이포그래피 시안 영상 자체가 메시지라 위에 카피를 얹지 않는다 */}
            <div className="about-banner">
              <video
                className="about-banner__video"
                src={asset("/about-typo.mp4")}
                autoPlay
                muted
                loop
                playsInline
                aria-label="노블컴퍼니 브랜드 타이포그래피 영상"
              />
            </div>
          </Reveal>

          <div className="about-intro-grid">
            <Reveal>
              <div>
                <p className="about-statement">
                  노블컴퍼니는
                  <br />
                  데이터와 크리에이티브로 브랜드의 성장을 만드는
                  <br />
                  퍼포먼스 마케팅 기업입니다
                </p>
                <BrochureCta variant="button" />
              </div>
            </Reveal>

            <Reveal>
              <div className="about-body">
                <p>
                  노블컴퍼니는 검색광고와 디스플레이 광고, 바이럴과 온드미디어를 아우르는 통합
                  마케팅 서비스를 제공하고 있습니다. 2011년 법인 설립 이후 병의원·교육·커머스·
                  공공 등 다양한 업종의 캠페인을 집행하며 데이터 기반의 광고 운영 역량을
                  쌓아왔습니다.
                </p>
                <p>
                  노블컴퍼니는 네이버 프리미어 파트너사이자 카카오 공식대행사로, 매체사와의
                  협력을 통해 안정적인 운영 환경을 확보하고 있습니다. 에이스카운터·스마트로그·
                  GA 등 분석 도구를 활용해 유입부터 전환까지의 흐름을 진단하고, 캠페인의 성과를
                  수치로 투명하게 공유합니다.
                </p>
                <p>
                  노블컴퍼니는 광고주가 아닌 파트너로 함께합니다. 작은 최적화 하나가 브랜드의
                  내일을 바꾸는 나비효과가 된다고 믿으며, 최적의 마케팅 솔루션으로 최고의 성과를
                  만들어가겠습니다.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="org">
              <span className="eyebrow">ORGANIZATION</span>
              <h3 className="org__title">조직 구성</h3>

              <div className="org__chart">
                <div className="org__ceo">CEO</div>
                <div className="org__divisions">
                  {orgChart.map((d) => (
                    <div className="org__division" key={d.division}>
                      <div className="org__head">{d.division}</div>
                      <ul className="org__teams">
                        {d.teams.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="about-band">
        <div className="container">
          <p>
            노블컴퍼니는 빠르게 변화하는 디지털 환경 속에서
            <br />
            늘 새로운 목표에 도전하며 성장해 왔습니다.
            <br />
            노블컴퍼니는 브랜드의 가능성을 성장으로 실현하는 파트너로 거듭나
            <br />
            최적의 마케팅 솔루션을 제공하겠습니다.
          </p>
        </div>
      </section>

      <section className="about-section">
        <div className="container company-layout">
          <h2 className="company-heading">회사정보</h2>
          <dl className="company-table">
            {companyInfo.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>
                  {Array.isArray(row.value) ? (
                    <ul>
                      {row.value.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- 비전 */

function VisionTab() {
  return (
    <section className="about-section">
      <div className="container">
        <Reveal>
          <p className="about-lead">
            데이터와 크리에이티브가 만드는 나비효과
            <br />
            브랜드의 다음 단계를 함께 설계합니다
          </p>
        </Reveal>

        <Reveal>
          <div className="vision-cards">
            <div className="vision-card">
              <span className="vision-card__label">미션</span>
              <Dot />
              <strong>
                Be the Best
                <br />
                Growth Partner
              </strong>
            </div>
            <div className="vision-card vision-card--dark">
              <span className="vision-card__label">비전</span>
              <Dot inverted />
              <strong>
                No.1
                <br />
                Performance Marketing Company
              </strong>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="vision-goal">
            <span className="vision-goal__label">목표</span>
            <p>데이터로 증명하고 크리에이티브로 완성하는 통합 마케팅 파트너</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** 미션·비전 카드의 겹친 원 그래픽 */
function Dot({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className={`vision-dot ${inverted ? "vision-dot--inverted" : ""}`} aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

/* ---------------------------------------------------------------- 연혁 */

function HistoryTab() {
  return (
    <section className="about-section">
      <div className="container">
        <Reveal>
          <p className="about-lead">
            2011년부터 현재까지,
            <br />
            데이터 기반 통합 마케팅 시장과 함께 성장했습니다
          </p>
        </Reveal>

        <div className="history">
          {history.map((period, i) => (
            <details className="history__item" key={period.range} open={i === 0}>
              <summary className="history__head">
                <span>{period.range}</span>
                <svg
                  className="history__chevron"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>

              <div className="history__body">
                {period.groups.map((g) => (
                  <div className="history__row" key={g.year ?? g.label}>
                    <div className="history__year">
                      {g.year ? (
                        <>
                          {g.year}
                          <i aria-hidden="true">.</i>
                        </>
                      ) : (
                        <em>{g.label}</em>
                      )}
                    </div>
                    {/* 연도 없는 묶음(광고 수주·인증)은 항목이 많아 2열로 편다 */}
                    <ul className={`history__list ${g.year ? "" : "history__list--grid"}`}>
                      {g.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
