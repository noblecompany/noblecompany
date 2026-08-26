/**
 * 공지사항/원문들.md + 이미지 → notices 테이블·Storage 'notices' 버킷 시드.
 * 실행: node scripts/seed-notices.mjs   (0008 마이그레이션 적용 후)
 * 멱등: 같은 slug 가 있으면 건너뛴다.
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

/** 원문 순서(최신→과거)와 1:1 — slug·이미지·출처 매체명 */
const META = [
  { slug: "2025-12-31-gangdong-selfsupport-donation", image: "강동지역자활센터 후원금 전달.jpg", source: "내외경제TV" },
  { slug: "2025-08-20-naver-premier-partner", image: "네이버 프리미어 파트너사 노블컴퍼니.JPEG", source: "데일리시큐" },
  { slug: "2025-01-14-seoul-hidden-champion", image: "서울형 강소기업 확인서.jpg", source: "데일리시큐" },
  { slug: "2025-01-07-gangdong-donation", image: "2024 강동구 기부금 후원.jpg", source: "시민일보" },
  { slug: "2024-12-26-gangdong-mayor-award", image: "20241219강동구청장 표창.jpg", source: "데일리시큐" },
  { slug: "2024-02-20-youth-friendly-company", image: "청년친화강소기업 로고.JPEG", source: "시민일보" },
  { slug: "2024-02-07-gangdong-selfsupport-donation", image: "강동자활후훤.jpg", source: "데일리시큐" },
  { slug: "2024-01-12-work-innovation", image: "근무혁신 우수기업3.jpg", source: "데일리시큐" },
  { slug: "2024-01-02-council-chairman-award", image: "의장상1.jpg", source: "기호일보" },
];

// ---------- 원문 파싱: '--' 또는 '---' 구분, 1행 제목 / 2행 일시 / 3행 작성자·조회 / 나머지 본문(+출처 URL)
const raw = readFileSync("공지사항/원문들.md", "utf8");
const blocks = raw.split(/\n\s*-{2,}\s*\n/).map((b) => b.trim()).filter(Boolean);
if (blocks.length !== META.length) {
  console.error(`원문 블록 ${blocks.length}개 ≠ META ${META.length}개 — 매핑을 확인하세요`);
  process.exit(1);
}

const posts = blocks.map((block, i) => {
  const lines = block.split("\n");
  const title = lines[0].trim();
  const date = lines[1].trim().match(/(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2})/);
  const viewMatch = lines[2].match(/조회\s+([\d,]+)/);
  let body = lines.slice(3).join("\n").trim();
  // 본문 끝의 URL / '출처 : …(URL)' 줄을 분리
  let sourceUrl = null;
  const urlLine = body.match(/(https?:\/\/[^\s)]+)/g);
  if (urlLine) sourceUrl = urlLine[urlLine.length - 1];
  body = body
    .split("\n")
    .filter((l) => !/^https?:\/\//.test(l.trim()) && !/^출처\s*:/.test(l.trim()))
    .join("\n")
    .trim();
  const publishedAt = date
    ? `${date[1]}-${date[2]}-${date[3]}T${date[4]}:${date[5]}:00+09:00`
    : new Date().toISOString();
  return {
    ...META[i],
    title,
    body,
    sourceUrl,
    publishedAt,
    viewCount: viewMatch ? Number(viewMatch[1].replace(/,/g, "")) : 0,
  };
});

// ---------- 업로드 + INSERT
for (const p of posts) {
  const { data: dup } = await db.from("notices").select("id").eq("slug", p.slug).maybeSingle();
  if (dup) {
    console.log(`- 건너뜀 (이미 존재): ${p.slug}`);
    continue;
  }
  const file = readFileSync(`공지사항/${p.image}`);
  const meta = await sharp(file).metadata();
  const ext = p.image.split(".").pop().toLowerCase().replace("jpeg", "jpg");
  const path = `${p.slug}/${p.slug}.${ext}`;
  const { error: upErr } = await db.storage.from("notices").upload(path, file, {
    contentType: ext === "png" ? "image/png" : "image/jpeg",
    upsert: true,
  });
  if (upErr) {
    console.error(`✗ 업로드 실패 ${p.image}:`, upErr.message);
    process.exitCode = 1;
    continue;
  }
  const { error } = await db.from("notices").insert({
    slug: p.slug,
    title: p.title,
    body: p.body,
    source_url: p.sourceUrl,
    source_name: p.source,
    images: [{ path, name: p.image, size: file.length, width: meta.width, height: meta.height }],
    pinned: false,
    status: "published",
    published_at: p.publishedAt,
    view_count: p.viewCount,
  });
  if (error) {
    console.error(`✗ INSERT 실패 ${p.slug}:`, error.message);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${p.publishedAt.slice(0, 10)} ${p.title}  (${p.image})`);
  }
}
console.log(process.exitCode ? "\n일부 실패" : "\n공지사항 시드 완료 ✓");
