"use client";

import { BookOpen } from "lucide-react";
import { stripOrderPrefix } from "@/lib/catalog/categories";
import type { PermissionTreeNode } from "@/lib/catalog/permission-tree";
import { PermissionStatusBadge } from "@/components/admin/permission-ui";

export function PermissionCategoryGrid({
  categories,
  onSelect,
}: {
  categories: PermissionTreeNode[];
  onSelect: (categoryId: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className="surface-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen size={20} />
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground line-clamp-2">
              {stripOrderPrefix(cat.name)}
            </h3>
            <PermissionStatusBadge status={cat.grantStatus} />
          </div>
          <p className="text-sm text-muted">
            {cat.courseCount ?? 0} khóa học ·{" "}
            {(cat.videoCount ?? 0).toLocaleString("vi-VN")} video
          </p>
        </button>
      ))}
    </div>
  );
}
