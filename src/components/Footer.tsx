import { Link } from "react-router-dom";
import {
  PARTNER_EMAIL,
  PARTNER_TEL,
  RECRUIT_EMAIL,
  RECRUIT_TEL,
  SALES_EMAIL,
  SALES_TEL,
} from "../data/company";
import BrochureCta from "./BrochureCta";

const CONTACTS = [
  { label: "광고문의", tel: SALES_TEL, mail: SALES_EMAIL },
  { label: "제휴문의", tel: PARTNER_TEL, mail: PARTNER_EMAIL },
  { label: "채용문의", tel: RECRUIT_TEL, mail: RECRUIT_EMAIL },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <div className="footer__brand">
              noble<b>.</b>company
            </div>
            <p className="footer__label">COMPANY INFO</p>
            <p>대표이사 : 이왕행 | 사업자등록번호 : 212-86-05752</p>
            <p>[본사 주소] 서울 강동구 성내로 48 (성내동, 씨네월드) 6층</p>
          </div>

          <div className="footer__contact">
            <p className="footer__label">CONTACT</p>
            {CONTACTS.map((c) => (
              <p key={c.label}>
                <b className="footer__contact-label">{c.label}</b>{" "}
                <a href={`tel:${c.tel.replace(/-/g, "")}`}>{c.tel}</a> ·{" "}
                <a href={`mailto:${c.mail}`}>{c.mail}</a>
              </p>
            ))}
            {/* TODO: 네이버 블로그 URL 확정 시 교체 */}
            <p style={{ marginTop: 12 }}>
              <a
                href="https://blog.naver.com"
                target="_blank"
                rel="noreferrer"
                className="accent"
              >
                네이버블로그 바로가기 →
              </a>
            </p>
          </div>
        </div>

        <nav className="footer__links" aria-label="푸터 메뉴">
          <a href="tel:024741941">문의전화</a>
          <a href="mailto:noble@e-noble.kr">메일</a>
          <BrochureCta variant="link" />
          <Link to="/careers">채용공고</Link>
          <Link to="/contact">오시는길</Link>
          <Link to="/privacy">개인정보처리방침</Link>
          <Link to="/email-policy">이메일무단수집거부</Link>
        </nav>

        <div className="footer__bottom">
          <span>(C) (주)노블컴퍼니. ALL RIGHTS RESERVED.</span>
          <span>e-noble.kr</span>
        </div>
      </div>
    </footer>
  );
}
