/**
 * 어드민 개발용 목데이터 — Supabase 연동(1-2·1-4) 전까지의 화면 데이터.
 * 스키마는 supabase/migrations/0001_init.sql 과 1:1 로 맞춰,
 * 연동 시 이 파일만 API 훅으로 교체하면 된다.
 * ※ 회사·인명은 전부 가상이다.
 */

export type InquiryStatus = "new" | "contacted" | "proposal" | "won" | "lost";
export type ApplicationStatus = "received" | "screening" | "interview" | "offer" | "rejected";

export interface Inquiry {
  id: string;
  company: string;
  name: string;
  phone: string;
  email: string;
  types: string[];
  budget: string | null;
  period: string | null;
  message: string | null;
  status: InquiryStatus;
  assignee: string | null;
  memo: string | null;
  createdAt: string; // ISO
  retentionUntil: string;
}

export interface Application {
  id: string;
  postingTitle: string;
  name: string;
  phone: string;
  email: string;
  careerYears: string | null;
  message: string | null;
  resumeName: string | null;
  portfolioUrl: string | null;
  status: ApplicationStatus;
  memo: string | null;
  createdAt: string;
  retentionUntil: string;
}

export interface AdminNotification {
  id: string;
  type: "inquiry" | "application";
  title: string;
  link: string;
  createdAt: string;
  read: boolean;
}

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "신규",
  contacted: "응대중",
  proposal: "제안",
  won: "수주",
  lost: "종료",
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  received: "접수",
  screening: "서류검토",
  interview: "면접",
  offer: "합격",
  rejected: "불합격",
};

export const APPLICATION_STEPS: ApplicationStatus[] = [
  "received",
  "screening",
  "interview",
  "offer",
];

