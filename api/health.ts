/**
 * GET /api/health — 의존성 없는 최소 함수.
 * FUNCTION_INVOCATION_FAILED 원인 판별용: 이것까지 죽으면 런타임/빌드 설정 문제,
 * 살면 의존성(supabase-js 등) 로드 문제로 확정된다. 런타임 노드 버전도 노출한다.
 */
export default function handler(
  _req: unknown,
  res: { status: (c: number) => { json: (b: unknown) => void } },
) {
  // 운영 설정 '존재 여부'만 노출 (값은 절대 노출하지 않음) — 메일 미수신 등 원인 판별용
  const has = (k: string) => Boolean(process.env[k]);
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
