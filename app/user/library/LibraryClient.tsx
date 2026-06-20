"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, FolderOpen, Search } from "lucide-react";
import { CategoryCard } from "@/components/course/CategoryCard";
import { CourseFolderGroups } from "@/components/course/CourseFolderGroups";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { CourseSearchBox } from "@/components/course/CourseSearchBox";
import { CourseSearchResults } from "@/components/course/CourseSearchResults";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryGridSkeleton, CourseListSkeleton } from "@/components/ui/Skeleton";
import {
  decodeCategoryParam,
  groupCoursesBySubCategory,
  stripOrderPrefix,
} from "@/lib/catalog/categories";
import {
  useCourseSearch,
  useDebouncedValue,
  type CourseSearchFilter,
} from "@/components/course/useCourseSearch";

type Tab = "all" | "unlocked" | "locked";

type Category = {
  id: string;
  name: string;
  courseCount: number;
  videoCount: number;
};

type Course = {
  id: string;
  name: string;
  videoCount: number;
  path: string;
  unlocked: boolean;
  accessPending?: boolean;
  bundledGift?: boolean;
};

function tabToFilter(tab: Tab): CourseSearchFilter | undefined {
  if (tab === "unlocked") return "unlocked";
  if (tab === "locked") return "locked";
  return undefined;
}

export function LibraryClient({ categoryParam }: { categoryParam: string | null }) {
  const router = useRouter();
  const categoryKey = categoryParam ? decodeCategoryParam(categoryParam) : null;
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const limit = 30;
  const debouncedQ = useDebouncedValue(q);
  const searching = !!debouncedQ.trim();

  const search = useCourseSearch({
    q,
    page,
    limit,
    filter: tabToFilter(tab),
    category: categoryKey,
    enabled: searching,
  });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setLoading(false);
  }, []);

  const loadCourses = useCallback(async () => {
    if (!categoryKey || searching) return;
    setLoading(true);
    const filter =
      tab === "unlocked"
        ? "&filter=unlocked"
        : tab === "locked"
          ? "&filter=locked"
          : "";
    const res = await fetch(
      `/api/courses?category=${encodeURIComponent(categoryKey)}${filter}`
    );
    const data = await res.json();
    const rows: Course[] = data.courses ?? [];
    setCourses(rows);
    const first = rows[0];
    const raw = first?.path.split("/").filter(Boolean)[1] ?? categoryKey;
    setCategoryName(raw);
    setLoading(false);
  }, [categoryKey, tab, searching]);

  useEffect(() => {
    if (categoryKey) {
      if (!searching) loadCourses();
    } else if (!searching) {
      loadCategories();
    }
  }, [categoryKey, loadCategories, loadCourses, searching]);

  useEffect(() => {
    setPage(1);
  }, [tab, q, categoryKey]);

  async function requestAccess(id: string) {
    if (pendingIds.has(id) || requestingId) return;
    setRequestingId(id);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("đang chờ")) {
          setPendingIds((prev) => new Set(prev).add(id));
        }
        setToast({ text: data.error ?? "Không gửi được yêu cầu", type: "error" });
        return;
      }
      setPendingIds((prev) => new Set(prev).add(id));
      setToast({ text: "Đã gửi yêu cầu mở khóa" });
    } finally {
      setRequestingId(null);
    }
  }

  function isAccessPending(course: { id: string; accessPending?: boolean }) {
    return course.accessPending || pendingIds.has(course.id);
  }

  const courseGroups = useMemo(
    () => groupCoursesBySubCategory(courses),
    [courses]
  );

  const tabBar = (
    <div className="flex gap-1" role="tablist" aria-label="Lọc khóa học">
      {(["all", "unlocked", "locked"] as Tab[]).map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={tab === t}
          onClick={() => setTab(t)}
          className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === t
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {t === "all" ? "Tất cả" : t === "unlocked" ? "Đã mở" : "Chưa mở"}
        </button>
      ))}
    </div>
  );

  if (!categoryKey) {
    return (
      <div>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        <h1 className="mb-2 text-2xl font-bold">Thư viện khóa học</h1>
        <p className="mb-4 text-sm text-slate-500">
          Chọn danh mục hoặc tìm khóa học trên toàn thư viện
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <CourseSearchBox value={q} onChange={setQ} loading={search.loading && searching} />
          {searching && tabBar}
        </div>
        {searching ? (
          <CourseSearchResults
            courses={search.courses}
            loading={search.loading}
            total={search.total}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onRequestAccess={requestAccess}
            pendingCourseIds={pendingIds}
            requestingCourseId={requestingId}
          />
        ) : loading ? (
          <CategoryGridSkeleton />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Chưa có danh mục"
            description="Danh mục khóa học sẽ xuất hiện sau khi đồng bộ."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                {...cat}
                href={`/user/library?category=${encodeURIComponent(cat.id)}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <button
        type="button"
        onClick={() => router.push("/user/library")}
        className="mb-4 flex items-center gap-1 text-sm text-indigo-600 hover:underline"
      >
        <ArrowLeft size={16} />
        Tất cả danh mục
      </button>
      <h1 className="mb-6 text-2xl font-bold">
        {stripOrderPrefix(categoryName || categoryKey)}
      </h1>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <CourseSearchBox value={q} onChange={setQ} className="max-w-md" loading={search.loading && searching} />
        {tabBar}
      </div>
      {searching ? (
        <CourseSearchResults
          courses={search.courses}
          loading={search.loading}
          total={search.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onRequestAccess={requestAccess}
          pendingCourseIds={pendingIds}
          requestingCourseId={requestingId}
        />
      ) : loading ? (
        <CourseListSkeleton count={6} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Không có khóa học"
          description="Danh mục này chưa có khóa học hoặc không khớp bộ lọc."
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">{courses.length} khóa học</p>
          <CourseFolderGroups
            groups={courseGroups}
            isAccessPending={isAccessPending}
            requestingId={requestingId}
            onRequestAccess={requestAccess}
          />
        </>
      )}
    </div>
  );
}
