-- ============================================================
-- 0003 — 하드코딩 데이터 이관 시드 (scripts/gen-seed.mjs 가 생성)
-- 각 테이블이 비어 있을 때만 INSERT 한다 (재실행 안전).
-- ============================================================

-- 채용공고 (src/data/careers.ts)
insert into job_postings (id, title, job_group, team, employment, career, location, deadline, summary, responsibilities, requirements, preferred, status, sort_order)
select 'ae-planner', '광고기획(AE) 경력', '기획', '기획1팀', '정규직', '경력 3년 이상', '서울 강동구 성내동 (본사)', null, '브랜드의 과제를 정의하고 IMC 캠페인 전략과 실행을 리드합니다.', array['광고주 커뮤니케이션 및 캠페인 전략 수립', '매체 믹스 설계와 예산 운영 계획 수립', '퍼포먼스·콘텐츠 파트와의 협업 및 일정 관리', '캠페인 성과 리포트 작성과 개선안 제안']::text[], array['대행사 AE 또는 인하우스 마케팅 3년 이상 경력', 'SA·DA 매체 구조에 대한 이해', '제안서·리포트 문서 작성 역량']::text[], array['병의원·교육·커머스 업종 캠페인 경험', 'GA4 등 웹 분석 도구 활용 경험']::text[], 'published', 0
where not exists (select 1 from job_postings where id = 'ae-planner');
insert into job_postings (id, title, job_group, team, employment, career, location, deadline, summary, responsibilities, requirements, preferred, status, sort_order)
select 'performance-marketer', '퍼포먼스 마케터 (SA/DA)', '퍼포먼스', '미디어팀', '정규직', '경력무관', '서울 강동구 성내동 (본사)', '2026-09-30', '네이버·구글·메타 매체를 운영하며 데이터로 CPA를 개선합니다.', array['검색·디스플레이 광고 세팅 및 일일 운영 최적화', '키워드·소재 성과 분석과 A/B 테스트 설계', '매체별 성과 리포트 작성']::text[], array['엑셀·스프레드시트를 활용한 데이터 정리 역량', '숫자를 근거로 판단하고 설명할 수 있는 분']::text[], array['네이버 검색광고·구글 애즈 운영 경험', '에이스카운터·스마트로그 등 분석 툴 사용 경험']::text[], 'published', 1
where not exists (select 1 from job_postings where id = 'performance-marketer');
insert into job_postings (id, title, job_group, team, employment, career, location, deadline, summary, responsibilities, requirements, preferred, status, sort_order)
select 'content-designer', '콘텐츠 디자이너', '콘텐츠', '크리에이티브팀', '정규직', '경력 2년 이상', '서울 강동구 성내동 (본사)', '2026-09-15', '광고 소재와 상세페이지로 브랜드 메시지를 완성합니다.', array['디스플레이 광고 소재 및 랜딩·상세페이지 디자인', '숏폼·영상 콘텐츠 편집 및 썸네일 제작', '브랜드 톤앤매너에 맞춘 비주얼 가이드 운영']::text[], array['포토샵·일러스트레이터 활용 능력', '포트폴리오 필수 제출 (PDF 또는 링크)']::text[], array['프리미어·애프터이펙트 활용 가능자', '퍼포먼스 소재 제작 경험']::text[], 'published', 2
where not exists (select 1 from job_postings where id = 'content-designer');
insert into job_postings (id, title, job_group, team, employment, career, location, deadline, summary, responsibilities, requirements, preferred, status, sort_order)
select 'viral-manager', '바이럴·온드미디어 담당', '바이럴', '바이럴팀', '정규직', '신입', '서울 강동구 성내동 (본사)', null, '블로그·카페·SNS 채널에서 브랜드 대화를 만들고 관리합니다.', array['채널별 콘텐츠 기획 및 발행 운영', '인플루언서·체험단 섭외와 일정 관리', '노출·유입 지표 모니터링']::text[], array['국문 글쓰기에 자신 있는 분', '채널 운영에 대한 기본 이해']::text[], array['개인 블로그·SNS 운영 경험', '콘텐츠 촬영·편집 가능자']::text[], 'published', 3
where not exists (select 1 from job_postings where id = 'viral-manager');

