import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { findCourseInIndex } from "@/lib/catalog/reader";
import { dbQuery } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const status = request.nextUrl.searchParams.get("status");
  let sql = `SELECT ar.*, u.username, u.display_name
    FROM access_requests ar
    JOIN users u ON u.id = ar.user_id
    ORDER BY ar.created_at DESC`;
  const params: unknown[] = [];

  if (status && status !== "all") {
    sql = `SELECT ar.*, u.username, u.display_name
      FROM access_requests ar
      JOIN users u ON u.id = ar.user_id
      WHERE ar.status = ?
      ORDER BY ar.created_at DESC`;
    params.push(status);
  }

  const rows = await dbQuery(sql, params);

  return jsonOk({
    requests: rows.map((r) => {
      const row = r as Record<string, unknown>;
      const course = findCourseInIndex(row.course_id as string);
      return {
        ...row,
        courseName: course?.name ?? row.course_id,
      };
    }),
  });
}
