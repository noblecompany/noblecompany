import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { useNotices } from "../lib/content";
import { useSeo } from "../lib/seo";

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

/** 공지사항 목록 — 수상·인증·사회공헌 소식. 어드민에서 등록 */
export default function Notice() {
  useSeo({
    title: "공지사항",
    description:
      "노블컴퍼니 소식 — 네이버 프리미어 파트너사 선정, 서울형 강소기업·청년친화강소기업 선정, 지역사회 후원 등 수상·인증·사회공헌 소식을 전합니다.",
  });
  const { notices, loading } = useNotices();

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 40 }}>
        <div className="container">
          <Reveal>
            <h1 className="page-hero__title">NOTICE</h1>
            <p className="page-hero__sub">
              노블컴퍼니의 <span className="accent">소식</span>을 전합니다
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--soft" style={{ paddingTop: 20 }}>
        <div className="container">
          {loading && notices.length === 0 && <p className="notice-empty">불러오는 중…</p>}
          {!loading && notices.length === 0 && (
            <p className="notice-empty">등록된 공지가 없습니다.</p>
          )}

          <ul className="notice-list">
            {notices.map((n, i) => (
              <Reveal key={n.id} delay={(i % 4) * 60}>
                <li className={`notice-item ${n.pinned ? "is-pinned" : ""}`}>
                  <Link to={`/notice/${n.slug}`} className="notice-item__link">
                    <div className="notice-item__thumb">
                      {n.thumb ? (
                        <img src={n.thumb} alt="" loading="lazy" />
                      ) : (
                        <span className="notice-item__thumb-empty">noble</span>
                      )}
                    </div>
                    <div className="notice-item__body">
                      <div className="notice-item__meta">
                        {n.pinned && <span className="notice-item__pin">공지</span>}
                        <time dateTime={n.publishedAt}>{fmt(n.publishedAt)}</time>
                        {n.sourceName && <span>· {n.sourceName}</span>}
                      </div>
                      <h2 className="notice-item__title">{n.title}</h2>
                      <span className="notice-item__more">자세히 보기 →</span>
                    </div>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
