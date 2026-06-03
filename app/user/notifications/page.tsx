"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: number;
  created_at: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setItems(d.notifications ?? []));
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Thông báo</h1>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-slate-500">Không có thông báo</p>
        )}
        {items.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl bg-white p-4 shadow-sm ${n.read ? "opacity-70" : ""}`}
            onClick={() => !n.read && markRead(n.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium">{n.title}</h3>
              {!n.read && <Badge tone="blue">Mới</Badge>}
            </div>
            {n.body && (
              <p className="mt-1 text-sm text-slate-500">{n.body}</p>
            )}
            <p className="mt-2 text-xs text-slate-400">{n.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