export const mockInquiries: Inquiry[] = [
  {
    id: "inq-01",
    company: "㈜한별커머스",
    name: "김서연",
    phone: "010-2314-7789",
    email: "sy.kim@hanbyeol.example",
    types: ["퍼포먼스 마케팅", "IMC 통합 마케팅"],
    budget: "1,000~3,000만 원",
    period: "6개월",
    message:
      "자사몰 리뉴얼에 맞춰 신규 고객 유입 캠페인을 준비하고 있습니다. 네이버·메타 중심으로 제안 부탁드립니다.",
    status: "new",
    assignee: null,
    memo: null,
    createdAt: "2026-08-05T09:12:00+09:00",
    retentionUntil: "2029-08-05",
  },
  {
    id: "inq-02",
    company: "리버튼의원",
    name: "박지훈",
    phone: "010-8890-1123",
    email: "contact@riverton.example",
    types: ["퍼포먼스 마케팅"],
    budget: "500~1,000만 원",
    period: "연간",
    message: "지역 기반 검색광고 대행사를 찾고 있습니다. 병의원 레퍼런스가 궁금합니다.",
    status: "new",
    assignee: null,
    memo: null,
    createdAt: "2026-08-05T08:40:00+09:00",
    retentionUntil: "2029-08-05",
  },
  {
    id: "inq-03",
    company: "그린포레 식품",
    name: "이하늘",
    phone: "010-3345-6620",
    email: "haneul@greenfore.example",
    types: ["바이럴", "콘텐츠 제작"],
    budget: "미정",
    period: "3개월",
    message: "신제품 런칭 바이럴 캠페인 문의드립니다.",
    status: "contacted",
    assignee: "기획1팀 최AE",
    memo: "8/6 유선 상담 완료. 제안서 8/12까지 송부 예정.",
    createdAt: "2026-08-04T15:22:00+09:00",
    retentionUntil: "2029-08-04",
  },
  {
    id: "inq-04",
    company: "누리에듀",
    name: "정민아",
    phone: "010-5567-8934",
    email: "mina@nuriedu.example",
    types: ["IMC 통합 마케팅", "브랜딩"],
    budget: "3,000만 원 이상",
    period: "연간",
    message: "성인 교육 브랜드 리포지셔닝과 연간 미디어 플랜을 함께 논의하고 싶습니다.",
    status: "proposal",
    assignee: "기획2팀 한AE",
    memo: "경쟁 PT 8/20. 교육 업종 사례 중심으로 준비.",
    createdAt: "2026-08-01T11:05:00+09:00",
    retentionUntil: "2029-08-01",
  },
  {
    id: "inq-05",
    company: "블루무브 물류",
    name: "송재현",
    phone: "010-9210-4456",
    email: "jh.song@bluemove.example",
    types: ["온드미디어"],
    budget: "500만 원 미만",
    period: "미정",
    message: "기업 블로그 운영 대행 견적 문의드립니다.",
    status: "won",
    assignee: "콘텐츠팀 윤PM",
    memo: "8월 계약 완료. 월 8건 발행.",
    createdAt: "2026-07-28T10:30:00+09:00",
    retentionUntil: "2029-07-28",
  },
  {
    id: "inq-06",
    company: "모두의가구",
    name: "강수진",
    phone: "010-1178-2245",
    email: "sj.kang@modufurn.example",
    types: ["퍼포먼스 마케팅", "바이럴"],
    budget: "1,000~3,000만 원",
    period: "6개월",
    message: "시즌 프로모션 대비 통합 캠페인 문의.",
    status: "lost",
    assignee: "기획3팀 서AE",
    memo: "내부 사정으로 하반기 보류 통보 (7/30).",
    createdAt: "2026-07-25T14:48:00+09:00",
    retentionUntil: "2029-07-25",
  },
  {
    id: "inq-07",
    company: "펫프렌즈컴퍼니",
    name: "오다인",
    phone: "010-6642-9087",
    email: "dain@petfriends.example",
    types: ["콘텐츠 제작"],
    budget: "500~1,000만 원",
    period: "3개월",
    message: "숏폼 광고 소재 제작 단가와 진행 프로세스가 궁금합니다.",
    status: "contacted",
    assignee: "콘텐츠팀 윤PM",
    memo: null,
    createdAt: "2026-08-03T17:55:00+09:00",
    retentionUntil: "2029-08-03",
  },
  {
    id: "inq-08",
    company: "세종테크",
    name: "임찬영",
    phone: "010-4423-5561",
    email: "cy.lim@sejongtech.example",
    types: ["기타"],
    budget: null,
    period: null,
    message: "B2B 리드 확보 마케팅도 진행하시는지 문의드립니다.",
    status: "new",
    assignee: null,
    memo: null,
    createdAt: "2026-08-02T09:20:00+09:00",
    retentionUntil: "2029-08-02",
  },
];

