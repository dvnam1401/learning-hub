"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CourseListSkeleton } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/format";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: number;
  created_at: string;
}

export function NotificationsPageClient() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setItems(d.notifications ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Thông báo</h1>
      <p className="mb-6 text-sm text-slate-500">
        Cập nhật về khóa học và quyền truy cập của bạn
      </p>

      {loading ? (
        <CourseListSkeleton count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Không có thông báo"
          description="Bạn sẽ nhận thông báo khi có cập nhật mới."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.read && markRead(n.id)}
              disabled={!!n.read}
              className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all duration-200 ${
                n.read
                  ? "border-slate-100 opacity-70"
                  : "border-indigo-100 hover:border-indigo-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-slate-900">{n.title}</h3>
                {!n.read && <Badge tone="blue">Mới</Badge>}
              </div>
              {n.body && (
                <p className="mt-1 text-sm text-slate-500">{n.body}</p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                {formatDateTime(n.created_at)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
