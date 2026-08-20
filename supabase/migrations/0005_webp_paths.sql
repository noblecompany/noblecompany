-- public/portfolio 정적 이미지를 WebP 로 전환하면서 DB 경로도 함께 갱신.
-- Storage 업로드분(절대 URL)은 건드리지 않는다 — '/portfolio/%.jpg' 정적 경로만 대상.

update works
set thumb_path = replace(thumb_path, '.jpg', '.webp')
where thumb_path like '/portfolio/%.jpg';

update works
set hero_path = replace(hero_path, '.jpg', '.webp')
where hero_path like '/portfolio/%.jpg';
