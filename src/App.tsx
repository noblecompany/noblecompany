import { Route, Routes } from "react-router-dom";
import ButterflyCta from "./components/ButterflyCta";
import Footer from "./components/Footer";
import Header from "./components/Header";
import About from "./pages/About";
import CareerDetail from "./pages/CareerDetail";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Solution from "./pages/Solution";
import Work from "./pages/Work";
import WorkDetail from "./pages/WorkDetail";

export default function App() {
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
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
      <ButterflyCta />
    </>
  );
}
