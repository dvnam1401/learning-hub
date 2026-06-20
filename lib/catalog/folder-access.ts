import type { CatalogCourse } from "@/lib/types";
import { stripOrderPrefix } from "./categories";
import { isGiftCourse } from "./gift";
import {
  computeGrantedSubfolders,
  isBundledGiftUnlocked,
} from "./bundled-gift";

export type GrantStatus = "none" | "direct" | "inherited" | "partial" | "gift";

export function parseFolderId(folderId: string): string[] | null {
  if (!folderId.startsWith("cat:")) return null;
  const keys = folderId.slice(4).split("/").filter(Boolean);
  return keys.length ? keys : null;
}

export function courseMatchesFolderId(
  course: CatalogCourse,
  folderId: string
): boolean {
  const keys = parseFolderId(folderId);
  if (!keys) return false;
  const parts = course.path.split("/").filter(Boolean);
  if (parts.length < 2) return false;
  if (stripOrderPrefix(parts[1]) !== keys[0]) return false;
  if (keys.length === 1) return true;
  if (parts.length < 3) return false;
  return stripOrderPrefix(parts[2]) === keys[1];
}

export function isCourseGrantedByFolders(
  course: CatalogCourse,
  folderIds: Iterable<string>
): boolean {
  for (const folderId of folderIds) {
    if (courseMatchesFolderId(course, folderId)) return true;
  }
  return false;
}

export function resolveCourseUnlocked(
  course: CatalogCourse,
  role: string,
  grantedCourseIds: Set<string>,
  grantedFolderIds: Set<string>
): boolean {
  if (role === "ADMIN") return true;
  if (isGiftCourse(course)) return true;
  if (grantedCourseIds.has(course.id)) return true;
  if (isCourseGrantedByFolders(course, grantedFolderIds)) return true;
  const subfolders = computeGrantedSubfolders(grantedCourseIds);
  return isBundledGiftUnlocked(course, grantedCourseIds, subfolders);
}
