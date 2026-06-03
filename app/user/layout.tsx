import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { getUnreadCount } from "@/lib/db/repositories";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  const unread = await getUnreadCount(user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <UserSidebar
        displayName={user.displayName ?? user.username}
        unread={unread}
      />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
