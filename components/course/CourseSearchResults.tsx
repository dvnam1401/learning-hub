"use client";

import { Button } from "@/components/ui/Button";
import { CourseListItem } from "@/components/course/CourseListItem";
import {
  shortenCoursePath,
  type CourseSearchItem,
} from "@/components/course/useCourseSearch";

export function CourseSearchResults({
  courses,
  loading,
  total,
  page,
  limit,
  onPageChange,
  onRequestAccess,
  variant = "user",
  onSelectCourse,
}: {
  courses: CourseSearchItem[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onRequestAccess?: (id: string) => void;
  variant?: "user" | "admin";
  onSelectCourse?: (id: string) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) {
    return <p className="text-slate-500">Đang tìm...</p>;
  }

  if (courses.length === 0) {
    return <p className="text-slate-500">Không tìm thấy khóa học phù hợp.</p>;
  }

  if (variant === "admin") {
    return (
      <>
        <div className="space-y-2">
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCourse?.(c.id)}
              className={`flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 ${
                c.hidden ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 line-clamp-2">
                  {c.name}
                  {c.hidden && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      (ẩn)
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                  {shortenCoursePath(c.path)} · {c.videoCount} video
                </p>
              </div>
            </button>
          ))}
        </div>
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={onPageChange}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.id}>
            <CourseListItem
              id={c.id}
              name={c.name}
              videoCount={c.videoCount}
              unlocked={c.unlocked}
              onRequestAccess={
                onRequestAccess ? () => onRequestAccess(c.id) : undefined
              }
            />
            <p className="mt-1 pl-16 text-xs text-slate-400 line-clamp-1">
              {shortenCoursePath(c.path)}
            </p>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Trước
      </Button>
      <span className="text-sm text-slate-500">
        {page} / {totalPages} · {total} khóa
      </span>
      <Button
        variant="secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Sau
      </Button>
    </div>
  );
}
