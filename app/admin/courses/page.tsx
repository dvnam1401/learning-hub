"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AdminCatalogTree } from "@/components/admin/AdminCatalogTree";
import {
  AdminCoursesTable,
  type AdminCourseRow,
} from "@/components/admin/AdminCoursesTable";
import { CourseSearchBox } from "@/components/course/CourseSearchBox";
import { CourseSearchResults } from "@/components/course/CourseSearchResults";
import {
  useCourseSearch,
  useDebouncedValue,
} from "@/components/course/useCourseSearch";

type View = "tree" | "table";

export default function AdminCoursesPage() {
  const [view, setView] = useState<View>("tree");
  const [tree, setTree] = useState([]);
  const [courses, setCourses] = useState<AdminCourseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "visible" | "hidden">("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 50;
  const debouncedQ = useDebouncedValue(q);
  const searching = !!debouncedQ.trim();

  const search = useCourseSearch({
    q,
    page: searchPage,
    limit,
    enabled: searching && view === "tree",
  });

  const loadTree = useCallback(async () => {
    const res = await fetch("/api/admin/catalog/tree");
    const data = await res.json();
    setTree(data.tree ?? []);
  }, []);

  const loadTable = useCallback(async () => {
    setLoading(true);
    const query = debouncedQ ? `&q=${encodeURIComponent(debouncedQ)}` : "";
    const res = await fetch(
      `/api/courses?page=${page}&limit=${limit}${query}`
    );
    const data = await res.json();
    let rows: AdminCourseRow[] = data.courses ?? [];
    if (status === "visible") rows = rows.filter((c) => !c.hidden);
    if (status === "hidden") rows = rows.filter((c) => c.hidden);
    setCourses(rows);
    setTotal(data.total ?? rows.length);
    setLoading(false);
  }, [page, debouncedQ, status, limit]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (view === "table") loadTable();
  }, [view, loadTable]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status]);

  useEffect(() => {
    setSearchPage(1);
  }, [debouncedQ]);

  async function saveOverride(id: string, hidden?: boolean) {
    await fetch(`/api/admin/courses/${id}/override`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName || null,
        thumbnailUrl: thumbnailUrl || null,
        hidden,
      }),
    });
    setEditId(null);
    loadTree();
    if (view === "table") loadTable();
  }

  function openEdit(c: AdminCourseRow) {
    setEditId(c.id);
    setDisplayName(c.name);
    setThumbnailUrl("");
  }

  async function selectCourseFromSearch(id: string) {
    setEditId(id);
    const res = await fetch(`/api/courses/${id}`);
    if (res.ok) {
      const d = await res.json();
      setDisplayName(d.course?.name ?? "");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
        <div className="flex gap-2">
          <Button
            variant={view === "tree" ? "primary" : "secondary"}
            onClick={() => setView("tree")}
          >
            Tree View
          </Button>
          <Button
            variant={view === "table" ? "primary" : "secondary"}
            onClick={() => setView("table")}
          >
            Bảng dữ liệu
          </Button>
        </div>
      </div>

      {view === "tree" ? (
        <>
          <div className="mb-4">
            <CourseSearchBox value={q} onChange={setQ} />
          </div>
          {searching ? (
            <CourseSearchResults
              variant="admin"
              courses={search.courses}
              loading={search.loading}
              total={search.total}
              page={searchPage}
              limit={limit}
              onPageChange={setSearchPage}
              onSelectCourse={selectCourseFromSearch}
            />
          ) : (
            <AdminCatalogTree
              tree={tree}
              onSelectCourse={selectCourseFromSearch}
            />
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <CourseSearchBox value={q} onChange={setQ} />
            <Select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | "visible" | "hidden")
              }
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="visible">Đang hiển thị</option>
              <option value="hidden">Đã ẩn</option>
            </Select>
          </div>
          {loading ? (
            <p className="text-slate-500">Đang tải...</p>
          ) : (
            <>
              <AdminCoursesTable
                courses={courses}
                onEdit={openEdit}
                onHide={(id) => saveOverride(id, true)}
              />
              <div className="mt-4 flex items-center justify-center gap-3">
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
            </>
          )}
        </>
      )}

      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 font-semibold">Sửa khóa học</h2>
            <div className="space-y-3">
              <Input
                placeholder="Tên hiển thị"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Input
                placeholder="Thumbnail URL"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => saveOverride(editId)}>Lưu</Button>
              <Button variant="secondary" onClick={() => setEditId(null)}>
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
