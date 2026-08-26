import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AdminLayout from "./AdminLayout";
import Applications from "./pages/Applications";
import Audits from "./pages/Audits";
import Dashboard from "./pages/Dashboard";
import Inquiries from "./pages/Inquiries";
import Jobs from "./pages/Jobs";
import Notices from "./pages/Notices";
import Settings from "./pages/Settings";
import SiteContent from "./pages/SiteContent";
import Visits from "./pages/Visits";
import Works from "./pages/Works";
import "./admin.css";

/**
 * 어드민 진입점 — Supabase Auth 세션 기반 (1-3).
 * 계정 생성은 Supabase 대시보드 → Authentication → Users 에서만 한다
 * (공개 가입 없음 — 5인 소수 운영).
 */
export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 어드민 진입 시에만 PWA 매니페스트를 주입 — '홈 화면에 추가'하면
  // noble.admin 이름의 standalone 앱으로 설치된다 (공개 사이트에는 미적용).
  useEffect(() => {
    if (document.querySelector('link[rel="manifest"]')) return;
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/admin-manifest.webmanifest";
    document.head.appendChild(link);

    const meta = document.createElement("meta");
    meta.name = "apple-mobile-web-app-capable";
    meta.content = "yes";
    document.head.appendChild(meta);

    const title = document.createElement("meta");
    title.name = "apple-mobile-web-app-title";
    title.content = "noble.admin";
    document.head.appendChild(title);

    // 어드민(앱 모드)에서는 핀치/더블탭 줌을 막아 네이티브 앱처럼 — 입력창 포커스 시 자동 줌도 함께 차단
    // (공개 사이트는 그대로 두고, 어드민 진입 시에만 뷰포트를 바꾼다)
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const prevViewport = viewport?.content;
    if (viewport) {
      viewport.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
    }
    return () => {
      if (viewport && prevViewport) viewport.content = prevViewport;
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (!session) return <Login />;

  return <Authorized onLogout={() => void supabase?.auth.signOut()} />;
}

/**
 * 로그인 세션이 있어도 admin_users 에 등록된 계정만 콘솔을 연다.
 * (공개 회원가입으로 만든 계정 차단 — 서버 requireAdmin 과 같은 기준)
 */
function Authorized({ onLogout }: { onLogout: () => void }) {
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    import("./api")
      .then(({ adminApi }) => adminApi("/me"))
      .then(() => setState("ok"))
      .catch(() => setState("denied"));
  }, []);

  if (state === "checking") return null;

  if (state === "denied") {
    return (
      <div className="adm-login">
        <div className="adm-login__card">
          <div className="adm-login__brand">
            noble<b>.</b>admin
          </div>
          <p className="adm-login__desc">이 계정은 관리자 권한이 없습니다.</p>
          <p className="adm-login__dev">
            관리자 등록은 대표 계정(owner)이 Supabase 대시보드에서 진행합니다.
          </p>
          <button type="button" className="adm-btn adm-btn--primary adm-login__submit" onClick={onLogout}>
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout onLogout={() => void supabase?.auth.signOut()}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inquiries" element={<Inquiries />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/audits" element={<Audits />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/works" element={<Works />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/site" element={<SiteContent />} />
        <Route path="/visits" element={<Visits />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}

/** 시간대별 인사말 — 5시 전/22시 후 '편안한 밤이에요' */
function greetingByHour(h: number): string {
  if (h < 5) return "편안한 밤이에요";
  if (h < 12) return "좋은 아침이에요";
  if (h < 18) return "좋은 오후예요";
  if (h < 22) return "좋은 저녁이에요";
  return "편안한 밤이에요";
}

function todayLabel(d: Date): string {
  const wd = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${wd}요일`;
}

/**
 * 로그인 화면 — 흰 배경 + 그라데이션 탑바, 글자 단위로 통통 튀는 인사 카드(시간대별),
 * 오늘 날짜, 펄스 도트. 기능은 그대로 Supabase 이메일/비밀번호 로그인.
 */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const now = new Date();
  const greeting = greetingByHour(now.getHours());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError("인증 설정이 없습니다. VITE_SUPABASE_* 환경변수를 확인해 주세요.");
      return;
    }
    if (!email.trim()) {
      setError("이메일을 입력하세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력하세요.");
      return;
    }

    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      // 계정 없음/비번 오류를 구분해 알려주지 않는다 (계정 존재 여부 노출 방지)
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    // 성공 시 onAuthStateChange 가 세션을 갱신한다
  };

  return (
    <div className="nlg">
      <div className="nlg__topbar" />
      <div className="nlg__card">
        <div className="nlg__logo">
          <img src="/logo-noble.webp" alt="NOBLE COMPANY" />
        </div>

        <div className="nlg__hi">
          <p>브랜드의 성장을 데이터로 증명합니다,</p>
          <p className="nlg__hi-b">노블컴퍼니</p>
        </div>

        <div className="nlg__greet">
          <div className="nlg__shimmer" />
          <span className="nlg__spk" style={{ top: "12%", right: "22%", width: 5, height: 5, background: "#2e80e8", boxShadow: "0 0 4px #2e80e8" }} />
          <span className="nlg__spk" style={{ top: "62%", right: "17%", width: 4, height: 4, background: "#a78bfa", boxShadow: "0 0 4px #a78bfa", animationDelay: ".9s" }} />
          <span className="nlg__spk" style={{ top: "28%", right: "11%", width: 3, height: 3, background: "#67e8f9", boxShadow: "0 0 4px #67e8f9", animationDelay: "1.8s" }} />
          <div className="nlg__txt">
            <p className="nlg__g" aria-label={greeting}>
              {greeting.split("").map((ch, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  style={
                    ch === " "
                      ? undefined
                      : {
                          animation: `nlgCharJump ${(2 + (i % 5) * 0.2).toFixed(1)}s cubic-bezier(.36,.07,.19,.97) ${((i * 0.37) % 2).toFixed(1)}s infinite`,
                        }
                  }
                >
                  {ch}
                </span>
              ))}
            </p>
            <p className="nlg__date">{todayLabel(now)}</p>
          </div>
          <div className="nlg__dot">
            <span className="nlg__ring" />
            <span className="nlg__ring nlg__ring--d2" />
            <span className="nlg__core" />
          </div>
        </div>

        <div className="nlg__div">
          <span className="nlg__ln" />
          <span>Admin Console</span>
          <span className="nlg__ln" />
        </div>

        <form onSubmit={submit} autoComplete="off" noValidate>
          <input
            type="email"
            className="nlg__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="username"
            autoFocus
          />
          <input
            type="password"
            className="nlg__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoComplete="current-password"
            style={{ marginTop: 10 }}
          />
          <button type="submit" className="nlg__submit" disabled={busy}>
            {busy ? "확인 중…" : "로그인"}
          </button>
          <div className="nlg__err" role="alert">
            {error ?? ""}
          </div>
        </form>

        <p className="nlg__copy">© {now.getFullYear()} 노블컴퍼니 · NOBLE COMPANY</p>
      </div>
    </div>
  );
}
