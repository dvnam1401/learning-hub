import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { dbRun } from "@/lib/db/client";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;
  await dbRun(
    "UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?",
    [id, user.id]
  );

  return jsonOk({ ok: true });
}
