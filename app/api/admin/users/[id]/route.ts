import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/password";
import { dbGet, dbRun } from "@/lib/db/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const { id } = await params;
  const body = await request.json();

  const target = await dbGet<{ id: string }>(
    "SELECT id FROM users WHERE id = ?",
    [id]
  );
  if (!target) return jsonError("User không tồn tại", 404);

  if (body.username !== undefined) {
    const username = String(body.username).trim();
    if (!username) return jsonError("Username không hợp lệ");
    const exists = await dbGet("SELECT id FROM users WHERE username = ? AND id != ?", [
      username,
      id,
    ]);
    if (exists) return jsonError("Username đã tồn tại");
    await dbRun("UPDATE users SET username = ? WHERE id = ?", [username, id]);
  }

  if (body.role !== undefined) {
    if (id === user.id && body.role !== "ADMIN") {
      return jsonError("Không thể hạ quyền chính mình");
    }
    const role = body.role === "ADMIN" ? "ADMIN" : "USER";
    await dbRun("UPDATE users SET role = ? WHERE id = ?", [role, id]);
  }

  if (body.status) {
    if (id === user.id && body.status === "locked") {
      return jsonError("Không thể khóa chính mình");
    }
    const status = body.status === "locked" ? "locked" : "active";
    await dbRun("UPDATE users SET status = ? WHERE id = ?", [status, id]);
  }

  if (body.displayName !== undefined) {
    const displayName = body.displayName ? String(body.displayName).trim() : null;
    await dbRun("UPDATE users SET display_name = ? WHERE id = ?", [
      displayName,
      id,
    ]);
  }

  if (body.password) {
    const password = String(body.password);
    if (password.length < 6) return jsonError("Mật khẩu tối thiểu 6 ký tự");
    const hash = await hashPassword(password);
    await dbRun("UPDATE users SET password_hash = ? WHERE id = ?", [hash, id]);
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

  const target = await dbGet<{ id: string }>(
    "SELECT id FROM users WHERE id = ?",
    [id]
  );
  if (!target) return jsonError("User không tồn tại", 404);

  await dbRun("DELETE FROM user_courses WHERE user_id = ?", [id]);
  await dbRun("DELETE FROM user_folder_grants WHERE user_id = ?", [id]);
  await dbRun("DELETE FROM progress WHERE user_id = ?", [id]);
  await dbRun("DELETE FROM notifications WHERE user_id = ?", [id]);
  await dbRun("DELETE FROM access_requests WHERE user_id = ?", [id]);
  await dbRun("DELETE FROM users WHERE id = ?", [id]);
  return jsonOk({ ok: true });
}
