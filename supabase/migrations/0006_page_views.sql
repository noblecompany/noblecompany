-- ============================================================
-- 0006 — 접속 통계 (일별·기간별·검색 포털별 유입)
-- 공개 페이지가 라우트 이동마다 POST /api/site 로 1행씩 기록한다.
-- 개인정보 없음: IP·UA 는 저장하지 않고 일 단위 익명 해시(visitor_hash)로만 남긴다.
-- ============================================================

create table if not exists page_views (
  id           bigint generated always as identity primary key,
  day          date not null,                    -- KST 기준 일자 (집계 키)
  path         text not null,
  ref_group    text not null default 'direct',   -- naver|google|daum|kakao|meta|youtube|bing|etc|direct|internal
  ref_host     text,                             -- 유입 원본 호스트 (분류 검증용)
  visitor_hash text not null,                    -- sha256(salt·ip·ua·day) 32자 — 날짜가 바뀌면 같은 사람도 새 해시
  created_at   timestamptz not null default now()
);

create index if not exists page_views_day_idx on page_views (day);
create index if not exists page_views_day_ref_idx on page_views (day, ref_group);

alter table page_views enable row level security;
-- 정책 없음 = 클라이언트 직접 조회·쓰기 전면 차단 (서버 서비스 롤로만 접근)

-- ---------- 집계 함수 (group by 는 PostgREST 로 못 하므로 RPC 로)

create or replace function stats_visits_daily(from_day date, to_day date)
returns table(day date, visitors bigint, pageviews bigint)
language sql stable as $$
  select day, count(distinct visitor_hash), count(*)
  from page_views
  where day between from_day and to_day
  group by day
  order by day;
$$;

create or replace function stats_visits_referrers(from_day date, to_day date)
returns table(ref_group text, visitors bigint, pageviews bigint)
language sql stable as $$
  select ref_group, count(distinct visitor_hash), count(*)
  from page_views
  where day between from_day and to_day
    and ref_group <> 'internal'   -- 사이트 내부 이동은 유입 통계에서 제외
  group by ref_group
  order by 2 desc;
$$;

-- anon/authenticated 는 함수도 직접 못 부른다 (어드민 API 의 서비스 롤 전용)
revoke execute on function stats_visits_daily(date, date) from anon, authenticated;
revoke execute on function stats_visits_referrers(date, date) from anon, authenticated;
