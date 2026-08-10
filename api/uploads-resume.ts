import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { adminDb } from "./_lib/db";
import { clientIp, fail, ok, rateLimited } from "./_lib/http";

/**
 * POST /api/uploads-resume — 이력서 업로드용 signed URL 발급 (§3.2).
 * 브라우저가 이 URL 로 Storage 'resumes' 비공개 버킷에 직접 업로드한다.
 * 확장자 화이트리스트·용량(10MB)은 §7-6. 용량은 업로드 시 Storage 정책으로도 제한 권장.
 */
const ALLOWED_EXT = ["pdf", "doc", "docx", "hwp", "hwpx"];

const Body = z.object({
  filename: z.string().trim().min(1).max(200),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return fail(res, "method_not_allowed", "POST only", 405);
  if (rateLimited(clientIp(req), 10)) {
    return fail(res, "rate_limited", "잠시 후 다시 시도해 주세요.", 429);
  }

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return fail(res, "invalid_body", "파일명을 확인해 주세요.", 422);

  const ext = parsed.data.filename.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext)) {
    return fail(res, "bad_extension", `허용 형식: ${ALLOWED_EXT.join(", ")}`, 422);
  }

  // 경로에 원본 파일명을 쓰지 않는다 — 한글·특수문자·중복 문제 차단
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  const db = adminDb();
  const { data, error } = await db.storage.from("resumes").createSignedUploadUrl(path);
  if (error) return fail(res, "storage_error", "업로드 준비에 실패했습니다.", 500);

  return ok(res, { path, token: data.token, signedUrl: data.signedUrl });
}
