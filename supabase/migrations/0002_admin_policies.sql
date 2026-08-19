-- ============================================================
-- 0002 — 어드민 화면 연동에 필요한 정책·함수·버킷
--  · 알림센터(F6): 어드민 로그인 사용자의 notifications 직접 구독(Realtime)
--  · 조회수 증가 RPC(공고·소개서) — 서버에서만 호출
--  · 소개서·사이트 자산 공개 버킷
-- ============================================================

-- ---------- 어드민 여부 판별 (RLS 안에서 재사용)
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid() and active
  );
$$;

-- ---------- admin_users: 본인 행 조회 (역할 표시용)
drop policy if exists "admin read self" on admin_users;
create policy "admin read self" on admin_users
  for select using (id = auth.uid());

-- ---------- notifications: 어드민만 조회 (개인정보 없음 — 제목·링크뿐)
drop policy if exists "admin read notifications" on notifications;
create policy "admin read notifications" on notifications
  for select using (is_admin());

-- ---------- notification_reads: 본인 읽음 기록만
drop policy if exists "admin read own reads" on notification_reads;
create policy "admin read own reads" on notification_reads
  for select using (user_id = auth.uid());
drop policy if exists "admin insert own reads" on notification_reads;
create policy "admin insert own reads" on notification_reads
  for insert with check (user_id = auth.uid() and is_admin());

-- ---------- Realtime — 신규 접수를 새로고침 없이 반영 (설계 §6.0)
do $$
begin
  alter publication supabase_realtime add table notifications;
exception when others then null; -- 이미 추가됐거나 publication 이 없으면 무시
end $$;

-- ---------- 조회수 증가 (서버 전용 — anon 실행 권한 없음)
create or replace function increment_job_view(p_id text) returns void
language sql security definer set search_path = public as $$
  update job_postings set view_count = view_count + 1 where id = p_id;
$$;
revoke execute on function increment_job_view(text) from public, anon, authenticated;

create or replace function increment_brochure(p_id uuid, p_action text) returns void
language sql security definer set search_path = public as $$
  update brochures set
    view_count     = view_count     + (p_action = 'view')::int,
    download_count = download_count + (p_action = 'download')::int
  where id = p_id;
$$;
revoke execute on function increment_brochure(uuid, text) from public, anon, authenticated;

-- ---------- 버킷: 회사소개서(공개)·사이트 자산(팝업 이미지·로고, 공개)
insert into storage.buckets (id, name, public) values ('brochures', 'brochures', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;
