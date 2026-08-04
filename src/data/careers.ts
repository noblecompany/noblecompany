/**
 * 채용공고 데이터 — 인사팀 확정 원고로 교체해야 하는 플레이스홀더입니다.
 * 어드민(공고 CRUD) 도입 전까지는 이 파일이 유일한 소스입니다.
 * 스키마는 docs/기능-어드민-설계.md 의 `job_postings` 테이블과 1:1로 맞췄습니다.
 */

/** 직군 — 필터 탭에 그대로 노출된다 */
export type JobGroup = "기획" | "퍼포먼스" | "콘텐츠" | "바이럴" | "경영지원";

export type Employment = "정규직" | "계약직" | "인턴";

export interface JobPosting {
  id: string;
  title: string;
  group: JobGroup;
  /** 소속 조직 */
  team: string;
  employment: Employment;
  /** 예) "신입", "경력 3년 이상", "경력무관" */
  career: string;
  location: string;
  /** ISO(YYYY-MM-DD) 마감일. null 이면 상시채용 */
  deadline: string | null;
  /** 목록 카드 한 줄 소개 */
  summary: string;
  responsibilities: string[];
  requirements: string[];
  preferred: string[];
}

export const jobGroups: { key: JobGroup; label: string; desc: string }[] = [
  { key: "기획", label: "기획(AE)", desc: "브랜드 과제를 읽고 캠페인 전략과 실행을 총괄합니다." },
  { key: "퍼포먼스", label: "퍼포먼스", desc: "SA·DA 매체를 운영하며 데이터로 성과를 만듭니다." },
  { key: "콘텐츠", label: "콘텐츠·디자인", desc: "메시지를 소재와 크리에이티브로 완성합니다." },
  { key: "바이럴", label: "바이럴", desc: "온드미디어와 커뮤니티에서 브랜드 대화를 설계합니다." },
  { key: "경영지원", label: "경영지원", desc: "구성원이 일에 집중할 수 있는 기반을 만듭니다." },
];

/** 채용 전형 절차 — 전 직군 공통 */
export const hiringProcess = [
  { step: "01", title: "서류 접수", desc: "이력서·포트폴리오를 메일로 접수합니다. 상시 검토합니다." },
  { step: "02", title: "서류 전형", desc: "접수 후 영업일 기준 5일 이내에 결과를 안내드립니다." },
  { step: "03", title: "실무 면접", desc: "지원 직무 리더와 실제 업무 사례를 중심으로 이야기합니다." },
  { step: "04", title: "최종 면접", desc: "경영진과 함께 방향과 성장 계획을 확인합니다." },
  { step: "05", title: "처우 협의·입사", desc: "경력과 역량에 맞춘 처우를 협의한 뒤 입사일을 확정합니다." },
];

/** 복리후생 — 확정 문구로 교체 필요 */
export const benefits = [
  { title: "성과 보상", desc: "캠페인 성과와 개인 기여도를 반영한 인센티브를 지급합니다." },
  { title: "성장 지원", desc: "매체사 교육·자격 취득·도서 구입을 회사가 지원합니다." },
  { title: "유연한 근무", desc: "출퇴근 시차 운영과 리프레시 휴가로 컨디션을 지킵니다." },
  { title: "장비 지원", desc: "직무에 맞는 노트북·모니터 등 업무 장비를 제공합니다." },
];

/** 지원서 접수 연락처는 company.ts 가 단일 출처 — 채용 화면 편의를 위해 다시 내보낸다 */
export { RECRUIT_EMAIL, RECRUIT_TEL } from "./company";

