"use client";

import { useCallback, useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export type CourseSearchItem = {
  id: string;
  name: string;
  videoCount: number;
  path: string;
  unlocked: boolean;
  hidden?: boolean;
};

export type CourseSearchFilter = "mine" | "unlocked" | "locked";

type Options = {
  q: string;
  page: number;
  limit?: number;
  filter?: CourseSearchFilter;
  category?: string | null;
  enabled?: boolean;
};

export function useCourseSearch({
  q,
  page,
  limit = 30,
  filter,
  category,
  enabled = true,
}: Options) {
  const [courses, setCourses] = useState<CourseSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const debouncedQ = useDebouncedValue(q);

  const load = useCallback(async () => {
    if (!enabled || !debouncedQ.trim()) {
      setCourses([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      q: debouncedQ.trim(),
    });
    if (filter) params.set("filter", filter);
    if (category) params.set("category", category);
    const res = await fetch(`/api/courses?${params}`);
    const data = await res.json();
    setCourses(data.courses ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [debouncedQ, page, limit, filter, category, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { courses, total, loading, debouncedQ, active: !!debouncedQ.trim() };
}

export function shortenCoursePath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 2) return path;
  return parts.slice(-2).join(" / ");
}
