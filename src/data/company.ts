/**
 * 회사 공통 정보 — 회사소개서 파일 메타 포함.
 *
 * 소개서 교체 절차
 *   1. PDF를 `public/brochure/` 에 URL-safe 한 영문 이름으로 넣는다
 *      (한글 파일명은 인코딩 이슈가 있어 다운로드 시 파일명만 한글로 바꿔 준다)
 *   2. 아래 `brochure.file` 에 경로를, `size`·`updatedAt` 을 실제 값으로 채운다
 *   3. `file` 이 null 인 동안에는 다운로드 버튼 대신 메일 요청 안내가 노출된다
 */

/** 연락처 단일 출처 — Footer·Contact·Careers가 모두 여기를 참조한다 */
export const SALES_EMAIL = "noble@e-noble.kr";
export const SALES_TEL = "02-474-1941";
export const PARTNER_EMAIL = "kbn@e-noble.kr";
export const PARTNER_TEL = "02-2088-7062";
export const RECRUIT_EMAIL = "hrm@e-noble.kr";
export const RECRUIT_TEL = "02-2088-7047";

/** 헤더 CTA — 별도 사이트로 나가는 디자인 포트폴리오 */
export const DESIGN_PORTFOLIO_URL = "https://nb-web-one.vercel.app/";

export interface Brochure {
  /** public/ 기준 경로. 파일 미확보 상태면 null */
  file: string | null;
  /** 사용자가 내려받을 때 보이는 파일명 */
  downloadName: string;
  /** 표시용 문구. 예) "PDF · 12.4MB" */
  size: string;
  /** 갱신일 (YYYY.MM) */
  updatedAt: string;
}

export const brochure: Brochure = {
  // 원본: "NB260624 NB_회사 소개서.pdf" (51p, PowerPoint 2019 내보내기)
  // 한글·공백이 섞인 파일명은 URL 인코딩 이슈가 있어 영문으로 개명해 보관한다.
  file: "/brochure/noble-company-profile.pdf",
  downloadName: "노블컴퍼니_회사소개서.pdf",
  size: "PDF · 5.1MB · 51p",
  updatedAt: "2026.06",
};

/** ABOUT > 소개 하단 회사정보 표 */
export const companyInfo: { label: string; value: string | string[] }[] = [
  { label: "회사명", value: "주식회사 노블컴퍼니" },
  { label: "대표이사", value: "이왕행" },
  // TODO: 법인설립 정확한 월·일 확인 (연혁상 2011~2013 구간에 법인설립)
  { label: "설립일", value: "2011년" },
  { label: "사업자등록번호", value: "212-86-05752" },
  { label: "주소", value: "서울특별시 강동구 성내로 48 (성내동, 씨네월드) 6층" },
  {
    label: "대표번호",
    value: `Tel : ${SALES_TEL} / 제휴 : ${PARTNER_TEL} / 채용 : ${RECRUIT_TEL}`,
  },
  {
    label: "주요 사업",
    value: [
      "IMC 통합 마케팅 기획 및 운영",
      "검색광고(SA) · 디스플레이광고(DA) 대행",
      "바이럴 · 온드미디어 콘텐츠 마케팅",
      "브랜딩 및 광고 콘텐츠 제작",
      "데이터 분석 기반 광고 성과 컨설팅",
    ],
  },
];

/** ABOUT > 소개 조직도. 본부 순서가 그대로 좌→우 배치가 된다 */
export const orgChart: { division: string; teams: string[] }[] = [
  { division: "전략본부", teams: ["기획 1팀", "기획 2팀", "기획 3팀", "마케팅 1팀", "마케팅 2팀"] },
  { division: "콘텐츠본부", teams: ["콘텐츠 마케팅팀", "디자인팀", "미디어 영상팀"] },
  { division: "운영본부", teams: ["채널팀", "운영 지원팀", "인사팀", "회계팀", "개발팀"] },
  { division: "브랜드사업본부", teams: ["커머스 사업부", "후원 사업부"] },
];

