-- ============================================================
-- 0008 — 공지사항 (뉴스·수상·사회공헌 소식)
-- 어드민에서 등록·수정하고, 공개 페이지(/notice)에서 열람·이미지 다운로드.
-- 이미지는 Storage 'notices' 공개 버킷 (버킷은 seed 스크립트가 API 로 생성).
-- ============================================================

create table if not exists notices (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,            -- URL 슬러그 (예: 2025-12-31-donation)
  title        text not null,
  body         text not null,                   -- 본문 (줄바꿈 유지, 단락은 빈 줄)
  source_url   text,                            -- 출처 기사 링크
  source_name  text,                            -- 출처 매체명
  images       jsonb not null default '[]'::jsonb, -- [{path, name, size, width, height}]
  pinned       boolean not null default false,  -- 상단 고정
  status       text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz not null default now(), -- 게시일 (정렬 기준, 과거 날짜 입력 가능)
  view_count   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists notices_published_idx on notices (status, pinned desc, published_at desc);

alter table notices enable row level security;

-- 공개: 게시 상태만 익명 SELECT 허용 (쓰기는 서버 서비스 롤로만)
drop policy if exists "public read published notices" on notices;
create policy "public read published notices" on notices
  for select using (status = 'published');

-- 조회수 증가 (서버 전용)
create or replace function increment_notice_view(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update notices set view_count = view_count + 1 where id = p_id;
$$;
revoke execute on function increment_notice_view(uuid) from public, anon, authenticated;
