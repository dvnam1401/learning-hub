import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/lib/types";

const COOKIE_NAME = "lh_session";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      username: payload.username as string,
      role: payload.role as SessionUser["role"],
      displayName: (payload.displayName as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
