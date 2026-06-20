"use client";

import { Button } from "@/components/ui/Button";
import type { GrantStatus } from "@/lib/catalog/folder-access";
import type { PermissionTreeNode } from "@/lib/catalog/permission-tree";

export function statusLabel(status: GrantStatus): string {
  if (status === "direct") return "Đã cấp";
  if (status === "inherited") return "Kế thừa";
  if (status === "partial") return "Một phần";
  if (status === "gift") return "Quà tặng";
  return "";
}

export function statusClass(status: GrantStatus): string {
  if (status === "direct")
    return "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400";
  if (status === "inherited")
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400";
  if (status === "partial")
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400";
  if (status === "gift") return "bg-accent text-muted";
  return "";
}

export function PermissionStatusBadge({ status }: { status: GrantStatus }) {
  const label = statusLabel(status);
  if (!label) return null;
  return (
    <span
      className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${statusClass(status)}`}
    >
      {label}
    </span>
  );
}

export function PermissionGrantAction({
  node,
  busy,
  onGrant,
  onRevoke,
}: {
  node: PermissionTreeNode;
  busy: boolean;
  onGrant: (node: PermissionTreeNode) => void;
  onRevoke: (node: PermissionTreeNode) => void;
}) {
  if (node.type === "course" && node.isGift) {
    return <span className="shrink-0 text-xs text-muted">Tự động</span>;
  }
  if (node.grantStatus === "gift") {
    return <span className="shrink-0 text-xs text-muted">Tự động</span>;
  }
  if (node.grantStatus === "direct") {
    return (
      <Button
        variant="danger"
        className="shrink-0 px-2 py-1 text-xs"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          onRevoke(node);
        }}
      >
        Thu hồi
      </Button>
    );
  }
  if (node.grantStatus === "inherited") {
    return <span className="shrink-0 text-xs text-primary">Kế thừa</span>;
  }
  return (
    <Button
      variant="success"
      className="shrink-0 px-2 py-1 text-xs"
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onGrant(node);
      }}
    >
      Cấp quyền
    </Button>
  );
}

export function PermissionCourseRow({
  node,
  busy,
  onGrant,
  onRevoke,
}: {
  node: PermissionTreeNode;
  busy: boolean;
  onGrant: (node: PermissionTreeNode) => void;
  onRevoke: (node: PermissionTreeNode) => void;
}) {
  return (
    <div
      className={`surface-card flex flex-col gap-3 p-4 transition-opacity sm:flex-row sm:items-center sm:gap-4 ${busy ? "pointer-events-none opacity-60" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground line-clamp-2">{node.name}</p>
        <p className="mt-0.5 text-xs text-muted">{node.videoCount ?? 0} video</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <PermissionStatusBadge status={node.grantStatus} />
        <PermissionGrantAction
          node={node}
          busy={busy}
          onGrant={onGrant}
          onRevoke={onRevoke}
        />
      </div>
    </div>
  );
}
