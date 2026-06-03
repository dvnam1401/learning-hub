import { NextRequest } from "next/server";
import { COOKIE_NAME, signToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import { jsonError, jsonOk } from "@/lib/api/response";
import { findUserByUsername, toSessionUser } from "@/lib/db/repositories";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
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

    const hash = user.password_hash;
    if (!hash || typeof hash !== "string") {
      return jsonError("Dữ liệu user trên D1 không hợp lệ", 500);
    }

    const valid = await verifyPassword(password, hash);
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
  } catch (err) {
    console.error("[auth/login]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("CLOUDFLARE") || msg.includes("D1")) {
      return jsonError(
        "Chưa cấu hình hoặc sai Cloudflare D1 trên Vercel (3 biến CLOUDFLARE_*).",
        500
      );
    }
    return jsonError(`Lỗi máy chủ: ${msg}`, 500);
  }
}
