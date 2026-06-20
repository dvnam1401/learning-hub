"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, PlayCircle } from "lucide-react";
import type { CourseTreeNode } from "@/lib/types";
import { firstVideoInNode } from "@/lib/catalog/tree-utils";
import { Collapsible } from "@/components/ui/Collapsible";

function countVideos(node: CourseTreeNode): number {
  if (node.type === "video") return 1;
  return node.children.reduce((s, c) => s + countVideos(c), 0);
}

function Section({
  node,
  courseId,
  depth = 0,
}: {
  node: CourseTreeNode;
  courseId: string;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const videos = countVideos(node);
  const panelId = `section-${node.id}`;

  if (node.type === "video" && node.fileId) {
    return (
      <Link
        href={`/user/courses/${courseId}/watch/${node.fileId}`}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-accent hover:text-foreground"
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        <PlayCircle size={14} className="shrink-0 text-primary" />
        <span className="line-clamp-2">{node.name}</span>
      </Link>
    );
  }

  if (node.children.length === 0) return null;

  const isLeafGroup = node.children.every((c) => c.type === "video");

  if (isLeafGroup) {
    const startVideo = firstVideoInNode(node);
    return (
      <div>
        <div
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          style={{ paddingLeft: 12 + depth * 16 }}
        >
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(!open)}
            className={`shrink-0 text-muted transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${open ? "rotate-0" : "-rotate-90"}`}
          >
            <ChevronDown size={16} />
          </button>
          {startVideo ? (
            <Link
              href={`/user/courses/${courseId}/watch/${startVideo.id}`}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <span className="flex-1">{node.name}</span>
              <span className="shrink-0 text-xs text-muted">{videos} bài</span>
            </Link>
          ) : (
            <>
              <span className="flex-1">{node.name}</span>
              <span className="text-xs text-muted">{videos} bài</span>
            </>
          )}
        </div>
        <Collapsible open={open}>
          <div id={panelId} className="space-y-0.5">
            {node.children.map((child) => (
              <Section key={child.id} node={child} courseId={courseId} depth={depth + 1} />
            ))}
          </div>
        </Collapsible>
      </div>
    );
  }

  return (
    <div className={depth === 0 ? "border-b border-border pb-3 last:border-0" : ""}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        <span className={`shrink-0 transition-transform duration-300 ${open ? "rotate-0" : "-rotate-90"}`}>
          <ChevronDown size={18} />
        </span>
        <span className="flex-1">{node.name}</span>
        <span className="text-xs font-normal text-muted">{videos} bài</span>
      </button>
      <Collapsible open={open}>
        <div id={panelId} className="mt-1 space-y-0.5">
          {node.children.map((child) => (
            <Section key={child.id} node={child} courseId={courseId} depth={depth + 1} />
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

export function CourseCurriculum({
  tree,
  courseId,
}: {
  tree: CourseTreeNode;
  courseId: string;
}) {
  return (
    <div className="surface-card">
      <div className="border-b border-border px-4 py-3 font-semibold text-foreground">
        Nội dung khóa học
      </div>
      <div className="max-h-[60vh] space-y-1 overflow-y-auto p-2">
        {tree.children.map((node) => (
          <Section key={node.id} node={node} courseId={courseId} />
        ))}
        {tree.children.length === 0 && tree.type === "video" && tree.fileId && (
          <Section node={tree} courseId={courseId} />
        )}
      </div>
    </div>
  );
}
