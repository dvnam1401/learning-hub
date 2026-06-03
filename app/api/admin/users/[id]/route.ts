import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/password";
import { dbRun } from "@/lib/db/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const { id } = await params;
  const body = await request.json();

  if (body.status) {
    await dbRun("UPDATE users SET status = ? WHERE id = ?", [
      body.status,
      id,
    ]);
  }
  if (body.displayName !== undefined) {
    await dbRun("UPDATE users SET display_name = ? WHERE id = ?", [
      body.displayName,
      id,
    ]);
  }
  if (body.password) {
    const hash = await hashPassword(String(body.password));
    await dbRun("UPDATE users SET password_hash = ? WHERE id = ?", [
      hash,
      id,
    ]);
  }

  return jsonOk({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const { id } = await params;
  if (id === user.id) return jsonError("Không thể xóa chính mình");

  await dbRun("DELETE FROM users WHERE id = ?", [id]);
  return jsonOk({ ok: true });
}
