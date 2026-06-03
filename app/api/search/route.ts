import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { findCourseInIndex } from "@/lib/catalog/reader";
import { isGiftCourse } from "@/lib/catalog/gift";
import { searchCatalog } from "@/lib/catalog/search";
import { getUserCourseIds } from "@/lib/db/repositories";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const results = searchCatalog(q);
  const granted = new Set(await getUserCourseIds(user.id));

  return jsonOk({
    results: results.map((r) => {
      const course = findCourseInIndex(r.courseId);
      const gift = course ? isGiftCourse(course) : false;
      return {
        ...r,
        unlocked: user.role === "ADMIN" || granted.has(r.courseId) || gift,
      };
    }),
  });
}
