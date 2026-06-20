import type { CourseTreeNode } from "@/lib/types";

export function naturalKey(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .split(/(\d+)/)
    .map((s) => (/^\d+$/.test(s) ? s.padStart(20, "0") : s.toLowerCase()))
    .join("\x00");
}

export function compareNaturalNames(a: string, b: string): number {
  return naturalKey(a).localeCompare(naturalKey(b), "vi");
}

export function sortCourseTree(node: CourseTreeNode): CourseTreeNode {
  const folders = node.children.filter((c) => c.type !== "video");
  const videos = node.children.filter((c) => c.type === "video");

  folders.sort((a, b) => compareNaturalNames(a.name, b.name));
  videos.sort((a, b) => compareNaturalNames(a.name, b.name));

  return {
    ...node,
    children: [...folders.map(sortCourseTree), ...videos],
  };
}

export function isVideoLeafGroup(node: CourseTreeNode): boolean {  return (
    node.children.length > 0 &&
    node.children.every((c) => c.type === "video")
  );
}

export function findVideoPath(
  tree: CourseTreeNode,
  videoId: string
): CourseTreeNode[] | null {
  const path: CourseTreeNode[] = [];

  function walk(node: CourseTreeNode): boolean {
    path.push(node);
    if (node.type === "video" && node.fileId === videoId) return true;
    for (const child of node.children) {
      if (walk(child)) return true;
    }
    path.pop();
    return false;
  }

  return walk(tree) ? path : null;
}

export function findLessonScope(
  tree: CourseTreeNode,
  videoId: string
): CourseTreeNode | null {
  let scope: CourseTreeNode | null = null;

  function walk(node: CourseTreeNode): boolean {
    if (node.type === "video" && node.fileId === videoId) return true;
    let found = false;
    for (const child of node.children) {
      if (walk(child)) found = true;
    }
    if (found && node.type === "lesson") {
      scope = node;
    }
    return found;
  }

  if (walk(tree) && scope) return scope;

  const videoPath = findVideoPath(tree, videoId);
  if (!videoPath || videoPath.length < 2) return null;
  return videoPath[videoPath.length - 2];
}

export function flattenVideoIds(node: CourseTreeNode): string[] {
  const ids: string[] = [];
  const walk = (n: CourseTreeNode) => {
    if (n.type === "video" && n.fileId) ids.push(n.fileId);
    n.children.forEach(walk);
  };
  walk(node);
  return ids;
}

export function getNextVideoIdInScope(
  scope: CourseTreeNode,
  currentVideoId: string
): string | null {
  const list = flattenVideoIds(scope);
  const i = list.indexOf(currentVideoId);
  return i >= 0 && i < list.length - 1 ? list[i + 1] : null;
}

export function firstVideoInNode(
  node: CourseTreeNode
): { id: string; name: string } | null {
  if (node.type === "video" && node.fileId) {
    return { id: node.fileId, name: node.name };
  }
  for (const child of node.children) {
    const v = firstVideoInNode(child);
    if (v) return v;
  }
  return null;
}
