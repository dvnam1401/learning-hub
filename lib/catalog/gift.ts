import type { CatalogCourse } from "@/lib/types";
import { stripOrderPrefix } from "./categories";
import { getCatalogIndex } from "./reader";

export function isGiftCategoryFolderName(name: string): boolean {
  const key = stripOrderPrefix(name).toLowerCase();
  return key.startsWith("quà tặng");
}

function pathFolderSegments(path: string): string[] {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return [];
  return parts.slice(0, -1);
}

export function isGiftCourse(course: CatalogCourse): boolean {
  return pathFolderSegments(course.path).some(isGiftCategoryFolderName);
}

export function getGiftCourses(): CatalogCourse[] {
  return getCatalogIndex().filter(isGiftCourse);
}

export function getGiftCourseIds(): string[] {
  return getGiftCourses().map((c) => c.id);
}
