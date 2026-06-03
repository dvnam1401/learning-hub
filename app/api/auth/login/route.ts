import { NextRequest } from "next/server";
import { COOKIE_NAME, signToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import { jsonError, jsonOk } from "@/lib/api/response";
import { findUserByUsername, toSessionUser } from "@/lib/db/repositories";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");

  if (!username || !password) {
    return jsonError("Vui lòng nhập username và password");
  }

  const user = await findUserByUsername(username);
  if (!user || user.status === "locked") {
    return jsonError("Tài khoản không hợp lệ", 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return jsonError("Mật khẩu không đúng", 401);

  const session = toSessionUser(user);
  const token = await signToken(session);

  const res = jsonOk({ user: session });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
