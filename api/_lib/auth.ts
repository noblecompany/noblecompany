import type { SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";
import { adminDb } from "./db.js";
import { clientIp } from "./http.js";

/** 어드민 역할 (설계 §6.5) */
export type AdminRole = "owner" | "hr" | "sales" | "editor";

export interface AdminUser {
  id: string;
  name: string;
  role: AdminRole;
}

/**
 * Authorization: Bearer <Supabase access token> 을 검증하고
 * admin_users 에 등록된 활성 계정인지 확인한다.
 * 실패하면 null — 호출부가 401 로 응답한다.
 */
export async function requireAdmin(
  req: VercelRequest,
  db: SupabaseClient,
): Promise<AdminUser | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);

  const { data: userData, error } = await db.auth.getUser(token);
  if (error || !userData.user) return null;

  const { data: admin } = await db
    .from("admin_users")
    .select("id, name, role, active")
    .eq("id", userData.user.id)
    .maybeSingle();

  // Auth 계정은 있지만 admin_users 미등록인 경우 —
  // 공개 회원가입으로 만들어진 계정이 관리자가 되는 것을 막기 위해,
  // ADMIN_EMAILS(쉼표 구분) 허용 목록에 있는 이메일만 자동 등록(owner)한다.
  // 목록에 없으면 401 — 계정은 Supabase 대시보드에서 admin_users 에 직접 추가해야 한다.
  if (!admin) {
    const email = (userData.user.email ?? "").toLowerCase();
    const allow = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!email || !allow.includes(email)) return null;
    const name = email.split("@")[0] || "admin";
    const { data: created } = await db
      .from("admin_users")
      .insert({ id: userData.user.id, name, role: "owner" })
      .select("id, name, role")
      .single();
    return created ? (created as AdminUser) : null;
  }

  if (!admin.active) return null;
  return { id: admin.id, name: admin.name, role: admin.role as AdminRole };
}

/** 역할 검사 — owner 는 항상 통과 (설계 §6.5) */
export function hasRole(user: AdminUser, allowed: AdminRole[]): boolean {
  return user.role === "owner" || allowed.includes(user.role);
}

/** 감사 로그 (F15) — 개인정보 열람·수정·삭제·내보내기 기록. 실패해도 본 동작은 막지 않는다. */
export async function audit(
  db: SupabaseClient,
  req: VercelRequest,
  actor: AdminUser,
  action: "view" | "export" | "update" | "delete",
  targetTable: string,
  targetId?: string,
): Promise<void> {
  try {
    await db.from("audit_logs").insert({
      actor_id: actor.id,
      action,
      target_table: targetTable,
      target_id: targetId ?? null,
      ip: clientIp(req),
    });
  } catch {
    /* 감사 로그 실패로 업무 동작을 막지 않는다 */
  }
}

/** 개인정보 마스킹 — 목록 응답 기본값 (전체 보기는 reveal 엔드포인트로) */
export const maskPhone = (p: string) =>
  p.replace(/(\d{2,3})[- ]?(\d{3,4})[- ]?(\d{4})/, "$1-****-$3");
export const maskEmail = (e: string) => {
  const [id, domain] = e.split("@");
  return `${(id ?? "").slice(0, 2)}***@${domain ?? ""}`;
};

export { adminDb };
