import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCatalogIndex } from "@/lib/catalog/reader";
import {
  filterByCategoryPath,
  filterByTopCategory,
} from "@/lib/catalog/categories";
import { isGiftCourse } from "@/lib/catalog/gift";
import {
  getCourseOverrides,
  getUserCourseIds,
} from "@/lib/db/repositories";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const filter = request.nextUrl.searchParams.get("filter");
  const category = request.nextUrl.searchParams.get("category");
  const categoryPath = request.nextUrl.searchParams.get("categoryPath");
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const pageParam = request.nextUrl.searchParams.get("page");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const usePagination = pageParam !== null || limitParam !== null;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(limitParam ?? "50", 10)));
  const granted = await getUserCourseIds(user.id);
  const grantedSet = new Set(granted);
  const overrides = await getCourseOverrides();
  const hiddenSet = new Set(
    overrides.filter((o) => o.hidden).map((o) => o.course_id)
  );
  const overrideMap = new Map(overrides.map((o) => [o.course_id, o]));

  let courses = getCatalogIndex().filter((c) => !hiddenSet.has(c.id));

  if (category) {
    courses = filterByTopCategory(courses, category);
  }
  if (categoryPath) {
    courses = filterByCategoryPath(courses, categoryPath);
  }
  if (q) {
    courses = courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.path.toLowerCase().includes(q) ||
        (c.categoryPath ?? "").toLowerCase().includes(q)
    );
  }

  const userHasCourse = (c: (typeof courses)[0]) =>
    user.role === "ADMIN" || grantedSet.has(c.id) || isGiftCourse(c);

  if (user.role !== "ADMIN" && filter === "mine") {
    courses = courses.filter((c) => userHasCourse(c));
  }

  const result = courses.map((c) => {
    const o = overrideMap.get(c.id);
    return {
      ...c,
      name: o?.display_name || c.name,
      thumbnailUrl: o?.thumbnail_url ?? null,
      hidden: !!o?.hidden,
      unlocked: userHasCourse(c),
    };
  });

  const total = result.length;

  if (filter === "unlocked") {
    const filtered = result.filter((c) => c.unlocked);
    if (usePagination) {
      const start = (page - 1) * limit;
      return jsonOk({
        courses: filtered.slice(start, start + limit),
        total: filtered.length,
        page,
        limit,
      });
    }
    return jsonOk({ courses: filtered, total: filtered.length });
  }
  if (filter === "locked") {
    const filtered = result.filter((c) => !c.unlocked);
    if (usePagination) {
      const start = (page - 1) * limit;
      return jsonOk({
        courses: filtered.slice(start, start + limit),
        total: filtered.length,
        page,
        limit,
      });
    }
    return jsonOk({ courses: filtered, total: filtered.length });
  }

  if (usePagination) {
    const start = (page - 1) * limit;
    return jsonOk({
      courses: result.slice(start, start + limit),
      total,
      page,
      limit,
    });
  }

  return jsonOk({ courses: result, total });
}
