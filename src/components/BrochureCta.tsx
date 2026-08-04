import { useEffect, useRef, useState } from "react";
import { asset } from "../lib/asset";
import { brochure, SALES_EMAIL } from "../data/company";

/** 소개서 파일이 아직 없을 때 쓰는 메일 요청 링크 */
const REQUEST_HREF = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(
  "[회사소개서 요청]",
)}&body=${encodeURIComponent(
  ["회사명:", "담당자:", "연락처:", "", "회사소개서를 요청드립니다."].join("\n"),
)}`;

/** 집계는 백엔드 도입 시 서버로 옮긴다 (docs/기능-어드민-설계.md F13) */
function track(event: "brochure_view" | "brochure_download") {
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as unknown as { gtag: (...a: unknown[]) => void }).gtag("event", event);
  }
}

const ViewIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

const FullscreenIcon = ({ exit = false }: { exit?: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {exit ? (
      <>
        <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
      </>
    ) : (
      <>
        <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
      </>
    )}
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
);

/**
 * 회사소개서 CTA.
 * 클릭하면 바로 내려받지 않고 **브라우저에서 먼저 열어 보여준 뒤**, 그 화면에서 다운로드하게 합니다.
 *
 * - 데스크톱: 사이트 안에서 모달 뷰어(iframe)로 미리보기
 * - 모바일: iframe PDF 렌더가 불안정해 새 탭의 기본 뷰어로 넘긴다
 * - 파일 미확보(`brochure.file === null`): 메일 요청으로 폴백
 */
export default function BrochureCta({
  variant = "card",
  className = "",
}: {
  variant?: "card" | "button" | "link";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ready = Boolean(brochure.file);
  const fileUrl = ready ? asset(brochure.file as string) : "";
  const label = ready ? "회사소개서 보기" : "회사소개서 요청하기";

  const handleOpen = (e: React.MouseEvent) => {
    if (!ready) return; // 메일 요청은 기본 동작(mailto)에 맡긴다
    e.preventDefault();
    track("brochure_view");

    // 모바일 브라우저는 iframe 안에서 PDF를 제대로 렌더하지 못하는 경우가 많다
    if (window.matchMedia("(max-width: 768px)").matches) {
      window.open(fileUrl, "_blank", "noopener");
      return;
    }
    setOpen(true);
  };

  const anchorProps = {
    href: ready ? fileUrl : REQUEST_HREF,
    onClick: handleOpen,
    ...(ready ? { target: "_blank", rel: "noreferrer" } : {}),
  };

  const cta =
    variant === "link" ? (
      <a {...anchorProps} className={className}>
        {label}
      </a>
    ) : (
      <a {...anchorProps} className={`btn btn--primary brochure-btn ${className}`}>
        <ViewIcon />
        {label}
      </a>
    );

  const modal = open && <BrochureViewer url={fileUrl} onClose={() => setOpen(false)} />;

  if (variant !== "card") {
    return (
      <>
        {cta}
        {modal}
      </>
    );
  }

  return (
    <div className={`brochure-card ${className}`}>
      <div className="brochure-card__text">
        <span className="eyebrow">COMPANY PROFILE</span>
        <h3>노블컴퍼니 회사소개서</h3>
        <p>
          {ready
            ? "회사 연혁과 조직, 주요 캠페인 성과와 협업 방식을 한 편에 정리했습니다. 브라우저에서 바로 열어 보고 필요하면 내려받으세요."
            : "회사 연혁과 조직, 주요 캠페인 성과를 담은 소개서를 메일로 보내드립니다."}
        </p>
        {ready && (
          <span className="brochure-card__meta">
            {brochure.size} · {brochure.updatedAt} 기준
          </span>
        )}
      </div>
      {cta}
      {modal}
    </div>
  );
}

/** 사이트 안에서 PDF를 미리 보여주는 모달 */
function BrochureViewer({ url, onClose }: { url: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isFull, setIsFull] = useState(false);
  /**
   * iframe 이 최종 크기를 갖기 전에 PDF 가 로드되면 `#zoom` 프래그먼트가
   * 잘못된 위치에 적용돼 1페이지 하단·중간 페이지에서 열린다.
   * 레이아웃이 확정된 다음 프레임에 src 를 넣어 이 경합을 피한다.
   */
  const [src, setSrc] = useState("");

  useEffect(() => {
    // 스크롤 잠금으로 스크롤바가 사라지며 폭이 한 번 더 바뀌므로 rAF 로는 모자란다
    const id = window.setTimeout(() => setSrc(`${url}#zoom=100`), 250);
    return () => window.clearTimeout(id);
  }, [url]);

  // 모달이 열려 있는 동안 뒤 페이지 스크롤을 막고, ESC 로 닫는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // 전체화면 상태에서는 ESC 가 전체화면 해제로 먼저 쓰이게 둔다
      if (document.fullscreenElement) return;
      onClose();
    };
    const onFullscreenChange = () => setIsFull(Boolean(document.fullscreenElement));

    /*
      overflow:hidden 만으로는 스크롤바만 사라질 뿐 scrollTop 변경은 막지 못한다.
      그러면 브라우저가 iframe 을 화면에 맞추려 페이지를 스크롤하면서 PDF 내부까지
      함께 밀려 1페이지 중간부터 열린다. body 를 fixed 로 고정해 스크롤을 원천 차단한다.
    */
    const scrollY = window.scrollY;
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      Object.assign(document.body.style, prev);
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      // 모달을 닫을 때 전체화면이 남아 있지 않게 정리한다
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, [onClose]);

  const toggleFullscreen = () => {
    const el = panelRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      // 지원하지 않는 브라우저에서는 조용히 무시하고 모달 크기를 유지한다
      void el.requestFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      className="brochure-modal"
      role="dialog"
      aria-modal="true"
      aria-label="노블컴퍼니 회사소개서 미리보기"
    >
      {/* 패널이 화면을 다 덮으므로 배경 클릭 대신 ✕ 와 ESC 로 닫는다 */}
      <div ref={panelRef} className={`brochure-modal__panel ${isFull ? "is-fullscreen" : ""}`}>
        <div className="brochure-modal__head">
          <div>
            <strong>노블컴퍼니 회사소개서</strong>
            <span>
              {brochure.size} · {brochure.updatedAt} 기준
            </span>
          </div>

          <div className="brochure-modal__actions">
            <button
              type="button"
              className="brochure-modal__ghost"
              onClick={toggleFullscreen}
              aria-pressed={isFull}
              title={
                isFull ? "전체화면 나가기 (ESC)" : "브라우저 UI까지 감추고 전체화면으로 보기"
              }
            >
              <FullscreenIcon exit={isFull} />
              {isFull ? "전체화면 나가기" : "전체화면"}
            </button>
            <a
              className="brochure-modal__btn"
              href={url}
              download={brochure.downloadName}
              onClick={() => track("brochure_download")}
            >
              <DownloadIcon />
              다운로드
            </a>
            <button
              type="button"
              className="brochure-modal__close"
              onClick={onClose}
              aria-label="미리보기 닫기"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
          </div>
        </div>

        {/*
          폭 맞춤(FitH)은 넓은 화면에서 배율이 150% 넘게 튄다. 100% 로 고정해 연다.
          zoom 에 `배율,left,top` 좌표까지 주면 엉뚱한 페이지에서 열리므로 배율만 지정한다.
        */}
        {src && (
          <iframe
            className="brochure-modal__frame"
            src={src}
            title="노블컴퍼니 회사소개서 미리보기"
          />
        )}
      </div>
    </div>
  );
}
