import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AdminLayout from "./AdminLayout";
import Applications from "./pages/Applications";
import Dashboard from "./pages/Dashboard";
import Inquiries from "./pages/Inquiries";
import Jobs from "./pages/Jobs";
import Settings from "./pages/Settings";
import SiteContent from "./pages/SiteContent";
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

  return (
    <AdminLayout onLogout={() => void supabase?.auth.signOut()}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inquiries" element={<Inquiries />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/works" element={<Works />} />
        <Route path="/site" element={<SiteContent />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError("인증 설정이 없습니다. VITE_SUPABASE_* 환경변수를 확인해 주세요.");
      return;
    }
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      // 계정 없음/비번 오류를 구분해 알려주지 않는다 (계정 존재 여부 노출 방지)
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    // 성공 시 onAuthStateChange 가 세션을 갱신한다
  };

  return (
    <div className="adm-login">
      <form className="adm-login__card" onSubmit={submit}>
        <div className="adm-login__brand">
          noble<b>.</b>admin
        </div>
        <p className="adm-login__desc">노블컴퍼니 관리자 콘솔</p>

        <label className="adm-field">
          <span>이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@e-noble.kr"
            autoComplete="username"
          />
        </label>
        <label className="adm-field">
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        {error && <p className="adm-login__error">{error}</p>}

        <button
          type="submit"
          className="adm-btn adm-btn--primary adm-login__submit"
          disabled={busy}
        >
          {busy ? "확인 중…" : "로그인"}
        </button>

        <p className="adm-login__dev">
          계정 문의: 관리자(Supabase Authentication → Users 에서 발급)
        </p>
      </form>
    </div>
  );
}
