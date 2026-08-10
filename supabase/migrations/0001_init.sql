-- ============================================================
-- 노블컴퍼니 홈페이지 — 초기 스키마 (docs/기능-어드민-설계.md §4)
-- Supabase 프로젝트 생성 후 SQL Editor 에서 실행하거나
-- `supabase db push` 로 적용한다.
-- ============================================================

-- ---------- 4.1 채용공고 (src/data/careers.ts JobPosting 과 1:1)
create table if not exists job_postings (
  id            text primary key,           -- URL 슬러그. 예: 'ae-planner'
  title         text not null,
  job_group     text not null,              -- 기획|퍼포먼스|콘텐츠|바이럴|경영지원
  team          text not null,
  employment    text not null,              -- 정규직|계약직|인턴
  career        text not null,
  location      text not null,
  deadline      date,                       -- null = 상시채용
  summary       text not null,
  responsibilities text[] not null default '{}',
  requirements     text[] not null default '{}',
  preferred        text[] not null default '{}',
  status        text not null default 'draft' check (status in ('draft','published','closed')),
  sort_order    int  not null default 0,
  view_count    int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- 4.2 채용 지원
create table if not exists job_applications (
  id            uuid primary key default gen_random_uuid(),
  posting_id    text references job_postings(id) on delete set null,
  posting_title text not null,              -- 공고 삭제 대비 스냅샷
  name          text not null,
  phone         text not null,
  email         text not null,
  career_years  text,
  message       text,
  resume_path   text,                       -- Storage 경로 (비공개 버킷)
  portfolio_url text,
  status        text not null default 'received'
    check (status in ('received','screening','interview','offer','rejected')),
  memo          text,
  privacy_agreed_at timestamptz not null,
  retention_until   date not null,          -- 접수일 + 1년 (F7)
  created_at    timestamptz not null default now()
);

-- ---------- 4.3 프로젝트 문의
create table if not exists inquiries (
  id          uuid primary key default gen_random_uuid(),
  company     text not null,
  name        text not null,
  phone       text not null,
  email       text not null,
  types       text[] not null default '{}',
  budget      text,
  period      text,
  message     text,
  source      text,                         -- utm_source 등
  status      text not null default 'new'
    check (status in ('new','contacted','proposal','won','lost')),
  assignee    text,
  memo        text,
  privacy_agreed_at timestamptz not null,
  retention_until   date not null,          -- 접수일 + 3년 (F7)
  created_at  timestamptz not null default now()
);

-- ---------- 4.4 포트폴리오 (Phase 2 에서 45건 이관)
create table if not exists works (
  id text primary key,
  client text not null,
  category text not null check (category in ('IMC','SA','DA','VIRAL')),
  industry text, team text, media_type text,
  objective text, strategy text, media text, result text,
  thumb_path text, hero_path text, rank int,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);

-- ---------- 4.5 회사소개서
create table if not exists brochures (
  id          uuid primary key default gen_random_uuid(),
  version     text not null,
  file_path   text not null,
  file_size   int  not null,
  is_current  boolean not null default false,
  view_count     int not null default 0,
  download_count int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- 4.6 어드민 사용자 (Supabase Auth 연동)
create table if not exists admin_users (
  id       uuid primary key references auth.users(id) on delete cascade,
  name     text not null,
  role     text not null default 'owner' check (role in ('owner','hr','sales','editor')),
  active   boolean not null default true,
  last_login_at timestamptz
);

-- ---------- 4.7 감사 로그 (F15)
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null check (action in ('view','export','update','delete')),
  target_table text, target_id text,
  ip text,
  created_at timestamptz not null default now()
);

-- ---------- 4.8 연혁 (F14)
create table if not exists history_entries (
  id          uuid primary key default gen_random_uuid(),
  range_label text not null,
  year        text,
  group_label text,
  body        text not null,
  sort_order  int not null default 0
);

-- ---------- 4.9 조직도 (F14)
create table if not exists org_divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0
);
create table if not exists org_teams (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references org_divisions(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

-- ---------- 4.10 클라이언트 목록 (F14)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_path text,
  visible boolean not null default true,
  sort_order int not null default 0
);

-- ---------- 4.11 팝업 배너 (C1)
create table if not exists popups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_path text,
  link_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- 4.12 사이트 설정 (F16 기능 토글)
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into site_settings (key, value) values
  ('feature.popup', 'false'::jsonb),
  ('feature.stats', 'false'::jsonb)
on conflict (key) do nothing;

-- ---------- 4.13 어드민 알림 (F6)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('inquiry','application')),
  title text not null,
  link text not null,
  created_at timestamptz not null default now()
);
create table if not exists notification_reads (
  notification_id uuid references notifications(id) on delete cascade,
  user_id uuid references admin_users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

-- ============================================================
-- RLS — 개인정보 테이블은 클라이언트 직접 조회 금지 (§4 정책 요약)
-- 어드민 조회는 전부 서버(서비스 롤 키)를 경유한다.
-- ============================================================

alter table job_postings      enable row level security;
alter table job_applications  enable row level security;
alter table inquiries         enable row level security;
alter table works             enable row level security;
alter table brochures         enable row level security;
alter table admin_users       enable row level security;
alter table audit_logs        enable row level security;
alter table history_entries   enable row level security;
alter table org_divisions     enable row level security;
alter table org_teams         enable row level security;
alter table clients           enable row level security;
alter table popups            enable row level security;
alter table site_settings     enable row level security;
alter table notifications     enable row level security;
alter table notification_reads enable row level security;

-- 공개 콘텐츠: 게시분만 익명 SELECT 허용
create policy "public read published postings" on job_postings
  for select using (status = 'published');
create policy "public read published works" on works
  for select using (status = 'published');
create policy "public read history" on history_entries for select using (true);
create policy "public read divisions" on org_divisions for select using (true);
create policy "public read teams" on org_teams for select using (true);
create policy "public read visible clients" on clients for select using (visible);
create policy "public read current brochure" on brochures for select using (is_current);
create policy "public read active popups" on popups
  for select using (active and now() between starts_at and ends_at);
create policy "public read settings" on site_settings for select using (true);

-- 접수: 익명 INSERT만 허용 (SELECT 정책이 없으므로 조회는 전면 차단)
create policy "anon insert inquiries" on inquiries for insert with check (true);
create policy "anon insert applications" on job_applications for insert with check (true);

-- 나머지 쓰기·개인정보 조회는 정책 없음 = 서비스 롤 키(서버)로만 가능

-- ---------- 이력서 비공개 버킷
insert into storage.buckets (id, name, public)
  values ('resumes', 'resumes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;
