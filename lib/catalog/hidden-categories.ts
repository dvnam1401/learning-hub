import type { CatalogCourse } from "@/lib/types";
import { stripOrderPrefix, topCategoryKeyFromPath } from "./categories";

const HIDDEN_USER_ROOT_KEYS = new Set([
  "Khóa Học Giá Hời 2026",
  "Khóa Học Giá Hời 2026 2",
]);

export function isHiddenUserCategoryKey(key: string): boolean {
  return HIDDEN_USER_ROOT_KEYS.has(stripOrderPrefix(key));
}

export function isHiddenUserCategoryFolderName(name: string): boolean {
  return isHiddenUserCategoryKey(stripOrderPrefix(name));
}

export function isHiddenUserCourse(course: CatalogCourse): boolean {
  return isHiddenUserCategoryKey(topCategoryKeyFromPath(course.path));
}

export function excludeHiddenUserCourses(
  courses: CatalogCourse[]
): CatalogCourse[] {
  return courses.filter((c) => !isHiddenUserCourse(c));
}

export function filterHiddenUserCategories<T extends { id: string }>(
  categories: T[]
): T[] {
  return categories.filter((c) => !isHiddenUserCategoryKey(c.id));
}
