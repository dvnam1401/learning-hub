import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/user");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b bg-white px-6 py-4">
          <span className="text-sm text-slate-500">Admin</span>
          <span className="font-medium">
            {user.displayName ?? user.username}
          </span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
