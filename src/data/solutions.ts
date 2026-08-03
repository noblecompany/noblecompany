export interface SolutionTool {
  id: string;
  name: string;
  tagline: string;
  recommends: Array<{ icon: string; text: string }>;
  steps: Array<{ label: string; title: string; desc: string }>;
}

// 기획안 슬라이드 41~43 기반 — 노블컴퍼니가 운용하는 솔루션 툴.
// "추천 대상 → 작동 원리 → 사용 이점" 소비자 플로우로 구성합니다.
export const solutionTools: SolutionTool[] = [
  {
    id: "acecounter",
    name: "에이스카운터",
    tagline: "방문부터 전환까지, 웹사이트 로그 분석의 표준",
    recommends: [
      { icon: "📊", text: "광고비 대비 실제 전환 성과를 정확히 알고 싶을 때" },
      { icon: "🧭", text: "방문자가 어떤 경로로 들어와 이탈하는지 궁금할 때" },
      { icon: "🎯", text: "매체별 기여도를 비교해 예산을 재배분하고 싶을 때" },
    ],
    steps: [
      { label: "STEP 1", title: "전환 스크립트 설치", desc: "사이트 주요 페이지에 분석 스크립트를 설치해 방문·전환 데이터를 수집합니다." },
      { label: "STEP 2", title: "유입 경로 분석", desc: "매체·키워드·소재별 유입과 전환 기여도를 교차 분석합니다." },
      { label: "STEP 3", title: "예산 최적화", desc: "고효율 채널 중심으로 예산을 재배분해 전환당 비용을 낮춥니다." },
    ],
  },
  {
    id: "smartlog",
    name: "스마트로그",
    tagline: "부정클릭 차단으로 새는 광고비를 지킵니다",
    recommends: [
      { icon: "🛡️", text: "경쟁사의 부정클릭으로 과도한 광고비 소진이 우려될 때" },
      { icon: "🔍", text: "네이버·구글 등 다양한 광고에서의 부정클릭을 방지하고 싶을 때" },
      { icon: "💰", text: "발생한 무효클릭에 대해 손쉽게 환급 신청을 하고 싶을 때" },
    ],
    steps: [
      { label: "STEP 1", title: "실시간 클릭 감시", desc: "스마트폰 앱으로 부정클릭 발생 시 실시간 알림을 받고 즉각 대응합니다." },
      { label: "STEP 2", title: "원터치 차단·노출 제한", desc: "의심 IP를 조건 기반으로 차단하고 매체에 노출 제한을 등록합니다." },
      { label: "STEP 3", title: "환급 보고서 자동 생성", desc: "부정클릭된 광고비를 광고 종류별로 정리해 환급 서식을 자동 생성합니다." },
    ],
  },
  {
    id: "ga",
    name: "구글 애널리틱스",
    tagline: "사용자 행동 데이터로 읽는 성장의 방향",
    recommends: [
      { icon: "🌐", text: "웹·앱을 아우르는 통합 사용자 데이터가 필요할 때" },
      { icon: "🔄", text: "유입 후 행동 흐름과 이탈 지점을 파악하고 싶을 때" },
      { icon: "📈", text: "데이터 기반으로 랜딩·퍼널을 개선하고 싶을 때" },
    ],
    steps: [
      { label: "STEP 1", title: "GA4 이벤트 설계", desc: "비즈니스 목표에 맞는 핵심 이벤트와 전환을 설계·설치합니다." },
      { label: "STEP 2", title: "행동 흐름 분석", desc: "세션·이벤트 데이터를 통해 사용자 여정과 이탈 구간을 진단합니다." },
      { label: "STEP 3", title: "퍼널 개선", desc: "진단 결과를 랜딩·UX 개선과 광고 타깃팅에 반영해 전환율을 높입니다." },
    ],
  },
  {
    id: "kw-analysis",
    name: "경쟁사 키워드 광고 분석",
    tagline: "경쟁사의 검색 광고 전략을 한눈에",
    recommends: [
      { icon: "⚔️", text: "경쟁사가 어떤 키워드에 입찰하는지 알고 싶을 때" },
      { icon: "🏷️", text: "키워드별 경쟁 강도와 예상 단가를 파악하고 싶을 때" },
      { icon: "🧠", text: "경쟁사 대비 차별화된 키워드 전략이 필요할 때" },
    ],
    steps: [
      { label: "STEP 1", title: "경쟁사 키워드 수집", desc: "경쟁사가 노출 중인 키워드와 광고 소재를 수집합니다." },
      { label: "STEP 2", title: "경쟁 강도 분석", desc: "키워드별 경쟁 강도·순위·소재 메시지를 비교 분석합니다." },
      { label: "STEP 3", title: "전략 수립", desc: "빈 틈 키워드와 차별화 메시지를 도출해 계정에 반영합니다." },
    ],
  },
  {
    id: "display-analysis",
    name: "경쟁사 노출형 광고 분석",
    tagline: "배너·영상 광고의 경쟁 동향 트래킹",
    recommends: [
      { icon: "🖼️", text: "경쟁사가 어떤 배너·영상 소재를 쓰는지 궁금할 때" },
      { icon: "📅", text: "경쟁사 캠페인 시점과 물량 변화를 추적하고 싶을 때" },
      { icon: "💡", text: "소재 기획에 참고할 레퍼런스가 필요할 때" },
    ],
    steps: [
      { label: "STEP 1", title: "노출 소재 모니터링", desc: "주요 매체에 노출되는 경쟁사 디스플레이·영상 소재를 수집합니다." },
      { label: "STEP 2", title: "크리에이티브 분석", desc: "메시지·포맷·운영 시점을 분석해 트렌드를 도출합니다." },
      { label: "STEP 3", title: "소재 전략 반영", desc: "분석 인사이트를 자사 소재 기획과 A/B 테스트에 반영합니다." },
    ],
  },
];
