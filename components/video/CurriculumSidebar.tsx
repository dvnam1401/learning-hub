"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import type { CourseTreeNode } from "@/lib/types";
import { findLessonScope } from "@/lib/catalog/tree-utils";

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
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                active
                  ? "border border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              style={{ paddingLeft: 12 + depth * 12 }}
            >
              <CheckCircle size={14} className="text-emerald-500 shrink-0" />
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

  const scope = useMemo(
    () => findLessonScope(tree, currentVideoId) ?? tree,
    [tree, currentVideoId]
  );

  const showScopeTitle = scope.id !== tree.id;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between font-semibold text-slate-900"
        onClick={() => setOpen(!open)}
      >
        Nội dung khóa học
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {showScopeTitle && (
        <p className="mt-2 text-sm font-medium text-indigo-600 line-clamp-2">
          {scope.name}
        </p>
      )}
      {open && (
        <div className="mt-3 max-h-[70vh] space-y-1 overflow-y-auto">
          <VideoLinks
            nodes={scope.children}
            courseId={courseId}
            currentVideoId={currentVideoId}
          />
        </div>
      )}
    </div>
  );
}
