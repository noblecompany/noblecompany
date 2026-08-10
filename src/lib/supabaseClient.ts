import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 브라우저용 Supabase 클라이언트 — 공개(publishable) 키만 사용한다.
 * 어드민 로그인(Auth)과, 이후 공개 콘텐츠 조회에 쓴다.
 * 환경변수가 없으면 null — 로그인 화면이 설정 안내를 띄운다.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;
