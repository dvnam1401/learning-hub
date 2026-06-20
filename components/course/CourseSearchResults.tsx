"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CourseListItem } from "@/components/course/CourseListItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { CourseListSkeleton } from "@/components/ui/Skeleton";
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
  pendingCourseIds,
  requestingCourseId,
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
  pendingCourseIds?: Set<string>;
  requestingCourseId?: string | null;
  variant?: "user" | "admin";
  onSelectCourse?: (id: string) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) {
    return <CourseListSkeleton count={5} />;
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="Không tìm thấy kết quả"
        description="Thử từ khóa khác hoặc đổi bộ lọc."
      />
    );
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
              className={`surface-card flex w-full items-center gap-3 p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-md ${
                c.hidden ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground line-clamp-2">
                  {c.name}
                  {c.hidden && (
                    <span className="ml-2 text-xs font-normal text-muted">
                      (ẩn)
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted line-clamp-1">
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
              accessPending={
                c.accessPending || pendingCourseIds?.has(c.id) || false
              }
              bundledGift={c.bundledGift}
              requesting={requestingCourseId === c.id}
              onRequestAccess={
                onRequestAccess && !c.bundledGift
                  ? () => onRequestAccess(c.id)
                  : undefined
              }
            />
            <p className="mt-1 pl-0 text-xs text-muted line-clamp-1 sm:pl-16">
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
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Trước
      </Button>
      <span className="text-sm text-muted">
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
