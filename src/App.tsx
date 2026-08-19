import { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import ButterflyCta from "./components/ButterflyCta";
import Footer from "./components/Footer";
import Header from "./components/Header";
import SitePopup from "./components/SitePopup";
import About from "./pages/About";
import CareerDetail from "./pages/CareerDetail";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import EmailPolicy from "./pages/EmailPolicy";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Solution from "./pages/Solution";
import Work from "./pages/Work";
import WorkDetail from "./pages/WorkDetail";

// 어드민은 방문자 번들에 섞이지 않게 지연 로드한다
const AdminApp = lazy(() => import("./admin/AdminApp"));

export default function App() {
  // 어드민 화면에는 공개 사이트의 헤더·푸터·나비 CTA를 얹지 않는다
  const isAdmin = useLocation().pathname.startsWith("/admin");

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
