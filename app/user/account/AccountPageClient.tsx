"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export function AccountPageClient() {
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

  if (!user) return <p className="text-muted">Đang tải...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tài khoản</h1>
      <div className="surface-card space-y-3 p-6">
        <p className="text-foreground">
          <span className="text-muted">Username:</span> {user.username}
        </p>
        <p className="text-foreground">
          <span className="text-muted">Tên hiển thị:</span>{" "}
          {user.displayName ?? "—"}
        </p>
        <p className="text-foreground">
          <span className="text-muted">Vai trò:</span> {user.role}
        </p>
        <Button variant="danger" onClick={logout}>
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
