"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { CourseListItem } from "@/components/course/CourseListItem";
import { stripOrderPrefix } from "@/lib/catalog/categories";

export type LibraryCourse = {
  id: string;
  name: string;
  videoCount: number;
  unlocked: boolean;
  bundledGift?: boolean;
  accessPending?: boolean;
};

export type CourseSubfolderGroup = {
  key: string;
  name: string;
  courses: LibraryCourse[];
};

function FolderSection({
  name,
  courses,
  defaultOpen,
  isAccessPending,
  requestingId,
  onRequestAccess,
}: {
  name: string;
  courses: LibraryCourse[];
  defaultOpen: boolean;
  isAccessPending: (course: LibraryCourse) => boolean;
  requestingId: string | null;
  onRequestAccess: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {open ? (
          <FolderOpen size={16} className="shrink-0 text-amber-600" />
        ) : (
          <Folder size={16} className="shrink-0 text-amber-600" />
        )}
        <span className="flex-1 font-medium text-slate-800">
          {stripOrderPrefix(name)}
        </span>
        <span className="text-xs text-slate-500">{courses.length} khóa</span>
      </button>
      {open && (
        <div className="space-y-3 p-4">
          {courses.map((course) => (
            <CourseListItem
              key={course.id}
              {...course}
              accessPending={isAccessPending(course)}
              requesting={requestingId === course.id}
              onRequestAccess={
                course.bundledGift ? undefined : () => onRequestAccess(course.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CourseFolderGroups({
  groups,
  isAccessPending,
  requestingId,
  onRequestAccess,
}: {
  groups: CourseSubfolderGroup[];
  isAccessPending: (course: LibraryCourse) => boolean;
  requestingId: string | null;
  onRequestAccess: (id: string) => void;
}) {
  if (groups.length === 0) return null;

  if (groups.length === 1 && groups[0].key === "__root__") {
    return (
      <div className="space-y-3">
        {groups[0].courses.map((course) => (
          <CourseListItem
            key={course.id}
            {...course}
            accessPending={isAccessPending(course)}
            requesting={requestingId === course.id}
            onRequestAccess={
              course.bundledGift ? undefined : () => onRequestAccess(course.id)
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <FolderSection
          key={group.key}
          name={group.name}
          courses={group.courses}
          defaultOpen
          isAccessPending={isAccessPending}
          requestingId={requestingId}
          onRequestAccess={onRequestAccess}
        />
      ))}
    </div>
  );
}
