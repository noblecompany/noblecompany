import nodemailer from "nodemailer";

/**
 * HIWORKS SMTP 발송 (F6) — smtps.hiworks.com:465 (SSL).
 * 환경변수 미설정이면 조용히 건너뛴다 (알림센터 INSERT 는 별도로 동작).
 *
 * SMTP_USER 는 인증 실계정, MAIL_FROM 은 표시 발신 주소.
 * noble@ 발신 별칭이 허용되면 MAIL_FROM=noble@e-noble.kr 로 두면 된다.
 *
 * 주의: 하이웍스는 계정 보안 설정에 따라 해외 IP 의 SMTP 로그인을 차단한다
 * ("[AUTH] Your IP is not allowed"). 함수 리전을 서울(icn1)로 두고,
 * 그래도 막히면 하이웍스 관리자에서 해당 계정의 해외 접속 차단을 해제해야 한다.
 */

export function mailConfigured(): boolean {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && MAIL_TO);
}

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  return nodemailer.createTransport({
    host: SMTP_HOST,                       // smtps.hiworks.com
    port: Number(SMTP_PORT ?? 465),
    secure: Number(SMTP_PORT ?? 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/** 범용 발송 — 실패는 그대로 throw (호출부가 정책을 정한다) */
export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  /** 표시 발신자 이름 — 기본 '노블컴퍼니 홈페이지' */
  fromName?: string;
}): Promise<void> {
  if (!mailConfigured()) throw new Error("SMTP 환경변수가 설정되지 않았습니다.");
  const { SMTP_USER, MAIL_FROM } = process.env;
  await transport().sendMail({
    from: `${opts.fromName ?? "노블컴퍼니 홈페이지"} <${MAIL_FROM ?? SMTP_USER}>`,
    to: opts.to,
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
  });
}

/** 팀 알림 (공용함 noble@ 로) — 환경변수 미설정이면 조용히 건너뛴다 */
export async function sendNotificationMail(opts: {
  subject: string;
  text: string;
  /** 팀 알림의 회신 버튼이 향할 곳 — 접수자(고객/지원자) 이메일 */
  replyTo?: string;
}): Promise<void> {
  if (!mailConfigured()) return;
  await sendMail({
    to: process.env.MAIL_TO as string,       // noble@e-noble.kr (공용함)
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo,
  });
}
