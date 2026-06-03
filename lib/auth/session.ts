import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "./jwt";
import type { SessionUser } from "@/lib/types";

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(
  user: SessionUser | null,
  role: SessionUser["role"]
): SessionUser {
  if (!user) throw new Error("Unauthorized");
  if (user.role !== role && role === "ADMIN") throw new Error("Forbidden");
  return user;
}
