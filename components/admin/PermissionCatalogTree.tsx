"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileVideo,
  Folder,
  FolderOpen,
  Layers,
  ListVideo,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { GrantStatus } from "@/lib/catalog/folder-access";
import {
  contentNodesGrantStatus,
  mapPreviewToContentNodes,
  type CourseContentNode,
} from "@/lib/catalog/course-content-nodes";

type PermissionNode = {
  id: string;
  name: string;
  type: "category" | "subcategory" | "course";
  courseCount?: number;
  videoCount?: number;
  courseId?: string;
  grantStatus: GrantStatus;
  children: PermissionNode[];
};

type DisplayNode = {
  id: string;
  name: string;
  type: PermissionNode["type"] | CourseContentNode["type"];
  courseCount?: number;
  videoCount?: number;
  courseId?: string;
  grantStatus: GrantStatus;
  children: DisplayNode[];
  grantable: boolean;
};

function statusLabel(status: GrantStatus): string {
  if (status === "direct") return "Đã cấp";
  if (status === "inherited") return "Kế thừa";
  if (status === "partial") return "Một phần";
  if (status === "gift") return "Quà tặng";
  return "";
}

function statusClass(status: GrantStatus): string {
  if (status === "direct") return "bg-green-100 text-green-700";
  if (status === "inherited") return "bg-indigo-100 text-indigo-700";
  if (status === "partial") return "bg-amber-100 text-amber-700";
  if (status === "gift") return "bg-slate-100 text-slate-500";
  return "";
}

function countLabel(node: DisplayNode): string {
  if (node.type === "course") {
    return `${node.videoCount ?? 0} video`;
  }
  if (node.type === "category" || node.type === "subcategory") {
    return `${node.courseCount ?? 0} khóa`;
  }
  return "";
}

function NodeIcon({
  node,
  open,
}: {
  node: DisplayNode;
  open: boolean;
}) {
  if (node.type === "video") {
    return <FileVideo size={14} className="shrink-0 text-indigo-500" />;
  }
  if (node.type === "chapter") {
    return <Layers size={14} className="shrink-0 text-sky-600" />;
  }
  if (node.type === "lesson") {
    return <ListVideo size={14} className="shrink-0 text-violet-500" />;
  }
  if (open) {
    return <FolderOpen size={14} className="shrink-0 text-amber-600" />;
  }
  return <Folder size={14} className="shrink-0 text-amber-600" />;
}

function GrantAction({
  node,
  busy,
  onGrant,
  onRevoke,
}: {
  node: DisplayNode;
  busy: boolean;
  onGrant: (node: PermissionNode) => void;
  onRevoke: (node: PermissionNode) => void;
}) {
  if (!node.grantable) return null;
  if (node.grantStatus === "gift") {
    return <span className="shrink-0 text-xs text-slate-400">Tự động</span>;
  }
  if (node.grantStatus === "direct") {
    return (
      <Button
        variant="danger"
        className="shrink-0 px-2 py-1 text-xs"
        disabled={busy}
        onClick={() => onRevoke(node as PermissionNode)}
      >
        Thu hồi
      </Button>
    );
  }
  if (node.grantStatus === "inherited") {
    return <span className="shrink-0 text-xs text-indigo-500">Kế thừa</span>;
  }
  return (
    <Button
      variant="success"
      className="shrink-0 px-2 py-1 text-xs"
      disabled={busy}
      onClick={() => onGrant(node as PermissionNode)}
    >
      Cấp quyền
    </Button>
  );
}

function toContentDisplayNodes(
  nodes: CourseContentNode[],
  parentStatus: GrantStatus
): DisplayNode[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
    grantStatus: contentNodesGrantStatus(parentStatus),
    children: toContentDisplayNodes(
      node.children,
      contentNodesGrantStatus(parentStatus)
    ),
    grantable: false,
  }));
}

