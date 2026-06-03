"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function SyncPage() {
  const [data, setData] = useState<{
    lastBuild: string | null;
    stats: { courseCount: number; videoCount: number };
    logs: Array<{
      id: string;
      started_at: string;
      finished_at: string;
      status: string;
      courses_count: number;
      videos_count: number;
      duration_ms: number;
      message: string;
    }>;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);

  function load() {
    fetch("/api/admin/sync")
      .then((r) => r.json())
      .then(setData);
  }

  useEffect(() => {
    load();
  }, []);

  async function syncNow() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) alert(json.error ?? "Lỗi đồng bộ");
      else alert("Đồng bộ thành công");
    } catch {
      alert(
        "Đồng bộ thất bại trên server. Chạy: npm run build:catalog trên máy local."
      );
    }
    setSyncing(false);
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Đồng bộ dữ liệu</h1>
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Lần build cuối</p>
            <p className="font-medium">
              {data?.lastBuild ?? "Chưa có"}
            </p>
          </div>
          <Button onClick={syncNow} disabled={syncing}>
            <RefreshCw size={16} className="inline mr-2" />
            {syncing ? "Đang đồng bộ..." : "Sync Drive Now"}
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Khóa học</p>
            <p className="text-2xl font-bold">
              {data?.stats.courseCount ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Video</p>
            <p className="text-2xl font-bold">
              {data?.stats.videoCount ?? 0}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Production: chạy scanner → npm run build:catalog → deploy thư mục data/
        </p>
      </div>
      <h2 className="mb-3 font-semibold">Lịch sử đồng bộ</h2>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">Thời gian</th>
              <th className="p-3">Status</th>
              <th className="p-3">Khóa</th>
              <th className="p-3">Video</th>
            </tr>
          </thead>
          <tbody>
            {(data?.logs ?? []).map((log) => (
              <tr key={log.id} className="border-b">
                <td className="p-3">{log.started_at}</td>
                <td className="p-3">
                  <Badge
                    tone={
                      log.status === "success"
                        ? "green"
                        : log.status === "failed"
                          ? "red"
                          : "yellow"
                    }
                  >
                    {log.status}
                  </Badge>
                </td>
                <td className="p-3">{log.courses_count}</td>
                <td className="p-3">{log.videos_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
