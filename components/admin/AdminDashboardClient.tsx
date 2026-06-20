"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, Play, AlertTriangle } from "lucide-react";
import { StatCardSkeleton } from "@/components/ui/Skeleton";

export function AdminDashboardClient() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalCourses: number;
    totalVideos: number;
    pendingRequests: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const cards = [
    { label: "Người dùng", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
    { label: "Khóa học", value: stats?.totalCourses ?? 0, icon: BookOpen, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Video", value: stats?.totalVideos ?? 0, icon: Play, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
    { label: "Yêu cầu chờ", value: stats?.pendingRequests ?? 0, icon: AlertTriangle, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  ];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mb-6 text-sm text-muted">Tổng quan hệ thống</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!stats
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : cards.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="surface-card p-5 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                    <Icon className={color} size={24} />
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
