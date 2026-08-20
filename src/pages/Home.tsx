import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Accordion from "../components/Accordion";
import ClientsBand from "../components/ClientsBand";
import PortfolioScroll from "../components/PortfolioScroll";
import Reveal from "../components/Reveal";
import { asset } from "../lib/asset";

/** 슬라이드 26~28 인트로 카피 로테이션 */
const HERO_LINES = ["HI! WE ARE NOBLE", "WE CAN SHOW YOU", "HOW WE WORK"];

/**
 * 히어로 미디어 — youtubeId가 있으면 유튜브 배경, 없으면 video(mp4)로 폴백합니다.
 * https://youtu.be/IeITxaCVsD8
 */
const HERO_MEDIA = {
  // 유튜브 임베드는 제목·로고 오버레이가 얹혀서, 브랜드필름 원본 mp4를 직접 재생한다.
  // 되돌리려면 youtubeId에 "IeITxaCVsD8" 를 넣으면 유튜브가 우선한다.
  youtubeId: "",
  // 원본 파일명: "[noble AI LAB] show your attitude _ VEIL 브랜드필름 (AI 광고 영상).mp4"
  // 공백·대괄호·한글이 섞여 있어 URL-safe 하게 개명해 보관한다.
  video: "/hero-veil.mp4",
  // 원본: https://e-noble.kr/superboard/data/siteconfig/20260323141812_69c0cd1426e0f_....png
  // (흰 배경 제거 + 다크 배경용 흰색 텍스트 변환본, public/에 로컬 보관)
  logo: "/logo-noble-white.webp",
};

