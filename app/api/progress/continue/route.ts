import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { findCourseInIndex } from "@/lib/catalog/reader";
import { dbQuery } from "@/lib/db/client";

export async function GET() {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const rows = await dbQuery<{
    video_id: string;
    course_id: string;
    current_time: number;
    completed: number;
    updated_at: string;
  }>(
    `SELECT video_id, course_id, current_time, completed, updated_at
     FROM progress WHERE user_id = ? AND completed = 0
     ORDER BY updated_at DESC LIMIT 10`,
    [user.id]
  );

  const items = rows.map((r) => {
    const course = findCourseInIndex(r.course_id);
    return {
      ...r,
      courseName: course?.name ?? r.course_id,
    };
  });

  return jsonOk({ items });
}
