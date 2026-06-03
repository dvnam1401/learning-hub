"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  courseCount: number;
}

interface CourseRow {
  id: string;
  name: string;
  videoCount: number;
  granted: boolean;
  isGift?: boolean;
}

export default function PermissionsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [filter, setFilter] = useState<"all" | "granted" | "not">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        if (d.users?.[0]) setSelectedId(d.users[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/admin/user-courses?userId=${selectedId}`)
      .then((r) => r.json())
      .then((d) => setCourses(d.courses ?? []));
  }, [selectedId]);

  async function grant(courseId: string) {
    await fetch("/api/admin/user-courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedId, courseId }),
    });
    const res = await fetch(`/api/admin/user-courses?userId=${selectedId}`);
    const d = await res.json();
    setCourses(d.courses ?? []);
  }

  async function revoke(courseId: string) {
    await fetch(
      `/api/admin/user-courses?userId=${selectedId}&courseId=${courseId}`,
      { method: "DELETE" }
    );
    const res = await fetch(`/api/admin/user-courses?userId=${selectedId}`);
    const d = await res.json();
    setCourses(d.courses ?? []);
  }

  const selected = users.find((u) => u.id === selectedId);
  const filtered = courses.filter((c) => {
    if (filter === "granted" && !c.granted) return false;
    if (filter === "not" && c.granted) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex gap-6">
      <div className="w-72 shrink-0">
        <h2 className="mb-3 font-bold">Chọn User</h2>
        <Input
          placeholder="Tìm user..."
          className="mb-3"
          onChange={(e) => {
            const v = e.target.value.toLowerCase();
            setUsers((prev) => prev);
            void v;
          }}
        />
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
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
          Phân quyền cho {selected?.username ?? "—"}
        </h1>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Tìm khóa học..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="font-semibold line-clamp-2">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {c.videoCount} video
                {c.isGift ? " · Quà tặng mặc định" : ""}
              </p>
              <div className="mt-4">
                {c.granted && c.isGift ? (
                  <p className="text-center text-sm text-slate-500">
                    Tự động cho mọi user
                  </p>
                ) : c.granted ? (
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => revoke(c.id)}
                  >
                    Thu hồi quyền
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={() => grant(c.id)}
                  >
                    Cấp quyền
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
