import { useCallback, useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../lib/theme";
import { adminApi, timeAgo, type AdminNotification } from "./api";

/** 사이드바 메뉴 — 설계 §6.1 정보 구조 */
const MENU: Array<{ to: string; label: string; icon: ReactNode }> = [
  { to: "/admin", label: "대시보드", icon: <IconGrid /> },
  { to: "/admin/inquiries", label: "문의 관리", icon: <IconMail /> },
  { to: "/admin/applications", label: "지원자 관리", icon: <IconUsers /> },
  { to: "/admin/jobs", label: "채용공고", icon: <IconFile /> },
  { to: "/admin/works", label: "포트폴리오", icon: <IconImage /> },
  { to: "/admin/site", label: "연혁·조직", icon: <IconTree /> },
  { to: "/admin/settings", label: "사이트 설정", icon: <IconGear /> },
];

const TITLE: Record<string, string> = {
  "/admin": "대시보드",
  "/admin/inquiries": "문의 관리",
  "/admin/applications": "지원자 관리",
  "/admin/jobs": "채용공고",
  "/admin/works": "포트폴리오",
  "/admin/site": "연혁·조직",
  "/admin/settings": "사이트 설정",
};

export default function AdminLayout({
  children,
  onLogout,
}: PropsWithChildren<{ onLogout: () => void }>) {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const title = TITLE[pathname] ?? "대시보드";

  return (
    <div className="adm">
      <aside className="adm-side">
        <Link to="/admin" className="adm-side__brand">
          noble<b>.</b>admin
        </Link>

        <nav className="adm-side__nav" aria-label="관리 메뉴">
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.to === "/admin"}
              className={({ isActive }) => `adm-side__item ${isActive ? "is-active" : ""}`}
            >
              {m.icon}
              {m.label}
            </NavLink>
          ))}
        </nav>

        <div className="adm-side__foot">
          <a href="/" target="_blank" rel="noreferrer">
            사이트 바로가기 ↗
          </a>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <div className="adm-top__crumb">
            <span>관리자</span>
            <i aria-hidden="true">/</i>
            <b>{title}</b>
          </div>

          <div className="adm-top__actions">
            <NotificationBell />
            <button
              type="button"
              className="adm-iconbtn"
              onClick={toggle}
              aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {theme === "dark" ? <IconSun /> : <IconMoon />}
            </button>
            <button type="button" className="adm-iconbtn" onClick={onLogout} aria-label="로그아웃">
              <IconLogout />
            </button>
          </div>
        </header>

        <main className="adm-content">{children}</main>
      </div>
    </div>
  );
}

/**
 * 알림센터 (F6) — 서버 목록 + Supabase Realtime 으로 신규 접수를 새로고침 없이 반영.
 * 읽음 상태는 사용자별로 notification_reads 에 기록된다.
 */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read).length;

  const load = useCallback(() => {
    adminApi<AdminNotification[]>("/notifications")
      .then(setItems)
      .catch(() => undefined); // 알림은 부가 기능 — 실패해도 화면을 막지 않는다
  }, []);

  useEffect(() => {
    load();
    if (!supabase) return;
    const ch = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as {
            id: string; type: "inquiry" | "application"; title: string;
            link: string; created_at: string;
          };
          setItems((prev) =>
            prev.some((x) => x.id === n.id)
              ? prev
              : [
                  { id: n.id, type: n.type, title: n.title, link: n.link, createdAt: n.created_at, read: false },
                  ...prev,
                ],
          );
        },
      )
      .subscribe();
    return () => {
      void supabase?.removeChannel(ch);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markRead = (id?: string) => {
    // 화면 먼저 갱신하고 서버에 기록 (실패해도 다음 로드에서 동기화)
    setItems((list) => list.map((n) => (id ? (n.id === id ? { ...n, read: true } : n) : { ...n, read: true })));
    void adminApi("/notifications/read", { method: "POST", body: id ? { id } : { all: true } }).catch(
      () => undefined,
    );
  };

  return (
    <div className="adm-bell" ref={ref}>
      <button
        type="button"
        className="adm-iconbtn"
        onClick={() => setOpen((v) => !v)}
        aria-label={`알림 ${unread}건`}
        aria-expanded={open}
      >
        <IconBell />
        {unread > 0 && <span className="adm-bell__badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="adm-bell__panel">
          <div className="adm-bell__head">
            <b>알림</b>
            {unread > 0 && (
              <button type="button" onClick={() => markRead()}>
                모두 읽음
              </button>
            )}
          </div>
          <ul>
            {items.length === 0 && (
              <li className="adm-bell__empty">아직 알림이 없습니다</li>
            )}
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  to={n.link}
                  className={n.read ? "" : "is-unread"}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                  }}
                >
                  <span className={`adm-bell__type adm-bell__type--${n.type}`}>
                    {n.type === "inquiry" ? "문의" : "지원"}
                  </span>
                  <span className="adm-bell__title">{n.title}</span>
                  <span className="adm-bell__time">{timeAgo(n.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---- 아이콘 (16px stroke) ---- */
const p = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function IconGrid() {
  return (
    <svg {...p} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg {...p} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg {...p} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c.6-3.4 2.8-5 5.5-5s4.9 1.6 5.5 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 14.5c2.4.1 4.3 1.5 5 4.5" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg {...p} aria-hidden="true">
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </svg>
  );
}
function IconImage() {
  return (
    <svg {...p} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m4 18 5-5 3 3 4-4 4 4" />
    </svg>
  );
}
function IconTree() {
  return (
    <svg {...p} aria-hidden="true">
      <rect x="9" y="3" width="6" height="5" rx="1.2" />
      <rect x="3" y="16" width="6" height="5" rx="1.2" />
      <rect x="15" y="16" width="6" height="5" rx="1.2" />
      <path d="M12 8v4M6 16v-2h12v2" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg {...p} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg {...p} aria-hidden="true">
      <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9" />
      <path d="M10.2 20a2 2 0 0 0 3.6 0" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg {...p} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4 12H2M22 12h-2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg {...p} aria-hidden="true">
      <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg {...p} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  );
}
