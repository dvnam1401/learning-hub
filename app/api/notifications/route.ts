import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { dbQuery } from "@/lib/db/client";

export async function GET() {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const rows = await dbQuery(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    [user.id]
  );

  return jsonOk({ notifications: rows });
}
