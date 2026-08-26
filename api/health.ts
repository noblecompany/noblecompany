/**
 * GET /api/health — 의존성 없는 최소 함수.
 * FUNCTION_INVOCATION_FAILED 원인 판별용: 이것까지 죽으면 런타임/빌드 설정 문제,
 * 살면 의존성(supabase-js 등) 로드 문제로 확정된다. 런타임 노드 버전도 노출한다.
 */
export default async function handler(
  req: { query?: Record<string, string | string[] | undefined> },
  res: { status: (c: number) => { json: (b: unknown) => void } },
) {
  // 운영 설정 '존재 여부'만 노출 (값은 절대 노출하지 않음) — 메일 미수신 등 원인 판별용
  const has = (k: string) => Boolean(process.env[k]);

  // ?mailtest=<CRON_SECRET> — 운영 서버에서 SMTP 로그인·발송을 실제로 시도해 오류 원문을 돌려준다.
  // (하이웍스 해외 IP 차단 등, 로컬에서는 재현되지 않는 문제 판별용. 비밀키 없이는 동작하지 않음)
  const secret = process.env.CRON_SECRET;
  const mt = req.query?.mailtest;
  if (secret && typeof mt === "string" && mt === secret) {
    try {
      const { sendNotificationMail } = await import("./_lib/mail.js");
      const started = Date.now();
      await sendNotificationMail({
        subject: "[테스트] 운영 서버(Vercel) 발송 점검",
        text: `Vercel 함수에서 직접 발송한 테스트 메일입니다. ${new Date().toISOString()}`,
      });
      return res.status(200).json({ ok: true, mailtest: "sent", ms: Date.now() - started });
    } catch (e) {
      const err = e as { message?: string; code?: string; response?: string; responseCode?: number };
      return res.status(200).json({
        ok: false,
        mailtest: "failed",
        error: { message: err.message, code: err.code, response: err.response, responseCode: err.responseCode },
      });
    }
  }

  res.status(200).json({
    ok: true,
    node: process.version,
    ts: Date.now(),
    config: {
      mail: has("SMTP_HOST") && has("SMTP_USER") && has("SMTP_PASS") && has("MAIL_TO"),
      mailFrom: has("MAIL_FROM"),
      supabase: has("SUPABASE_URL") && has("SUPABASE_SERVICE_ROLE_KEY"),
      adminEmails: has("ADMIN_EMAILS"),
      cronSecret: has("CRON_SECRET"),
      turnstile: has("TURNSTILE_SECRET_KEY"),
    },
  });
}
