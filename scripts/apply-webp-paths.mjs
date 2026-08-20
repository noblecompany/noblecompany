// 0005_webp_paths.sql 과 동일한 작업을 supabase-js 로 수행 (DDL 이 아니라서 가능)
// + 소개서 압축 후 file_size 실측치 반영
import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: rows, error } = await db
  .from("works")
  .select("id, thumb_path, hero_path")
  .or("thumb_path.like./portfolio/%.jpg,hero_path.like./portfolio/%.jpg");
if (error) throw error;

let n = 0;
for (const r of rows ?? []) {
  const patch = {};
  if (r.thumb_path?.startsWith("/portfolio/") && r.thumb_path.endsWith(".jpg"))
    patch.thumb_path = r.thumb_path.replace(/\.jpg$/, ".webp");
  if (r.hero_path?.startsWith("/portfolio/") && r.hero_path.endsWith(".jpg"))
    patch.hero_path = r.hero_path.replace(/\.jpg$/, ".webp");
  if (!Object.keys(patch).length) continue;
  const { error: e } = await db.from("works").update(patch).eq("id", r.id);
  if (e) throw e;
  n++;
}
console.log(`works 경로 갱신: ${n}행`);

// 소개서 file_size 실측치 반영 (정적 public 파일 항목만)
const size = statSync("public/brochure/noble-company-profile.pdf").size;
const { data: br, error: e2 } = await db
  .from("brochures")
  .update({ file_size: size })
  .like("file_path", "/brochure/%")
  .select("version");
if (e2) throw e2;
console.log(`brochures file_size=${size} 반영: ${(br ?? []).length}행`);
