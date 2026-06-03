"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarLogout } from "@/components/auth/SidebarLogout";
import {
  Bell,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Users,
  UserCheck,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/courses", label: "Khóa học", icon: BookOpen },
  { href: "/admin/access-requests", label: "Yêu cầu cấp quyền", icon: UserCheck },
  { href: "/admin/permissions", label: "Phân quyền", icon: GraduationCap },
  { href: "/admin/notifications", label: "Thông báo", icon: Bell },
  { href: "/admin/settings/sync", label: "Cài đặt", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col overflow-y-auto bg-admin-sidebar text-slate-300">
      <div className="flex items-center gap-2 border-b border-slate-700 px-5 py-5 text-white">
        <GraduationCap className="text-admin-accent" size={24} />
        <span className="font-bold">Learning Hub</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-admin-accent text-white"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-slate-700 p-3">
        <Link
          href="/admin/settings/sync"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw size={16} />
          Đồng bộ Drive
        </Link>
        <SidebarLogout className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-red-300" />
      </div>
    </aside>
  );
}
