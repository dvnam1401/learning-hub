"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SidebarLogout({ className }: { className: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button type="button" onClick={logout} className={className}>
      <LogOut size={16} />
      Đăng xuất
    </button>
  );
}
