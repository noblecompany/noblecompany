-- ============================================================
-- 0007 — 포트폴리오 카테고리에 '관공서' 추가
-- works.category 체크 제약을 재정의한다. (SQL Editor 에서 실행)
-- ============================================================
alter table works drop constraint if exists works_category_check;
alter table works add constraint works_category_check
  check (category in ('IMC','SA','DA','VIRAL','관공서'));
