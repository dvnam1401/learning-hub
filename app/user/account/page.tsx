"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    username: string;
    displayName: string | null;
    role: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!user) return <p>Đang tải...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Tài khoản</h1>
      <div className="rounded-xl bg-white p-6 shadow-sm space-y-3">
        <p>
          <span className="text-slate-500">Username:</span> {user.username}
        </p>
        <p>
          <span className="text-slate-500">Tên hiển thị:</span>{" "}
          {user.displayName ?? "—"}
        </p>
        <p>
          <span className="text-slate-500">Vai trò:</span> {user.role}
        </p>
        <Button variant="danger" onClick={logout}>
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
