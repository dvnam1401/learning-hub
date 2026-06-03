import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/password";
import { grantGiftCoursesToUser, listUsers } from "@/lib/db/repositories";
import { dbGet, dbRun, newId } from "@/lib/db/client";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);
  const users = await listUsers();
  const withCounts = await Promise.all(
    users.map(async (u) => {
      const row = await dbGet<{ c: number }>(
        "SELECT COUNT(*) as c FROM user_courses WHERE user_id = ?",
        [u.id]
      );
      return { ...u, courseCount: row?.c ?? 0 };
    })
  );
  return jsonOk({ users: withCounts });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const body = await request.json();
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const role = body.role === "ADMIN" ? "ADMIN" : "USER";
  const displayName = body.displayName ? String(body.displayName) : null;

  if (!username || !password) return jsonError("Thiếu thông tin");

  const exists = await dbGet("SELECT id FROM users WHERE username = ?", [
    username,
  ]);
  if (exists) return jsonError("Username đã tồn tại");

  const hash = await hashPassword(password);
  const userId = newId();
  await dbRun(
    `INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, ?, ?, ?)`,
    [userId, username, hash, role, displayName]
  );

  if (role === "USER") {
    await grantGiftCoursesToUser(userId, user.id);
  }

  return jsonOk({ ok: true });
}
