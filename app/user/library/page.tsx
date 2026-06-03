"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CategoryCard } from "@/components/course/CategoryCard";
import { CourseListItem } from "@/components/course/CourseListItem";
import { Button } from "@/components/ui/Button";
import { CourseSearchBox } from "@/components/course/CourseSearchBox";
import { CourseSearchResults } from "@/components/course/CourseSearchResults";
import {
  decodeCategoryParam,
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
};

function tabToFilter(tab: Tab): CourseSearchFilter | undefined {
  if (tab === "unlocked") return "unlocked";
  if (tab === "locked") return "locked";
  return undefined;
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Đang tải...</p>}>
      <LibraryContent />
    </Suspense>
  );
}

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const categoryKey = categoryParam ? decodeCategoryParam(categoryParam) : null;
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
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
      `/api/courses?category=${encodeURIComponent(categoryKey)}&page=${page}&limit=${limit}${filter}`
    );
    const data = await res.json();
    setCourses(data.courses ?? []);
    setTotal(data.total ?? 0);
    const first = data.courses?.[0] as Course | undefined;
    const raw =
      first?.path.split("/").filter(Boolean)[1] ?? categoryKey;
    setCategoryName(raw);
    setLoading(false);
  }, [categoryKey, tab, page, limit, searching]);

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
    await fetch("/api/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: id }),
    });
    alert("Đã gửi yêu cầu mở khóa");
  }

  const tabBar = (
    <div className="flex gap-2">
      {(["all", "unlocked", "locked"] as Tab[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === t
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-600"
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
        <h1 className="mb-2 text-2xl font-bold">Thư viện khóa học</h1>
        <p className="mb-4 text-sm text-slate-500">
          Chọn danh mục hoặc tìm khóa học trên toàn thư viện
        </p>
        <div className="mb-4 flex flex-wrap gap-4">
          <CourseSearchBox value={q} onChange={setQ} />
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
          />
        ) : loading ? (
          <p className="text-slate-500">Đang tải...</p>
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

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/user/library")}
        className="mb-4 flex items-center gap-1 text-sm text-indigo-600 hover:underline"
      >
        <ArrowLeft size={16} />
        Tất cả danh mục
      </button>
      <h1 className="mb-6 text-2xl font-bold">
        {stripOrderPrefix(categoryName)}
      </h1>
      <div className="mb-4 flex flex-wrap gap-4">
        <CourseSearchBox value={q} onChange={setQ} className="max-w-md" />
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
        />
      ) : loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : courses.length === 0 ? (
        <p className="text-slate-500">Không có khóa học trong danh mục này.</p>
      ) : (
        <>
          <div className="space-y-3">
            {courses.map((c) => (
              <CourseListItem
                key={c.id}
                {...c}
                onRequestAccess={() => requestAccess(c.id)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-slate-500">
                {page} / {totalPages} · {total} khóa
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
