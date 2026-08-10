import Reveal from "../components/Reveal";
import { PARTNER_EMAIL, RECRUIT_EMAIL, SALES_EMAIL, SALES_TEL } from "../data/company";

/**
 * 개인정보처리방침 (F12) — 접수 기능 오픈 전 게시 의무.
 * TODO: 정식 오픈 전 법무/대표 검토 필수. 시행일·보호책임자 확정 후 갱신.
 * 보관기간은 확정값(문의 3년 / 채용 1년)을 반영했다 (docs/기능-어드민-설계.md §7).
 */

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. 총칙",
    body: (
      <p>
        주식회사 노블컴퍼니(이하 "회사")는 「개인정보 보호법」 등 관련 법령을 준수하며,
        이용자의 개인정보를 소중히 다루고 안전하게 관리하기 위해 최선을 다합니다. 본
        방침은 회사 홈페이지(e-noble.kr)를 통해 수집되는 개인정보의 처리에 적용됩니다.
      </p>
    ),
  },
  {
    title: "2. 수집하는 개인정보 항목과 방법",
    body: (
      <>
        <p>회사는 홈페이지에서 아래와 같이 개인정보를 수집합니다.</p>
        <ul>
          <li>
            <b>프로젝트 문의</b>: 회사명, 담당자 이름, 연락처, 이메일 (필수) / 문의 종류,
            예산, 진행 기간, 문의 내용 (선택)
          </li>
          <li>
            <b>채용 지원</b>: 성명, 연락처, 이메일, 지원 공고 (필수) / 경력, 이력서·포트폴리오
            파일, 자기소개 (선택)
          </li>
          <li>
            <b>자동 수집</b>: 접속 기록, 서비스 이용 기록 (스팸·부정 이용 방지 목적)
          </li>
        </ul>
        <p>개인정보는 이용자가 홈페이지 양식에 직접 입력하는 방식으로 수집됩니다.</p>
      </>
    ),
  },
  {
    title: "3. 개인정보의 이용 목적",
    body: (
      <ul>
        <li>프로젝트 문의: 문의 응대, 상담 및 제안, 계약 협의</li>
        <li>채용 지원: 지원자 확인, 전형 진행, 채용 관련 안내</li>
        <li>서비스 운영: 부정 이용 방지, 접수 이력 관리</li>
      </ul>
    ),
  },
  {
    title: "4. 보유 및 이용 기간",
    body: (
      <>
        <p>
          개인정보는 수집·이용 목적이 달성되면 지체 없이 파기하며, 보유 기간은 다음과
          같습니다.
        </p>
        <ul>
          <li>
            <b>프로젝트 문의</b>: 접수일로부터 <b>3년</b>
          </li>
          <li>
            <b>채용 지원</b>: 접수일로부터 <b>1년</b> (이력서 등 첨부 파일 포함)
          </li>
        </ul>
        <p>
          보유 기간이 지난 개인정보는 전자적 파일은 복구할 수 없는 방법으로 삭제하고,
          출력물은 파쇄 또는 소각하여 파기합니다.
        </p>
      </>
    ),
  },
  {
    title: "5. 제3자 제공",
    body: (
      <p>
        회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 근거한
        수사기관 등의 적법한 요청이 있는 경우는 예외로 합니다.
      </p>
    ),
  },
  {
    title: "6. 처리 위탁",
    body: (
      <>
        <p>회사는 서비스 운영을 위해 아래와 같이 개인정보 처리를 위탁합니다.</p>
        <ul>
          <li>클라우드 호스팅·데이터 보관: Vercel Inc., Supabase Inc.</li>
          <li>이메일 발송·수신: 가비아(하이웍스)</li>
        </ul>
        <p>위탁 계약 시 개인정보 보호 관련 법령 준수를 명시하고 관리·감독합니다.</p>
      </>
    ),
  },
  {
    title: "7. 정보주체의 권리",
    body: (
      <p>
        이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수
        있습니다. 요청은 아래 개인정보 보호책임자 연락처로 하시면 지체 없이
        조치하겠습니다.
      </p>
    ),
  },
  {
    title: "8. 안전성 확보 조치",
    body: (
      <ul>
        <li>개인정보 전송 구간 암호화(HTTPS) 및 저장 시 암호화</li>
        <li>접근 권한 최소화, 관리자 인증 및 개인정보 열람 기록 관리</li>
        <li>이력서 등 파일은 기간 제한이 있는 비공개 링크로만 접근</li>
      </ul>
    ),
  },
  {
    title: "9. 개인정보 보호책임자",
    body: (
      <>
        {/* TODO: 보호책임자 지정 확정 시 갱신 (기본값: 대표이사) */}
        <ul>
          <li>개인정보 보호책임자: 대표이사 이왕행</li>
          <li>
            문의: {SALES_TEL} · {SALES_EMAIL}
          </li>
          <li>
            제휴 관련: {PARTNER_EMAIL} / 채용 관련: {RECRUIT_EMAIL}
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "10. 고지 의무",
    body: (
      <p>
        본 방침의 내용이 추가, 삭제 또는 수정되는 경우 시행 7일 전부터 홈페이지 공지사항을
        통해 알립니다.
        {/* TODO: 정식 오픈 시 시행일 확정 */}
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 30 }}>
        <div className="container">
          <Reveal>
            <h1 className="policy-title">개인정보처리방침</h1>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container policy">
          {SECTIONS.map((s) => (
            <div className="policy__block" key={s.title}>
              <h2>{s.title}</h2>
              {s.body}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
