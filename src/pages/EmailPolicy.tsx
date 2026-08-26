import Reveal from "../components/Reveal";
import { useSeo } from "../lib/seo";

/** 이메일무단수집거부 (F12) — 정보통신망법 제50조의2 근거 고지 */
export default function EmailPolicy() {
  useSeo({
    title: "이메일무단수집거부",
    description:
      "노블컴퍼니 웹사이트에 게시된 이메일 주소를 수집 프로그램 등 기술적 장치로 무단 수집하는 것을 거부합니다. 위반 시 정보통신망법에 의해 처벌될 수 있습니다.",
  });
  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 30 }}>
        <div className="container">
          <Reveal>
            <h1 className="policy-title">이메일무단수집거부</h1>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container policy">
          <div className="policy__block">
            <p>
              본 웹사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적
              장치를 이용하여 무단으로 수집되는 것을 거부하며, 이를 위반할 경우
              「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조의2에 의하여
              형사처벌됨을 유념하시기 바랍니다.
            </p>
            <ul>
              <li>게시일: 2026년 8월</li>
              <li>게시자: 주식회사 노블컴퍼니</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
