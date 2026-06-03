import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCatalogIndex } from "@/lib/catalog/reader";
import { getTopCategories } from "@/lib/catalog/categories";
import { getCourseOverrides } from "@/lib/db/repositories";

export async function GET() {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const overrides = await getCourseOverrides();
  const hiddenSet = new Set(
    overrides.filter((o) => o.hidden).map((o) => o.course_id)
  );

  const courses = getCatalogIndex().filter((c) => !hiddenSet.has(c.id));
  return jsonOk({ categories: getTopCategories(courses) });
}
