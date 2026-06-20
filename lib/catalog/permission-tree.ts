import type { AdminCatalogNode } from "./categories";
import type { GrantStatus } from "./folder-access";

export type PermissionTreeNode = Omit<AdminCatalogNode, "children"> & {
  grantStatus: GrantStatus;
  children: PermissionTreeNode[];
};

export function annotatePermissionTree(
  nodes: AdminCatalogNode[],
  grantedCourses: Set<string>,
  grantedFolders: Set<string>,
  inherited = false
): PermissionTreeNode[] {
  return nodes.map((node) => {
    if (node.type === "course") {
      const gift = !!node.isGift;
      const direct = node.courseId ? grantedCourses.has(node.courseId) : false;
      let grantStatus: GrantStatus = "none";
      if (gift) grantStatus = "gift";
      else if (direct) grantStatus = "direct";
      else if (inherited) grantStatus = "inherited";
      return { ...node, grantStatus, children: [] };
    }

    const direct = grantedFolders.has(node.id);
    const childInherited = inherited || direct;
    const children = annotatePermissionTree(
      node.children,
      grantedCourses,
      grantedFolders,
      childInherited
    );
    const hasGrantedChild = children.some((c) => c.grantStatus !== "none");
    let grantStatus: GrantStatus = "none";
    if (direct) grantStatus = "direct";
    else if (inherited) grantStatus = "inherited";
    else if (hasGrantedChild) grantStatus = "partial";
    return { ...node, grantStatus, children };
  });
}

export function filterPermissionTree(
  nodes: PermissionTreeNode[],
  filter: "all" | "granted" | "not"
): PermissionTreeNode[] {
  if (filter === "all") return nodes;

  const walk = (list: PermissionTreeNode[]): PermissionTreeNode[] => {
    const out: PermissionTreeNode[] = [];
    for (const node of list) {
      const children = walk(node.children);
      const granted = node.grantStatus !== "none";
      const match = filter === "granted" ? granted : !granted;
      if (match || children.length) {
        out.push({ ...node, children });
      }
    }
    return out;
  };

  return walk(nodes);
}

export function filterPermissionTreeByQuery(
  nodes: PermissionTreeNode[],
  q: string
): PermissionTreeNode[] {
  const query = q.trim().toLowerCase();
  if (!query) return nodes;

  const walk = (list: PermissionTreeNode[]): PermissionTreeNode[] => {
    const out: PermissionTreeNode[] = [];
    for (const node of list) {
      const children = walk(node.children);
      const selfMatch = node.name.toLowerCase().includes(query);
      if (selfMatch || children.length) {
        out.push({ ...node, children });
      }
    }
    return out;
  };

  return walk(nodes);
}
