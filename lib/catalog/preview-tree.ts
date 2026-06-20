import type { CourseTreeNode } from "@/lib/types";

export type CoursePreviewNode = {
  id: string;
  name: string;
  type: "chapter" | "lesson" | "video";
  children: CoursePreviewNode[];
};

export function toPreviewTree(node: CourseTreeNode): CoursePreviewNode {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    children: node.children.map(toPreviewTree),
  };
}