function NodeRow({
  node,
  depth,
  busy,
  onGrant,
  onRevoke,
}: {
  node: DisplayNode;
  depth: number;
  busy: boolean;
  onGrant: (node: PermissionNode) => void;
  onRevoke: (node: PermissionNode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [contentChildren, setContentChildren] = useState<DisplayNode[] | null>(
    null
  );
  const [loadingContent, setLoadingContent] = useState(false);
  const isCourse = node.type === "course";
  const canExpand =
    node.type === "category" ||
    node.type === "subcategory" ||
    node.type === "course" ||
    node.type === "chapter" ||
    node.type === "lesson";
  const visibleChildren =
    isCourse && contentChildren !== null ? contentChildren : node.children;
  const hasChildren = canExpand && (visibleChildren.length > 0 || isCourse);
  const pad = 8 + depth * 16;
  const label = statusLabel(node.grantStatus);
  const count = countLabel(node);

  async function toggleOpen() {
    if (!canExpand) return;
    if (!open && isCourse && contentChildren === null && node.courseId) {
      setLoadingContent(true);
      try {
        const res = await fetch(`/api/courses/${node.courseId}/preview`);
        if (res.ok) {
          const data = await res.json();
          const mapped = mapPreviewToContentNodes(data.tree);
          setContentChildren(toContentDisplayNodes(mapped, node.grantStatus));
        } else {
          setContentChildren([]);
        }
      } catch {
        setContentChildren([]);
      } finally {
        setLoadingContent(false);
      }
    }
    setOpen(!open);
  }

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 text-sm hover:bg-slate-50 ${
          node.type === "video" ? "text-slate-700" : "font-medium text-slate-800"
        }`}
        style={{ paddingLeft: pad }}
      >
        {canExpand ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            onClick={toggleOpen}
          >
            {hasChildren || isCourse ? (
              open ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <span className="w-3.5" />
            )}
            <NodeIcon node={node} open={open} />
            <span className="line-clamp-1 flex-1">{node.name}</span>
          </button>
        ) : (
          <>
            <span className="w-3.5" />
            <NodeIcon node={node} open={open} />
            <span className="line-clamp-1 flex-1">{node.name}</span>
          </>
        )}
        {label && (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClass(node.grantStatus)}`}
          >
            {label}
          </span>
        )}
        {count && (
          <span className="shrink-0 text-xs text-slate-400">{count}</span>
        )}
        <GrantAction
          node={node}
          busy={busy}
          onGrant={onGrant}
          onRevoke={onRevoke}
        />
      </div>
      {open && loadingContent && (
        <p className="py-1 text-xs text-slate-400" style={{ paddingLeft: pad + 24 }}>
          Đang tải nội dung...
        </p>
      )}
      {open &&
        !loadingContent &&
        visibleChildren.map((child) => (
          <NodeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            busy={busy}
            onGrant={onGrant}
            onRevoke={onRevoke}
          />
        ))}
    </div>
  );
}

function toDisplayNode(node: PermissionNode): DisplayNode {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    courseCount: node.courseCount,
    videoCount: node.videoCount,
    courseId: node.courseId,
    grantStatus: node.grantStatus,
    children: node.children.map(toDisplayNode),
    grantable: true,
  };
}

export function PermissionCatalogTree({
  tree,
  loading,
  refreshing,
  busy,
  onGrant,
  onRevoke,
}: {
  tree: PermissionNode[];
  loading?: boolean;
  refreshing?: boolean;
  busy: boolean;
  onGrant: (node: PermissionNode) => void;
  onRevoke: (node: PermissionNode) => void;
}) {
  if (loading) {
    return (
      <div className="max-h-[65vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-slate-500">Đang tải danh sách khóa học...</p>
      </div>
    );
  }

  if (!tree.length) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
        Không có mục phù hợp bộ lọc.
      </p>
    );
  }

  return (
    <div
      className={`max-h-[65vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 transition-opacity ${
        refreshing ? "opacity-60" : ""
      }`}
    >
      {tree.map((node) => (
        <NodeRow
          key={node.id}
          node={toDisplayNode(node)}
          depth={0}
          busy={busy}
          onGrant={onGrant}
          onRevoke={onRevoke}
        />
      ))}
    </div>
  );
}
