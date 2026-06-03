"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarLogout } from "@/components/auth/SidebarLogout";
import {
  BookOpen,
  Bell,
  GraduationCap,
  Home,
  Settings,
} from "lucide-react";

const links = [
  { href: "/user", label: "Trang chủ", icon: Home },
  { href: "/user/my-courses", label: "Khóa học của tôi", icon: GraduationCap },
  { href: "/user/library", label: "Thư viện khóa học", icon: BookOpen },
  { href: "/user/notifications", label: "Thông báo", icon: Bell },
  { href: "/user/account", label: "Tài khoản", icon: Settings },
];

export function UserSidebar({
  displayName,
  unread = 0,
}: {
  displayName: string;
  unread?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto bg-white p-4 shadow-sm">
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
        <p className="text-sm opacity-90">Chào mừng trở lại</p>
        <p className="font-semibold">{displayName}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/user" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              {label}
              {href.includes("notifications") && unread > 0 && (
                <span className="ml-auto rounded-full bg-indigo-500 px-2 py-0.5 text-xs text-white">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-slate-100 pt-3">
        <SidebarLogout className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600" />
      </div>
    </aside>
  );
}