export const mockApplications: Application[] = [
  {
    id: "app-01",
    postingTitle: "퍼포먼스 마케터 (SA/DA)",
    name: "한지우",
    phone: "010-7789-3321",
    email: "jiwoo.han@mail.example",
    careerYears: "2년",
    message: "커머스 인하우스에서 네이버·메타 운영 경험이 있습니다.",
    resumeName: "한지우_이력서.pdf",
    portfolioUrl: null,
    status: "received",
    memo: null,
    createdAt: "2026-08-05T10:02:00+09:00",
    retentionUntil: "2027-08-05",
  },
  {
    id: "app-02",
    postingTitle: "광고기획(AE) 경력",
    name: "문성호",
    phone: "010-2290-6674",
    email: "sh.moon@mail.example",
    careerYears: "5년",
    message: "종합대행사 AE 5년차입니다. 병의원·교육 업종 담당 경험 다수.",
    resumeName: "문성호_경력기술서.pdf",
    portfolioUrl: null,
    status: "screening",
    memo: "경력 적합. 8/8 실무면접 제안 예정.",
    createdAt: "2026-08-04T13:40:00+09:00",
    retentionUntil: "2027-08-04",
  },
  {
    id: "app-03",
    postingTitle: "콘텐츠 디자이너",
    name: "배유나",
    phone: "010-8812-4409",
    email: "yuna.bae@mail.example",
    careerYears: "3년",
    message: "상세페이지·SNS 소재 중심 포트폴리오 첨부합니다.",
    resumeName: "배유나_포트폴리오.pdf",
    portfolioUrl: "https://portfolio.example/yunabae",
    status: "interview",
    memo: "1차 통과. 2차 실무 과제 발송(8/6).",
    createdAt: "2026-08-01T16:18:00+09:00",
    retentionUntil: "2027-08-01",
  },
  {
    id: "app-04",
    postingTitle: "바이럴·온드미디어 담당",
    name: "신도현",
    phone: "010-3356-7710",
    email: "dh.shin@mail.example",
    careerYears: "신입",
    message: "개인 블로그 일 방문 1.5천 운영 중입니다.",
    resumeName: "신도현_이력서.pdf",
    portfolioUrl: "https://blog.example/dohyun",
    status: "received",
    memo: null,
    createdAt: "2026-08-03T11:27:00+09:00",
    retentionUntil: "2027-08-03",
  },
  {
    id: "app-05",
    postingTitle: "퍼포먼스 마케터 (SA/DA)",
    name: "권민재",
    phone: "010-9934-2216",
    email: "mj.kwon@mail.example",
    careerYears: "4년",
    message: "대행사 미디어팀 4년. GFA·카카오모먼트 운영 다수.",
    resumeName: "권민재_이력서.pdf",
    portfolioUrl: null,
    status: "offer",
    memo: "처우 협의 중 (8/4 안내 발송).",
    createdAt: "2026-07-26T09:55:00+09:00",
    retentionUntil: "2027-07-26",
  },
  {
    id: "app-06",
    postingTitle: "콘텐츠 디자이너",
    name: "조은비",
    phone: "010-1145-8823",
    email: "eb.jo@mail.example",
    careerYears: "1년",
    message: "영상 편집 위주로 작업해왔습니다.",
    resumeName: "조은비_이력서.pdf",
    portfolioUrl: null,
    status: "rejected",
    memo: "디자인 툴 경험 부족. 불합격 안내 완료(7/31).",
    createdAt: "2026-07-24T14:03:00+09:00",
    retentionUntil: "2027-07-24",
  },
];

export const mockNotifications: AdminNotification[] = [
  {
    id: "n-01",
    type: "inquiry",
    title: "㈜한별커머스 프로젝트 문의",
    link: "/admin/inquiries",
    createdAt: "2026-08-05T09:12:00+09:00",
    read: false,
  },
  {
    id: "n-02",
    type: "application",
    title: "한지우 — 퍼포먼스 마케터 지원",
    link: "/admin/applications",
    createdAt: "2026-08-05T10:02:00+09:00",
    read: false,
  },
  {
    id: "n-03",
    type: "inquiry",
    title: "리버튼의원 프로젝트 문의",
    link: "/admin/inquiries",
    createdAt: "2026-08-05T08:40:00+09:00",
    read: false,
  },
  {
    id: "n-04",
    type: "application",
    title: "신도현 — 바이럴·온드미디어 지원",
    link: "/admin/applications",
    createdAt: "2026-08-03T11:27:00+09:00",
    read: true,
  },
  {
    id: "n-05",
    type: "inquiry",
    title: "펫프렌즈컴퍼니 프로젝트 문의",
    link: "/admin/inquiries",
    createdAt: "2026-08-03T17:55:00+09:00",
    read: true,
  },
];

/** '5분 전' 형태의 상대 시각 — 목데이터 기준일(2026-08-05)에 맞춘 간이 구현 */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = new Date("2026-08-05T18:00:00+09:00").getTime();
  const m = Math.max(1, Math.floor((now - then) / 60000));
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** 개인정보 마스킹 — 전체 보기 전 기본 표시 (감사 로그 대상 동작의 목업) */
export const maskPhone = (p: string) => p.replace(/(\d{3})-(\d{3,4})-(\d{4})/, "$1-****-$3");
export const maskEmail = (e: string) => {
  const [id, domain] = e.split("@");
  return `${id.slice(0, 2)}***@${domain}`;
};
