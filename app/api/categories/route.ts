import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCatalogIndex } from "@/lib/catalog/reader";
import { getTopCategories } from "@/lib/catalog/categories";
import {
  excludeHiddenUserCourses,
  filterHiddenUserCategories,
} from "@/lib/catalog/hidden-categories";
import { getCourseOverrides } from "@/lib/db/repositories";

export async function GET() {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const overrides = await getCourseOverrides();
  const hiddenSet = new Set(
    overrides.filter((o) => o.hidden).map((o) => o.course_id)
  );

  let courses = getCatalogIndex().filter((c) => !hiddenSet.has(c.id));
  if (user.role !== "ADMIN") {
    courses = excludeHiddenUserCourses(courses);
  }
  let categories = getTopCategories(courses);
  if (user.role !== "ADMIN") {
    categories = filterHiddenUserCategories(categories);
  }
  return jsonOk({ categories });
}
