import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { findCourseInIndex } from "@/lib/catalog/reader";
import { isHiddenUserCourse } from "@/lib/catalog/hidden-categories";
import { searchCatalog } from "@/lib/catalog/search";
import { resolveCourseUnlocked } from "@/lib/catalog/folder-access";
import { getUserCourseIds, getUserFolderGrantIds } from "@/lib/db/repositories";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const q = request.nextUrl.searchParams.get("q") ?? "";
  let results = searchCatalog(q);
  if (user.role !== "ADMIN") {
    results = results.filter((r) => {
      const course = findCourseInIndex(r.courseId);
      return course && !isHiddenUserCourse(course);
    });
  }
  const granted = new Set(await getUserCourseIds(user.id));
  const folderGrants = new Set(await getUserFolderGrantIds(user.id));

  return jsonOk({
    results: results.map((r) => {
      const course = findCourseInIndex(r.courseId);
      const unlocked = course
        ? resolveCourseUnlocked(course, user.role, granted, folderGrants)
        : user.role === "ADMIN";
      return {
        ...r,
        unlocked,
      };
    }),
  });
}
