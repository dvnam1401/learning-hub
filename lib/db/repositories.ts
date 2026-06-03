import { getGiftCourseIds, isGiftCourse } from "@/lib/catalog/gift";
import { findCourseInIndex } from "@/lib/catalog/reader";
import { dbGet, dbQuery, dbRun, newId } from "./client";
import type { CourseOverride, SessionUser } from "@/lib/types";

export async function findUserByUsername(username: string) {
  return dbGet<{
    id: string;
    username: string;
    password_hash: string;
    role: string;
    status: string;
    display_name: string | null;
  }>("SELECT * FROM users WHERE username = ?", [username]);
}

export async function getUserCourseIds(userId: string): Promise<string[]> {
  const rows = await dbQuery<{ course_id: string }>(
    "SELECT course_id FROM user_courses WHERE user_id = ?",
    [userId]
  );
  return rows.map((r) => r.course_id);
}

export async function getCourseOverrides(): Promise<CourseOverride[]> {
  return dbQuery<CourseOverride>("SELECT * FROM course_overrides");
}

export async function getOverride(courseId: string) {
  return dbGet<CourseOverride>(
    "SELECT * FROM course_overrides WHERE course_id = ?",
    [courseId]
  );
}

export async function hasCourseAccess(
  userId: string,
  courseId: string,
  role: string
): Promise<boolean> {
  if (role === "ADMIN") return true;
  const course = findCourseInIndex(courseId);
  if (course && isGiftCourse(course)) return true;
  const row = await dbGet(
    "SELECT 1 FROM user_courses WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );
  return Boolean(row);
}

export async function grantGiftCoursesToUser(
  userId: string,
  grantedBy: string | null
) {
  for (const courseId of getGiftCourseIds()) {
    const exists = await dbGet(
      "SELECT id FROM user_courses WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );
    if (!exists) {
      await dbRun(
        `INSERT INTO user_courses (id, user_id, course_id, granted_by) VALUES (?, ?, ?, ?)`,
        [newId(), userId, courseId, grantedBy]
      );
    }
  }
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string
) {
  await dbRun(
    `INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, ?, ?, ?)`,
    [newId(), userId, type, title, body ?? null]
  );
}

export async function getUnreadCount(userId: string): Promise<number> {
  const row = await dbGet<{ c: number }>(
    "SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0",
    [userId]
  );
  return row?.c ?? 0;
}

export async function listUsers() {
  return dbQuery<{
    id: string;
    username: string;
    role: string;
    status: string;
    display_name: string | null;
    created_at: string;
  }>(
    "SELECT id, username, role, status, display_name, created_at FROM users ORDER BY created_at DESC"
  );
}

export async function countPendingRequests(): Promise<number> {
  const row = await dbGet<{ c: number }>(
    "SELECT COUNT(*) as c FROM access_requests WHERE status = 'pending'"
  );
  return row?.c ?? 0;
}

export function toSessionUser(row: {
  id: string;
  username: string;
  role: string;
  display_name: string | null;
}): SessionUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role as SessionUser["role"],
    displayName: row.display_name,
  };
}
