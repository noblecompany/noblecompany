import Reveal from "./Reveal";
import { clients } from "../data/clients";

/**
 * 기획안 슬라이드 9 — Clients.
 * 레퍼런스는 클라이언트 로고 그리드지만 로고 원본이 아직 없어,
 * 확보 전까지 브랜드명 롤링으로 동일한 "거래 폭" 신뢰 메시지를 전달한다.
 */
const ROWS = 3;

export default function ClientsBand() {
  // 브랜드를 3줄로 나눠 줄마다 반대 방향으로 흐르게 한다
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
              style={{ animationDuration: `${52 + r * 9}s` }}
            >
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
