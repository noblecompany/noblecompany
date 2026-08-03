import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";

/**
 * ABOUT — 기획안에 별도 챕터가 없어 메인 전략(슬라이드 18)의
 * 브랜드 관점을 기반으로 구성한 초안입니다. 확정 콘텐츠로 교체하세요.
 */
export default function About() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <h1 className="page-hero__title">ABOUT</h1>
            <p className="page-hero__sub">
              우리는 광고를 <span className="accent">나비효과</span>라 부릅니다
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <Reveal>
            <div className="message-grid">
              <h2>
                작은 캠페인 하나가
                <br />
                브랜드의 <span className="accent">내일을 바꿉니다.</span>
              </h2>
              <p className="section-desc">
                노블컴퍼니는 광고에 대한 관점과 클라이언트를 바라보는 시각부터 다르게
                시작합니다. 불필요한 과정을 최소화하고 핵심 정보에 집중하며, 자연스럽게 신뢰를
                쌓아 전환으로 이어지는 흐름을 설계합니다. 데이터로 검증하고, 크리에이티브로
                증명합니다.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="about-values">
              <div className="value-card">
                <h3>Data First</h3>
                <p>
                  감이 아닌 데이터로 판단합니다. 진단·운영·보고의 전 과정을 수치로 투명하게
                  공유합니다.
                </p>
              </div>
              <div className="value-card">
                <h3>Partner, not Client</h3>
                <p>
                  광고주가 아닌 파트너로 함께합니다. 브랜드의 목표를 우리의 목표로 삼아
                  움직입니다.
                </p>
              </div>
              <div className="value-card">
                <h3>Butterfly Effect</h3>
                <p>
                  작은 최적화 하나, 소재 하나의 차이가 만드는 큰 성과의 흐름을 믿고
                  집요하게 개선합니다.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>노블컴퍼니와 함께 성장할 준비가 되셨나요?</h2>
          <p>브랜드의 다음 단계를 함께 그려드립니다.</p>
          <Link to="/contact" className="btn btn--dark">
            프로젝트 문의하기
          </Link>
        </div>
      </section>
    </main>
  );
}