export const jobPostings: JobPosting[] = [
  {
    id: "ae-planner",
    title: "광고기획(AE) 경력",
    group: "기획",
    team: "기획1팀",
    employment: "정규직",
    career: "경력 3년 이상",
    location: "서울 강동구 성내동 (본사)",
    deadline: null,
    summary: "브랜드의 과제를 정의하고 IMC 캠페인 전략과 실행을 리드합니다.",
    responsibilities: [
      "광고주 커뮤니케이션 및 캠페인 전략 수립",
      "매체 믹스 설계와 예산 운영 계획 수립",
      "퍼포먼스·콘텐츠 파트와의 협업 및 일정 관리",
      "캠페인 성과 리포트 작성과 개선안 제안",
    ],
    requirements: [
      "대행사 AE 또는 인하우스 마케팅 3년 이상 경력",
      "SA·DA 매체 구조에 대한 이해",
      "제안서·리포트 문서 작성 역량",
    ],
    preferred: [
      "병의원·교육·커머스 업종 캠페인 경험",
      "GA4 등 웹 분석 도구 활용 경험",
    ],
  },
  {
    id: "performance-marketer",
    title: "퍼포먼스 마케터 (SA/DA)",
    group: "퍼포먼스",
    team: "미디어팀",
    employment: "정규직",
    career: "경력무관",
    location: "서울 강동구 성내동 (본사)",
    deadline: "2026-09-30",
    summary: "네이버·구글·메타 매체를 운영하며 데이터로 CPA를 개선합니다.",
    responsibilities: [
      "검색·디스플레이 광고 세팅 및 일일 운영 최적화",
      "키워드·소재 성과 분석과 A/B 테스트 설계",
      "매체별 성과 리포트 작성",
    ],
    requirements: [
      "엑셀·스프레드시트를 활용한 데이터 정리 역량",
      "숫자를 근거로 판단하고 설명할 수 있는 분",
    ],
    preferred: [
      "네이버 검색광고·구글 애즈 운영 경험",
      "에이스카운터·스마트로그 등 분석 툴 사용 경험",
    ],
  },
  {
    id: "content-designer",
    title: "콘텐츠 디자이너",
    group: "콘텐츠",
    team: "크리에이티브팀",
    employment: "정규직",
    career: "경력 2년 이상",
    location: "서울 강동구 성내동 (본사)",
    deadline: "2026-09-15",
    summary: "광고 소재와 상세페이지로 브랜드 메시지를 완성합니다.",
    responsibilities: [
      "디스플레이 광고 소재 및 랜딩·상세페이지 디자인",
      "숏폼·영상 콘텐츠 편집 및 썸네일 제작",
      "브랜드 톤앤매너에 맞춘 비주얼 가이드 운영",
    ],
    requirements: [
      "포토샵·일러스트레이터 활용 능력",
      "포트폴리오 필수 제출 (PDF 또는 링크)",
    ],
    preferred: ["프리미어·애프터이펙트 활용 가능자", "퍼포먼스 소재 제작 경험"],
  },
  {
    id: "viral-manager",
    title: "바이럴·온드미디어 담당",
    group: "바이럴",
    team: "바이럴팀",
    employment: "정규직",
    career: "신입",
    location: "서울 강동구 성내동 (본사)",
    deadline: null,
    summary: "블로그·카페·SNS 채널에서 브랜드 대화를 만들고 관리합니다.",
    responsibilities: [
      "채널별 콘텐츠 기획 및 발행 운영",
      "인플루언서·체험단 섭외와 일정 관리",
      "노출·유입 지표 모니터링",
    ],
    requirements: ["국문 글쓰기에 자신 있는 분", "채널 운영에 대한 기본 이해"],
    preferred: ["개인 블로그·SNS 운영 경험", "콘텐츠 촬영·편집 가능자"],
  },
];

/** 마감일이 지났는지 — 마감일 당일까지는 접수 가능으로 본다 */
export function isClosed(job: JobPosting, now: Date = new Date()): boolean {
  if (!job.deadline) return false;
  const end = new Date(`${job.deadline}T23:59:59`);
  return now.getTime() > end.getTime();
}

/** 목록·상세에 표시할 마감 라벨 */
export function deadlineLabel(job: JobPosting): string {
  if (!job.deadline) return "상시채용";
  if (isClosed(job)) return "마감";
  const [y, m, d] = job.deadline.split("-");
  return `~ ${y}.${m}.${d}`;
}
