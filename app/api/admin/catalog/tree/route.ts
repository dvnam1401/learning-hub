import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCatalogIndex } from "@/lib/catalog/reader";
import { buildAdminCatalogTree } from "@/lib/catalog/categories";
import { getCourseOverrides } from "@/lib/db/repositories";

export async function GET() {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const overrides = await getCourseOverrides();
  const hiddenSet = new Set(
    overrides.filter((o) => o.hidden).map((o) => o.course_id)
  );
  const overrideMap = new Map(overrides.map((o) => [o.course_id, o]));

  const courses = getCatalogIndex().map((c) => {
    const o = overrideMap.get(c.id);
    return { ...c, name: o?.display_name || c.name };
  });

  return jsonOk({
    tree: buildAdminCatalogTree(courses, hiddenSet),
    stats: {
      courseCount: courses.length,
      videoCount: courses.reduce((s, c) => s + c.videoCount, 0),
    },
  });
}
