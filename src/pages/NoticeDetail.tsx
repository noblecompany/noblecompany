import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Reveal from "../components/Reveal";
import { useNotice, useNotices, type NoticeImage } from "../lib/content";
import { useSeo } from "../lib/seo";

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

const fmtBytes = (n: number | null) =>
  n === null ? "" : n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`;

/**
 * 공지사항 상세 — 본문 + 첨부 이미지 갤러리.
 * 이미지는 개별 다운로드(Storage ?download= → attachment) 와 전체 다운로드를 지원한다.
 */
export default function NoticeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { notice, loading } = useNotice(slug);
  const { notices } = useNotices();
  const [lightbox, setLightbox] = useState<NoticeImage | null>(null);

  useSeo(
    notice
      ? {
          title: notice.title,
          description: notice.body.replace(/\s+/g, " ").slice(0, 150),
          image: notice.images[0]?.url,
          ogType: "article",
        }
      : {},
  );

  if (!notice) {
    if (loading) return <main style={{ minHeight: "60vh" }} />;
    return <Navigate to="/notice" replace />;
  }

  // 이전/다음 — 목록 순서(고정 → 최신순) 기준
  const at = notices.findIndex((n) => n.slug === notice.slug);
  const prev = at > 0 ? notices[at - 1] : null;
  const next = at >= 0 && at < notices.length - 1 ? notices[at + 1] : null;

  // 본문: 빈 줄 = 단락, 줄바꿈 = <br>
  const paragraphs = notice.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  /** 전체 다운로드 — 브라우저가 파일별로 저장 (짧은 간격으로 순차 트리거) */
  const downloadAll = () => {
    notice.images.forEach((img, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = img.downloadUrl;
        a.download = img.name;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 400);
    });
  };

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 28 }}>
        <div className="container notice-detail">
          <Reveal>
            <nav className="breadcrumb" aria-label="현재 위치">
              <Link to="/">홈</Link>
              <span aria-hidden="true">·</span>
              <Link to="/notice">공지사항</Link>
            </nav>
            <div className="notice-detail__meta">
              {notice.pinned && <span className="notice-item__pin">공지</span>}
              <time dateTime={notice.publishedAt}>{fmt(notice.publishedAt)}</time>
              <span>· 조회 {notice.viewCount.toLocaleString()}</span>
            </div>
            <h1 className="notice-detail__title">{notice.title}</h1>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 10 }}>
        <div className="container notice-detail">
          {notice.images.length > 0 && (
            <Reveal>
              <div className="notice-gallery">
                <div className="notice-gallery__head">
                  <h2>첨부 이미지 {notice.images.length}장</h2>
                  {notice.images.length > 1 && (
                    <button type="button" className="btn btn--ghost notice-dl" onClick={downloadAll}>
                      <DownloadIcon /> 전체 다운로드
                    </button>
                  )}
                </div>
                <ul className={`notice-gallery__grid ${notice.images.length === 1 ? "is-single" : ""}`}>
                  {notice.images.map((img) => (
                    <li key={img.url} className="notice-gallery__item">
                      <button
                        type="button"
                        className="notice-gallery__open"
                        onClick={() => setLightbox(img)}
                        aria-label={`${img.name} 크게 보기`}
                      >
                        <img src={img.url} alt={img.name} loading="lazy" />
                      </button>
                      <div className="notice-gallery__foot">
                        <span className="notice-gallery__name" title={img.name}>
                          {img.name} {img.size !== null && <em>({fmtBytes(img.size)})</em>}
                        </span>
                        <a className="notice-dl notice-dl--sm" href={img.downloadUrl} download={img.name}>
                          <DownloadIcon /> 다운로드
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}

          <Reveal>
            <article className="notice-body">
              {paragraphs.map((p, i) => (
                <p key={i}>
                  {p.split("\n").map((line, j, arr) => (
                    <span key={j}>
                      {line}
                      {j < arr.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
              {notice.sourceUrl && (
                <p className="notice-body__source">
                  출처 :{" "}
                  <a href={notice.sourceUrl} target="_blank" rel="noreferrer">
                    {notice.sourceName ?? notice.sourceUrl} ↗
                  </a>
                </p>
              )}
            </article>
          </Reveal>

          <div className="detail-nav">
            {prev ? <Link to={`/notice/${prev.slug}`}>← {prev.title}</Link> : <span />}
            <Link to="/notice" className="is-current">
              목록
            </Link>
            {next ? <Link to={`/notice/${next.slug}`}>{next.title} →</Link> : <span />}
          </div>
        </div>
      </section>

      {lightbox && (
        <div className="notice-lightbox" role="dialog" aria-label={lightbox.name} onClick={() => setLightbox(null)}>
          <img src={lightbox.url} alt={lightbox.name} />
          <div className="notice-lightbox__bar" onClick={(e) => e.stopPropagation()}>
            <span>{lightbox.name}</span>
            <a className="notice-dl notice-dl--sm" href={lightbox.downloadUrl} download={lightbox.name}>
              <DownloadIcon /> 다운로드
            </a>
            <button type="button" onClick={() => setLightbox(null)} aria-label="닫기">
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  );
}
