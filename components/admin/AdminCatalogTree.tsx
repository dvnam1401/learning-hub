"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Video,
} from "lucide-react";

type TreeNode = {
  id: string;
  name: string;
  type: "category" | "subcategory" | "course";
  courseCount?: number;
  videoCount?: number;
  courseId?: string;
  hidden?: boolean;
  children: TreeNode[];
};

function NodeRow({
  node,
  depth,
  onSelectCourse,
}: {
  node: TreeNode;
  depth: number;
  onSelectCourse?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;
  const pad = 8 + depth * 16;

  if (node.type === "course") {
    return (
      <button
        type="button"
        onClick={() => node.courseId && onSelectCourse?.(node.courseId)}
        className={`flex w-full items-center gap-2 py-1.5 text-left text-sm hover:bg-slate-50 ${
          node.hidden ? "text-slate-400" : "text-slate-700"
        }`}
        style={{ paddingLeft: pad }}
      >
        <Video size={14} className="shrink-0 text-indigo-500" />
        <span className="line-clamp-1 flex-1">{node.name}</span>
        <span className="shrink-0 text-xs text-slate-400">
          {node.videoCount} video
        </span>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 py-1.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
        style={{ paddingLeft: pad }}
      >
        {hasChildren ? (
          open ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        ) : (
          <span className="w-3.5" />
        )}
        {open ? (
          <FolderOpen size={14} className="text-amber-600" />
        ) : (
          <Folder size={14} className="text-amber-600" />
        )}
        <span className="line-clamp-1 flex-1">{node.name}</span>
        <span className="shrink-0 text-xs text-slate-400">
          {node.courseCount} khóa
        </span>
      </button>
      {open &&
        node.children.map((child) => (
          <NodeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            onSelectCourse={onSelectCourse}
          />
        ))}
    </div>
  );
}

export function AdminCatalogTree({
  tree,
  onSelectCourse,
}: {
  tree: TreeNode[];
  onSelectCourse?: (id: string) => void;
}) {
  return (
    <div className="max-h-[65vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
      {tree.map((node) => (
        <NodeRow
          key={node.id}
          node={node}
          depth={0}
          onSelectCourse={onSelectCourse}
        />
      ))}
    </div>
  );
}
