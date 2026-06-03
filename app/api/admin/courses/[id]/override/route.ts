import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { dbRun } from "@/lib/db/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const { id: courseId } = await params;
  const body = await request.json();

  await dbRun(
    `INSERT INTO course_overrides (course_id, display_name, thumbnail_url, hidden, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(course_id) DO UPDATE SET
       display_name = COALESCE(excluded.display_name, display_name),
       thumbnail_url = COALESCE(excluded.thumbnail_url, thumbnail_url),
       hidden = COALESCE(excluded.hidden, hidden),
       updated_at = datetime('now')`,
    [
      courseId,
      body.displayName ?? null,
      body.thumbnailUrl ?? null,
      body.hidden !== undefined ? (body.hidden ? 1 : 0) : null,
    ]
  );

  return jsonOk({ ok: true });
}
