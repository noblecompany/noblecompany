import { useEffect, useState } from "react";
import { asset } from "../lib/asset";
import { useSiteContent } from "../lib/content";

const DISMISS_KEY = "noble-popup-dismissed";

/**
 * 공지·팝업 배너 (C1) — 어드민 사이트 설정에서 기간 예약·on/off 로 제어한다.
 * "오늘 하루 보지 않기"는 localStorage 에 팝업 id + 날짜로 기록한다.
 */
export default function SitePopup() {
  const { site } = useSiteContent();
  const popup = site.popup;
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!popup) return;
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { id: string; date: string };
        const today = new Date().toISOString().slice(0, 10);
        if (saved.id === popup.id && saved.date === today) return; // 오늘 이미 닫음
      }
    } catch {
      /* localStorage 차단 환경 — 그냥 보여준다 */
    }
    setHidden(false);
  }, [popup]);

  if (!popup || hidden) return null;

  const dismissToday = () => {
    try {
      localStorage.setItem(
        DISMISS_KEY,
        JSON.stringify({ id: popup.id, date: new Date().toISOString().slice(0, 10) }),
      );
    } catch {
      /* 저장 실패해도 이번 세션에는 닫힌다 */
    }
    setHidden(true);
  };

  const body = (
    <>
      {popup.imagePath ? (
        <img src={asset(popup.imagePath)} alt={popup.title} />
      ) : (
        <p className="site-popup__title">{popup.title}</p>
      )}
    </>
  );

  return (
    <div className="site-popup" role="dialog" aria-label={`공지: ${popup.title}`}>
      <div className="site-popup__body">
        {popup.linkUrl ? (
          <a href={popup.linkUrl} target="_blank" rel="noreferrer" aria-label={popup.title}>
            {body}
          </a>
        ) : (
          body
        )}
      </div>
      <div className="site-popup__foot">
        <button type="button" onClick={dismissToday}>
          오늘 하루 보지 않기
        </button>
        <button type="button" onClick={() => setHidden(true)}>
          닫기
        </button>
      </div>
    </div>
  );
}
