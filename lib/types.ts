export type UserRole = "ADMIN" | "USER";

export interface SessionUser {
  id: string;
  username: string;
  role: UserRole;
  displayName: string | null;
}

export interface CatalogCourse {
  id: string;
  name: string;
  path: string;
  videoCount: number;
  rootSource: string;
  categoryPath?: string;
}

export interface CourseTreeNode {
  id: string;
  name: string;
  type: "chapter" | "lesson" | "video";
  parentId: string | null;
  fileId?: string;
  mimeType?: string;
  children: CourseTreeNode[];
}

export interface SearchIndexEntry {
  id: string;
  courseId: string;
  type: "course" | "chapter" | "lesson" | "video";
  name: string;
  path: string;
}

export interface CourseOverride extends Record<string, unknown> {
  course_id: string;
  display_name: string | null;
  thumbnail_url: string | null;
  hidden: number;
}
