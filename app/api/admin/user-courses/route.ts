import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isGiftCourse } from "@/lib/catalog/gift";
import { getCatalogIndex } from "@/lib/catalog/reader";
import { createNotification } from "@/lib/db/repositories";
import { dbGet, dbQuery, dbRun, newId } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return jsonError("Thiếu userId");

  const granted = await dbQuery<{ course_id: string }>(
    "SELECT course_id FROM user_courses WHERE user_id = ?",
    [userId]
  );
  const grantedSet = new Set(granted.map((g) => g.course_id));

  const courses = getCatalogIndex().map((c) => ({
    ...c,
    granted: grantedSet.has(c.id) || isGiftCourse(c),
    isGift: isGiftCourse(c),
  }));

  return jsonOk({ courses });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await request.json();
  const userId = String(body.userId ?? "");
  const courseId = String(body.courseId ?? "");

  const exists = await dbGet(
    "SELECT id FROM user_courses WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );
  if (!exists) {
    await dbRun(
      `INSERT INTO user_courses (id, user_id, course_id, granted_by) VALUES (?, ?, ?, ?)`,
      [newId(), userId, courseId, user.id]
    );
    const course = getCatalogIndex().find((c) => c.id === courseId);
    await createNotification(
      userId,
      "COURSE_GRANTED",
      "Khóa học mới được cấp",
      course?.name ?? courseId
    );
  }

  return jsonOk({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const userId = request.nextUrl.searchParams.get("userId");
  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!userId || !courseId) return jsonError("Thiếu tham số");

  const course = getCatalogIndex().find((c) => c.id === courseId);
  if (course && isGiftCourse(course)) {
    return jsonError("Không thể thu hồi khóa quà tặng mặc định", 400);
  }

  await dbRun(
    "DELETE FROM user_courses WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );

  return jsonOk({ ok: true });
}
