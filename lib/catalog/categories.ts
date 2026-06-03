import type { CatalogCourse } from "@/lib/types";

export type CategorySummary = {
  id: string;
  name: string;
  courseCount: number;
  videoCount: number;
};

export type AdminCatalogNode = {
  id: string;
  name: string;
  type: "category" | "subcategory" | "course";
  courseCount?: number;
  videoCount?: number;
  courseId?: string;
  hidden?: boolean;
  children: AdminCatalogNode[];
};

function pathParts(path: string): string[] {
  return path.split("/").filter(Boolean);
}

export function stripOrderPrefix(name: string): string {
  return name.replace(/^\d+\.\s*/, "").trim();
}

export function decodeCategoryParam(categoryParam: string): string {
  try {
    return decodeURIComponent(categoryParam);
  } catch {
    return categoryParam;
  }
}

export function topCategoryKeyFromPath(path: string): string {
  return stripOrderPrefix(getTopCategoryName(path));
}

export function getOrderPrefix(name: string): number {
  const m = name.match(/^(\d+)\./);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

export function compareFolderNames(a: string, b: string): number {
  const pa = getOrderPrefix(a);
  const pb = getOrderPrefix(b);
  if (pa !== pb) return pa - pb;
  return stripOrderPrefix(a).localeCompare(stripOrderPrefix(b), "vi");
}

function pickDisplayName(current: string, incoming: string): string {
  return getOrderPrefix(incoming) < getOrderPrefix(current) ? incoming : current;
}

function findFolderChild(
  parent: AdminCatalogNode,
  name: string,
  type: "category" | "subcategory"
): AdminCatalogNode {
  const key = stripOrderPrefix(name);
  let node = parent.children.find(
    (n) => n.type !== "course" && stripOrderPrefix(n.name) === key
  );
  if (!node) {
    node = {
      id: `${parent.id}/${key}`,
      name,
      type,
      courseCount: 0,
      videoCount: 0,
      children: [],
    };
    parent.children.push(node);
  } else {
    node.name = pickDisplayName(node.name, name);
  }
  return node;
}

export function getTopCategoryName(path: string): string {
  const parts = pathParts(path);
  return parts[1] ?? parts[0] ?? "Khác";
}

export function getSubCategoryName(path: string): string | null {
  const parts = pathParts(path);
  return parts[2] ?? null;
}

export function getTopCategories(courses: CatalogCourse[]): CategorySummary[] {
  const map = new Map<string, CategorySummary>();

  for (const c of courses) {
    const rawName = getTopCategoryName(c.path);
    const key = stripOrderPrefix(rawName);
    const hit = map.get(key);
    if (hit) {
      hit.courseCount += 1;
      hit.videoCount += c.videoCount;
      hit.name = pickDisplayName(hit.name, rawName);
    } else {
      map.set(key, {
        id: key,
        name: rawName,
        courseCount: 1,
        videoCount: c.videoCount,
      });
    }
  }

  return [...map.values()].sort((a, b) => compareFolderNames(a.name, b.name));
}

export function filterByTopCategory(
  courses: CatalogCourse[],
  categoryId: string
): CatalogCourse[] {
  const key = decodeCategoryParam(categoryId);
  return courses.filter((c) => topCategoryKeyFromPath(c.path) === key);
}

export function filterByCategoryPath(
  courses: CatalogCourse[],
  categoryPath: string
): CatalogCourse[] {
  const prefix = categoryPath.endsWith("/")
    ? categoryPath.slice(0, -1)
    : categoryPath;
  return courses.filter(
    (c) => c.path === prefix || c.path.startsWith(`${prefix}/`)
  );
}

export function buildAdminCatalogTree(
  courses: CatalogCourse[],
  hiddenIds: Set<string>
): AdminCatalogNode[] {
  const roots = new Map<string, AdminCatalogNode>();

  for (const c of courses) {
    const parts = pathParts(c.path);
    if (parts.length < 2) continue;

    const catName = parts[1];
    const catKey = stripOrderPrefix(catName);
    const catId = `cat:${catKey}`;
    let cat = roots.get(catKey);
    if (!cat) {
      cat = {
        id: catId,
        name: catName,
        type: "category",
        courseCount: 0,
        videoCount: 0,
        children: [],
      };
      roots.set(catKey, cat);
    } else {
      cat.name = pickDisplayName(cat.name, catName);
    }
    cat.courseCount! += 1;
    cat.videoCount! += c.videoCount;

    let parent: AdminCatalogNode = cat;
    if (parts.length >= 3) {
      const subName = parts[2];
      const sub = findFolderChild(cat, subName, "subcategory");
      sub.courseCount! += 1;
      sub.videoCount! += c.videoCount;
      parent = sub;
    }

    const exists = parent.children.some(
      (n) => n.type === "course" && n.courseId === c.id
    );
    if (!exists) {
      parent.children.push({
        id: c.id,
        name: c.name,
        type: "course",
        courseId: c.id,
        videoCount: c.videoCount,
        hidden: hiddenIds.has(c.id),
        children: [],
      });
    }
  }

  const sortNodes = (nodes: AdminCatalogNode[]) => {
    const folders = nodes.filter((n) => n.type !== "course");
    const items = nodes.filter((n) => n.type === "course");
    folders.sort((a, b) => compareFolderNames(a.name, b.name));
    items.sort((a, b) => compareFolderNames(a.name, b.name));
    for (const n of folders) {
      if (n.children.length) sortNodes(n.children);
    }
    nodes.length = 0;
    nodes.push(...folders, ...items);
  };

  const result = [...roots.values()];
  sortNodes(result);
  return result.sort((a, b) => compareFolderNames(a.name, b.name));
}
