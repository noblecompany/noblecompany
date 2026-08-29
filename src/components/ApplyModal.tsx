import { useEffect, useRef, useState, type FormEvent } from "react";
import { ActionButton } from "seed-design/ui/action-button";
import { TextField, TextFieldInput } from "seed-design/ui/text-field";
import { applyLinkBrand, type JobPosting } from "../data/careers";
import { ACE_CONVERSION, aceVirtualPage } from "../lib/acecounter";

/** 조사 '로/으로' — 받침 있으면 '으로'(ㄹ 받침 제외), 없거나 한글이 아니면 '로'. 예) 사람인으로 · 잡코리아로 · 원티드로 */
function josaRo(word: string): string {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "로";
  const jong = code % 28;
  return jong === 0 || jong === 8 ? "로" : "으로";
}

/** 이력서 허용 형식 — 서버(api/uploads-resume)와 동일하게 유지 */
const RESUME_ACCEPT = ".pdf,.doc,.docx,.hwp,.hwpx";
const RESUME_MAX_MB = 10;

interface FormState {
  name: string;
  phone: string;
  email: string;
  careerYears: string;
  portfolioUrl: string;
  message: string;
  agree: boolean;
}

const INITIAL: FormState = {
  name: "",
  phone: "",
  email: "",
  careerYears: "",
  portfolioUrl: "",
  message: "",
  agree: false,
};

/**
 * 채용 온라인 지원 모달 (F2, 1-7).
 * 이력서는 signed URL 로 Storage 에 직접 업로드한 뒤 경로만 접수 API 로 보낸다
 * — 서버리스 함수의 요청 크기 제한(4.5MB)을 우회 (설계 §3.2).
 */
