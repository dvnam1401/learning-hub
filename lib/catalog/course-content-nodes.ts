import type { CoursePreviewNode } from "./preview-tree";
import type { GrantStatus } from "./folder-access";

export type CourseContentNodeType =
  | "chapter"
  | "lesson"
  | "video";

export type CourseContentNode = {
  id: string;
  name: string;
  type: CourseContentNodeType;
  children: CourseContentNode[];
};

export function mapPreviewToContentNodes(
  node: CoursePreviewNode,
  flattenSingleWrapper = true
): CourseContentNode[] {
  if (node.type === "video") {
    return [{ id: node.id, name: node.name, type: "video", children: [] }];
  }
  const children = node.children.flatMap((child) =>
    mapPreviewToContentNodes(child, false)
  );
  if (node.type === "chapter" || node.type === "lesson") {
    if (
      flattenSingleWrapper &&
      children.length > 0 &&
      children.every((child) => child.type === "video")
    ) {
      return children;
    }
    return [
      {
        id: node.id,
        name: node.name,
        type: node.type,
        children,
      },
    ];
  }
  return children;
}

export function contentNodesGrantStatus(
  parentStatus: GrantStatus
): GrantStatus {
  if (parentStatus === "direct" || parentStatus === "inherited") {
    return "inherited";
  }
  if (parentStatus === "gift") return "gift";
  return "none";
}
