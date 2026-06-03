"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CategoryCard } from "@/components/course/CategoryCard";
import { CourseListItem } from "@/components/course/CourseListItem";
import { CourseSearchBox } from "@/components/course/CourseSearchBox";
import { CourseSearchResults } from "@/components/course/CourseSearchResults";
import {
  useCourseSearch,
  useDebouncedValue,
} from "@/components/course/useCourseSearch";
import {
  compareFolderNames,
  decodeCategoryParam,
  getOrderPrefix,
  stripOrderPrefix,
  topCategoryKeyFromPath,
} from "@/lib/catalog/categories";

type Course = {
  id: string;
  name: string;
  videoCount: number;
  path: string;
  unlocked: boolean;
};

function pickDisplayName(current: string, incoming: string): string {
  return getOrderPrefix(incoming) < getOrderPrefix(current) ? incoming : current;
}

function groupByCategory(courses: Course[]) {
  const map = new Map<
    string,
    {
      id: string;
      name: string;
      courseCount: number;
      videoCount: number;
      courses: Course[];
    }
  >();

  for (const c of courses) {
    const key = topCategoryKeyFromPath(c.path);
    const rawName = c.path.split("/").filter(Boolean)[1] ?? key;
    const hit = map.get(key);
    if (hit) {
      hit.courseCount += 1;
      hit.videoCount += c.videoCount;
      hit.name = pickDisplayName(hit.name, rawName);
      hit.courses.push(c);
    } else {
      map.set(key, {
        id: key,
        name: rawName,
        courseCount: 1,
        videoCount: c.videoCount,
        courses: [c],
      });
    }
  }

  return [...map.values()].sort((a, b) => compareFolderNames(a.name, b.name));
}

export default function MyCoursesPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Đang tải...</p>}>
      <MyCoursesContent />
    </Suspense>
  );
}

function MyCoursesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const categoryKey = categoryParam ? decodeCategoryParam(categoryParam) : null;
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [categoryCourses, setCategoryCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 30;
  const debouncedQ = useDebouncedValue(q);
  const searching = !!debouncedQ.trim();

  const search = useCourseSearch({
    q,
    page,
    limit,
    filter: "mine",
    category: categoryKey,
    enabled: searching,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/courses?filter=mine");
    const data = await res.json();
    setAllCourses(
      (data.courses ?? []).map((c: Course) => ({ ...c, unlocked: true }))
    );
    setLoading(false);
  }, []);

  const loadCategory = useCallback(async () => {
    if (!categoryKey) return;
    setLoading(true);
    const res = await fetch(
      `/api/courses?filter=mine&category=${encodeURIComponent(categoryKey)}`
    );
    const data = await res.json();
    setCategoryCourses(
      (data.courses ?? []).map((c: Course) => ({ ...c, unlocked: true }))
    );
    setLoading(false);
  }, [categoryKey]);

  useEffect(() => {
    if (categoryKey) {
      if (!searching) loadCategory();
    } else if (!searching) {
      loadAll();
    }
  }, [categoryKey, searching, loadAll, loadCategory]);

  useEffect(() => {
    setPage(1);
  }, [q, categoryKey]);

  const groups = useMemo(() => groupByCategory(allCourses), [allCourses]);
  const activeGroup = groups.find((g) => g.id === categoryKey);
  const categoryName =
    activeGroup?.name ??
    categoryCourses[0]?.path.split("/").filter(Boolean)[1] ??
    categoryKey ??
    "";

  if (!categoryKey) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold">Khóa học của tôi</h1>
        <p className="mb-4 text-sm text-slate-500">
          Chọn danh mục hoặc tìm trong khóa đã được cấp
        </p>
        <div className="mb-6">
          <CourseSearchBox value={q} onChange={setQ} />
        </div>
        {searching ? (
          <CourseSearchResults
            courses={search.courses}
            loading={search.loading}
            total={search.total}
            page={page}
            limit={limit}
            onPageChange={setPage}
          />
        ) : loading ? (
          <p className="text-slate-500">Đang tải...</p>
        ) : groups.length === 0 ? (
          <p className="text-slate-500">
            Bạn chưa có khóa học nào. Vào thư viện để yêu cầu mở khóa.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map((cat) => (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                courseCount={cat.courseCount}
                videoCount={cat.videoCount}
                href={`/user/my-courses?category=${encodeURIComponent(cat.id)}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/user/my-courses")}
        className="mb-4 flex items-center gap-1 text-sm text-indigo-600 hover:underline"
      >
        <ArrowLeft size={16} />
        Tất cả danh mục
      </button>
      <h1 className="mb-6 text-2xl font-bold">
        {stripOrderPrefix(categoryName)}
      </h1>
      <div className="mb-4">
        <CourseSearchBox value={q} onChange={setQ} className="max-w-md" />
      </div>
      {searching ? (
        <CourseSearchResults
          courses={search.courses}
          loading={search.loading}
          total={search.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
        />
      ) : loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : categoryCourses.length === 0 ? (
        <p className="text-slate-500">Không có khóa học trong danh mục này.</p>
      ) : (
        <div className="space-y-3">
          {categoryCourses.map((c) => (
            <CourseListItem
              key={c.id}
              id={c.id}
              name={c.name}
              videoCount={c.videoCount}
              unlocked
            />
          ))}
        </div>
      )}
    </div>
  );
}
