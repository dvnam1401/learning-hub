"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PermissionCatalogTree } from "@/components/admin/PermissionCatalogTree";
import { PermissionCategoryGrid } from "@/components/admin/PermissionCategoryGrid";
import { PermissionFolderGroups } from "@/components/admin/PermissionFolderGroups";
import {
  PermissionGrantAction,
  PermissionStatusBadge,
} from "@/components/admin/permission-ui";
import { CourseSearchBox } from "@/components/course/CourseSearchBox";
import { useDebouncedValue } from "@/components/course/useCourseSearch";
import { CategoryGridSkeleton } from "@/components/ui/Skeleton";
import { stripOrderPrefix } from "@/lib/catalog/categories";
import type { AdminCatalogNode } from "@/lib/catalog/categories";
import {
  annotatePermissionTree,
  filterPermissionTree,
  filterPermissionTreeByQuery,
  type PermissionTreeNode,
} from "@/lib/catalog/permission-tree";

interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  courseCount: number;
}

export function PermissionsPageClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [baseTree, setBaseTree] = useState<AdminCatalogNode[]>([]);
  const [grantedCourses, setGrantedCourses] = useState<string[]>([]);
  const [grantedFolders, setGrantedFolders] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "granted" | "not">("all");
  const [q, setQ] = useState("");
  const [userQ, setUserQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const debouncedQ = useDebouncedValue(q);
  const searching = !!debouncedQ.trim();

  useEffect(() => {
    const ac = new AbortController();
    setCatalogLoading(true);
    setLoadError("");

    Promise.all([
      fetch("/api/admin/users", { signal: ac.signal }).then((r) => r.json()),
      fetch("/api/admin/catalog/tree", { signal: ac.signal }).then((r) =>
        r.json()
      ),
    ])
      .then(([usersData, treeData]) => {
        const list = usersData.users ?? [];
        setAllUsers(list);
        setUsers(list);
        if (list[0]) setSelectedId(list[0].id);
        setBaseTree(treeData.tree ?? []);
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setLoadError(
          e instanceof Error ? e.message : "Không tải được dữ liệu trang"
        );
      })
      .finally(() => {
        if (!ac.signal.aborted) setCatalogLoading(false);
      });

    return () => ac.abort();
  }, []);

  const loadGrants = useCallback(async (userId: string, signal?: AbortSignal) => {
    setGrantsLoading(true);
    setLoadError("");
    try {
      const res = await fetch(
        `/api/admin/user-permissions?userId=${encodeURIComponent(userId)}&grantsOnly=1`,
        { signal }
      );
      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error ?? `Lỗi ${res.status}`);
      }
      setGrantedCourses(d.grantedCourseIds ?? []);
      setGrantedFolders(d.grantedFolderIds ?? []);
    } catch (e: unknown) {
      if (signal?.aborted) return;
      setLoadError(
        e instanceof Error && e.message === "Failed to fetch"
          ? "Không kết nối được máy chủ. Thử tải lại trang."
          : e instanceof Error
            ? e.message
            : "Không tải được quyền user"
      );
    } finally {
      if (!signal?.aborted) setGrantsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const ac = new AbortController();
    loadGrants(selectedId, ac.signal);
    return () => ac.abort();
  }, [selectedId, loadGrants]);

  useEffect(() => {
    const query = userQ.trim().toLowerCase();
    if (!query) {
      setUsers(allUsers);
      return;
    }
    setUsers(
      allUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          (u.display_name ?? "").toLowerCase().includes(query)
      )
    );
  }, [userQ, allUsers]);

  useEffect(() => {
    if (searching) setActiveCategoryId(null);
  }, [searching]);

  useEffect(() => {
    setActiveCategoryId(null);
  }, [selectedId]);

  const displayTree = useMemo(() => {
    let tree: PermissionTreeNode[] = annotatePermissionTree(
      baseTree,
      new Set(grantedCourses),
      new Set(grantedFolders)
    );
    tree = filterPermissionTree(tree, filter);
    tree = filterPermissionTreeByQuery(tree, debouncedQ);
    return tree;
  }, [baseTree, grantedCourses, grantedFolders, filter, debouncedQ]);

  const topCategories = useMemo(
    () => displayTree.filter((n) => n.type === "category"),
    [displayTree]
  );

  const activeCategory = useMemo(
    () =>
      activeCategoryId
        ? topCategories.find((c) => c.id === activeCategoryId) ?? null
        : null,
    [activeCategoryId, topCategories]
  );

  useEffect(() => {
    if (
      activeCategoryId &&
      !topCategories.some((c) => c.id === activeCategoryId)
    ) {
      setActiveCategoryId(null);
    }
  }, [activeCategoryId, topCategories]);

  async function grant(node: PermissionTreeNode) {
    if (!selectedId || busy) return;
    setBusy(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/user-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedId,
          targetType: node.type === "course" ? "course" : "folder",
          targetId: node.type === "course" ? node.courseId : node.id,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? `Lỗi ${res.status}`);
      await loadGrants(selectedId);
    } catch (e: unknown) {
      setLoadError(
        e instanceof Error ? e.message : "Không cấp quyền được"
      );
    } finally {
      setBusy(false);
    }
  }

  async function revoke(node: PermissionTreeNode) {
    if (!selectedId || busy) return;
    setBusy(true);
    setLoadError("");
    try {
      const targetType = node.type === "course" ? "course" : "folder";
      const targetId = node.type === "course" ? node.courseId : node.id;
      if (!targetId) throw new Error("Mục tiêu không hợp lệ");
      const res = await fetch(
        `/api/admin/user-permissions?userId=${encodeURIComponent(selectedId)}&targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`,
        { method: "DELETE" }
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? `Lỗi ${res.status}`);
      await loadGrants(selectedId);
    } catch (e: unknown) {
      setLoadError(
        e instanceof Error ? e.message : "Không thu hồi quyền được"
      );
    } finally {
      setBusy(false);
    }
  }

  const selected = allUsers.find((u) => u.id === selectedId);
  const treeLoading = catalogLoading || (grantsLoading && !baseTree.length);
  const treeRefreshing = grantsLoading && baseTree.length > 0;

  return (
    <div className="flex gap-6">
      <div className="w-72 shrink-0">
        <h2 className="mb-3 font-bold text-foreground">Chọn User</h2>
        <Input
          placeholder="Tìm user..."
          className="mb-3"
          value={userQ}
          onChange={(e) => setUserQ(e.target.value)}
        />
        <div className="max-h-[70vh] space-y-2 overflow-y-auto">
          {users.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">
              Không tìm thấy user
            </p>
          )}
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedId(u.id)}
              className={`w-full rounded-xl p-3 text-left transition-colors ${
                selectedId === u.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-card-foreground shadow-sm hover:bg-accent"
              }`}
            >
              <p className="font-semibold">{u.display_name ?? u.username}</p>
              <p className="text-xs opacity-80">{u.courseCount} khóa học</p>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <h1 className="mb-4 text-xl font-bold text-foreground">
          Phân quyền cho {selected?.display_name ?? selected?.username ?? "—"}
        </h1>
        <p className="mb-4 text-sm text-muted">
          Cấp quyền folder ngoài để mở toàn bộ nội dung bên trong. Cấp quyền
          folder/khóa con để chỉ mở phần được chọn.
        </p>
        {loadError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400" role="alert">
            {loadError}
          </p>
        )}
        <div className="mb-4 flex flex-wrap gap-2">
          <CourseSearchBox value={q} onChange={setQ} />
          {(["all", "granted", "not"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "primary" : "secondary"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Tất cả" : f === "granted" ? "Đã cấp" : "Chưa cấp"}
            </Button>
          ))}
        </div>
        {searching && (
          <p className="mb-3 text-sm text-muted">
            Đang tìm trong toàn bộ danh mục — chọn danh mục để duyệt theo folder.
          </p>
        )}
        {searching ? (
          <PermissionCatalogTree
            tree={displayTree}
            loading={treeLoading}
            refreshing={treeRefreshing}
            busy={busy}
            onGrant={grant}
            onRevoke={revoke}
          />
        ) : !activeCategory ? (
          treeLoading ? (
            <CategoryGridSkeleton count={6} />
          ) : topCategories.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-6 text-muted">
              Không có mục phù hợp bộ lọc.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                {topCategories.length} danh mục — chọn để xem folder và khóa học
              </p>
              <PermissionCategoryGrid
                categories={topCategories}
                onSelect={setActiveCategoryId}
              />
            </>
          )
        ) : (
          <div className={treeRefreshing ? "opacity-60 transition-opacity" : ""}>
            <button
              type="button"
              onClick={() => setActiveCategoryId(null)}
              className="mb-4 flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ArrowLeft size={16} />
              Tất cả danh mục
            </button>
            <div className="mb-4 flex flex-wrap items-center gap-3 surface-card p-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-foreground">
                  {stripOrderPrefix(activeCategory.name)}
                </h2>
                <p className="text-sm text-muted">
                  {activeCategory.courseCount ?? 0} khóa học
                </p>
              </div>
              <PermissionStatusBadge status={activeCategory.grantStatus} />
              <PermissionGrantAction
                node={activeCategory}
                busy={busy}
                onGrant={grant}
                onRevoke={revoke}
              />
            </div>
            {activeCategory.children.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-6 text-muted">
                Không có mục phù hợp bộ lọc trong danh mục này.
              </p>
            ) : (
              <PermissionFolderGroups
                nodes={activeCategory.children}
                busy={busy}
                onGrant={grant}
                onRevoke={revoke}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
