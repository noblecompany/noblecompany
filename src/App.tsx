import { Suspense, lazy, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import ButterflyCta from "./components/ButterflyCta";
import Footer from "./components/Footer";
import Header from "./components/Header";
import SitePopup from "./components/SitePopup";
import About from "./pages/About";
import CareerDetail from "./pages/CareerDetail";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Diagnosis from "./pages/Diagnosis";
import EmailPolicy from "./pages/EmailPolicy";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Solution from "./pages/Solution";
import Work from "./pages/Work";
import WorkDetail from "./pages/WorkDetail";

// 어드민은 방문자 번들에 섞이지 않게 지연 로드한다
const AdminApp = lazy(() => import("./admin/AdminApp"));

/** 접속 통계 수집 (C2) — 라우트 이동마다 1 페이지뷰. 어드민·dev·GH Pages 프리뷰 제외 */
function usePageTracking(pathname: string) {
  useEffect(() => {
    if (!import.meta.env.PROD || import.meta.env.BASE_URL !== "/") return;
    if (pathname.startsWith("/admin")) return;
    try {
      // 세션 첫 페이지뷰만 유입처(referrer)를 보낸다 — 이후 이동은 내부 집계
      const landing = !sessionStorage.getItem("nbl-visit");
      sessionStorage.setItem("nbl-visit", "1");
      const payload = JSON.stringify({
        path: pathname,
        ref: landing ? document.referrer : "",
        landing,
      });
      const blob = new Blob([payload], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/site", blob)) {
        void fetch("/api/site", { method: "POST", body: payload, keepalive: true }).catch(
          () => undefined,
        );
      }
    } catch {
      // 통계 수집 실패는 방문자에게 어떤 영향도 주지 않는다
    }
  }, [pathname]);
}

export default function App() {
  // 어드민 화면에는 공개 사이트의 헤더·푸터·나비 CTA를 얹지 않는다
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  usePageTracking(pathname);

  if (isAdmin) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work" element={<Work />} />
        <Route path="/work/:id" element={<WorkDetail />} />
        <Route path="/solution" element={<Solution />} />
        <Route path="/diagnosis" element={<Diagnosis />} />
        <Route path="/about" element={<About />} />
        {/* 소개/비전/연혁 탭을 경로로 둬 공유·뒤로가기가 동작하게 한다 */}
        <Route path="/about/:tab" element={<About />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/careers/:id" element={<CareerDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/email-policy" element={<EmailPolicy />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
      <ButterflyCta />
      <SitePopup />
    </>
  );
}
