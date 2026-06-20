import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { MobileShell } from "@/components/layout/MobileShell";
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
    <MobileShell
      title="Learning Hub"
      sidebar={
        <UserSidebar
          displayName={user.displayName ?? user.username}
          unread={unread}
        />
      }
    >
      {children}
    </MobileShell>
  );
}
