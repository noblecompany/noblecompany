import type { SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import {
  audit,
  hasRole,
  maskEmail,
  maskPhone,
  requireAdmin,
  type AdminUser,
} from "../_lib/auth.js";
import { adminDb } from "../_lib/db.js";
import { fail, ok } from "../_lib/http.js";

/**
 * 어드민 API 전체를 하나의 서버리스 함수로 라우팅한다 (설계 §5 어드민 API).
 * Vercel Hobby 플랜의 함수 개수 제한을 넘지 않기 위한 구조.
 * 모든 요청은 Supabase Auth Bearer 토큰 + admin_users 활성 계정을 요구한다.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = adminDb();
  const user = await requireAdmin(req, db);
  if (!user) return fail(res, "unauthorized", "로그인이 필요합니다.", 401);

  // 경로 세그먼트 — Vercel 이 catch-all 파라미터를 넘기는 형태(문자열/배열)가
  // 환경마다 달라서, URL 자체에서 /api/admin 이후를 직접 파싱한다.
  const pathname = (req.url ?? "").split("?")[0];
  let segs = pathname
    .replace(/^\/api\/admin\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  if (segs.length === 0) {
    segs = ([] as string[]).concat((req.query.path as string[] | string) ?? []);
  }
  const [resource, id, sub] = segs;
  const ctx: Ctx = { req, res, db, user };

  try {
    switch (resource) {
      case "dashboard":
        return await dashboard(ctx);
      case "notifications":
        return await notifications(ctx, id);
      case "inquiries":
        return await inquiries(ctx, id, sub);
      case "applications":
        return await applications(ctx, id, sub);
      case "jobs":
        return await jobs(ctx, id);
      case "works":
        return await works(ctx, id);
      case "history":
        return await history(ctx);
      case "org":
        return await org(ctx);
      case "clients":
        return await clients(ctx);
      case "popups":
        return await popups(ctx, id);
      case "brochures":
        return await brochures(ctx);
      case "settings":
        return await settings(ctx);
      case "stats":
        return await stats(ctx);
      case "uploads":
        return await uploads(ctx);
      case "audits":
        return await audits(ctx, id);
      case "export":
        return await exportCsv(ctx);
      case "me":
        return ok(res, user);
      default:
        return fail(res, "not_found", "알 수 없는 리소스입니다.", 404);
    }
  } catch (e) {
    console.error("admin api error", e);
    return fail(res, "server_error", "처리 중 오류가 발생했습니다.", 500);
  }
}

interface Ctx {
  req: VercelRequest;
  res: VercelResponse;
  db: SupabaseClient;
  user: AdminUser;
}

const forbidden = (res: VercelResponse) =>
  fail(res, "forbidden", "이 작업을 수행할 권한이 없습니다.", 403);
const notFound = (res: VercelResponse) => fail(res, "not_found", "대상을 찾을 수 없습니다.", 404);
const badBody = (res: VercelResponse) => fail(res, "invalid_body", "입력값을 확인해 주세요.", 422);
const methodNa = (res: VercelResponse) => fail(res, "method_not_allowed", "허용되지 않은 메서드", 405);

/* ================================================= 대시보드 */

async function dashboard({ res, db }: Ctx) {
  const todayKst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

  const [inqToday, appToday, postings, recentInq, weekInq, weekApp] = await Promise.all([
    db.from("inquiries").select("id", { count: "exact", head: true })
      .gte("created_at", `${todayKst}T00:00:00+09:00`),
    db.from("job_applications").select("id", { count: "exact", head: true })
      .gte("created_at", `${todayKst}T00:00:00+09:00`),
    db.from("job_postings").select("id, title, team, deadline, status").eq("status", "published"),
    db.from("inquiries").select("id, company, types, status, created_at")
      .order("created_at", { ascending: false }).limit(5),
    db.from("inquiries").select("created_at").gte("created_at", weekAgo),
    db.from("job_applications").select("created_at").gte("created_at", weekAgo),
  ]);

  // 최근 7일 추이 — KST 날짜별 버킷
  const days: { day: string; inq: number; app: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() + 9 * 3600 * 1000 - i * 86400 * 1000);
    days.push({ day: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`, inq: 0, app: 0 });
  }
  const bucket = (iso: string) => {
    const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  };
  for (const r of (weekInq.data ?? [])) {
    const hit = days.find((x) => x.day === bucket(r.created_at));
    if (hit) hit.inq += 1;
  }
  for (const r of (weekApp.data ?? [])) {
    const hit = days.find((x) => x.day === bucket(r.created_at));
    if (hit) hit.app += 1;
  }

  const open = (postings.data ?? []).filter(
    (p) => !p.deadline || p.deadline >= todayKst,
  );
  const closing = open
    .filter((p) => p.deadline)
    .sort((a, b) => (a.deadline as string).localeCompare(b.deadline as string))
    .slice(0, 6);

  return ok(res, {
    todayInquiries: inqToday.count ?? 0,
    todayApplications: appToday.count ?? 0,
    openPostings: open.length,
    week: days,
    recentInquiries: (recentInq.data ?? []).map((r) => ({
      id: r.id, company: r.company, types: r.types, status: r.status, createdAt: r.created_at,
    })),
    closingPostings: closing.map((p) => ({
      id: p.id, title: p.title, team: p.team, deadline: p.deadline,
    })),
  });
}

/* ================================================= 알림센터 (F6) */

async function notifications({ req, res, db, user }: Ctx, id?: string) {
  if (req.method === "GET" && !id) {
    const [{ data: rows }, { data: reads }] = await Promise.all([
      db.from("notifications").select("*").order("created_at", { ascending: false }).limit(30),
      db.from("notification_reads").select("notification_id").eq("user_id", user.id),
    ]);
    const readSet = new Set((reads ?? []).map((r) => r.notification_id));
    return ok(res, (rows ?? []).map((n) => ({
      id: n.id, type: n.type, title: n.title, link: n.link,
      createdAt: n.created_at, read: readSet.has(n.id),
    })));
  }

  if (req.method === "POST" && id === "read") {
    const Body = z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() });
    const p = Body.safeParse(req.body);
    if (!p.success) return badBody(res);

    let targets: string[] = [];
    if (p.data.all) {
      const { data } = await db.from("notifications").select("id")
        .order("created_at", { ascending: false }).limit(100);
      targets = (data ?? []).map((n) => n.id);
    } else if (p.data.id) {
      targets = [p.data.id];
    }
    if (targets.length) {
      await db.from("notification_reads").upsert(
        targets.map((nid) => ({ notification_id: nid, user_id: user.id })),
        { onConflict: "notification_id,user_id", ignoreDuplicates: true },
      );
    }
    return ok(res, { read: targets.length });
  }

  return methodNa(res);
}

/* ================================================= 문의 관리 (owner·sales) */

const mapInquiry = (r: Record<string, unknown>, reveal = false) => ({
  id: r.id,
  company: r.company,
  name: r.name,
  phone: reveal ? r.phone : maskPhone(String(r.phone)),
  email: reveal ? r.email : maskEmail(String(r.email)),
  types: r.types,
  budget: r.budget,
  period: r.period,
  message: r.message,
  source: r.source,
  status: r.status,
  assignee: r.assignee,
  memo: r.memo,
  createdAt: r.created_at,
  retentionUntil: r.retention_until,
});

async function inquiries({ req, res, db, user }: Ctx, id?: string, sub?: string) {
  if (!hasRole(user, ["sales"])) return forbidden(res);

  if (req.method === "GET" && !id) {
    const { data, error } = await db.from("inquiries").select("*")
      .order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    return ok(res, (data ?? []).map((r) => mapInquiry(r)));
  }

  if (req.method === "POST" && id && sub === "reveal") {
    const { data } = await db.from("inquiries").select("*").eq("id", id).maybeSingle();
    if (!data) return notFound(res);
    await audit(db, req, user, "view", "inquiries", id);
    return ok(res, { phone: data.phone, email: data.email });
  }

  if (req.method === "PATCH" && id) {
    const Body = z.object({
      status: z.enum(["new", "contacted", "proposal", "won", "lost"]).optional(),
      assignee: z.string().max(50).nullable().optional(),
      memo: z.string().max(4000).nullable().optional(),
    });
    const p = Body.safeParse(req.body);
    if (!p.success) return badBody(res);
    const { error } = await db.from("inquiries").update(p.data).eq("id", id);
    if (error) throw error;
    await audit(db, req, user, "update", "inquiries", id);
    return ok(res);
  }

  return methodNa(res);
}

/* ================================================= 지원자 관리 (owner·hr) */

const mapApplication = (r: Record<string, unknown>, reveal = false) => ({
  id: r.id,
  postingId: r.posting_id,
  postingTitle: r.posting_title,
  name: r.name,
  phone: reveal ? r.phone : maskPhone(String(r.phone)),
  email: reveal ? r.email : maskEmail(String(r.email)),
  careerYears: r.career_years,
  message: r.message,
  hasResume: Boolean(r.resume_path),
  portfolioUrl: r.portfolio_url,
  status: r.status,
  memo: r.memo,
  createdAt: r.created_at,
  retentionUntil: r.retention_until,
});

async function applications({ req, res, db, user }: Ctx, id?: string, sub?: string) {
  if (!hasRole(user, ["hr"])) return forbidden(res);

  if (req.method === "GET" && !id) {
    const { data, error } = await db.from("job_applications").select("*")
      .order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    return ok(res, (data ?? []).map((r) => mapApplication(r)));
  }

  if (req.method === "POST" && id && sub === "reveal") {
    const { data } = await db.from("job_applications").select("phone, email").eq("id", id).maybeSingle();
    if (!data) return notFound(res);
    await audit(db, req, user, "view", "job_applications", id);
    return ok(res, { phone: data.phone, email: data.email });
  }

  // 이력서 열람 — 60초 signed URL + 감사 로그 (설계 §6.4)
  if (req.method === "GET" && id && sub === "resume") {
    const { data } = await db.from("job_applications").select("resume_path, name").eq("id", id).maybeSingle();
    if (!data?.resume_path) return notFound(res);
    const { data: signed, error } = await db.storage.from("resumes")
      .createSignedUrl(data.resume_path, 60);
    if (error || !signed) return fail(res, "storage_error", "이력서 URL 발급에 실패했습니다.", 500);
    await audit(db, req, user, "view", "job_applications:resume", id);
    return ok(res, { url: signed.signedUrl });
  }

  if (req.method === "PATCH" && id) {
    const Body = z.object({
      status: z.enum(["received", "screening", "interview", "offer", "rejected"]).optional(),
      memo: z.string().max(4000).nullable().optional(),
    });
    const p = Body.safeParse(req.body);
    if (!p.success) return badBody(res);
    const { error } = await db.from("job_applications").update(p.data).eq("id", id);
    if (error) throw error;
    await audit(db, req, user, "update", "job_applications", id);
    return ok(res);
  }

  return methodNa(res);
}

/* ================================================= 채용공고 CRUD (owner·hr, B2) */

const JobBody = z.object({
  id: z.string().trim().regex(/^[a-z0-9-]+$/, "슬러그는 영문 소문자·숫자·하이픈만").min(2).max(80),
  title: z.string().trim().min(1).max(120),
  group: z.string().trim().min(1).max(20),
  team: z.string().trim().min(1).max(40),
  employment: z.string().trim().min(1).max(20),
  career: z.string().trim().min(1).max(40),
  location: z.string().trim().min(1).max(80),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  summary: z.string().trim().min(1).max(200),
  responsibilities: z.array(z.string().max(200)).max(20),
  requirements: z.array(z.string().max(200)).max(20),
  preferred: z.array(z.string().max(200)).max(20),
  status: z.enum(["draft", "published", "closed"]),
  sortOrder: z.number().int().optional(),
});

const mapJob = (r: Record<string, unknown>) => ({
  id: r.id, title: r.title, group: r.job_group, team: r.team, employment: r.employment,
  career: r.career, location: r.location, deadline: r.deadline, summary: r.summary,
  responsibilities: r.responsibilities, requirements: r.requirements, preferred: r.preferred,
  status: r.status, sortOrder: r.sort_order, viewCount: r.view_count,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

const jobRow = (b: z.infer<typeof JobBody>) => ({
  id: b.id, title: b.title, job_group: b.group, team: b.team, employment: b.employment,
  career: b.career, location: b.location, deadline: b.deadline, summary: b.summary,
  responsibilities: b.responsibilities, requirements: b.requirements, preferred: b.preferred,
  status: b.status, sort_order: b.sortOrder ?? 0, updated_at: new Date().toISOString(),
});

async function jobs({ req, res, db, user }: Ctx, id?: string) {
  if (req.method === "GET") {
    const { data, error } = await db.from("job_postings").select("*")
      .order("sort_order").order("created_at", { ascending: false });
    if (error) throw error;
    return ok(res, (data ?? []).map(mapJob));
  }

  if (!hasRole(user, ["hr"])) return forbidden(res);

  if (req.method === "POST") {
    const p = JobBody.safeParse(req.body);
    if (!p.success) return fail(res, "invalid_body", p.error.issues[0]?.message ?? "입력값 오류", 422);
    const { data: dup } = await db.from("job_postings").select("id").eq("id", p.data.id).maybeSingle();
    if (dup) return fail(res, "duplicate_id", "이미 사용 중인 슬러그입니다.", 409);
    const { data, error } = await db.from("job_postings").insert(jobRow(p.data)).select("*").single();
    if (error) throw error;
    return ok(res, mapJob(data), 201);
  }

  if (req.method === "PATCH" && id) {
    const p = JobBody.partial().safeParse(req.body);
    if (!p.success) return badBody(res);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const b = p.data;
    if (b.title !== undefined) patch.title = b.title;
    if (b.group !== undefined) patch.job_group = b.group;
    if (b.team !== undefined) patch.team = b.team;
    if (b.employment !== undefined) patch.employment = b.employment;
    if (b.career !== undefined) patch.career = b.career;
    if (b.location !== undefined) patch.location = b.location;
    if (b.deadline !== undefined) patch.deadline = b.deadline;
    if (b.summary !== undefined) patch.summary = b.summary;
    if (b.responsibilities !== undefined) patch.responsibilities = b.responsibilities;
    if (b.requirements !== undefined) patch.requirements = b.requirements;
    if (b.preferred !== undefined) patch.preferred = b.preferred;
    if (b.status !== undefined) patch.status = b.status;
    if (b.sortOrder !== undefined) patch.sort_order = b.sortOrder;
    const { data, error } = await db.from("job_postings").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return notFound(res);
    return ok(res, mapJob(data));
  }

  if (req.method === "DELETE" && id) {
    const { error } = await db.from("job_postings").delete().eq("id", id);
    if (error) throw error;
    await audit(db, req, user, "delete", "job_postings", id);
    return ok(res);
  }

  return methodNa(res);
}

/* ================================================= 포트폴리오 CRUD (owner·editor, B1) */

const WorkBody = z.object({
  id: z.string().trim().regex(/^[a-z0-9-]+$/).min(2).max(80),
  client: z.string().trim().min(1).max(80),
  category: z.enum(["IMC", "SA", "DA", "VIRAL"]),
  industry: z.string().max(40).nullable().optional(),
  team: z.string().max(40).nullable().optional(),
  mediaType: z.string().max(120).nullable().optional(),
  objective: z.string().max(2000).nullable().optional(),
  strategy: z.string().max(4000).nullable().optional(),
  media: z.string().max(300).nullable().optional(),
  result: z.string().max(2000).nullable().optional(),
  thumbPath: z.string().max(500).nullable().optional(),
  heroPath: z.string().max(500).nullable().optional(),
  rank: z.number().int().nullable().optional(),
  status: z.enum(["draft", "published"]),
});

const mapWork = (r: Record<string, unknown>) => ({
  id: r.id, client: r.client, category: r.category, industry: r.industry, team: r.team,
  mediaType: r.media_type, objective: r.objective, strategy: r.strategy, media: r.media,
  result: r.result, thumbPath: r.thumb_path, heroPath: r.hero_path, rank: r.rank,
  status: r.status, createdAt: r.created_at,
});

const workRow = (b: z.infer<typeof WorkBody>) => ({
  id: b.id, client: b.client, category: b.category, industry: b.industry ?? null,
  team: b.team ?? null, media_type: b.mediaType ?? null, objective: b.objective ?? null,
  strategy: b.strategy ?? null, media: b.media ?? null, result: b.result ?? null,
  thumb_path: b.thumbPath ?? null, hero_path: b.heroPath ?? null, rank: b.rank ?? null,
  status: b.status,
});

async function works({ req, res, db, user }: Ctx, id?: string) {
  if (req.method === "GET") {
    const { data, error } = await db.from("works").select("*")
      .order("rank", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return ok(res, (data ?? []).map(mapWork));
  }

  if (!hasRole(user, ["editor"])) return forbidden(res);

  if (req.method === "POST") {
    const p = WorkBody.safeParse(req.body);
    if (!p.success) return badBody(res);
    const { data: dup } = await db.from("works").select("id").eq("id", p.data.id).maybeSingle();
    if (dup) return fail(res, "duplicate_id", "이미 사용 중인 슬러그입니다.", 409);
    const { data, error } = await db.from("works").insert(workRow(p.data)).select("*").single();
    if (error) throw error;
    return ok(res, mapWork(data), 201);
  }

  if (req.method === "PATCH" && id) {
    const p = WorkBody.partial().safeParse(req.body);
    if (!p.success) return badBody(res);
    const b = p.data;
    const patch: Record<string, unknown> = {};
    if (b.client !== undefined) patch.client = b.client;
    if (b.category !== undefined) patch.category = b.category;
    if (b.industry !== undefined) patch.industry = b.industry;
    if (b.team !== undefined) patch.team = b.team;
    if (b.mediaType !== undefined) patch.media_type = b.mediaType;
    if (b.objective !== undefined) patch.objective = b.objective;
    if (b.strategy !== undefined) patch.strategy = b.strategy;
    if (b.media !== undefined) patch.media = b.media;
    if (b.result !== undefined) patch.result = b.result;
    if (b.thumbPath !== undefined) patch.thumb_path = b.thumbPath;
    if (b.heroPath !== undefined) patch.hero_path = b.heroPath;
    if (b.rank !== undefined) patch.rank = b.rank;
    if (b.status !== undefined) patch.status = b.status;
    const { data, error } = await db.from("works").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return notFound(res);
    return ok(res, mapWork(data));
  }

  if (req.method === "DELETE" && id) {
    const { error } = await db.from("works").delete().eq("id", id);
    if (error) throw error;
    await audit(db, req, user, "delete", "works", id);
    return ok(res);
  }

  return methodNa(res);
}

/* ================================================= 연혁 (owner·editor, B3) — 전체 교체 저장 */

async function history({ req, res, db, user }: Ctx) {
  if (req.method === "GET") {
    const { data, error } = await db.from("history_entries").select("*").order("sort_order");
    if (error) throw error;
    return ok(res, (data ?? []).map((r) => ({
      rangeLabel: r.range_label, year: r.year, groupLabel: r.group_label,
      body: r.body, sortOrder: r.sort_order,
    })));
  }

  if (!hasRole(user, ["editor"])) return forbidden(res);

  if (req.method === "PUT") {
    const Body = z.array(z.object({
      rangeLabel: z.string().trim().min(1).max(40),
      year: z.string().max(10).nullable(),
      groupLabel: z.string().max(40).nullable(),
      body: z.string().trim().min(1).max(300),
    })).max(500);
    const p = Body.safeParse(req.body);
    if (!p.success) return badBody(res);
    await db.from("history_entries").delete().not("id", "is", null);
    if (p.data.length) {
      const { error } = await db.from("history_entries").insert(
        p.data.map((r, i) => ({
          range_label: r.rangeLabel, year: r.year, group_label: r.groupLabel,
          body: r.body, sort_order: i,
        })),
      );
      if (error) throw error;
    }
    return ok(res, { saved: p.data.length });
  }

  return methodNa(res);
}

/* ================================================= 조직도 (owner·editor, B4) — 전체 교체 저장 */

async function org({ req, res, db, user }: Ctx) {
  if (req.method === "GET") {
    const [{ data: divisions }, { data: teams }] = await Promise.all([
      db.from("org_divisions").select("*").order("sort_order"),
      db.from("org_teams").select("*").order("sort_order"),
    ]);
    return ok(res, (divisions ?? []).map((d) => ({
      division: d.name,
      teams: (teams ?? []).filter((t) => t.division_id === d.id).map((t) => t.name),
    })));
  }

  if (!hasRole(user, ["editor"])) return forbidden(res);

  if (req.method === "PUT") {
    const Body = z.array(z.object({
      division: z.string().trim().min(1).max(40),
      teams: z.array(z.string().trim().min(1).max(40)).max(30),
    })).max(20);
    const p = Body.safeParse(req.body);
    if (!p.success) return badBody(res);
    await db.from("org_divisions").delete().not("id", "is", null); // teams 는 cascade
    for (const [di, d] of p.data.entries()) {
      const { data: div, error } = await db.from("org_divisions")
        .insert({ name: d.division, sort_order: di }).select("id").single();
      if (error) throw error;
      if (d.teams.length) {
        const { error: e2 } = await db.from("org_teams").insert(
          d.teams.map((t, ti) => ({ division_id: div.id, name: t, sort_order: ti })),
        );
        if (e2) throw e2;
      }
    }
    return ok(res, { saved: p.data.length });
  }

  return methodNa(res);
}

/* ================================================= 클라이언트 (owner·editor, B5) — 전체 교체 저장 */

async function clients({ req, res, db, user }: Ctx) {
  if (req.method === "GET") {
    const { data, error } = await db.from("clients").select("*").order("sort_order");
    if (error) throw error;
    return ok(res, (data ?? []).map((c) => ({
      name: c.name, visible: c.visible, sortOrder: c.sort_order,
    })));
  }

  if (!hasRole(user, ["editor"])) return forbidden(res);

  if (req.method === "PUT") {
    const Body = z.array(z.object({
      name: z.string().trim().min(1).max(60),
      visible: z.boolean(),
    })).max(500);
    const p = Body.safeParse(req.body);
    if (!p.success) return badBody(res);
    // 중복 이름 제거 (unique 제약)
    const seen = new Set<string>();
    const rows = p.data.filter((c) => !seen.has(c.name) && seen.add(c.name));
    await db.from("clients").delete().not("id", "is", null);
    if (rows.length) {
      const { error } = await db.from("clients").insert(
        rows.map((c, i) => ({ name: c.name, visible: c.visible, sort_order: i })),
      );
      if (error) throw error;
    }
    return ok(res, { saved: rows.length });
  }

  return methodNa(res);
}

/* ================================================= 팝업 배너 (owner·editor, C1) */

const PopupBody = z.object({
  title: z.string().trim().min(1).max(80),
  imagePath: z.string().max(500).nullable().optional(),
  linkUrl: z.string().max(500).nullable().optional(),
  startsAt: z.string().min(10),
  endsAt: z.string().min(10),
  active: z.boolean(),
});

const mapPopup = (r: Record<string, unknown>) => ({
  id: r.id, title: r.title, imagePath: r.image_path, linkUrl: r.link_url,
  startsAt: r.starts_at, endsAt: r.ends_at, active: r.active, createdAt: r.created_at,
});

async function popups({ req, res, db, user }: Ctx, id?: string) {
  if (req.method === "GET") {
    const { data, error } = await db.from("popups").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return ok(res, (data ?? []).map(mapPopup));
  }

  if (!hasRole(user, ["editor"])) return forbidden(res);

  if (req.method === "POST") {
    const p = PopupBody.safeParse(req.body);
    if (!p.success) return badBody(res);
    const { data, error } = await db.from("popups").insert({
      title: p.data.title, image_path: p.data.imagePath ?? null, link_url: p.data.linkUrl ?? null,
      starts_at: p.data.startsAt, ends_at: p.data.endsAt, active: p.data.active,
    }).select("*").single();
    if (error) throw error;
    return ok(res, mapPopup(data), 201);
  }

  if (req.method === "PATCH" && id) {
    const p = PopupBody.partial().safeParse(req.body);
    if (!p.success) return badBody(res);
    const b = p.data;
    const patch: Record<string, unknown> = {};
    if (b.title !== undefined) patch.title = b.title;
    if (b.imagePath !== undefined) patch.image_path = b.imagePath;
    if (b.linkUrl !== undefined) patch.link_url = b.linkUrl;
    if (b.startsAt !== undefined) patch.starts_at = b.startsAt;
    if (b.endsAt !== undefined) patch.ends_at = b.endsAt;
    if (b.active !== undefined) patch.active = b.active;
    const { data, error } = await db.from("popups").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return notFound(res);
    return ok(res, mapPopup(data));
  }

  if (req.method === "DELETE" && id) {
    const { error } = await db.from("popups").delete().eq("id", id);
    if (error) throw error;
    return ok(res);
  }

  return methodNa(res);
}

/* ================================================= 회사소개서 (owner, B6) */

async function brochures({ req, res, db, user }: Ctx) {
  if (req.method === "GET") {
    const { data, error } = await db.from("brochures").select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok(res, (data ?? []).map((b) => ({
      id: b.id, version: b.version, filePath: b.file_path, fileSize: b.file_size,
      isCurrent: b.is_current, viewCount: b.view_count, downloadCount: b.download_count,
      createdAt: b.created_at,
    })));
  }

  if (!hasRole(user, [])) return forbidden(res); // owner 전용

  // 업로드 완료 후 등록 — 이전 버전은 보관, 새 버전이 최신이 된다
  if (req.method === "POST") {
    const Body = z.object({
      version: z.string().trim().min(1).max(20),
      filePath: z.string().trim().min(1).max(500),
      fileSize: z.number().int().min(1),
    });
    const p = Body.safeParse(req.body);
    if (!p.success) return badBody(res);
    await db.from("brochures").update({ is_current: false }).eq("is_current", true);
    const { data, error } = await db.from("brochures").insert({
      version: p.data.version, file_path: p.data.filePath,
      file_size: p.data.fileSize, is_current: true,
    }).select("id").single();
    if (error) throw error;
    return ok(res, { id: data.id }, 201);
  }

  return methodNa(res);
}

/* ================================================= 설정 — 기능 토글 (owner, F16) */

async function settings({ req, res, db, user }: Ctx) {
  if (req.method === "GET") {
    const { data, error } = await db.from("site_settings").select("key, value");
    if (error) throw error;
    return ok(res, Object.fromEntries((data ?? []).map((s) => [s.key, s.value])));
  }

  if (!hasRole(user, [])) return forbidden(res); // owner 전용

  if (req.method === "PATCH") {
    const Body = z.record(z.string().max(60), z.union([z.boolean(), z.string().max(500), z.number()]));
    const p = Body.safeParse(req.body);
    if (!p.success) return badBody(res);
    const rows = Object.entries(p.data).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(), updated_by: user.id,
    }));
    const { error } = await db.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) throw error;
    return ok(res, { saved: rows.length });
  }

  return methodNa(res);
}

/* ================================================= 통계 (owner, C2 간이판) */

async function stats({ req, res, db, user }: Ctx) {
  if (req.method !== "GET") return methodNa(res);
  if (!hasRole(user, [])) return forbidden(res);

  const [jobsViews, brochureRows, inqCount, appCount] = await Promise.all([
    db.from("job_postings").select("id, title, view_count, status").order("view_count", { ascending: false }),
    db.from("brochures").select("version, view_count, download_count, is_current"),
    db.from("inquiries").select("id", { count: "exact", head: true }),
    db.from("job_applications").select("id", { count: "exact", head: true }),
  ]);

  return ok(res, {
    jobViews: (jobsViews.data ?? []).map((j) => ({
      id: j.id, title: j.title, viewCount: j.view_count, status: j.status,
    })),
    brochures: (brochureRows.data ?? []).map((b) => ({
      version: b.version, viewCount: b.view_count, downloadCount: b.download_count,
      isCurrent: b.is_current,
    })),
    totalInquiries: inqCount.count ?? 0,
    totalApplications: appCount.count ?? 0,
  });
}

/* ================================================= 업로드 signed URL (이미지·PDF) */

const UPLOAD_RULES: Record<string, { ext: string[]; roles: ("hr" | "sales" | "editor")[] }> = {
  portfolio: { ext: ["jpg", "jpeg", "png", "webp"], roles: ["editor"] },
  "site-assets": { ext: ["jpg", "jpeg", "png", "webp", "gif"], roles: ["editor"] },
  brochures: { ext: ["pdf"], roles: [] }, // owner 전용
};

async function uploads({ req, res, db, user }: Ctx) {
  if (req.method !== "POST") return methodNa(res);
  const Body = z.object({
    bucket: z.enum(["portfolio", "site-assets", "brochures"]),
    filename: z.string().trim().min(1).max(200),
  });
  const p = Body.safeParse(req.body);
  if (!p.success) return badBody(res);

  const rule = UPLOAD_RULES[p.data.bucket];
  if (!hasRole(user, rule.roles)) return forbidden(res);

  const ext = p.data.filename.split(".").pop()?.toLowerCase() ?? "";
  if (!rule.ext.includes(ext)) {
    return fail(res, "bad_extension", `허용 형식: ${rule.ext.join(", ")}`, 422);
  }

  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await db.storage.from(p.data.bucket).createSignedUploadUrl(path);
  if (error) return fail(res, "storage_error", "업로드 준비에 실패했습니다.", 500);

  const { data: pub } = db.storage.from(p.data.bucket).getPublicUrl(path);
  return ok(res, { path, token: data.token, signedUrl: data.signedUrl, publicUrl: pub.publicUrl });
}

/* ================================================= 사이트 진단 결과 (owner·sales) */

async function audits({ req, res, db, user }: Ctx, id?: string) {
  if (!hasRole(user, ["sales"])) return forbidden(res);

  if (req.method === "GET" && !id) {
    const { data, error } = await db
      .from("seo_audits")
      .select("id, url, final_url, page_title, grade, pass_count, warn_count, fail_count, categories, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    return ok(res, (data ?? []).map((a) => ({
      id: a.id, url: a.url, finalUrl: a.final_url, pageTitle: a.page_title, grade: a.grade,
      passCount: a.pass_count, warnCount: a.warn_count, failCount: a.fail_count,
      categories: a.categories, createdAt: a.created_at,
    })));
  }

  if (req.method === "GET" && id) {
    const { data, error } = await db.from("seo_audits").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return notFound(res);
    return ok(res, {
      id: data.id, url: data.url, finalUrl: data.final_url, pageTitle: data.page_title,
      grade: data.grade, passCount: data.pass_count, warnCount: data.warn_count,
      failCount: data.fail_count, categories: data.categories, checks: data.checks,
      keywords: data.keywords, meta: data.meta, ip: data.ip, createdAt: data.created_at,
    });
  }

  if (req.method === "DELETE" && id) {
    const { error } = await db.from("seo_audits").delete().eq("id", id);
    if (error) throw error;
    return ok(res);
  }

  return methodNa(res);
}

/* ================================================= CSV 내보내기 (owner, §7-8) */

async function exportCsv({ req, res, db, user }: Ctx) {
  if (req.method !== "GET") return methodNa(res);
  if (!hasRole(user, [])) return forbidden(res);

  const type = req.query.type as string;
  if (type !== "inquiries" && type !== "applications") {
    return fail(res, "invalid_type", "type 은 inquiries 또는 applications", 422);
  }

  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join(" / ") : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  let csv: string;
  if (type === "inquiries") {
    const { data, error } = await db.from("inquiries").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const head = ["접수일", "회사명", "담당자", "연락처", "이메일", "문의유형", "예산", "기간", "내용", "상태", "담당AE", "메모", "보관기한"];
    csv = [head.join(",")].concat((data ?? []).map((r) =>
      [r.created_at, r.company, r.name, r.phone, r.email, r.types, r.budget, r.period, r.message, r.status, r.assignee, r.memo, r.retention_until].map(esc).join(","),
    )).join("\r\n");
  } else {
    const { data, error } = await db.from("job_applications").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const head = ["접수일", "공고", "지원자", "연락처", "이메일", "경력", "자기소개", "포트폴리오", "전형단계", "메모", "보관기한"];
    csv = [head.join(",")].concat((data ?? []).map((r) =>
      [r.created_at, r.posting_title, r.name, r.phone, r.email, r.career_years, r.message, r.portfolio_url, r.status, r.memo, r.retention_until].map(esc).join(","),
    )).join("\r\n");
  }

  await audit(db, req, user, "export", type);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`);
  // 엑셀 한글 호환 BOM
  return res.status(200).send("﻿" + csv);
}
