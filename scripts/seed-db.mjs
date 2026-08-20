/**
 * 하드코딩 데이터(src/data/*)를 실제 Supabase DB 에 넣는다 (Phase 2 데이터 이관).
 * 사이트 화면과 어드민 관리 데이터가 처음부터 똑같이 보이게 하는 것이 목적.
 *
 * 실행: node scripts/seed-db.mjs   (.env 의 SUPABASE_URL / SERVICE_ROLE_KEY 사용)
 *
 * 멱등 규칙 — 어드민에서 수정한 내용을 덮어쓰지 않는다:
 *   · 공고·포트폴리오·클라이언트: 없는 행만 INSERT (있으면 건드리지 않음)
 *   · 연혁·조직·소개서: 테이블이 비어 있을 때만 INSERT
 *   · 버킷·기능 토글: 없으면 생성
 */
import { createClient } from "@supabase/supabase-js";
import { build } from "esbuild";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// ---------- .env 로드 (의존성 없이)
const env = {};
for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env 에 없습니다.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

// ---------- TS 데이터 파일 로드
async function loadTs(entry) {
  const out = join(mkdtempSync(join(tmpdir(), "noble-seed-")), "mod.mjs");
  await build({ entryPoints: [entry], bundle: true, format: "esm", outfile: out, platform: "neutral" });
  return import(pathToFileURL(out).href);
}

const careers = await loadTs("src/data/careers.ts");
const worksMod = await loadTs("src/data/works.ts");
const company = await loadTs("src/data/company.ts");
const clientsMod = await loadTs("src/data/clients.ts");

const fail = (step, error) => {
  console.error(`✗ ${step} 실패:`, error.message ?? error);
  process.exitCode = 1;
};

// ---------- 1) 채용공고 — 없는 행만
{
  const rows = careers.jobPostings.map((j, i) => ({
    id: j.id,
    title: j.title,
    job_group: j.group,
    team: j.team,
    employment: j.employment,
    career: j.career,
    location: j.location,
    deadline: j.deadline,
    summary: j.summary,
    responsibilities: j.responsibilities,
    requirements: j.requirements,
    preferred: j.preferred,
    status: "published",
    sort_order: i,
  }));
  const { error } = await db.from("job_postings").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) fail("채용공고", error);
  else console.log(`✓ 채용공고 ${rows.length}건 (기존 행은 유지)`);
}

// ---------- 2) 포트폴리오 — 없는 행만
{
  const rows = worksMod.works.map((w) => ({
    id: w.id,
    client: w.client,
    category: w.category,
    industry: w.industry,
    team: w.team,
    media_type: w.mediaType,
    objective: w.objective,
    strategy: w.strategy,
    media: w.media,
    result: w.result,
    thumb_path: w.thumb,
    hero_path: w.hero,
    rank: w.rank,
    status: "published",
  }));
  const { error } = await db.from("works").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) fail("포트폴리오", error);
  else console.log(`✓ 포트폴리오 ${rows.length}건 (기존 행은 유지)`);
}

// ---------- 3) 연혁 — 비어 있을 때만
{
  const { count, error: cntErr } = await db
    .from("history_entries")
    .select("id", { count: "exact", head: true });
  if (cntErr) fail("연혁 조회", cntErr);
  else if ((count ?? 0) > 0) console.log(`- 연혁: 이미 ${count}행 있음 (건너뜀)`);
  else {
    let sort = 0;
    const rows = [];
    for (const period of company.history) {
      for (const g of period.groups) {
        for (const item of g.items) {
          rows.push({
            range_label: period.range,
            year: g.year,
            group_label: g.label ?? null,
            body: item,
            sort_order: sort++,
          });
        }
      }
    }
    const { error } = await db.from("history_entries").insert(rows);
    if (error) fail("연혁", error);
    else console.log(`✓ 연혁 ${rows.length}행`);
  }
}

