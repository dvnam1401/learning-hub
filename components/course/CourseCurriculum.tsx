"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight, PlayCircle } from "lucide-react";
import type { CourseTreeNode } from "@/lib/types";

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

  if (node.type === "video" && node.fileId) {
    return (
      <Link
        href={`/user/courses/${courseId}/watch/${node.fileId}`}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        <PlayCircle size={14} className="shrink-0 text-indigo-500" />
        <span className="line-clamp-2">{node.name}</span>
      </Link>
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
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
          style={{ paddingLeft: 12 + depth * 16 }}
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="flex-1">{node.name}</span>
          <span className="text-xs text-slate-400">{videos} bài</span>
        </button>
        {open && (
          <div className="space-y-0.5">
            {node.children.map((child) => (
              <Section key={child.id} node={child} courseId={courseId} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={depth === 0 ? "border-b border-slate-100 pb-3 last:border-0" : ""}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-semibold text-slate-900 hover:bg-slate-50"
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <span className="flex-1">{node.name}</span>
        <span className="text-xs font-normal text-slate-400">{videos} bài</span>
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {node.children.map((child) => (
            <Section key={child.id} node={child} courseId={courseId} depth={depth + 1} />
          ))}
        </div>
      )}
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
    <div className="rounded-xl bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">
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
