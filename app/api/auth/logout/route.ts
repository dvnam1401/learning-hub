import { COOKIE_NAME } from "@/lib/auth/jwt";
import { jsonOk } from "@/lib/api/response";

export async function POST() {
  const res = jsonOk({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
