import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCatalogStats } from "@/lib/catalog/reader";
import { countPendingRequests } from "@/lib/db/repositories";
import { dbGet } from "@/lib/db/client";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const stats = getCatalogStats();
  const userRow = await dbGet<{ c: number }>(
    "SELECT COUNT(*) as c FROM users WHERE role = 'USER'"
  );
  const pending = await countPendingRequests();

  return jsonOk({
    totalUsers: userRow?.c ?? 0,
    totalCourses: stats.courseCount,
    totalVideos: stats.videoCount,
    pendingRequests: pending,
  });
}
