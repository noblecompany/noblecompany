/**
 * public/ 에셋의 실제 URL을 만든다.
 *
 * GitHub Pages는 `/noble-preview/` 하위 경로로 서빙되므로 "/portfolio/a.jpg" 같은
 * 절대경로를 그대로 쓰면 404가 난다. 빌드 시 주입되는 BASE_URL을 앞에 붙인다.
 * (로컬 dev·preview 에서는 BASE_URL이 "/" 라 결과가 동일하다.)
 */
export function asset(path: string): string {
  // Supabase Storage 등 절대 URL은 그대로 쓴다 (어드민에서 업로드한 이미지)
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return base + (path.startsWith("/") ? path : `/${path}`);
}
