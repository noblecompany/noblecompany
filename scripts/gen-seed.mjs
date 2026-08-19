/**
 * src/data/*.ts 하드코딩 데이터를 supabase/migrations/0003_seed.sql 로 변환한다.
 * (Phase 2 데이터 이관 — 공고 4건, 포트폴리오 45건, 연혁·조직·클라이언트, 소개서)
 *
 * 실행: node scripts/gen-seed.mjs
 * 생성된 SQL 은 각 테이블이 비어 있을 때만 INSERT 하므로 재실행해도 안전하다.
 */
import { build } from "esbuild";
import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

async function loadTs(entry) {
  const out = join(mkdtempSync(join(tmpdir(), "noble-seed-")), "mod.mjs");
  await build({ entryPoints: [entry], bundle: true, format: "esm", outfile: out, platform: "neutral" });
  return import(pathToFileURL(out).href);
}

const careers = await loadTs("src/data/careers.ts");
const worksMod = await loadTs("src/data/works.ts");
const company = await loadTs("src/data/company.ts");
const clientsMod = await loadTs("src/data/clients.ts");

const q = (v) => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};
const arr = (a) => `array[${a.map(q).join(", ")}]::text[]`;

const lines = [];
lines.push("-- ============================================================");
lines.push("-- 0003 — 하드코딩 데이터 이관 시드 (scripts/gen-seed.mjs 가 생성)");
lines.push("-- 각 테이블이 비어 있을 때만 INSERT 한다 (재실행 안전).");
lines.push("-- ============================================================");
lines.push("");

// ---------- 채용공고
lines.push("-- 채용공고 (src/data/careers.ts)");
careers.jobPostings.forEach((j, i) => {
  lines.push(
    `insert into job_postings (id, title, job_group, team, employment, career, location, deadline, summary, responsibilities, requirements, preferred, status, sort_order)` +
      `\nselect ${q(j.id)}, ${q(j.title)}, ${q(j.group)}, ${q(j.team)}, ${q(j.employment)}, ${q(j.career)}, ${q(j.location)}, ${q(j.deadline)}, ${q(j.summary)}, ${arr(j.responsibilities)}, ${arr(j.requirements)}, ${arr(j.preferred)}, 'published', ${i}` +
      `\nwhere not exists (select 1 from job_postings where id = ${q(j.id)});`,
  );
});
lines.push("");

// ---------- 포트폴리오
lines.push("-- 포트폴리오 (src/data/works.ts — 엑셀 자동 생성분)");
for (const w of worksMod.works) {
  lines.push(
    `insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)` +
      `\nselect ${q(w.id)}, ${q(w.client)}, ${q(w.category)}, ${q(w.industry)}, ${q(w.team)}, ${q(w.mediaType)}, ${q(w.objective)}, ${q(w.strategy)}, ${q(w.media)}, ${q(w.result)}, ${q(w.thumb)}, ${q(w.hero)}, ${w.rank ?? "null"}, 'published'` +
      `\nwhere not exists (select 1 from works where id = ${q(w.id)});`,
  );
}
lines.push("");

// ---------- 연혁 (중첩 구조 → 평탄화)
lines.push("-- 연혁 (src/data/company.ts history)");
let sort = 0;
const historyValues = [];
for (const period of company.history) {
  for (const g of period.groups) {
    for (const item of g.items) {
      historyValues.push(`(${q(period.range)}, ${q(g.year)}, ${q(g.label ?? null)}, ${q(item)}, ${sort++})`);
    }
  }
}
lines.push(
  `insert into history_entries (range_label, year, group_label, body, sort_order)` +
    `\nselect * from (values\n  ${historyValues.join(",\n  ")}\n) v(range_label, year, group_label, body, sort_order)` +
    `\nwhere not exists (select 1 from history_entries);`,
);
lines.push("");

// ---------- 조직도
lines.push("-- 조직도 (src/data/company.ts orgChart)");
company.orgChart.forEach((d, di) => {
  const id = `'${crypto.randomUUID()}'::uuid`;
  lines.push(
    `insert into org_divisions (id, name, sort_order)` +
      `\nselect ${id}, ${q(d.division)}, ${di}` +
      `\nwhere not exists (select 1 from org_divisions);`,
  );
  d.teams.forEach((t, ti) => {
    lines.push(
      `insert into org_teams (division_id, name, sort_order)` +
        `\nselect ${id}, ${q(t)}, ${ti}` +
        `\nwhere exists (select 1 from org_divisions od where od.id = ${id})` +
        `\n  and not exists (select 1 from org_teams ot where ot.division_id = ${id});`,
    );
  });
});
lines.push("");

// ---------- 클라이언트
lines.push("-- 클라이언트 롤링 밴드 (src/data/clients.ts)");
clientsMod.clients.forEach((name, i) => {
  lines.push(
    `insert into clients (name, visible, sort_order) values (${q(name)}, true, ${i}) on conflict (name) do nothing;`,
  );
});
lines.push("");

// ---------- 회사소개서 (정적 파일을 최초 버전으로 등록)
const b = company.brochure;
if (b.file) {
  let size = 0;
  try {
    size = statSync(join("public", b.file)).size;
  } catch {
    size = 0;
  }
  lines.push("-- 회사소개서 — public/ 정적 파일을 최초 버전으로 등록 (file_path 가 '/'로 시작하면 정적 자산)");
  lines.push(
    `insert into brochures (version, file_path, file_size, is_current)` +
      `\nselect ${q(b.updatedAt)}, ${q(b.file)}, ${size}, true` +
      `\nwhere not exists (select 1 from brochures);`,
  );
  lines.push("");
}

writeFileSync("supabase/migrations/0003_seed.sql", lines.join("\n") + "\n", "utf8");
console.log(`0003_seed.sql 생성 완료 — 공고 ${careers.jobPostings.length}건, 포트폴리오 ${worksMod.works.length}건, 연혁 ${historyValues.length}행, 클라이언트 ${clientsMod.clients.length}개`);
