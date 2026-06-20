"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, CheckCircle } from "lucide-react";
import type { CourseTreeNode } from "@/lib/types";
import { findLessonScope } from "@/lib/catalog/tree-utils";
import { Collapsible } from "@/components/ui/Collapsible";

function VideoLinks({
  nodes,
  courseId,
  currentVideoId,
  depth = 0,
}: {
  nodes: CourseTreeNode[];
  courseId: string;
  currentVideoId: string;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node) => {
        if (node.type === "video" && node.fileId) {
          const active = node.fileId === currentVideoId;
          return (
            <Link
              key={node.id}
              href={`/user/courses/${courseId}/watch/${node.fileId}`}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "border border-primary bg-primary/10 text-primary"
                  : "text-muted hover:bg-accent hover:text-foreground"
              }`}
              style={{ paddingLeft: 12 + depth * 12 }}
              aria-current={active ? "page" : undefined}
            >
              <CheckCircle size={14} className="shrink-0 text-emerald-500" />
              <span className="line-clamp-2">{node.name}</span>
            </Link>
          );
        }
        if (node.children.length > 0) {
          return (
            <VideoLinks
              key={node.id}
              nodes={node.children}
              courseId={courseId}
              currentVideoId={currentVideoId}
              depth={depth + 1}
            />
          );
        }
        return null;
      })}
    </>
  );
}

export function CurriculumSidebar({
  tree,
  courseId,
  currentVideoId,
}: {
  tree: CourseTreeNode;
  courseId: string;
  currentVideoId: string;
}) {
  const [open, setOpen] = useState(true);
  const panelId = "curriculum-panel";

  const scope = useMemo(
    () => findLessonScope(tree, currentVideoId) ?? tree,
    [tree, currentVideoId]
  );

  const showScopeTitle = scope.id !== tree.id;

  return (
    <div className="surface-card p-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen(!open)}
      >
        Nội dung khóa học
        <span className={`transition-transform duration-300 ${open ? "rotate-0" : "-rotate-180"}`}>
          <ChevronDown size={18} />
        </span>
      </button>
      {showScopeTitle && (
        <p className="mt-2 text-sm font-medium text-primary line-clamp-2">
          {scope.name}
        </p>
      )}
      <Collapsible open={open}>
        <div id={panelId} className="mt-3 max-h-[70vh] space-y-1 overflow-y-auto">
          <VideoLinks
            nodes={scope.children}
            courseId={courseId}
            currentVideoId={currentVideoId}
          />
        </div>
      </Collapsible>
    </div>
  );
}
