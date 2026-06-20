"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PermissionCatalogTree } from "@/components/admin/PermissionCatalogTree";
import { CourseSearchBox } from "@/components/course/CourseSearchBox";
import { useDebouncedValue } from "@/components/course/useCourseSearch";
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
  const debouncedQ = useDebouncedValue(q);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/catalog/tree").then((r) => r.json()),
    ]).then(([usersData, treeData]) => {
      const list = usersData.users ?? [];
      setAllUsers(list);
      setUsers(list);
      if (list[0]) setSelectedId(list[0].id);
      setBaseTree(treeData.tree ?? []);
      setCatalogLoading(false);
    });
  }, []);

  const loadGrants = useCallback(async (userId: string) => {
    setGrantsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/user-permissions?userId=${userId}&grantsOnly=1`
      );
      const d = await res.json();
      setGrantedCourses(d.grantedCourseIds ?? []);
      setGrantedFolders(d.grantedFolderIds ?? []);
    } finally {
      setGrantsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadGrants(selectedId);
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

  async function grant(node: PermissionTreeNode) {
    if (!selectedId || busy) return;
    setBusy(true);
    await fetch("/api/admin/user-permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedId,
        targetType: node.type === "course" ? "course" : "folder",
        targetId: node.type === "course" ? node.courseId : node.id,
      }),
    });
    await loadGrants(selectedId);
    setBusy(false);
  }

  async function revoke(node: PermissionTreeNode) {
    if (!selectedId || busy) return;
    setBusy(true);
    await fetch(
      `/api/admin/user-permissions?userId=${selectedId}&targetType=${
        node.type === "course" ? "course" : "folder"
      }&targetId=${node.type === "course" ? node.courseId : node.id}`,
      { method: "DELETE" }
    );
    await loadGrants(selectedId);
    setBusy(false);
  }

  const selected = allUsers.find((u) => u.id === selectedId);
  const treeLoading = catalogLoading || (grantsLoading && !baseTree.length);
  const treeRefreshing = grantsLoading && baseTree.length > 0;

  return (
    <div className="flex gap-6">
      <div className="w-72 shrink-0">
        <h2 className="mb-3 font-bold">Chọn User</h2>
        <Input
          placeholder="Tìm user..."
          className="mb-3"
          value={userQ}
          onChange={(e) => setUserQ(e.target.value)}
        />
        <div className="max-h-[70vh] space-y-2 overflow-y-auto">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedId(u.id)}
              className={`w-full rounded-xl p-3 text-left ${
                selectedId === u.id
                  ? "bg-indigo-600 text-white"
                  : "bg-white shadow-sm"
              }`}
            >
              <p className="font-semibold">{u.display_name ?? u.username}</p>
              <p className="text-xs opacity-80">{u.courseCount} khóa học</p>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <h1 className="mb-4 text-xl font-bold">
          Phân quyền cho {selected?.display_name ?? selected?.username ?? "—"}
        </h1>
        <p className="mb-4 text-sm text-slate-500">
          Cấp quyền folder ngoài để mở toàn bộ nội dung bên trong. Cấp quyền
          folder/khóa con để chỉ mở phần được chọn.
        </p>
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
        <PermissionCatalogTree
          tree={displayTree}
          loading={treeLoading}
          refreshing={treeRefreshing}
          busy={busy}
          onGrant={grant}
          onRevoke={revoke}
        />
      </div>
    </div>
  );
}
