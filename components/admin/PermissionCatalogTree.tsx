"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import type { PermissionTreeNode } from "@/lib/catalog/permission-tree";
import {
  PermissionGrantAction,
  PermissionStatusBadge,
} from "@/components/admin/permission-ui";

function SearchNodeRow({
  node,
  depth,
  busy,
  onGrant,
  onRevoke,
}: {
  node: PermissionTreeNode;
  depth: number;
  busy: boolean;
  onGrant: (node: PermissionTreeNode) => void;
  onRevoke: (node: PermissionTreeNode) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isFolder = node.type !== "course";
  const hasChildren = node.children.length > 0;
  const pad = 8 + depth * 16;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 text-sm hover:bg-accent"
        style={{ paddingLeft: pad }}
      >
        {isFolder && hasChildren ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left font-medium text-foreground"
            onClick={() => setOpen(!open)}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {open ? (
              <FolderOpen size={14} className="shrink-0 text-amber-600" />
            ) : (
              <Folder size={14} className="shrink-0 text-amber-600" />
            )}
            <span className="line-clamp-1 flex-1">{node.name}</span>
          </button>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-2 pl-5 font-medium text-foreground">
            <span className="line-clamp-1 flex-1">{node.name}</span>
          </span>
        )}
        {isFolder && (
          <span className="shrink-0 text-xs text-muted">
            {node.courseCount ?? 0} khóa
          </span>
        )}
        {!isFolder && (
          <span className="shrink-0 text-xs text-muted">
            {node.videoCount ?? 0} video
          </span>
        )}
        <PermissionStatusBadge status={node.grantStatus} />
        <PermissionGrantAction
          node={node}
          busy={busy}
          onGrant={onGrant}
          onRevoke={onRevoke}
        />
      </div>
      {open &&
        node.children.map((child) => (
          <SearchNodeRow
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

export function PermissionCatalogTree({
  tree,
  loading,
  refreshing,
  busy,
  onGrant,
  onRevoke,
}: {
  tree: PermissionTreeNode[];
  loading?: boolean;
  refreshing?: boolean;
  busy: boolean;
  onGrant: (node: PermissionTreeNode) => void;
  onRevoke: (node: PermissionTreeNode) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-muted">Đang tải danh sách khóa học...</p>
      </div>
    );
  }

  if (!tree.length) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-muted">
        Không có mục phù hợp bộ lọc.
      </p>
    );
  }

  return (
    <div
      className={`max-h-[65vh] overflow-y-auto rounded-xl border border-border bg-card p-2 transition-opacity ${
        refreshing ? "opacity-60" : ""
      }`}
    >
      {tree.map((node) => (
        <SearchNodeRow
          key={node.id}
          node={node}
          depth={0}
          busy={busy}
          onGrant={onGrant}
          onRevoke={onRevoke}
        />
      ))}
    </div>
  );
}