/** 연혁 한 구간 안의 묶음. year 가 null 이면 연도 미상 이력(광고 수주 등) */
export interface HistoryGroup {
  year: string | null;
  /** year 가 null 일 때 대신 노출할 제목 */
  label?: string;
  items: string[];
}

export interface HistoryPeriod {
  range: string;
  groups: HistoryGroup[];
}

/**
 * 연혁 — 인사·경영지원팀 제공 원본.
 * 광고 수주 건은 원본에 연도 표기가 없어 구간별 '광고 수주' 묶음으로 정리했습니다.
 */
export const history: HistoryPeriod[] = [
  {
    range: "2023 ~ 2025",
    groups: [
      { year: "2025", items: ["네이버 프리미어 파트너사 선정"] },
      {
        year: "2024",
        items: [
          "네이버 우수파트너사 선정",
          "강동구의회 의장상 수상",
          "강소기업 선정",
          "청년친화강소기업 선정",
          "서울형강소기업 선정",
          "지역사회 발전기여 강동구청장 표창장 수상",
        ],
      },
      {
        year: "2023",
        items: [
          "네이버 우수파트너사 선정",
          "강소기업 선정",
          "여성가족부 여성친화 일촌기업 협약",
          "강동종합사회복지관 업무협약 체결(MOU)",
        ],
      },
      {
        year: null,
        label: "광고 수주",
        items: [
          "전남도청",
          "립톤",
          "중원주식회사 시크릿데이",
          "뉴에라",
          "교원",
          "한국산업인력공단",
          "교보문고",
          "그랜드 유니버셜 트레이딩 코리아 헬로",
          "한예지",
          "정식품",
          "에어부산",
          "델타항공",
          "(주)에듀윌",
        ],
      },
    ],
  },
  {
    range: "2020 ~ 2022",
    groups: [
      { year: "2022", items: ["네이버 우수파트너사 선정"] },
      {
        year: null,
        label: "인증 · 협약",
        items: [
          "네이버 공식대행사 선정",
          "네이버 GFA 공식대행사 선정",
          "맞춤광고 기획 및 제작 기술평가 우수기업 T-4",
          "여성가족부 가족친화기업 인증",
          "강동지역자활센터와 업무협약 체결(MOU)",
        ],
      },
      {
        year: null,
        label: "광고 수주",
        items: [
          "롯데칠성",
          "롯데백화점",
          "LG베스트샵",
          "한국관광공사",
          "KDB생명",
          "유한킴벌리",
          "틱톡",
          "에스더포뮬러",
          "현대로보틱스",
        ],
      },
    ],
  },
  {
    range: "2017 ~ 2019",
    groups: [
      { year: "2018", items: ["여성가족부 여성친화 일촌기업 협약"] },
      {
        year: null,
        label: "인증 · 협약",
        items: [
          "KAKAO 공식대행사 선정",
          "강동지역자활센터 업무협약 체결(MOU)",
          "법률사무소 업무협약 체결(MOU)",
        ],
      },
      {
        year: null,
        label: "광고 수주",
        items: [
          "롯데쇼핑",
          "롯데ON",
          "롯데백화점",
          "유안타증권",
          "틱톡",
          "유한킴벌리",
          "코오롱스포츠",
          "블랙야크",
          "MCM",
          "애경뷰티",
          "네스카페",
          "오텍 캐리어",
        ],
      },
    ],
  },
  {
    range: "2014 ~ 2016",
    groups: [
      { year: null, label: "인증", items: ["벤처기업인증", "KIBO기술보증 기술인증"] },
      {
        year: null,
        label: "광고 수주",
        items: ["풀무원", "대원미디어", "브리지스톤 골프"],
      },
    ],
  },
  {
    range: "2011 ~ 2013",
    groups: [
      {
        year: null,
        label: "설립 · 선정",
        items: [
          "㈜노블컴퍼니 법인설립",
          "네이버 공식 인증 대행사 선정",
          "네이버 파워셀러 수상",
          "제주도관광협회 온라인광고 강사지정",
        ],
      },
      { year: null, label: "광고 수주", items: ["제주도관광협회 탐나오"] },
    ],
  },
];
