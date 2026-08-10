import type { VercelRequest, VercelResponse } from "@vercel/node";

/** 응답 형태 통일 — 설계 §5 공통 규칙 */
export function ok(res: VercelResponse, data: unknown = null, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function fail(res: VercelResponse, code: string, message: string, status = 400) {
  return res.status(status).json({ ok: false, error: { code, message } });
}

export function clientIp(req: VercelRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  return (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim() || "unknown";
}

/**
 * IP 당 분당 요청 제한 (설계 §5: 분당 5회).
 * 서버리스 인스턴스별 메모리라 완전하진 않지만 폼 스팸 1차 방어로는 충분하다.
 * TODO: 트래픽 증가 시 Upstash 등 외부 스토어 기반으로 교체.
 */
const hits = new Map<string, number[]>();

export function rateLimited(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) return true;
  list.push(now);
  hits.set(ip, list);
  return false;
}

/**
 * Cloudflare Turnstile 검증 (F8).
 * TURNSTILE_SECRET_KEY 미설정(개발 초기)이면 통과시킨다 — 오픈 전 반드시 설정.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const j = (await r.json()) as { success: boolean };
    return j.success;
  } catch {
    return false;
  }
}
