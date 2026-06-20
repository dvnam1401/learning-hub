import type { CatalogCourse } from "@/lib/types";
import { stripOrderPrefix } from "./categories";
import { findCourseInIndex, getCatalogIndex } from "./reader";

export function isBundledGiftCourse(
  course: Pick<CatalogCourse, "name"> | CatalogCourse
): boolean {
  const key = stripOrderPrefix(course.name).toLowerCase();
  return key === "tặng kèm" || key.startsWith("tặng kèm");
}

export function subfolderPath(coursePath: string): string {
  const parts = coursePath.split("/").filter(Boolean);
  return parts.slice(0, -1).join("/");
}

export function findBundledGiftInSubfolder(
  subfolder: string
): CatalogCourse | undefined {
  return getCatalogIndex().find(
    (c) => isBundledGiftCourse(c) && subfolderPath(c.path) === subfolder
  );
}

export function getBundledGiftForCourse(
  courseId: string
): CatalogCourse | undefined {
  const course = findCourseInIndex(courseId);
  if (!course || isBundledGiftCourse(course)) return undefined;
  return findBundledGiftInSubfolder(subfolderPath(course.path));
}

export function computeGrantedSubfolders(
  grantedIds: Iterable<string>
): Set<string> {
  const subfolders = new Set<string>();
  for (const id of grantedIds) {
    const course = findCourseInIndex(id);
    if (course && !isBundledGiftCourse(course)) {
      subfolders.add(subfolderPath(course.path));
    }
  }
  return subfolders;
}

export function isBundledGiftUnlocked(
  course: CatalogCourse,
  grantedIds: Set<string>,
  grantedSubfolders: Set<string>
): boolean {
  if (!isBundledGiftCourse(course)) return false;
  if (grantedIds.has(course.id)) return true;
  return grantedSubfolders.has(subfolderPath(course.path));
}
