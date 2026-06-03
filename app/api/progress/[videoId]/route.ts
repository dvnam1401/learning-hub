import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasCourseAccess } from "@/lib/db/repositories";
import { dbGet, dbRun, newId } from "@/lib/db/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const { videoId } = await params;
  const row = await dbGet<{
    current_time: number;
    completed: number;
    course_id: string;
  }>(
    "SELECT current_time, completed, course_id FROM progress WHERE user_id = ? AND video_id = ?",
    [user.id, videoId]
  );

  return jsonOk({ progress: row ?? null });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const { videoId } = await params;
  const body = await request.json();
  const courseId = String(body.courseId ?? "");
  const currentTime = Number(body.currentTime ?? 0);
  const duration = Number(body.duration ?? 0);

  const allowed = await hasCourseAccess(user.id, courseId, user.role);
  if (!allowed) return jsonError("Forbidden", 403);

  const completed =
    duration > 0 && currentTime / duration >= 0.9 ? 1 : body.completed ? 1 : 0;

  const existing = await dbGet(
    "SELECT id FROM progress WHERE user_id = ? AND video_id = ?",
    [user.id, videoId]
  );

  if (existing) {
    await dbRun(
      `UPDATE progress SET current_time = ?, completed = ?, course_id = ?, updated_at = datetime('now')
       WHERE user_id = ? AND video_id = ?`,
      [currentTime, completed, courseId, user.id, videoId]
    );
  } else {
    await dbRun(
      `INSERT INTO progress (id, user_id, video_id, course_id, current_time, completed)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newId(), user.id, videoId, courseId, currentTime, completed]
    );
  }

  return jsonOk({ ok: true, completed: Boolean(completed) });
}
