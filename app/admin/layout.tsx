import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { MobileShell } from "@/components/layout/MobileShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/user");

  return (
    <MobileShell title="Admin" sidebar={<AdminSidebar />}>
      <header className="-mx-4 -mt-4 mb-6 flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-4 lg:-mx-6 lg:-mt-6 lg:px-6">
        <span className="text-sm text-muted">Bảng điều khiển</span>
        <span className="font-medium text-foreground">
          {user.displayName ?? user.username}
        </span>
      </header>
      {children}
    </MobileShell>
  );
}
