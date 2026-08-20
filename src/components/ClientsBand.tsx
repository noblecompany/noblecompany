import Reveal from "./Reveal";
import { useSiteContent } from "../lib/content";

/**
 * 기획안 슬라이드 9 — Clients 롤링 밴드.
 * 로고 원본 확보 전까지 브랜드명 칩 롤링으로 "거래 폭" 신뢰 메시지를 전달한다.
 * 목록은 어드민(연혁·조직 > 클라이언트)에서, 노출 여부는
 * 어드민(사이트 설정 > 기능 토글 > 클라이언트 롤링 밴드)에서 제어한다.
 */
const ROWS = 3;

export default function ClientsBand() {
  const { site } = useSiteContent();

  // 기능 토글이 켜져 있을 때만 노출 (기본 꺼짐)
  if (site.settings["feature.clients"] !== true) return null;

  const clients = site.clients;
  if (clients.length === 0) return null;

  // 브랜드를 3줄로 나눠 줄마다 반대 방향·다른 속도로 흐르게 한다
  const lines = Array.from({ length: ROWS }, (_, r) =>
    clients.filter((_, i) => i % ROWS === r),
  );

  return (
    <section className="section clients">
      <div className="container">
        <Reveal>
          <h2 className="section-title">
            이미 울림을 준 많은 기업들이
            <br />
            <span className="accent">노블컴퍼니</span>와 함께하였습니다.
          </h2>
          <p className="section-desc">
            업종을 가리지 않고 {clients.length}개 브랜드의 광고를 운영해왔습니다.
          </p>
        </Reveal>
      </div>

      <div className="clients__rows" aria-label={`거래 브랜드 ${clients.length}개`}>
        {lines.map((line, r) => (
          <div className="clients__marquee" key={r}>
            <div
              className={`clients__track ${r % 2 ? "is-reverse" : ""}`}
              style={{ animationDuration: `${46 + r * 8}s` }}
            >
              {/* 끊김 없는 무한 롤링을 위해 같은 줄을 2번 이어 붙인다 */}
              {[...line, ...line].map((name, i) => (
                <span className="clients__chip" key={`${name}-${i}`} aria-hidden={i >= line.length}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
