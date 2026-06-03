import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { findCourseInIndex } from "@/lib/catalog/reader";
import { createNotification } from "@/lib/db/repositories";
import { dbGet, dbRun, newId } from "@/lib/db/client";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const { id } = await params;
  const reqRow = await dbGet<{
    id: string;
    user_id: string;
    course_id: string;
    status: string;
  }>("SELECT * FROM access_requests WHERE id = ?", [id]);

  if (!reqRow || reqRow.status !== "pending") {
    return jsonError("Yêu cầu không hợp lệ");
  }

  const course = findCourseInIndex(reqRow.course_id);

  await dbRun(
    `UPDATE access_requests SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`,
    [user.id, id]
  );

  const existing = await dbGet(
    "SELECT id FROM user_courses WHERE user_id = ? AND course_id = ?",
    [reqRow.user_id, reqRow.course_id]
  );
  if (!existing) {
    await dbRun(
      `INSERT INTO user_courses (id, user_id, course_id, granted_by) VALUES (?, ?, ?, ?)`,
      [newId(), reqRow.user_id, reqRow.course_id, user.id]
    );
  }

  await createNotification(
    reqRow.user_id,
    "REQUEST_APPROVED",
    "Yêu cầu mở khóa được duyệt",
    `Bạn đã được cấp quyền khóa học: ${course?.name ?? reqRow.course_id}`
  );

  return jsonOk({ ok: true });
}