// ---------- 4) 조직도 — 비어 있을 때만
{
  const { count, error: cntErr } = await db
    .from("org_divisions")
    .select("id", { count: "exact", head: true });
  if (cntErr) fail("조직도 조회", cntErr);
  else if ((count ?? 0) > 0) console.log(`- 조직도: 이미 본부 ${count}개 있음 (건너뜀)`);
  else {
    for (const [di, d] of company.orgChart.entries()) {
      const { data: div, error } = await db
        .from("org_divisions")
        .insert({ name: d.division, sort_order: di })
        .select("id")
        .single();
      if (error) {
        fail(`조직도(${d.division})`, error);
        break;
      }
      const { error: e2 } = await db
        .from("org_teams")
        .insert(d.teams.map((t, ti) => ({ division_id: div.id, name: t, sort_order: ti })));
      if (e2) {
        fail(`조직도 팀(${d.division})`, e2);
        break;
      }
    }
    if (!process.exitCode) console.log(`✓ 조직도 본부 ${company.orgChart.length}개`);
  }
}

// ---------- 5) 클라이언트 — 없는 이름만
{
  const rows = clientsMod.clients.map((name, i) => ({ name, visible: true, sort_order: i }));
  const { error } = await db.from("clients").upsert(rows, { onConflict: "name", ignoreDuplicates: true });
  if (error) fail("클라이언트", error);
  else console.log(`✓ 클라이언트 ${rows.length}개 (기존 행은 유지)`);
}

// ---------- 6) 회사소개서 — 비어 있을 때만 (public/ 정적 파일을 최초 버전으로)
{
  const { count, error: cntErr } = await db
    .from("brochures")
    .select("id", { count: "exact", head: true });
  if (cntErr) fail("소개서 조회", cntErr);
  else if ((count ?? 0) > 0) console.log(`- 회사소개서: 이미 ${count}건 있음 (건너뜀)`);
  else if (company.brochure.file) {
    let size = 0;
    try {
      size = statSync(join("public", company.brochure.file)).size;
    } catch {
      size = 0;
    }
    const { error } = await db.from("brochures").insert({
      version: company.brochure.updatedAt,
      file_path: company.brochure.file, // '/'로 시작 = public 정적 자산
      file_size: size,
      is_current: true,
    });
    if (error) fail("회사소개서", error);
    else console.log(`✓ 회사소개서 ${company.brochure.updatedAt}판 등록`);
  }
}

// ---------- 7) 기능 토글 기본값 — 없으면 생성
{
  const { error } = await db.from("site_settings").upsert(
    [
      { key: "feature.popup", value: false },
      { key: "feature.stats", value: false },
    ],
    { onConflict: "key", ignoreDuplicates: true },
  );
  if (error) fail("기능 토글", error);
  else console.log("✓ 기능 토글 기본값 확인");
}

// ---------- 8) Storage 버킷 — 없으면 생성 (0002 마이그레이션의 버킷 부분)
{
  const { data: buckets, error } = await db.storage.listBuckets();
  if (error) fail("버킷 조회", error);
  else {
    const have = new Set((buckets ?? []).map((b) => b.name));
    const want = [
      ["resumes", false],
      ["portfolio", true],
      ["brochures", true],
      ["site-assets", true],
    ];
    for (const [name, isPublic] of want) {
      if (have.has(name)) continue;
      const { error: e2 } = await db.storage.createBucket(name, { public: isPublic });
      if (e2) fail(`버킷(${name})`, e2);
      else console.log(`✓ 버킷 생성: ${name} (${isPublic ? "공개" : "비공개"})`);
    }
    console.log("✓ Storage 버킷 확인 완료");
  }
}

// ---------- 결과 요약
console.log("\n--- 현재 DB 상태 ---");
for (const t of ["job_postings", "works", "history_entries", "org_divisions", "org_teams", "clients", "brochures"]) {
  const { count } = await db.from(t).select("*", { count: "exact", head: true });
  console.log(`${t}: ${count ?? "?"}행`);
}
console.log(process.exitCode ? "\n일부 단계가 실패했습니다 — 위 오류를 확인하세요." : "\n시드 완료 ✓");
