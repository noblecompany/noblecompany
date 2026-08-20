import { supabase } from "../lib/supabaseClient";

/**
 * 어드민 API 클라이언트 — /api/admin/* 에 Supabase Auth 토큰을 붙여 호출한다.
 * 응답 형태 { ok, data } / { ok:false, error } 는 설계 §5 공통 규칙.
 */
export async function adminApi<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  if (!supabase) throw new Error("Supabase 설정이 없습니다.");
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");

  const res = await fetch(`/api/admin${path}`, {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const body = (await res.json().catch(() => null)) as
    | { ok: true; data: T }
    | { ok: false; error?: { message?: string } }
    | null;

  if (!res.ok || !body || !("ok" in body) || !body.ok) {
    const msg =
      (body && "error" in body && body.error?.message) ||
      (res.status === 401 ? "로그인이 필요합니다." : `요청 실패 (${res.status})`);
    throw new Error(msg);
  }
  return body.data;
}

/** CSV 다운로드 — blob 로 받아 저장 (owner 전용, 감사 로그 기록됨) */
export async function adminDownloadCsv(type: "inquiries" | "applications"): Promise<void> {
  if (!supabase) throw new Error("Supabase 설정이 없습니다.");
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("세션이 만료되었습니다.");

  const res = await fetch(`/api/admin/export?type=${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? "내보내기에 실패했습니다.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Storage 업로드 — 어드민 signed URL 발급 후 직접 PUT. 공개 URL 을 돌려준다 */
export async function adminUpload(
  bucket: "portfolio" | "site-assets" | "brochures",
  file: File | Blob,
  filename: string,
): Promise<{ path: string; publicUrl: string }> {
  const prep = await adminApi<{ path: string; signedUrl: string; publicUrl: string }>("/uploads", {
    method: "POST",
    body: { bucket, filename },
  });
  const put = await fetch(prep.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error("파일 업로드에 실패했습니다.");
  return { path: prep.path, publicUrl: prep.publicUrl };
}

/**
 * 이미지 리사이즈 (F5 — sm/lg 자동 생성).
 * 브라우저 canvas 로 최대 폭에 맞춰 축소한 WebP Blob 을 만든다.
 * WebP 인코딩이 안 되는 브라우저(구형 Safari)는 JPEG 로 폴백 — 확장자는 imageExt() 로 결정.
 */
export const imageExt = (blob: Blob): "webp" | "jpg" =>
  blob.type === "image/webp" ? "webp" : "jpg";

export function resizeImage(file: File, maxWidth: number, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas 미지원 브라우저입니다."));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.type === "image/webp") return resolve(blob);
          canvas.toBlob(
            (jpeg) => (jpeg ? resolve(jpeg) : reject(new Error("이미지 변환 실패"))),
            "image/jpeg",
            quality,
          );
        },
        "image/webp",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };
    img.src = url;
  });
}

/* ================================================= 공통 타입·라벨 (서버 응답과 1:1) */

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
  source: string | null;
  status: InquiryStatus;
  assignee: string | null;
  memo: string | null;
  createdAt: string;
  retentionUntil: string;
}

export interface Application {
  id: string;
  postingId: string | null;
  postingTitle: string;
  name: string;
  phone: string;
  email: string;
  careerYears: string | null;
  message: string | null;
  hasResume: boolean;
  portfolioUrl: string | null;
  status: ApplicationStatus;
  memo: string | null;
  createdAt: string;
  retentionUntil: string;
}

export interface AdminJob {
  id: string;
  title: string;
  group: string;
  team: string;
  employment: string;
  career: string;
  location: string;
  deadline: string | null;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  preferred: string[];
  status: "draft" | "published" | "closed";
  sortOrder: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWork {
  id: string;
  client: string;
  category: "IMC" | "SA" | "DA" | "VIRAL";
  industry: string | null;
  team: string | null;
  mediaType: string | null;
  objective: string | null;
  strategy: string | null;
  media: string | null;
  result: string | null;
  thumbPath: string | null;
  heroPath: string | null;
  rank: number | null;
  status: "draft" | "published";
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  type: "inquiry" | "application";
  title: string;
  link: string;
  createdAt: string;
  read: boolean;
}

export interface AdminPopup {
  id: string;
  title: string;
  imagePath: string | null;
  linkUrl: string | null;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
}

export interface AdminBrochure {
  id: string;
  version: string;
  filePath: string;
  fileSize: number;
  isCurrent: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
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

export const JOB_STATUS_LABEL: Record<AdminJob["status"], string> = {
  draft: "임시저장",
  published: "게시중",
  closed: "마감",
};

/* ================================================= 표시 유틸 */

export function timeAgo(iso: string): string {
  const m = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return formatDate(iso);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`;
  if (n >= 1024) return `${Math.round(n / 1024)}KB`;
  return `${n}B`;
}
