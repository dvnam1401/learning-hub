"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Req {
  id: string;
  username: string;
  course_id: string;
  courseName: string;
  note: string | null;
  status: string;
  created_at: string;
}

export default function AccessRequestsPage() {
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
      <h1 className="mb-6 text-2xl font-bold">Yêu cầu cấp quyền</h1>
      <div className="mb-4 flex gap-4">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-sm font-medium capitalize ${
              filter === f ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Khóa học</th>
              <th className="p-3">Ngày</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-3">{r.username}</td>
                <td className="p-3">{r.courseName}</td>
                <td className="p-3">{r.created_at}</td>
                <td className="p-3">
                  <Badge tone={tone(r.status)}>{r.status}</Badge>
                </td>
                <td className="p-3">
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button variant="success" onClick={() => approve(r.id)}>
                        Approve
                      </Button>
                      <Button variant="danger" onClick={() => reject(r.id)}>
                        Reject
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
