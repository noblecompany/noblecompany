-- ============================================================
-- 0004 — 사이트 진단(AEO·GEO) 결과 저장
-- 방문자가 URL 을 넣으면 서버가 분석해 저장하고,
-- 방문자에겐 요약만, 어드민에겐 전체 리포트를 보여준다.
-- ============================================================

create table if not exists seo_audits (
  id           uuid primary key default gen_random_uuid(),
  url          text not null,              -- 입력한 URL
  final_url    text,                       -- 리다이렉트 후 최종 URL
  page_title   text,
  grade        text not null,              -- A+|A|B|C|D|F
  pass_count   int  not null default 0,
  warn_count   int  not null default 0,
  fail_count   int  not null default 0,
  categories   jsonb not null default '{}'::jsonb,  -- {collect:'pass'|'warn'|'fail', index:…, aeo:…, geo:…}
  checks       jsonb not null default '[]'::jsonb,  -- 전체 점검 항목 [{id,label,category,status,value,advice,evidence}]
  keywords     jsonb not null default '{}'::jsonb,  -- {words:[…], phrases:[…], totalTokens}
  meta         jsonb not null default '{}'::jsonb,  -- {sizeKb, timeMs, description, …}
  ip           text,
  created_at   timestamptz not null default now()
);

create index if not exists seo_audits_created_idx on seo_audits (created_at desc);

alter table seo_audits enable row level security;
-- 정책 없음 = 클라이언트 직접 조회·쓰기 전면 차단 (서버 서비스 롤로만 접근)
