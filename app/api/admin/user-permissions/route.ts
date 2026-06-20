import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { buildAdminCatalogTree } from "@/lib/catalog/categories";
import { isGiftCourse } from "@/lib/catalog/gift";
import {
  annotatePermissionTree,
  filterPermissionTree,
  filterPermissionTreeByQuery,
} from "@/lib/catalog/permission-tree";
import { getCatalogIndex, findCourseInIndex } from "@/lib/catalog/reader";
import {
  createNotification,
  getCourseOverrides,
  getUserCourseIds,
  getUserFolderGrantIds,
  grantCourseWithBundledGift,
  grantFolderToUser,
  revokeFolderFromUser,
} from "@/lib/db/repositories";
import { dbRun } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return jsonError("Thiếu userId");

  const grantsOnly = request.nextUrl.searchParams.get("grantsOnly") === "1";

  const [grantedCourses, grantedFolders, overrides] = await Promise.all([
    getUserCourseIds(userId),
    getUserFolderGrantIds(userId),
    grantsOnly ? Promise.resolve([]) : getCourseOverrides(),
  ]);

  if (grantsOnly) {
    return jsonOk({
      grantedCourseIds: grantedCourses,
      grantedFolderIds: grantedFolders,
    });
  }

  const filter = request.nextUrl.searchParams.get("filter") ?? "all";
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const grantedFilter =
    filter === "granted" || filter === "not" ? filter : "all";

  const hiddenSet = new Set(
    overrides.filter((o) => o.hidden).map((o) => o.course_id)
  );
  const overrideMap = new Map(overrides.map((o) => [o.course_id, o]));

  const courses = getCatalogIndex().map((c) => {
    const o = overrideMap.get(c.id);
    return { ...c, name: o?.display_name || c.name };
  });

  const rawTree = buildAdminCatalogTree(courses, hiddenSet);
  let tree = annotatePermissionTree(
    rawTree,
    new Set(grantedCourses),
    new Set(grantedFolders)
  );
  tree = filterPermissionTree(tree, grantedFilter);
  tree = filterPermissionTreeByQuery(tree, q);

  return jsonOk({
    tree,
    grantedCourseIds: grantedCourses,
    grantedFolderIds: grantedFolders,
  });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await request.json();
  const userId = String(body.userId ?? "");
  const targetType = String(body.targetType ?? "");
  const targetId = String(body.targetId ?? "");

  if (!userId || !targetId) return jsonError("Thiếu tham số");

  if (targetType === "folder") {
    if (!targetId.startsWith("cat:")) return jsonError("Folder không hợp lệ");
    await grantFolderToUser(userId, targetId, user.id);
    return jsonOk({ ok: true });
  }

  if (targetType === "course") {
    const course = findCourseInIndex(targetId);
    if (course && isGiftCourse(course)) {
      return jsonError("Khóa quà tặng mặc định không cần cấp quyền", 400);
    }
    const granted = await grantCourseWithBundledGift(userId, targetId, user.id);
    if (granted.length) {
      await createNotification(
        userId,
        "COURSE_GRANTED",
        "Khóa học mới được cấp",
        course?.name ?? targetId
      );
    }
    return jsonOk({ ok: true });
  }

  return jsonError("targetType không hợp lệ");
}

export async function DELETE(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const userId = request.nextUrl.searchParams.get("userId");
  const targetType = request.nextUrl.searchParams.get("targetType");
  const targetId = request.nextUrl.searchParams.get("targetId");

  if (!userId || !targetId || !targetType) return jsonError("Thiếu tham số");

  if (targetType === "folder") {
    await revokeFolderFromUser(userId, targetId);
    return jsonOk({ ok: true });
  }

  if (targetType === "course") {
    const course = findCourseInIndex(targetId);
    if (course && isGiftCourse(course)) {
      return jsonError("Không thể thu hồi khóa quà tặng mặc định", 400);
    }
    await dbRun(
      "DELETE FROM user_courses WHERE user_id = ? AND course_id = ?",
      [userId, targetId]
    );
    return jsonOk({ ok: true });
  }

  return jsonError("targetType không hợp lệ");
}
