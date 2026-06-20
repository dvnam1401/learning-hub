import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getBundledGiftForCourse } from "@/lib/catalog/bundled-gift";
import { findCourseInIndex } from "@/lib/catalog/reader";
import { dbGet, dbRun } from "@/lib/db/client";
import {
  createNotification,
  grantCourseWithBundledGift,
} from "@/lib/db/repositories";

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
  const bundledGift = getBundledGiftForCourse(reqRow.course_id);

  await dbRun(
    `UPDATE access_requests SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`,
    [user.id, id]
  );

  await grantCourseWithBundledGift(reqRow.user_id, reqRow.course_id, user.id);

  const body = bundledGift
    ? `Bạn đã được cấp quyền khóa học: ${course?.name ?? reqRow.course_id} (kèm ${bundledGift.name})`
    : `Bạn đã được cấp quyền khóa học: ${course?.name ?? reqRow.course_id}`;

  await createNotification(
    reqRow.user_id,
    "REQUEST_APPROVED",
    "Yêu cầu mở khóa được duyệt",
    body
  );

  return jsonOk({ ok: true });
}