export default function ApplyModal({ job, onClose }: { job: JobPosting; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [file, setFile] = useState<File | null>(null);
  const [website, setWebsite] = useState(""); // 허니팟 (F8)
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // 모달이 떠 있는 동안 배경 스크롤 잠금 + ESC 닫기
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const pickFile = (f: File | null) => {
    setError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > RESUME_MAX_MB * 1024 * 1024) {
      setError(`이력서는 ${RESUME_MAX_MB}MB 이하만 첨부할 수 있습니다.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(f);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.phone || !form.email) {
      setError("필수 정보(이름, 연락처, 이메일)를 입력해 주세요.");
      return;
    }
    if (!form.agree) {
      setError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

    setBusy(true);
    try {
      // 1) 이력서가 있으면 Storage 직접 업로드
      let resumePath: string | undefined;
      if (file) {
        const prep = await fetch("/api/uploads-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name }),
        });
        const prepBody = (await prep.json().catch(() => null)) as {
          ok?: boolean;
          data?: { path: string; signedUrl: string };
          error?: { message?: string };
        } | null;
        if (!prep.ok || !prepBody?.data) {
          setError(prepBody?.error?.message ?? "이력서 업로드 준비에 실패했습니다.");
          return;
        }
        const put = await fetch(prepBody.data.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!put.ok) {
          setError("이력서 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.");
          return;
        }
        resumePath = prepBody.data.path;
      }

      // 2) 지원 접수
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postingId: job.id,
          postingTitle: job.title,
          name: form.name,
          phone: form.phone,
          email: form.email,
          careerYears: form.careerYears || undefined,
          message: form.message || undefined,
          resumePath,
          portfolioUrl: form.portfolioUrl || undefined,
          agree: true,
          website,
        }),
      });

      if (res.status === 201) {
        setDone(true);
        aceVirtualPage(ACE_CONVERSION.apply); // 에이스카운터 전환(채용 지원)
        return;
      }
      if (res.status === 429) {
        setError("요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const body = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      setError(body?.error?.message ?? "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } catch {
      setError("접수 서버에 연결하지 못했습니다. 이메일로 지원해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="apply-modal" role="dialog" aria-modal="true" aria-label={`${job.title} 지원하기`}>
      <div className="apply-modal__scrim" onClick={onClose} />
      <div className="apply-modal__panel">
        <header className="apply-modal__head">
          <div>
            <p className="eyebrow">APPLY · {job.group}</p>
            <h2>{job.title}</h2>
            <p className="apply-modal__sub">
              {job.team} · {job.employment} · {job.career}
            </p>
          </div>
          <button type="button" className="apply-modal__close" onClick={onClose} aria-label="닫기">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        </header>

        {/* 외부 채용 플랫폼 — 어드민에서 등록한 링크만큼 버튼 노출 (지원자가 익숙한 곳으로 바로 이동) */}
        {!done && (job.applyLinks?.length ?? 0) > 0 && (
          <>
            <div className="apply-ext" aria-label="다른 채용 플랫폼으로 지원">
              {job.applyLinks!.map((l) => {
                const brand = applyLinkBrand(l.label);
                return (
                  <a
                    key={l.url}
                    className="apply-ext__btn"
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={brand ? { background: brand.bg, color: brand.fg } : undefined}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 4h6v6" />
                      <path d="M20 4L10 14" />
                      <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
                    </svg>
                    {l.label}
                    {josaRo(l.label)} 지원하기
                  </a>
                );
              })}
            </div>
            <div className="apply-ext__divider">또는 아래 양식으로 바로 지원</div>
          </>
        )}

        {done ? (
          <div className="apply-modal__done">
            <strong>지원이 접수되었습니다.</strong>
            <p>
              {form.name}님의 지원서를 확인한 뒤 영업일 기준 5일 이내에
              입력하신 연락처로 결과를 안내드리겠습니다.
            </p>
            <ActionButton size="large" onClick={onClose}>
              닫기
            </ActionButton>
          </div>
        ) : (
          <form className="contact-form apply-modal__form" onSubmit={submit} noValidate>
            <div className="form-row">
              <TextField
                label="이름"
                required
                showRequiredIndicator
                value={form.name}
                onValueChange={(d) => set("name", d.value)}
              >
                <TextFieldInput placeholder="이름을 입력해 주세요" />
              </TextField>
              <TextField
                label="연락처"
                required
                showRequiredIndicator
                value={form.phone}
                onValueChange={(d) => set("phone", d.value)}
              >
                <TextFieldInput type="tel" placeholder="숫자만 입력해 주세요" />
              </TextField>
            </div>
            <div className="form-row">
              <TextField
                label="이메일"
                required
                showRequiredIndicator
                value={form.email}
                onValueChange={(d) => set("email", d.value)}
              >
                <TextFieldInput type="email" placeholder="이메일을 입력해 주세요" />
              </TextField>
              <TextField
                label="경력"
                value={form.careerYears}
                onValueChange={(d) => set("careerYears", d.value)}
              >
                <TextFieldInput placeholder="예) 신입, 3년" />
              </TextField>
            </div>

            <div>
              <label className="field-label" htmlFor="apply-resume">
                이력서·경력기술서
              </label>
              <input
                id="apply-resume"
                ref={fileRef}
                className="apply-modal__file"
                type="file"
                accept={RESUME_ACCEPT}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              <p className="apply-modal__hint">
                PDF·DOC·HWP, {RESUME_MAX_MB}MB 이하. 포트폴리오는 아래에 링크로 첨부해 주세요.
              </p>
            </div>

            <div>
              <label className="field-label" htmlFor="apply-portfolio">
                포트폴리오 링크
              </label>
              <input
                id="apply-portfolio"
                className="text-input"
                type="url"
                placeholder="https:// 로 시작하는 링크"
                value={form.portfolioUrl}
                onChange={(e) => set("portfolioUrl", e.target.value)}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="apply-message">
                간단 자기소개
              </label>
              <textarea
                id="apply-message"
                className="textarea-input"
                placeholder="경험과 강점을 자유롭게 적어주세요."
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
                [필수] 개인정보 수집·이용에 동의합니다. 수집된 정보는 채용 전형 목적으로만
                사용되며 접수일로부터 1년 후 자동 파기됩니다.
              </span>
            </label>

            {error && (
              <p style={{ color: "#d64545", fontWeight: 700, margin: 0, fontSize: 14 }}>{error}</p>
            )}

            {/* 허니팟 — 화면·스크린리더 모두에서 숨김 */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
            />

            <ActionButton size="large" type="submit" loading={busy}>
              지원서 제출
            </ActionButton>
          </form>
        )}
      </div>
    </div>
  );
}
