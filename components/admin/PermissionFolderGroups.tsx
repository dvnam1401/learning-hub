"use client";

import { useState } from "react";
import { ChevronDown, Folder, FolderOpen } from "lucide-react";
import { Collapsible } from "@/components/ui/Collapsible";
import { stripOrderPrefix } from "@/lib/catalog/categories";
import type { PermissionTreeNode } from "@/lib/catalog/permission-tree";
import {
  PermissionCourseRow,
  PermissionGrantAction,
  PermissionStatusBadge,
} from "@/components/admin/permission-ui";

function FolderSection({
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
  const [open, setOpen] = useState(false);
  const panelId = `perm-folder-${node.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const folders = node.children.filter((c) => c.type !== "course");
  const courses = node.children.filter((c) => c.type === "course");

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-accent/50 px-4 py-3 transition-colors hover:bg-accent">
        <button
          type="button"
          id={`${panelId}-trigger`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <span
            className={`shrink-0 transition-transform duration-300 ${open ? "rotate-0" : "-rotate-90"}`}
          >
            <ChevronDown size={16} />
          </span>
          {open ? (
            <FolderOpen size={16} className="shrink-0 text-amber-600" />
          ) : (
            <Folder size={16} className="shrink-0 text-amber-600" />
          )}
          <span className="flex-1 font-medium text-foreground">
            {stripOrderPrefix(node.name)}
          </span>
          <span className="text-xs text-muted">{node.courseCount ?? 0} khóa</span>
        </button>
        <PermissionStatusBadge status={node.grantStatus} />
        <PermissionGrantAction
          node={node}
          busy={busy}
          onGrant={onGrant}
          onRevoke={onRevoke}
        />
      </div>
      <Collapsible open={open}>
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${panelId}-trigger`}
          className="space-y-3 p-4"
        >
          {folders.map((child) => (
            <FolderSection
              key={child.id}
              node={child}
              depth={depth + 1}
              busy={busy}
              onGrant={onGrant}
              onRevoke={onRevoke}
            />
          ))}
          {courses.map((course) => (
            <PermissionCourseRow
              key={course.id}
              node={course}
              busy={busy}
              onGrant={onGrant}
              onRevoke={onRevoke}
            />
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

export function PermissionFolderGroups({
  nodes,
  busy,
  onGrant,
  onRevoke,
}: {
  nodes: PermissionTreeNode[];
  busy: boolean;
  onGrant: (node: PermissionTreeNode) => void;
  onRevoke: (node: PermissionTreeNode) => void;
}) {
  const folders = nodes.filter((n) => n.type !== "course");
  const rootCourses = nodes.filter((n) => n.type === "course");

  if (folders.length === 0 && rootCourses.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted">
        Không có khóa học trong danh mục này.
      </p>
    );
  }

  return (
    <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
      {folders.map((folder) => (
        <FolderSection
          key={folder.id}
          node={folder}
          depth={0}
          busy={busy}
          onGrant={onGrant}
          onRevoke={onRevoke}
        />
      ))}
      {rootCourses.map((course) => (
        <PermissionCourseRow
          key={course.id}
          node={course}
          busy={busy}
          onGrant={onGrant}
          onRevoke={onRevoke}
        />
      ))}
    </div>
  );
}
