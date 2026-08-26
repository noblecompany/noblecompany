-- 0009: 채용공고 외부 지원 링크 (사람인 · 잡코리아 · 원티드 등, 개수 제한 없음)
-- 공고마다 채용 플랫폼 공고 URL을 넣어두면 지원접수 화면에 "잡코리아로 지원하기" 같은 버튼이 노출된다.
-- 형식: [{"label": "잡코리아", "url": "https://..."}, {"label": "사람인", "url": "https://..."}]
alter table job_postings
  add column if not exists apply_links jsonb not null default '[]'::jsonb;
