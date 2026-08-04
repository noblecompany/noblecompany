import { useState, type FormEvent } from "react";
import { ActionButton } from "seed-design/ui/action-button";
import { TextField, TextFieldInput } from "seed-design/ui/text-field";
import BrochureCta from "../components/BrochureCta";
import Reveal from "../components/Reveal";

/** 슬라이드 15·45~46 — 선택형 UI 중심의 문의 폼 */
const INQUIRY_TYPES = [
  "퍼포먼스 마케팅",
  "IMC 통합 마케팅",
  "브랜딩",
  "온드미디어",
  "콘텐츠 제작",
  "바이럴",
  "BTL",
  "기타",
];

const BUDGETS = ["500만 원 미만", "500~1,000만 원", "1,000~3,000만 원", "3,000만 원 이상", "미정"];

interface FormState {
  company: string;
  name: string;
  phone: string;
  email: string;
  types: string[];
  budget: string;
  period: string;
  message: string;
  agree: boolean;
}

const INITIAL: FormState = {
  company: "",
  name: "",
  phone: "",
  email: "",
  types: [],
  budget: "",
  period: "",
  message: "",
  agree: false,
};

export default function Contact() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleType = (type: string) =>
    set(
      "types",
      form.types.includes(type) ? form.types.filter((t) => t !== type) : [...form.types, type],
    );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.company || !form.name || !form.phone || !form.email) {
      setError("필수 정보(회사명, 이름, 연락처, 이메일)를 입력해 주세요.");
      return;
    }
    if (form.types.length === 0) {
      setError("문의 종류를 1개 이상 선택해 주세요.");
      return;
    }
    if (!form.agree) {
      setError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

    // 문의 접수 백엔드 연동 전까지 메일 클라이언트로 전달합니다.
    const body = [
      `회사명: ${form.company}`,
      `담당자: ${form.name}`,
      `연락처: ${form.phone}`,
      `이메일: ${form.email}`,
      `문의 종류: ${form.types.join(", ")}`,
      `예산: ${form.budget || "미입력"}`,
      `기간: ${form.period || "미입력"}`,
      "",
      form.message,
    ].join("\n");
    window.location.href = `mailto:noble@e-noble.kr?subject=${encodeURIComponent(
      `[프로젝트 문의] ${form.company}`,
    )}&body=${encodeURIComponent(body)}`;

    setDone(true);
  };

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 40 }}>
        <div className="container">
          <Reveal>
            <h1 className="page-hero__title">CONTACT</h1>
            <p className="page-hero__sub">
              노블컴퍼니와 함께 <span className="accent">가능성</span>을 성장으로 실현하세요
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container contact-layout">
          <Reveal>
            <div className="contact-info">
              <h2>
                무엇이든
                <br />
                물어보세요.
              </h2>
              <p>
                아직 구체적인 계획이 없어도 괜찮습니다. 문의 유형만 선택해 주시면, 담당 AE가
                브랜드 상황에 맞는 방향을 제안해 드립니다.
              </p>
              <dl>
                <div>
                  <dt>광고문의</dt>
                  <dd>02-474-1941 · noble@e-noble.kr</dd>
                </div>
                <div>
                  <dt>제휴문의</dt>
                  <dd>02-2088-7062 · kbn@e-noble.kr</dd>
                </div>
                <div>
                  <dt>채용문의</dt>
                  <dd>02-2088-7047 · hrm@e-noble.kr</dd>
                </div>
                <div>
                  <dt>ADDRESS</dt>
                  <dd>서울 강동구 성내로 48 (성내동, 씨네월드) 6층</dd>
                </div>
              </dl>

              {/* 문의 전에 회사 정보를 먼저 확인하려는 방문자용 */}
              <BrochureCta variant="button" className="contact-info__brochure" />
            </div>
          </Reveal>

          <Reveal>
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <TextField
                  label="회사명"
                  required
                  showRequiredIndicator
                  value={form.company}
                  onValueChange={(d) => set("company", d.value)}
                >
                  <TextFieldInput placeholder="회사명을 입력해 주세요" />
                </TextField>
                <TextField
                  label="이름"
                  required
                  showRequiredIndicator
                  value={form.name}
                  onValueChange={(d) => set("name", d.value)}
                >
                  <TextFieldInput placeholder="담당자 이름을 입력해 주세요" />
                </TextField>
              </div>
              <div className="form-row">
                <TextField
                  label="연락처"
                  required
                  showRequiredIndicator
                  value={form.phone}
                  onValueChange={(d) => set("phone", d.value)}
                >
                  <TextFieldInput type="tel" placeholder="숫자만 입력해 주세요" />
                </TextField>
                <TextField
                  label="이메일"
                  required
                  showRequiredIndicator
                  value={form.email}
                  onValueChange={(d) => set("email", d.value)}
                >
                  <TextFieldInput type="email" placeholder="이메일을 입력해 주세요" />
                </TextField>
              </div>

              <div>
                <span className="field-label">
                  문의 종류 <span className="req">*</span>{" "}
                  <small style={{ fontWeight: 500, color: "var(--light-text-dim)" }}>
                    (다중 선택 가능)
                  </small>
                </span>
                <div className="chip-group">
                  {INQUIRY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`chip ${form.types.includes(type) ? "is-selected" : ""}`}
                      aria-pressed={form.types.includes(type)}
                      onClick={() => toggleType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="field-label">월 예산</span>
                <div className="chip-group">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={`chip ${form.budget === b ? "is-selected" : ""}`}
                      aria-pressed={form.budget === b}
                      onClick={() => set("budget", form.budget === b ? "" : b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="period">
                  진행 기간
                </label>
                <input
                  id="period"
                  className="text-input"
                  placeholder="예) 3개월, 6개월, 연간"
                  value={form.period}
                  onChange={(e) => set("period", e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="message">
                  문의 내용
                </label>
                <textarea
                  id="message"
                  className="textarea-input"
                  placeholder="프로젝트 상황, 목표, 고민을 자유롭게 적어주세요."
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                />
              </div>

              <label className="agree-row">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => set("agree", e.target.checked)}
                />
                <span>
                  [필수] 개인정보 수집·이용에 동의합니다. 수집된 정보는 문의 응대 목적으로만
                  사용됩니다.
                </span>
              </label>

              {error && (
                <p style={{ color: "#d64545", fontWeight: 700, margin: 0, fontSize: 14 }}>
                  {error}
                </p>
              )}
              {done && (
                <div className="form-done">
                  문의가 준비되었습니다. 메일 앱에서 전송을 완료해 주세요. 영업일 기준 1일 이내
                  회신드리겠습니다.
                </div>
              )}

              <ActionButton size="large" type="submit">
                프로젝트 문의 등록
              </ActionButton>
            </form>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
