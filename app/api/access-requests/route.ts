import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isHiddenUserCourse } from "@/lib/catalog/hidden-categories";
import { isBundledGiftCourse } from "@/lib/catalog/bundled-gift";
import { findCourseInIndex } from "@/lib/catalog/reader";
import { dbGet, dbRun, newId } from "@/lib/db/client";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const courseId = String(body.courseId ?? "");
  const note = body.note ? String(body.note) : null;

  const course = findCourseInIndex(courseId);
  if (!course) {
    return jsonError("Khóa học không tồn tại");
  }
  if (user.role !== "ADMIN" && isHiddenUserCourse(course)) {
    return jsonError("Khóa học không tồn tại");
  }
  if (isBundledGiftCourse(course)) {
    return jsonError("Khóa tặng kèm được mở cùng khóa chính trong nhóm");
  }

  const existing = await dbGet(
    `SELECT id FROM access_requests WHERE user_id = ? AND course_id = ? AND status = 'pending'`,
    [user.id, courseId]
  );
  if (existing) return jsonError("Đã có yêu cầu đang chờ duyệt");

  await dbRun(
    `INSERT INTO access_requests (id, user_id, course_id, note) VALUES (?, ?, ?, ?)`,
    [newId(), user.id, courseId, note]
  );

  return jsonOk({ ok: true });
}
