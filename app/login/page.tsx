"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="pointer-events-none absolute inset-0 opacity-30" />
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <BookOpen className="text-indigo-600" size={32} />
          <span className="text-2xl font-bold">
            Learning <span className="text-indigo-600">Hub</span>
          </span>
        </div>
        <h1 className="text-center text-xl font-bold">Welcome Back</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Sign in to continue learning
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Password</label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Sign In"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-400">
          Liên hệ quản trị viên để reset mật khẩu
        </p>
      </div>
    </div>
  );
}
