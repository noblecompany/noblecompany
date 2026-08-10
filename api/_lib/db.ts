import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 Supabase 클라이언트 (서비스 롤).
 * RLS 를 우회하므로 절대 브라우저 번들에 포함시키지 않는다 — api/ 밖에서 import 금지.
 */
export function adminDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** YYYY-MM-DD (KST 기준) — 보관기간 만료일 계산용 */
export function retentionDate(years: number): string {
  const d = new Date(Date.now() + 9 * 3600 * 1000); // KST
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}
