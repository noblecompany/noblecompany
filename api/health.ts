/**
 * GET /api/health — 의존성 없는 최소 함수.
 * FUNCTION_INVOCATION_FAILED 원인 판별용: 이것까지 죽으면 런타임/빌드 설정 문제,
 * 살면 의존성(supabase-js 등) 로드 문제로 확정된다. 런타임 노드 버전도 노출한다.
 */
export default function handler(
  _req: unknown,
  res: { status: (c: number) => { json: (b: unknown) => void } },
) {
  res.status(200).json({ ok: true, node: process.version, ts: Date.now() });
}
