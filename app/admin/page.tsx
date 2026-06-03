"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, Play, AlertTriangle } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalVideos: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, color: "text-emerald-500" },
    { label: "Total Videos", value: stats.totalVideos, icon: Play, color: "text-purple-500" },
    { label: "Pending Requests", value: stats.pendingRequests, icon: AlertTriangle, color: "text-orange-500" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
              <Icon className={color} size={28} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
