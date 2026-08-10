import nodemailer from "nodemailer";

/**
 * HIWORKS SMTP 발송 (F6) — smtps.hiworks.com:465 (SSL).
 * 환경변수 미설정이면 조용히 건너뛴다 (알림센터 INSERT 는 별도로 동작).
 *
 * SMTP_USER 는 인증 실계정, MAIL_FROM 은 표시 발신 주소.
 * noble@ 발신 별칭이 허용되면 MAIL_FROM=noble@e-noble.kr 로 두면 된다.
 */
export async function sendNotificationMail(opts: {
  subject: string;
  text: string;
  /** 팀 알림의 회신 버튼이 향할 곳 — 접수자(고객/지원자) 이메일 */
  replyTo?: string;
}): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO) return;

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,                       // smtps.hiworks.com
    port: Number(SMTP_PORT ?? 465),
    secure: Number(SMTP_PORT ?? 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transport.sendMail({
    from: `노블컴퍼니 홈페이지 <${MAIL_FROM ?? SMTP_USER}>`,
    to: MAIL_TO,                           // noble@e-noble.kr (공용함)
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
  });
}
