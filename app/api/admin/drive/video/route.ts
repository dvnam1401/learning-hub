import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isDriveConfigured } from "@/lib/drive/client";
import { cacheStatusForFile } from "@/lib/drive/cache";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  if (!isDriveConfigured()) {
    return jsonError("Google Drive chưa cấu hình", 503);
  }

  const fileId = new URL(request.url).searchParams.get("fileId");
  if (!fileId) return jsonError("Thiếu fileId", 400);

  const status = await cacheStatusForFile(fileId);
  return jsonOk(status);
}