/** 배경 재생용 유튜브 파라미터 — 자동재생·무음·무한루프·UI 제거 */
const ytSrc = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?${new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id, // loop는 playlist가 있어야 동작
    controls: "0",
    showinfo: "0",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    disablekb: "1",
    playsinline: "1",
    fs: "0",
  }).toString()}`;

/** 슬라이드 11 — 광고 운영 프로세스 아코디언 */
const PROCESS = [
  {
    title: "01. 진단 & 목표 설정",
    content: (
      <p>
        브랜드의 현재 데이터를 진단하고 캠페인의 <strong>핵심 KPI</strong>를 함께 정의합니다.
        시장·경쟁사·타깃 분석을 통해 성장의 출발점을 명확히 합니다.
      </p>
    ),
  },
  {
    title: "02. 전략 & 크리에이티브",
    content: (
      <p>
        IMC · SA · DA · VIRAL 중 최적의 채널 믹스를 설계하고, 타깃의 마음을 움직이는{" "}
        <strong>크리에이티브</strong>를 제작합니다.
      </p>
    ),
  },
  {
    title: "03. 운영 & 최적화",
    content: (
      <p>
        실시간 데이터 모니터링과 소재 A/B 테스트로 <strong>효율을 지속 개선</strong>합니다.
        부정클릭 차단 등 자체 솔루션으로 새는 예산까지 관리합니다.
      </p>
    ),
  },
  {
    title: "04. 성과 보고 & 확장",
    content: (
      <p>
        투명한 성과 리포트로 결과를 증명하고, 검증된 캠페인을 <strong>더 큰 성장</strong>으로
        확장합니다.
      </p>
    ),
  },
];

/** 메인 하단 FAQ — 자주묻는 질문 (cta-band 바로 위) */
const FAQ: { q: string; a: string[] }[] = [
  {
    q: "네이버 공식 파트너라는 게 어떤 의미인가요?",
    a: [
      "노블컴퍼니는 네이버의 공식 파트너사로서 네이버 검색광고를 비롯한 다양한 광고 상품을 전문적으로 운영하고 있습니다.",
      "단순히 광고를 집행하는 것을 넘어 네이버 본사와의 긴밀한 협업으로 광고 시스템과 운영 정책을 기반으로 광고 계정을 분석하고, 업종과 목표에 맞는 광고 전략을 수립합니다.",
      "하지만, 공식 파트너라는 자격보다, 노블컴퍼니는 이를 실제 광고 성과로 연결하는 운영 역량에 더 큰 자부심으로 관리를 도와드립니다.",
    ],
  },
  {
    q: "네이버 광고만 운영하나요?",
    a: [
      "아닙니다.",
      "노블컴퍼니는 네이버를 중심으로 Google, Meta, Kakao, Apple, Moloco, TikTok 등 다양한 온라인 광고 매체를 운영하고 있습니다.",
      "브랜드와 업종, 타깃, 광고 목표에 따라 적합한 매체를 선정하고 각 채널의 역할을 설계합니다.",
      "검색을 통한 직접적인 수요 확보부터 디스플레이·SNS를 통한 잠재고객 확보, 리타겟팅까지 하나의 마케팅 전략 안에서 통합적으로 운영합니다.",
      "또한 인플루언서, 바이럴, 체험단, SNS/블로그 운영대행, 콘텐츠 제작 등 온라인 마케팅에 필요한 모든 분야를 지원하는 회사입니다.",
    ],
  },
  {
    q: "광고 소재도 제작해주시나요?",
    a: [
      "네. 광고 목적과 매체 특성에 맞는 소재 기획 및 제작을 지원합니다.",
      "단순히 디자인을 제작하는 것이 아니라 어떤 메시지가 고객의 관심과 전환을 유도할 수 있는지를 먼저 분석하고, 광고 데이터와 시장 반응을 바탕으로 소재를 지속적으로 개선합니다.",
      "필요에 따라 이미지, 배너, 영상, 텍스트 등 매체별 광고 소재를 기획하고 제작합니다.",
    ],
  },
  {
    q: "월 광고비가 적어도 진행할 수 있나요?",
    a: [
      "광고 예산의 규모만으로 진행 여부를 판단하지 않습니다.",
      "중요한 것은 현재 예산 안에서 어떤 목표를 설정하고, 어떤 매체와 전략을 활용할 것인지입니다.",
      "다만 업종과 목표에 따라 효율적인 데이터 확보를 위해 필요한 최소 광고 규모가 달라질 수 있기 때문에, 상담 과정에서 현재 상황과 목표를 확인한 후 적합한 운영 방향을 제안드립니다.",
      "무조건 광고비를 늘리는 것이 아니라, 현재 예산에서 가장 효율적인 방법을 먼저 찾습니다.",
    ],
  },
  {
    q: "광고비와 대행 수수료는 어떻게 되나요?",
    a: [
      "광고비와 대행 수수료는 별도로 운영됩니다.",
      "광고비는 네이버, Google, Meta 등 각 광고 매체에 집행되는 비용이며, 대행 수수료는 광고 운영 및 관리에 대한 비용입니다.",
      "대행 수수료 없이 무료로 관리해드리는 매체가 있으며, 업종, 광고 규모, 운영 매체, 소재 제작 범위 및 업무 범위에 따라 수수료가 달라질 수 있습니다.",
      "상담을 통해 필요한 업무 범위와 비용을 투명하게 안내드립니다.",
    ],
  },
  {
    q: "기존 광고대행사가 있는데 변경할 수 있나요?",
    a: [
      "물론 가능합니다.",
      "기존 광고 계정을 그대로 활용하면서 현재 운영 현황과 광고 데이터를 먼저 분석하고, 기존 운영에서 개선할 수 있는 부분과 새롭게 적용할 전략을 진단합니다.",
      "광고대행사를 변경한다고 해서 반드시 기존 캠페인을 모두 초기화할 필요는 없습니다.",
      "현재 데이터와 운영 이력을 최대한 활용하면서 필요한 부분만 개선하여 불필요한 학습 손실과 운영 공백을 최소화하는 방향으로 진행합니다.",
    ],
  },
  {
    q: "광고 성과가 나오지 않을 경우 어떻게 하나요?",
    a: [
      "광고 성과가 낮다고 해서 무조건 광고비를 늘리거나 매체를 변경하지 않습니다.",
      "먼저 키워드, 타깃, 소재, 입찰가, 랜딩페이지, 전환 설정, 예산 배분 등 광고 성과에 영향을 미치는 요소를 단계적으로 분석합니다.",
      "이를 통해 성과가 낮은 원인이 광고 매체에 있는지, 광고 소재에 있는지, 랜딩페이지나 전환 과정에 있는지를 구분합니다.",
      "이후 데이터를 기반으로 개선안을 적용하고 결과를 지속적으로 확인하면서 캠페인을 최적화합니다.",
      "성과가 나올 때까지 무작정 기다리는 것이 아니라, 성과를 만들기 위해 무엇을 바꿔야 하는지를 지속적으로 찾아갑니다.",
    ],
  },
  {
    q: "어떤 업종을 주로 운영하시나요?",
    a: [
      "특정 업종에 한정하지 않고 다양한 산업군의 온라인 마케팅을 운영하고 있습니다.",
      "이커머스 · 뷰티 · 의료 · 건강 · 식품 · 생활용품 · 교육 · 법률 · 프랜차이즈 · 서비스업 등 다양한 업종의 광고 운영 경험을 보유하고 있습니다.",
      "업종마다 고객의 검색 패턴과 구매 과정, 광고 효율을 판단하는 기준이 다르기 때문에 단순히 동일한 광고 전략을 적용하지 않습니다.",
      "업종의 특성과 비즈니스 목표를 분석한 후 브랜드에 맞는 광고 전략을 설계합니다.",
    ],
  },
];

export default function Home() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLineIndex((i) => (i + 1) % HERO_LINES.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <main>
      {/* 1. 브랜드 메인 동적 컨텐츠 — 슬라이드 4~6 (영상 확보 전 모션 카피로 대체) */}
      <section className="hero">
        <div className="hero__bg" aria-hidden="true" />
        {HERO_MEDIA.youtubeId ? (
          <div className="hero__yt-wrap" aria-hidden="true">
            <iframe
              className="hero__yt"
              src={ytSrc(HERO_MEDIA.youtubeId)}
              title="노블컴퍼니 소개 영상"
              allow="autoplay; encrypted-media"
              frameBorder="0"
              tabIndex={-1}
            />
          </div>
        ) : (
          HERO_MEDIA.video && (
            <video
              className="hero__video"
              src={asset(HERO_MEDIA.video)}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
          )
        )}
        {(HERO_MEDIA.youtubeId || HERO_MEDIA.video) && (
          <div className="hero__veil" aria-hidden="true" />
        )}
        <div className="container hero__inner">
          <h1 className="hero__line" key={lineIndex} style={{ animation: "hero-swap 0.6s ease" }}>
            {HERO_LINES[lineIndex]}
          </h1>
          <p className="hero__tagline">
            브랜드를 분석하고 이해하고 시작합니다.
            <strong>기계적으로 운영하는 광고는 성과를 만들 수 없습니다</strong>
          </p>
          <p className="hero__sub">
            노블컴퍼니는 브랜드를 분석하고 경쟁사를 이해한 후 시작합니다.
            <br />
            목표를 분석하고 데이터를 읽고 전략을 도출해내는 광고회사입니다.
          </p>
          <p className="hero__sub">IMC · SA · DA · VIRAL, 광고의 시작부터 성과까지 함께합니다.</p>
          <div className="hero__cta">
            <Link to="/work" className="btn btn--primary">
              포트폴리오 보기
            </Link>
            <Link to="/contact" className="btn btn--ghost">
              프로젝트 문의
            </Link>
          </div>
        </div>
        <div className="hero__scroll" aria-hidden="true">
          scroll
        </div>
        <style>{`@keyframes hero-swap { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }`}</style>
      </section>

      {/* 2. 노블컴퍼니 메시지 — 슬라이드 7 (좌 대형 메시지 / 우 해설) */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="message-grid">
              <h2>
                광고는 비용이 아니라
                <br />
                {/* 한 줄에 넣으면 '파트/너'로 끊겨 어절 단위로 나눈다 */}
                <span className="accent">
                  브랜드의 시간을
                  <br />
                  아껴주는 파트너
                </span>
                입니다.
              </h2>
              <p className="section-desc">
                우리는 클라이언트를 광고주가 아닌 함께 성장하는 파트너로 바라봅니다. 불필요한
                과정을 덜어내고 핵심에 집중하는 캠페인 설계로, 작은 시작이 큰 성과로 이어지는
                흐름을 만듭니다. 그것이 노블컴퍼니가 말하는 나비효과입니다.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. 대표 포트폴리오 — 좌측 고정 텍스트 + 우측 스크롤 연동 그리드 (슬라이드 8, PLAY.D 레퍼런스) */}
      <PortfolioScroll />

      {/* 3.5 클라이언트 롤링 밴드 — 슬라이드 9, 목록은 어드민(클라이언트 관리)에서 편집 */}
      <ClientsBand />

      {/* 4. 성과/권위 증명 — 슬라이드 10~11 */}
      <section className="section" style={{ background: "var(--noble-black-soft)" }}>
        <div className="container">
          <Reveal>
            <h2 className="section-title">
              매년 성장해나가는
              <br />
              노블컴퍼니의 브랜드 가치
            </h2>
          </Reveal>
          {/* TODO: 재무 수치의 기준 연도(예: 2025년) 확정 시 라벨에 함께 표기 */}
          <Reveal>
            <div className="stats stats--figures">
              <div className="stat">
                <strong>
                  24,538,208,955<em>원</em>
                </strong>
                <span>매출총이익</span>
              </div>
              <div className="stat">
                <strong>
                  464,111,579<em>원</em>
                </strong>
                <span>영업이익</span>
              </div>
              <div className="stat">
                <strong>
                  601,136,106<em>원</em>
                </strong>
                <span>당기순이익</span>
              </div>
              <div className="stat">
                <strong>
                  800<em>+</em>
                </strong>
                <span>브랜드</span>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <h3 style={{ marginTop: 90, fontSize: 24, fontWeight: 800 }}>
              광고 운영 프로세스
            </h3>
            <Accordion items={PROCESS} />
          </Reveal>
        </div>
      </section>

      {/* 5. 자주묻는 질문 */}
      <section className="section faq">
        <div className="container">
          <Reveal>
            <div className="faq__head">
              <h2 className="section-title">자주묻는 질문</h2>
              <p className="faq__sub">
                찾으시는 답변이 없나요?{" "}
                <Link to="/contact" className="accent">
                  프로젝트 문의 바로가기 →
                </Link>
              </p>
            </div>
          </Reveal>
          <Reveal>
            <Accordion
              items={FAQ.map((f) => ({
                title: (
                  <>
                    <em className="faq__q" aria-hidden="true">
                      Q.
                    </em>
                    {f.q}
                  </>
                ),
                content: (
                  <div className="faq__answer">
                    {f.a.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ),
              }))}
            />
          </Reveal>
        </div>
      </section>

      {/* 6. 문의 유도 CTA — 슬라이드 13~15 */}
      <section className="cta-band">
        <div className="container">
          <Reveal>
            <h2>지금, 브랜드의 날갯짓을 시작하세요</h2>
            <p>어떤 광고가 맞을지 몰라도 괜찮습니다. 유형만 선택하면 노블컴퍼니가 답을 드립니다.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/contact" className="btn btn--dark">
                프로젝트 문의하기
              </Link>
              <Link to="/solution" className="btn btn--ghost">
                솔루션 알아보기
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
