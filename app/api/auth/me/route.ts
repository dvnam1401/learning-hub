import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET() {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);
  return jsonOk({ user });
}
