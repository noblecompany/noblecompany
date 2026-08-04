import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Accordion from "../components/Accordion";
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
  logo: "/logo-noble-white.png",
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

      {/* 4. 성과/권위 증명 — 슬라이드 10~11 */}
      <section className="section" style={{ background: "var(--noble-black-soft)" }}>
        <div className="container">
          <Reveal>
            <h2 className="section-title">
              결과로 증명하는
              <br />
              노블컴퍼니의 광고 운영 역량
            </h2>
          </Reveal>
          {/* TODO: 실제 성과 수치 확정 시 교체 (플레이스홀더) */}
          <Reveal>
            <div className="stats">
              <div className="stat">
                <strong>
                  120<em>+</em>
                </strong>
                <span>누적 클라이언트</span>
              </div>
              <div className="stat">
                <strong>
                  850<em>+</em>
                </strong>
                <span>누적 캠페인</span>
              </div>
              <div className="stat">
                <strong>
                  320<em>%</em>
                </strong>
                <span>평균 ROAS 개선</span>
              </div>
              <div className="stat">
                <strong>
                  98<em>%</em>
                </strong>
                <span>클라이언트 재계약률</span>
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

      {/* 5. 문의 유도 CTA — 슬라이드 13~15 */}
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
