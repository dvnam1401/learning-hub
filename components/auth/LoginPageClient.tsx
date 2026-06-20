"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function LoginPageClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      setLoading(false);
      setError("Không kết nối được máy chủ. Kiểm tra mạng hoặc URL deploy.");
      return;
    }
    const text = await res.text();
    setLoading(false);
    let data: { error?: string; user?: { role: string } } = {};
    if (text) {
      try {
        data = JSON.parse(text) as typeof data;
      } catch {
        setError(
          res.status === 401
            ? "Deploy bị Vercel chặn (Deployment Protection)."
            : `Máy chủ lỗi ${res.status}, phản hồi không phải JSON.`
        );
        return;
      }
    }
    if (!res.ok) {
      setError(data.error ?? `Đăng nhập thất bại (${res.status})`);
      return;
    }
    if (!data.user) {
      setError("Phản hồi đăng nhập không hợp lệ");
      return;
    }
    if (data.user.role === "ADMIN") router.push("/admin");
    else router.push("/user");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md animate-scale-in surface-card p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="text-primary" size={28} />
          </div>
          <span className="text-2xl font-bold text-foreground">
            Learning <span className="text-primary">Hub</span>
          </span>
        </div>
        <h1 className="text-center text-xl font-bold text-foreground">
          Chào mừng trở lại
        </h1>
        <p className="mb-6 text-center text-sm text-muted">
          Đăng nhập để tiếp tục học tập
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-foreground">
              Tên đăng nhập
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              Mật khẩu
            </label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="h-4 w-4 border-white/30 border-t-white" />
                Đang đăng nhập...
              </span>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted">
          Liên hệ quản trị viên để reset mật khẩu
        </p>
      </div>
    </div>
  );
}