-- 포트폴리오 (src/data/works.ts — 엑셀 자동 생성분)
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'aidiseonghyeongoegwa', '아이디성형외과', 'IMC', '병의원', '기획2팀', '검색, DA', '애널리틱스 기반 데이터 분석을 통한 CPA 안정화', '각 파트별 담당자를 배치해 주요(메인) 키워드 ~ 세부 키워드 (성별/지역/후기/비용 등) 외 시술명 혹은 시즌에 따라 검색량이 증가하는 키워드를 지속적으로 발굴해 키워드별 연결 페이지를 상이하게 운영하며, 성수기 시즌(11월~1월) 키워드 상위노출 선점 진행', '네이버, 카카오, 구글', null, '/portfolio/aidiseonghyeongoegwa-sm.webp', '/portfolio/aidiseonghyeongoegwa-lg.webp', 1, 'published'
where not exists (select 1 from works where id = 'aidiseonghyeongoegwa');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'edyuwil', '에듀윌', 'IMC', '교육', '기획1팀', '퍼포먼스마케팅', '에듀윌 과목별 가입자수 증대 및 매출상승을 위한 퍼포먼스마케팅', '40여개 과목별 맞춤 전략 및 시험일을 고려한 디테일한 예산 운영', 'SA, DA, VIRAL (네이버, 구글, META, KAKAO, GFA, 온드미디어)', null, '/portfolio/edyuwil-sm.webp', '/portfolio/edyuwil-lg.webp', 2, 'published'
where not exists (select 1 from works where id = 'edyuwil');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'keobeonat', '커버낫', 'IMC', '패션', '기획3팀', 'IMC', '온라인 퍼포먼스 매출 증대', '기존 운영하지 않았던 네이버 쇼핑검색 제안 및 진행으로 매출 볼륨 극대화 행사 진행 시 예산 공격적 투입으로 월 별 목표 매출 달성 시즌별 주력 상품인 반팔, 패딩, 백팩 등 시즌 전략 수립 및 진행으로 퍼포 먼스 효율 극대화 행사 진행 시 커뮤니티 침투를 통한 추가 매출 확보', '네이버 SA, DA / 구글 SA, DA / META / 바이럴 / 크리테오 / 모비온', null, '/portfolio/keobeonat-sm.webp', '/portfolio/keobeonat-lg.webp', 3, 'published'
where not exists (select 1 from works where id = 'keobeonat');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'naechureolbalranseu', '내추럴발란스', 'IMC', '반려동물', '기획3팀', 'IMC', '신규 고객 유입을 통한 매출 상승', '내추럴발란스 L.I 라인 강아지 사료의 신규 고객 유입을 위한 바이럴 마케팅 집행. 프로모션 기간에 맞춘 DA 및 SA 중심의 공격적인 퍼포먼스 광고를 집행. 기존 브랜드 무드와 2040 타겟을 고려한 콘텐츠 제작해 브랜딩 강화 및 전환율 상승', '네이버, META, 네이버 카페, 네이버 블로그, 인스타그램', null, '/portfolio/naechureolbalranseu-sm.webp', '/portfolio/naechureolbalranseu-lg.webp', 9, 'published'
where not exists (select 1 from works where id = 'naechureolbalranseu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'maipeurotin', '마이프로틴', 'IMC', '건강식품', '콘텐츠마케팅팀', '바이럴', '브랜드 인지도 확대 및 소비자 체험 기회 제공', '마이프로틴의 브랜드 경험을 강화하기 위해 오프라인 팝업 및 참여형 이벤트를 운영하여 소비자 접점을 확대하고 브랜드 인지도를 제고.', '오프라인 팝업', null, '/portfolio/maipeurotin-sm.webp', '/portfolio/maipeurotin-lg.webp', 10, 'published'
where not exists (select 1 from works where id = 'maipeurotin');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'gamseongkeopi', '감성커피', 'IMC', '창업', '기획1팀', 'SA, DA', '프랜차이즈 가맹 창업 희망 유저 발굴 및 가맹 문의 DB 수집 극대화', '네이버 검색광고를 통해 가맹점 개설 목적성이 명확한 고관여 창업 희망 유저들을 타겟팅하여 브랜드 신뢰도와 성공 사례를 노출하고 실질적인 가맹 상담 문의로의 유입을 유도 META를 활용하여 잠재적 창업 의향자에게 감성커피만의 차별화된 경쟁력과 창업 혜택을 담은 리드 광고 및 배너를 집행함으로써 상담 DB 수집률 최적화', '네이버, META', null, '/portfolio/gamseongkeopi-sm.webp', '/portfolio/gamseongkeopi-lg.webp', 11, 'published'
where not exists (select 1 from works where id = 'gamseongkeopi');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'tamnao', '탐나오', 'IMC', '여행사', '기획1팀', 'IMC', '제주도 관광상품 활성화를 위한 퍼포먼스 마케팅을 통해 상품 판매 증대', '관광 시즌에 맞춘 최대 효율 전략으로 상품 판매 증대. 다양한 자사 프로모션과 제주 관광 홍보 진행', '네이버, META, KAKAO, GFA, 온드미디어', null, '/portfolio/tamnao-sm.webp', '/portfolio/tamnao-lg.webp', 14, 'published'
where not exists (select 1 from works where id = 'tamnao');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'onnuriseutoeo', '온누리스토어', 'IMC', null, '기획1팀', 'IMC', '브랜드별 ROAS 상향', '건강기능식품, 생활용품 등 여러가지 브랜드를 취급 하는 종합스토어로 브랜드별 상황과 목표가 상이 / 브랜드 카테고리별 담당자 배치로 네이버 쇼핑에서의 입지를 높이기 위해 브랜드별 통합마케팅 운영', '네이버, KAKAO, GFA, GOOGLE', null, '/portfolio/onnuriseutoeo-sm.webp', '/portfolio/onnuriseutoeo-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'onnuriseutoeo');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'ineosia', '이너시아', 'IMC', null, '기획1팀', 'IMC', '자사몰 & 네이버 스토어 매출 증가', '매출 발생 키워드 분류 최대 클릭당비용 고려한 CPC 조절 ,CTR(T&D 최신화),', '네이버 SA, 네이버 GFA, META', null, '/portfolio/ineosia-sm.webp', '/portfolio/ineosia-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'ineosia');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'sonyeopon', '소녀폰', 'IMC', null, '기획1팀', 'IMC', '중고폰 매입 및 판매량 증대', '매입·판매 캠페인별 예산을 분리 배정하고 검색광고 구조를 재세팅하여 전환 유형별 CPA 개선 및 전반적인 광고 효율 최적화. 월별 이미지 소재 제안을 통해 지속적인 효율 소재 발굴 운영. 신규 스마트폰 출시 시즌에 맞춘 대규모 캠페인 기획 및 운영', '네이버, META, GFA, GOOGLE, 모비온', null, '/portfolio/sonyeopon-sm.webp', '/portfolio/sonyeopon-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'sonyeopon');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'raktibeu', '락티브', 'IMC', null, '기획2팀', 'IMC', '브랜딩 쿼리수 증대 및 구매 전환매출 볼륨 확대 목적', '매출볼륨 확보를 우선적으로 기존캠페인 외 신규그룹 셋팅으로 추가 유입/전환 유도 매주 경쟁사 및 자사 이슈사항 보고 개선사항 반영 신제품검색 키워드 매주 입찰 진행 신제품 키워드로 입점 및 매출확대', '네이버, GFA', null, '/portfolio/raktibeu-sm.webp', '/portfolio/raktibeu-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'raktibeu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'beseuteuhaim', '베스트하임', 'IMC', null, '기획3팀', 'IMC', 'ROAS 상승 및 매출액 증대', '시즌 상품 및 신제품 검색광고 상위 노출 진행 프로모션 기간에 맞춘 검색광고 최적화를 통해 매출 확보 및 ROAS 1,000% 이상 기록 영상 및 배너 광고를 함께 진행하며 브랜드 쿼리량 제고', '네이버, GFA, GOOGLE', null, '/portfolio/beseuteuhaim-sm.webp', '/portfolio/beseuteuhaim-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'beseuteuhaim');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'samseongjasanunyong', '삼성자산운용', 'SA', '금융', '기획1팀', '검색', '삼성자산운용 블로그 유입증대', '광고 목적과 타깃에 맞춘 콘텐츠 기획부터 키워드 분석, 소재 제작, 광고 운영 및 성과 최적화 전 과정을 관리하며 효율적인 캠페인을 운영. 사용자 검색 의도를 반영한 콘텐츠 구성과 지속적인 데이터 분석을 통해 광고 성과를 개선하고, 예산 효율을 높이는 운영을 진행.', '네이버SA', null, '/portfolio/samseongjasanunyong-sm.webp', '/portfolio/samseongjasanunyong-lg.webp', 1, 'published'
where not exists (select 1 from works where id = 'samseongjasanunyong');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'halriseu', '할리스', 'SA', '커피 프랜차이즈', '기획2팀', 'IMC', '공식몰 오픈 인지도 확대 및 구매 전환 ROAS 향상', 'SNS 채널 운영과 퍼포먼스 광고를 통해 공식몰 신규 고객 유입을 확대 및 브랜드검색으로 검색 수요 확보 META/Google PMAX를 통한 구매 전환과 카카오 CRM 기반 재구매 유도로 공식몰 매출 성장 지원', 'Instagram, 네이버 브랜드검색광고, META, Google PMAX, 카카오 CRM', null, '/portfolio/halriseu-sm.webp', '/portfolio/halriseu-lg.webp', 4, 'published'
where not exists (select 1 from works where id = 'halriseu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'onyueomakeu', '온유어마크', 'SA', '스포츠 리테일', '기획3팀', 'SA/DA', '온라인 퍼포먼스 매출 증대', '오프라인 판매 비중이 높은 상태에서 온라인 시장으로 확장 브랜드 인지도는 이미 알려져 있는 상태였기에 등록된 상품들을 최대한 노출 시키는것을 목표로 진행하였으며, 쇼핑검색광고&ADVoost를 통해 런닝 용품 판매를 시작', 'NAVER SA/DA', null, '/portfolio/onyueomakeu-sm.webp', '/portfolio/onyueomakeu-lg.webp', 5, 'published'
where not exists (select 1 from works where id = 'onyueomakeu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'dyuodeom', '듀오덤', 'SA', '의료용품', '기획1팀', '검색', '네이버 스마트 스토어 매출 상향', '고효율 발생 키워드 추출, 공격적인 지면 노출, 상호명 오픈마켓에 타겟 로스 최소화 시키기', '네이버 SA', null, '/portfolio/dyuodeom-sm.webp', '/portfolio/dyuodeom-lg.webp', 6, 'published'
where not exists (select 1 from works where id = 'dyuodeom');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'atoseipeu', '아토세이프', 'SA', '생활용품', '기획1팀', '검색, DA', '아토세이프의 세탁세제·섬유유연제·캡슐세제 등 생활케어 제품군 인지도를 확대하고, 실사용 기반의 기능성과 브랜드 이미지를 강화하여 구매 전환 및 재구매 유입을 확대합니다', '검색광고는 세제, 치약 관련 연관 키워드로, 실 구매 전환 의도가 높은 생활용품 키워드 중심으로 운영하여 직접 전환 효율을 확보합니다.', '네이버, GFA', null, '/portfolio/atoseipeu-sm.webp', '/portfolio/atoseipeu-lg.webp', 8, 'published'
where not exists (select 1 from works where id = 'atoseipeu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'geurinseutoeo', '그린스토어', 'SA', '건강기능식품', '기획1팀', '검색', '제품별 효율관리 및 ROAS 상승 목적', '건강기능식품 전문 브랜드 그린스토어의 대규모 제품 라인업을 대상으로 퍼포먼스 마케팅을 운영, 제품별 광고 효율을 극대화하기 위한 데이터 기반 최적화 전략을 수행하여, ROAS 이관 후 100%이상 증대', '네이버 SA', null, '/portfolio/geurinseutoeo-sm.webp', '/portfolio/geurinseutoeo-lg.webp', 9, 'published'
where not exists (select 1 from works where id = 'geurinseutoeo');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'belrop', '벨롭', 'SA', '라이프스타일', '기획1팀', '검색', '브랜드 매출 증대', '시즌별로 운동화, 아쿠아슈즈 등 주력 제품을 정해 효율적인 운영 / 다이어트 슬리퍼 제품의 경우 지속적으로 최상단 유지하면서 지속적인 매출 발생 / 지속적인 신제품 검색광고 적극 활용으로 브랜드 인지도 상승', '네이버', null, '/portfolio/belrop-sm.webp', '/portfolio/belrop-lg.webp', 10, 'published'
where not exists (select 1 from works where id = 'belrop');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'poseubaengkeu', '포스뱅크', 'SA', null, '기획1팀', '검색', '지속적인 퍼포먼스 마케팅으로 브랜드 인지도 상향', '브랜드검색광고와 파워링크 최적화 노출로 유입 증대. 해외 구글 검색광고 진행으로 글로벌 유입 진행', '네이버, GOOGLE', null, '/portfolio/poseubaengkeu-sm.webp', '/portfolio/poseubaengkeu-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'poseubaengkeu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'deotiniping', '더티니핑', 'SA', null, '기획1팀', '검색', '이벤트 홍보 및 브랜드 매출 증대', '브랜드와 캐릭터 인지도가 높아 이벤트에 맞춰 광고 소재 변경 및 프로모션 홍보, 어린이날과 크리스마스와 같은 시즌에 맞춰 추가적인 예산과 키워드 추가로 다양한 유입 유도', '네이버', null, '/portfolio/deotiniping-sm.webp', '/portfolio/deotiniping-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'deotiniping');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'ituseu247', '이투스247', 'SA', null, '기획1팀', '검색 / DA', '재수·반수·N수생 및 학부모를 대상으로 상담예약 및 학원 문의 전환을 확대하고, 시즌별 모집반 인지도와 등록 유입을 높이는 것.', '검색광고는 전환 의도가 높은 핵심 키워드 중심으로 운영하여 상담예약 기반의 퍼포먼스 효율을 극대화하였으며, 디스플레이 광고는 이투스247학원의 관리형 학습 경쟁력을 중심 메시지로 구성해 브랜드 차별성을 강화했습니다. 또한 모집 시즌별 프로그램에 맞춘 메시지 세분화로 타이밍별 유입 수요를 선제적으로 확보하였습니다.', '네이버. GOOGLE, GFA, META, 옥외', null, '/portfolio/ituseu247-sm.webp', '/portfolio/ituseu247-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'ituseu247');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'taigeomoning', '타이거모닝', 'SA', null, '기획1팀', '검색, DA', '자연 원료 기반의 브랜드 이미지를 강화하고, 타이거모닝의 제품군 인지도를 확대하여 구매 전환 및 재구매 유입 기반을 확보합니다', '검색광고는 구매 의도가 높은 키워드 중심으로 운영해 직접 전환 및 재구매 주기를 자극 및 디스플레이 광고는 자연 원료와 ‘모닝루틴 형성’ 메시지를 중심으로 브랜드 차별성을 강화 또한 각 제품별 USP를 분리 운영해 타깃 관심사별 유입 효율과 구매 전환율을 상향시킬 수 있도록 운영', '네이버. GFA', null, '/portfolio/taigeomoning-sm.webp', '/portfolio/taigeomoning-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'taigeomoning');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'taeansi', '태안시', 'SA', null, '기획1팀', '검색', '2026 태안국제원예치유박람회 인지도 제고와 검색 수요 기반 방문 유입 확대', '‘태안 방문의 해’를 중심으로 한 관광 활성화 정책에 맞춰, 2026 태안국제원예치유박람회의 온라인 유입 확대를 위한 광고 캠페인을 운영했습니다.', '네이버', null, '/portfolio/taeansi-sm.webp', '/portfolio/taeansi-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'taeansi');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'guktogyotongbu', '국토교통부', 'DA', '공공기관', '기획3팀', 'DA', '국토교통부 SNS 채널 팔로우 증대', '국토교통부에서 업로드된 콘텐츠로 각 콘텐츠별 특성을 반영하여 세밀한 관심사 타겟 광고 진행 후 성과가 좋았던 콘텐츠는 재 라이브 하여, 추가 팔로워 및 인게이지먼트 최대화', 'META, YOUTUBE', null, '/portfolio/guktogyotongbu-sm.webp', '/portfolio/guktogyotongbu-lg.webp', 1, 'published'
where not exists (select 1 from works where id = 'guktogyotongbu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'seupik', '스픽', 'DA', '교육', '기획1팀', 'SA, DA', '신규 유저 앱 설치 극대화 및 구독 결제 전환율 상승을 통한 ROAS 최적화', '네이버 검색광고 통해 다양한 핵심 키워드에 앱 혜택을 노출시켜 유입을 극대화하고, 브랜드검색을 활용하여 고관여 유저 대상 전환 유도형 소재 활용으로 최종 구독 결제 유도 네이버 보장형 디스플레이 광고 지면과 카카오톡, 카카오T 매체를 활용하여 대규모 임팩트 노출로 단기간 내 브랜드 인지도 제고 및 대세감 형성', '네이버,GFA, 카카오 모먼트, 카카오T,', null, '/portfolio/seupik-sm.webp', '/portfolio/seupik-lg.webp', 5, 'published'
where not exists (select 1 from works where id = 'seupik');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'wondeopeulreiseu', '원더플레이스', 'DA', '패션 편집숍', '기획2팀', 'DA', '원더플레이스 자사몰 내 신규고객 유입 및 전환 매출액 확보', '오프라인 메인 브랜드였으나 온라인 마케팅 본격 운영 다양한 브랜드 제품으로 진행 프로모션 간 바이럴 및 매체 예산 확대로 노출 및 전환 볼륨 확대 X, 인플루언서 협업 등으로 브랜딩 + 퍼포먼스 운영 병행', '네이버SA, GFA, META', null, '/portfolio/wondeopeulreiseu-sm.webp', '/portfolio/wondeopeulreiseu-lg.webp', 10, 'published'
where not exists (select 1 from works where id = 'wondeopeulreiseu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'ripton', '립톤', 'DA', '식음료', '기획1팀', 'SA, DA, 오프라인 이벤트', '다매체 믹스를 통한 타겟 접점 확대 및 립톤 아이스티 제품 판매량 극대화', '네이버 및 카카오의 주요 광고 지면을 활용하여 구매 목적성이 높은 고관여 유저에게 립톤 아이스티만의 구매 혜택을 직관적으로 노출하여 즉각적인 구매 유입 유도 타겟팅 알고리즘이 정교한 META와 GDN 네트워크를 병행 운영하여, 아이스티 수요가 높은 시즌성 잠재 고객을 발굴하고 지속적인 리타겟팅을 통해 최종 제품 판매 전환율을 극대화', '네이버, 카카오, GDN, META', null, '/portfolio/ripton-sm.webp', '/portfolio/ripton-lg.webp', 11, 'published'
where not exists (select 1 from works where id = 'ripton');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'dobeu', '도브', 'DA', '생활용품', '기획1팀', 'SA, DA', '네이버 지면을 활용하여 고관여 타겟 대상 혜택 전달 및 제품 구매 전환 유도', '네이버 광고 지면을 활용하여 브랜드 및 관련 키워드를 탐색하는 구매 고관여 타겟에게 현재 진행 중인 핵심 이벤트와 단독 프로모션 혜택을 직관적으로 노출 제품에 관심을 가진 유저들의 이탈을 방지하고 자연스러운 유입을 유도함으로써, 브랜드 인지도 제고와 동시에 실질적인 제품 구매 전환율 극대화에 기여', '네이버, META', null, '/portfolio/dobeu-sm.webp', '/portfolio/dobeu-lg.webp', 12, 'published'
where not exists (select 1 from works where id = 'dobeu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'hangukdijiteolyunghapjinheungwon', '한국디지털융합진흥원', 'DA', '공공·산업진흥', '기획2팀', 'DA', 'AI 시대 개발자 교육 수강생 모집 캠페인', 'HTML/CSS, Claude, 바이브 코딩 등 웹 풀 스택부터 AI교육 과정을 무료로 수강할 수 있는 프로그램 신청자를 모집하기 위한 DA 캠페인 운영, 취준생/이직자를 타겟으로 IT 및 소프트웨어에 관심있는 타겟에게 도달할 수 있도록 운영', '구글 GDN', null, '/portfolio/hangukdijiteolyunghapjinheungwon-sm.webp', '/portfolio/hangukdijiteolyunghapjinheungwon-lg.webp', 14, 'published'
where not exists (select 1 from works where id = 'hangukdijiteolyunghapjinheungwon');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'deotulraep', '더툴랩', 'DA', null, '기획2팀', 'DA', '매출증진 퍼포먼스 캠페인', '인플루언서 협업을 통한 브랜딩 소재 상시 운영으로 쿼리량 상승. 신제품 출시, 프로모션 등 일정에 따라 퍼포먼스 캠페인으로 성과 증진', 'GFA', null, '/portfolio/deotulraep-sm.webp', '/portfolio/deotulraep-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'deotulraep');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'pudeuen', '푸드엔', 'DA', null, '기획2팀', '검색 / DA', '매주 행사 진행으로 행사 식자재 상품 판매 증대 목적', '기획전, 시즌별 주력 식자재 중심으로 검색광고와 DA 소재를 운영하고, 구매 의도 키워드 및 업종, 관심사 타겟을 활용해 신규 고객 유입 확대. 행사 기간에는 고효율 상품 중심으로 예산과 입찰을 강화하고, 방문·장바구니 고객 리마케팅을 통해 재구매와 매출 증대.', '네이버, META, GOOGLE', null, '/portfolio/pudeuen-sm.webp', '/portfolio/pudeuen-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'pudeuen');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'hwanggeumgureongi', '황금구렁이', 'DA', null, '기획2팀', '검색 / META', '인플루언서 협업 진행으로 영상형 광고로 판매 증대', '차전자피·배변활동·식이섬유 등 구매 의도 키워드 중심으로 네이버 검색광고를 운영하고, 인플루언서 협업 영상은 메타 광고로 확산해 제품 신뢰도와 인지도를 강화. 숏츠 시청자, 사이트 방문자 대상 리마케팅과 후기, 혜택 소재를 병행해 구매 전환 및 판매 증대', '네이버, META', null, '/portfolio/hwanggeumgureongi-sm.webp', '/portfolio/hwanggeumgureongi-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'hwanggeumgureongi');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'yeongsanseupocheu', '영산스포츠', 'DA', null, '기획3팀', 'SA/DA', '온라인 퍼포먼스 매출 증대', '아디다스, 아식스, 뉴발란스 등 스포츠 의류브랜드 공식 판매업체로 자사몰 운영 초기부터 네이버 쇼핑검색광고와 피드 광고를 중심으로 광고를 구축하였으며, 다양한 상품을 광고에 노출해 성과 데이터를 축적 이를 기반으로 전환 효율이 우수한 상품을 지속적으로 발굴·확대 운영하여 광고 효율과 매출을 점진적으로 성장시킨 퍼포먼스 마케팅을 수행', 'NAVER SA/DA, 모비온', null, '/portfolio/yeongsanseupocheu-sm.webp', '/portfolio/yeongsanseupocheu-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'yeongsanseupocheu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'haetongryeong', '해통령', 'VIRAL', '식품', '콘텐츠마케팅팀', '바이럴', '브랜드 인지도 확대 및 제품 신뢰도 강화', '고양특례시의 주요 정책 및 시정 소식을 시민 친화적인 콘텐츠로 제작하여 정보 전달력과 시민 참여를 강화.', '인스타그램', null, '/portfolio/haetongryeong-sm.webp', '/portfolio/haetongryeong-lg.webp', 8, 'published'
where not exists (select 1 from works where id = 'haetongryeong');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'tudari', '투다리', 'VIRAL', '프랜차이즈', '콘텐츠마케팅팀', '바이럴', '브랜드 인지도 강화 및 고객 참여 확대', '투다리의 친근한 브랜드 이미지를 기반으로 시즌 메뉴 및 프로모션 콘텐츠를 기획·운영하여 고객 참여를 유도하고 브랜드 인지도를 강화.', '인스타그램', null, '/portfolio/tudari-sm.webp', '/portfolio/tudari-lg.webp', 9, 'published'
where not exists (select 1 from works where id = 'tudari');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'goyangteukryesicheong', '고양특례시청', 'VIRAL', '공공기관', '콘텐츠마케팅팀', '바이럴', '시민과의 소통 강화 및 시정 정보 확산', '고양특례시의 주요 정책 및 시정 소식을 시민 친화적인 콘텐츠로 제작하여 정보 전달력과 시민 참여를 강화.', '인스타그램', null, '/portfolio/goyangteukryesicheong-sm.webp', '/portfolio/goyangteukryesicheong-lg.webp', 12, 'published'
where not exists (select 1 from works where id = 'goyangteukryesicheong');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'samiheon', '사미헌', 'VIRAL', '식품/외식', '콘텐츠마케팅팀', '바이럴', '브랜드 인지도 확대 및 SNS 채널 활성화를 통한 고객 접점 강화', '사미헌의 프리미엄 브랜드 가치를 전달하는 콘텐츠를 기획·운영하고, META 광고를 통해 브랜드 인지도 및 고객 참여도를 강화.', '인스타그램', null, '/portfolio/samiheon-sm.webp', '/portfolio/samiheon-lg.webp', 14, 'published'
where not exists (select 1 from works where id = 'samiheon');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'pinikseudateu', '피닉스다트', 'VIRAL', null, '기획1팀', '검색 바이럴', '퍼포먼스 및 바이럴 마케팅을 통한 MS 1위 달성', '다트 업계 MS 1위 달성을 위하여 네이버 "다트" 관련 키워드 지면 상순위 노출. SNS 인플루언서를 통한 오프라인 "다트플렉스" 매장 방문 유도', '네이버SA, 네이버 인플루언서, SNS 인플루언서', null, '/portfolio/pinikseudateu-sm.webp', '/portfolio/pinikseudateu-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'pinikseudateu');
insert into works (id, client, category, industry, team, media_type, objective, strategy, media, result, thumb_path, hero_path, rank, status)
select 'hijeumedibyeongwon', '히즈메디병원', 'VIRAL', null, '기획2팀', '검색, 바이럴', '브랜드블로그 및 네이버검색광고를 통한 신규 환자 유치', '김포 지역 및 진료과별 세부 키워드를 발굴하여 검색 노출을 강화하고, 전문 의료정보 중심의 블로그 콘텐츠를 연계해 병원 신뢰도와 내원 전환을 확대', '네이버', null, '/portfolio/hijeumedibyeongwon-sm.webp', '/portfolio/hijeumedibyeongwon-lg.webp', null, 'published'
where not exists (select 1 from works where id = 'hijeumedibyeongwon');

-- 연혁 (src/data/company.ts history)
insert into history_entries (range_label, year, group_label, body, sort_order)
select * from (values
  ('2023 ~ 2025', '2025', null, '네이버 프리미어 파트너사 선정', 0),
  ('2023 ~ 2025', '2024', null, '네이버 우수파트너사 선정', 1),
  ('2023 ~ 2025', '2024', null, '강동구의회 의장상 수상', 2),
  ('2023 ~ 2025', '2024', null, '강소기업 선정', 3),
  ('2023 ~ 2025', '2024', null, '청년친화강소기업 선정', 4),
  ('2023 ~ 2025', '2024', null, '서울형강소기업 선정', 5),
  ('2023 ~ 2025', '2024', null, '지역사회 발전기여 강동구청장 표창장 수상', 6),
  ('2023 ~ 2025', '2023', null, '네이버 우수파트너사 선정', 7),
  ('2023 ~ 2025', '2023', null, '강소기업 선정', 8),
  ('2023 ~ 2025', '2023', null, '여성가족부 여성친화 일촌기업 협약', 9),
  ('2023 ~ 2025', '2023', null, '강동종합사회복지관 업무협약 체결(MOU)', 10),
  ('2023 ~ 2025', null, '광고 수주', '전남도청', 11),
  ('2023 ~ 2025', null, '광고 수주', '립톤', 12),
  ('2023 ~ 2025', null, '광고 수주', '중원주식회사 시크릿데이', 13),
  ('2023 ~ 2025', null, '광고 수주', '뉴에라', 14),
  ('2023 ~ 2025', null, '광고 수주', '교원', 15),
  ('2023 ~ 2025', null, '광고 수주', '한국산업인력공단', 16),
  ('2023 ~ 2025', null, '광고 수주', '교보문고', 17),
  ('2023 ~ 2025', null, '광고 수주', '그랜드 유니버셜 트레이딩 코리아 헬로', 18),
  ('2023 ~ 2025', null, '광고 수주', '한예지', 19),
  ('2023 ~ 2025', null, '광고 수주', '정식품', 20),
  ('2023 ~ 2025', null, '광고 수주', '에어부산', 21),
  ('2023 ~ 2025', null, '광고 수주', '델타항공', 22),
  ('2023 ~ 2025', null, '광고 수주', '(주)에듀윌', 23),
  ('2020 ~ 2022', '2022', null, '네이버 우수파트너사 선정', 24),
  ('2020 ~ 2022', null, '인증 · 협약', '네이버 공식대행사 선정', 25),
  ('2020 ~ 2022', null, '인증 · 협약', '네이버 GFA 공식대행사 선정', 26),
  ('2020 ~ 2022', null, '인증 · 협약', '맞춤광고 기획 및 제작 기술평가 우수기업 T-4', 27),
  ('2020 ~ 2022', null, '인증 · 협약', '여성가족부 가족친화기업 인증', 28),
  ('2020 ~ 2022', null, '인증 · 협약', '강동지역자활센터와 업무협약 체결(MOU)', 29),
  ('2020 ~ 2022', null, '광고 수주', '롯데칠성', 30),
  ('2020 ~ 2022', null, '광고 수주', '롯데백화점', 31),
  ('2020 ~ 2022', null, '광고 수주', 'LG베스트샵', 32),
  ('2020 ~ 2022', null, '광고 수주', '한국관광공사', 33),
  ('2020 ~ 2022', null, '광고 수주', 'KDB생명', 34),
  ('2020 ~ 2022', null, '광고 수주', '유한킴벌리', 35),
  ('2020 ~ 2022', null, '광고 수주', '틱톡', 36),
  ('2020 ~ 2022', null, '광고 수주', '에스더포뮬러', 37),
  ('2020 ~ 2022', null, '광고 수주', '현대로보틱스', 38),
  ('2017 ~ 2019', '2018', null, '여성가족부 여성친화 일촌기업 협약', 39),
  ('2017 ~ 2019', null, '인증 · 협약', 'KAKAO 공식대행사 선정', 40),
  ('2017 ~ 2019', null, '인증 · 협약', '강동지역자활센터 업무협약 체결(MOU)', 41),
  ('2017 ~ 2019', null, '인증 · 협약', '법률사무소 업무협약 체결(MOU)', 42),
  ('2017 ~ 2019', null, '광고 수주', '롯데쇼핑', 43),
  ('2017 ~ 2019', null, '광고 수주', '롯데ON', 44),
  ('2017 ~ 2019', null, '광고 수주', '롯데백화점', 45),
  ('2017 ~ 2019', null, '광고 수주', '유안타증권', 46),
  ('2017 ~ 2019', null, '광고 수주', '틱톡', 47),
  ('2017 ~ 2019', null, '광고 수주', '유한킴벌리', 48),
  ('2017 ~ 2019', null, '광고 수주', '코오롱스포츠', 49),
  ('2017 ~ 2019', null, '광고 수주', '블랙야크', 50),
  ('2017 ~ 2019', null, '광고 수주', 'MCM', 51),
  ('2017 ~ 2019', null, '광고 수주', '애경뷰티', 52),
  ('2017 ~ 2019', null, '광고 수주', '네스카페', 53),
  ('2017 ~ 2019', null, '광고 수주', '오텍 캐리어', 54),
  ('2014 ~ 2016', null, '인증', '벤처기업인증', 55),
  ('2014 ~ 2016', null, '인증', 'KIBO기술보증 기술인증', 56),
  ('2014 ~ 2016', null, '광고 수주', '풀무원', 57),
  ('2014 ~ 2016', null, '광고 수주', '대원미디어', 58),
  ('2014 ~ 2016', null, '광고 수주', '브리지스톤 골프', 59),
  ('2011 ~ 2013', null, '설립 · 선정', '㈜노블컴퍼니 법인설립', 60),
  ('2011 ~ 2013', null, '설립 · 선정', '네이버 공식 인증 대행사 선정', 61),
  ('2011 ~ 2013', null, '설립 · 선정', '네이버 파워셀러 수상', 62),
  ('2011 ~ 2013', null, '설립 · 선정', '제주도관광협회 온라인광고 강사지정', 63),
  ('2011 ~ 2013', null, '광고 수주', '제주도관광협회 탐나오', 64)
) v(range_label, year, group_label, body, sort_order)
where not exists (select 1 from history_entries);

-- 조직도 (src/data/company.ts orgChart)
insert into org_divisions (id, name, sort_order)
select 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid, '전략본부', 0
where not exists (select 1 from org_divisions);
insert into org_teams (division_id, name, sort_order)
select 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid, '기획 1팀', 0
where exists (select 1 from org_divisions od where od.id = 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid);
insert into org_teams (division_id, name, sort_order)
select 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid, '기획 2팀', 1
where exists (select 1 from org_divisions od where od.id = 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid);
insert into org_teams (division_id, name, sort_order)
select 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid, '기획 3팀', 2
where exists (select 1 from org_divisions od where od.id = 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid);
insert into org_teams (division_id, name, sort_order)
select 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid, '마케팅 1팀', 3
where exists (select 1 from org_divisions od where od.id = 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid);
insert into org_teams (division_id, name, sort_order)
select 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid, '마케팅 2팀', 4
where exists (select 1 from org_divisions od where od.id = 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = 'd0fe0012-512e-4838-bca1-ac861475a869'::uuid);
insert into org_divisions (id, name, sort_order)
select '12ee2071-6730-46ea-af89-981b30f5b607'::uuid, '콘텐츠본부', 1
where not exists (select 1 from org_divisions);
insert into org_teams (division_id, name, sort_order)
select '12ee2071-6730-46ea-af89-981b30f5b607'::uuid, '콘텐츠 마케팅팀', 0
where exists (select 1 from org_divisions od where od.id = '12ee2071-6730-46ea-af89-981b30f5b607'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = '12ee2071-6730-46ea-af89-981b30f5b607'::uuid);
insert into org_teams (division_id, name, sort_order)
select '12ee2071-6730-46ea-af89-981b30f5b607'::uuid, '디자인팀', 1
where exists (select 1 from org_divisions od where od.id = '12ee2071-6730-46ea-af89-981b30f5b607'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = '12ee2071-6730-46ea-af89-981b30f5b607'::uuid);
insert into org_teams (division_id, name, sort_order)
select '12ee2071-6730-46ea-af89-981b30f5b607'::uuid, '미디어 영상팀', 2
where exists (select 1 from org_divisions od where od.id = '12ee2071-6730-46ea-af89-981b30f5b607'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = '12ee2071-6730-46ea-af89-981b30f5b607'::uuid);
insert into org_divisions (id, name, sort_order)
select '9f755933-6569-42b7-b16b-96730a8754b6'::uuid, '운영본부', 2
where not exists (select 1 from org_divisions);
insert into org_teams (division_id, name, sort_order)
select '9f755933-6569-42b7-b16b-96730a8754b6'::uuid, '채널팀', 0
where exists (select 1 from org_divisions od where od.id = '9f755933-6569-42b7-b16b-96730a8754b6'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = '9f755933-6569-42b7-b16b-96730a8754b6'::uuid);
insert into org_teams (division_id, name, sort_order)
select '9f755933-6569-42b7-b16b-96730a8754b6'::uuid, '운영 지원팀', 1
where exists (select 1 from org_divisions od where od.id = '9f755933-6569-42b7-b16b-96730a8754b6'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = '9f755933-6569-42b7-b16b-96730a8754b6'::uuid);
insert into org_teams (division_id, name, sort_order)
select '9f755933-6569-42b7-b16b-96730a8754b6'::uuid, '인사팀', 2
where exists (select 1 from org_divisions od where od.id = '9f755933-6569-42b7-b16b-96730a8754b6'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = '9f755933-6569-42b7-b16b-96730a8754b6'::uuid);
insert into org_teams (division_id, name, sort_order)
select '9f755933-6569-42b7-b16b-96730a8754b6'::uuid, '회계팀', 3
where exists (select 1 from org_divisions od where od.id = '9f755933-6569-42b7-b16b-96730a8754b6'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = '9f755933-6569-42b7-b16b-96730a8754b6'::uuid);
insert into org_teams (division_id, name, sort_order)
select '9f755933-6569-42b7-b16b-96730a8754b6'::uuid, '개발팀', 4
where exists (select 1 from org_divisions od where od.id = '9f755933-6569-42b7-b16b-96730a8754b6'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = '9f755933-6569-42b7-b16b-96730a8754b6'::uuid);
insert into org_divisions (id, name, sort_order)
select '96a28ffe-cdec-43cc-952b-432c8f3aad7c'::uuid, '브랜드사업본부', 3
where not exists (select 1 from org_divisions);
insert into org_teams (division_id, name, sort_order)
select '96a28ffe-cdec-43cc-952b-432c8f3aad7c'::uuid, '커머스 사업부', 0
where exists (select 1 from org_divisions od where od.id = '96a28ffe-cdec-43cc-952b-432c8f3aad7c'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = '96a28ffe-cdec-43cc-952b-432c8f3aad7c'::uuid);
insert into org_teams (division_id, name, sort_order)
select '96a28ffe-cdec-43cc-952b-432c8f3aad7c'::uuid, '후원 사업부', 1
where exists (select 1 from org_divisions od where od.id = '96a28ffe-cdec-43cc-952b-432c8f3aad7c'::uuid)
  and not exists (select 1 from org_teams ot where ot.division_id = '96a28ffe-cdec-43cc-952b-432c8f3aad7c'::uuid);

-- 클라이언트 롤링 밴드 (src/data/clients.ts)
insert into clients (name, visible, sort_order) values ('스파이더', true, 0) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('에듀윌', true, 1) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('깨수깡', true, 2) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('탐나오', true, 3) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('핫식스', true, 4) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('이너시아', true, 5) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('틱톡', true, 6) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('스픽', true, 7) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('코오롱스포츠', true, 8) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('도브', true, 9) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('캐리어', true, 10) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('립톤', true, 11) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('교원웰스', true, 12) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('감성커피', true, 13) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('애경뷰티', true, 14) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('피닉스다트', true, 15) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('안국약품', true, 16) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('이투스247', true, 17) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('마일드랩', true, 18) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('타이거모닝', true, 19) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('헬로', true, 20) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('아토세이프', true, 21) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('뉴에라', true, 22) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('소녀폰', true, 23) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('삼진어묵', true, 24) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('락티브', true, 25) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('한일마페트', true, 26) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('아이디성형외과', true, 27) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('온누리스토어', true, 28) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('히즈메디병원', true, 29) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('클라우드환', true, 30) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('커버낫', true, 31) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('아토앤오투', true, 32) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('마이프로틴', true, 33) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('나무컨설팅', true, 34) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('내추럴발란스', true, 35) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('유안타증권', true, 36) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('베스트하임', true, 37) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('시크릿데이', true, 38) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('영산스포츠', true, 39) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('엔트로피메이크업', true, 40) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('하빗하키코리아', true, 41) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('콤비코리아', true, 42) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('피카고', true, 43) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('슈퍼너츠', true, 44) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('한화시스템', true, 45) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('더티니핑', true, 46) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('한예지', true, 47) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('듀오덤', true, 48) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('하우스텝', true, 49) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('하림네이처 델리', true, 50) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('웰킨두피탈모센터', true, 51) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('뚜레쥬르', true, 52) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('그린스토어', true, 53) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('삼성자산운용', true, 54) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('포스뱅크', true, 55) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('태안시', true, 56) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('여행하기 좋은 날', true, 57) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('하늘성형외과', true, 58) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('나비캣', true, 59) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('할리스', true, 60) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('법무법인북부', true, 61) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('푸드엔', true, 62) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('벨롭', true, 63) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('황금구렁이', true, 64) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('아너드', true, 65) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('온유어마크', true, 66) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('피씨디렉트', true, 67) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('초이스피부과', true, 68) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('형지엘리트', true, 69) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('이고진', true, 70) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('한국열린사이버대학교', true, 71) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('한국디지털융합진흥원', true, 72) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('에어부산', true, 73) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('더툴랩', true, 74) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('마인드브릿지', true, 75) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('원더플레이스', true, 76) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('한국관광공사', true, 77) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('꼬모니노즈', true, 78) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('블랙야크 키즈', true, 79) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('대방고시', true, 80) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('국토교통부', true, 81) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('유닉스', true, 82) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('더함가전', true, 83) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('아띠베뷰티', true, 84) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('하운드속초블루스테이', true, 85) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('비앙브리제', true, 86) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('대원샵', true, 87) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('로터스자동차코리아', true, 88) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('마이펫닥터', true, 89) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('롯데ON', true, 90) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('사미헌', true, 91) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('다나와자동차', true, 92) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('고양특례시청', true, 93) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('네스카페', true, 94) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('해통령', true, 95) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('MCM', true, 96) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('일룸', true, 97) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('발머스한의원', true, 98) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('한국금거래소', true, 99) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('투다리', true, 100) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('한국산업인력공단', true, 101) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('정식품', true, 102) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('함께하는 사랑밭', true, 103) on conflict (name) do nothing;
insert into clients (name, visible, sort_order) values ('루마썬팅', true, 104) on conflict (name) do nothing;

-- 회사소개서 — public/ 정적 파일을 최초 버전으로 등록 (file_path 가 '/'로 시작하면 정적 자산)
insert into brochures (version, file_path, file_size, is_current)
select '2026.06', '/brochure/noble-company-profile.pdf', 5302334, true
where not exists (select 1 from brochures);

