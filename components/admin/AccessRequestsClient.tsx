"use client";

import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/format";

interface Req {
  id: string;
  username: string;
  course_id: string;
  courseName: string;
  note: string | null;
  status: string;
  created_at: string;
}

const filterLabels: Record<string, string> = {
  all: "Tất cả",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export function AccessRequestsClient() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [filter, setFilter] = useState("all");

  function load() {
    const q = filter === "all" ? "" : `?status=${filter}`;
    fetch(`/api/admin/access-requests${q}`)
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []));
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function approve(id: string) {
    await fetch(`/api/admin/access-requests/${id}/approve`, {
      method: "PATCH",
    });
    load();
  }

  async function reject(id: string) {
    await fetch(`/api/admin/access-requests/${id}/reject`, {
      method: "PATCH",
    });
    load();
  }

  const tone = (s: string) =>
    s === "pending" ? "yellow" : s === "approved" ? "green" : "red";

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Yêu cầu cấp quyền</h1>
      <p className="mb-6 text-sm text-muted">Quản lý yêu cầu mở khóa học</p>
      <div className="mb-4 flex flex-wrap gap-1" role="tablist">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-accent hover:text-foreground"
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm text-foreground">
          <thead className="border-b border-border bg-accent text-muted">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Khóa học</th>
              <th className="p-3">Ngày</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    icon={UserCheck}
                    title="Không có yêu cầu"
                    description="Chưa có yêu cầu cấp quyền nào trong bộ lọc này."
                  />
                </td>
              </tr>
            )}
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border transition-colors hover:bg-accent">
                <td className="p-3 font-medium">{r.username}</td>
                <td className="p-3">{r.courseName}</td>
                <td className="p-3 text-muted">{formatDateTime(r.created_at)}</td>
                <td className="p-3">
                  <Badge tone={tone(r.status)}>{r.status}</Badge>
                </td>
                <td className="p-3">
                  {r.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="success" onClick={() => approve(r.id)}>
                        Duyệt
                      </Button>
                      <Button variant="danger" onClick={() => reject(r.id)}>
                        Từ chối
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
