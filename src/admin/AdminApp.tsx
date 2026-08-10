import { useState, type FormEvent } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import Applications from "./pages/Applications";
import Dashboard from "./pages/Dashboard";
import Inquiries from "./pages/Inquiries";
import "./admin.css";

/**
 * 어드민 진입점.
 * 인증은 Supabase Auth(1-3) 연동 전까지 세션스토리지 기반 개발 모드로 동작한다.
 * — 실제 데이터가 없으므로 게이트는 화면 흐름 확인용이다.
 */
const DEV_SESSION_KEY = "noble-admin-dev";

export default function AdminApp() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(DEV_SESSION_KEY) === "1",
  );

  if (!authed) {
    return (
      <Login
        onLogin={() => {
          sessionStorage.setItem(DEV_SESSION_KEY, "1");
          setAuthed(true);
        }}
      />
    );
  }

  return (
    <AdminLayout
      onLogout={() => {
        sessionStorage.removeItem(DEV_SESSION_KEY);
        setAuthed(false);
      }}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inquiries" element={<Inquiries />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    // TODO(1-3): Supabase Auth signInWithPassword 로 교체
    onLogin();
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

        <button type="submit" className="adm-btn adm-btn--primary adm-login__submit">
          로그인
        </button>

        <p className="adm-login__dev">
          개발 모드 — 인증 연동(Supabase) 전까지 임의 입력으로 로그인됩니다
        </p>
      </form>
    </div>
  );
}
