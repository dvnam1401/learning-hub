"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
import type { CoursePreviewNode } from "@/lib/catalog/preview-tree";
import { stripOrderPrefix } from "@/lib/catalog/categories";

function countVideos(node: CoursePreviewNode): number {
  if (node.type === "video") return 1;
  return node.children.reduce((s, c) => s + countVideos(c), 0);
}

function Section({
  node,
  depth = 0,
}: {
  node: CoursePreviewNode;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const videos = countVideos(node);

  if (node.type === "video") {
    return (
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted"
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        <Lock size={14} className="shrink-0 text-muted" />
        <span className="line-clamp-2">{stripOrderPrefix(node.name)}</span>
      </div>
    );
  }

  if (node.children.length === 0) return null;

  const isLeafGroup = node.children.every((c) => c.type === "video");

  if (isLeafGroup) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-accent"
          style={{ paddingLeft: 12 + depth * 16 }}
        >
          <span className="shrink-0 text-muted">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <span className="flex-1">{stripOrderPrefix(node.name)}</span>
          <span className="shrink-0 text-xs text-muted">{videos} bài</span>
        </button>
        {open && (
          <div className="space-y-0.5">
            {node.children.map((child) => (
              <Section key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={depth === 0 ? "border-b border-border pb-3 last:border-0" : ""}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-semibold text-foreground hover:bg-accent"
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <span className="flex-1">{stripOrderPrefix(node.name)}</span>
        <span className="text-xs font-normal text-muted">{videos} bài</span>
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {node.children.map((child) => (
            <Section key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CourseCurriculumPreview({ tree }: { tree: CoursePreviewNode }) {
  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Xem trước danh sách chủ đề và bài học. Video chỉ xem được sau khi được mở khóa.
      </p>
      <div className="max-h-[55vh] space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {tree.children.map((node) => (
          <Section key={node.id} node={node} />
        ))}
        {tree.children.length === 0 && tree.type === "video" && (
          <Section node={tree} />
        )}
      </div>
    </div>
  );
}
