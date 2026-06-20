import Link from "next/link";
import { headers } from "next/headers";
import { BookOpen, PlayCircle } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function UserDashboardPage() {
  const user = await getSession();
  let items: Array<{
    course_id: string;
    courseName: string;
    video_id: string;
    current_time: number;
  }> = [];

  try {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    const res = await fetch(`${proto}://${host}/api/progress/continue`, {
      cache: "no-store",
      headers: { cookie: h.get("cookie") ?? "" },
    });
    if (res.ok) {
      const data = await res.json();
      items = data.items ?? [];
    }
  } catch {
    /* empty catalog */
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Trang chủ</h1>
        <p className="mt-1 text-sm text-muted">
          Xin chào, {user?.displayName ?? user?.username}
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Tiếp tục học</h2>
        {items.length === 0 ? (
          <EmptyState
            icon={PlayCircle}
            title="Chưa có bài học dở"
            description="Khám phá thư viện và bắt đầu học ngay hôm nay."
            action={
              <Link href="/user/library">
                <Button>Khám phá thư viện</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.video_id}
                className="group surface-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PlayCircle size={20} />
                </div>
                <h3 className="font-semibold text-foreground line-clamp-2">
                  {item.courseName}
                </h3>
                <p className="mt-1 text-sm text-muted">Đang học dở</p>
                <Link
                  href={`/user/courses/${item.course_id}/watch/${item.video_id}`}
                  className="mt-4 inline-block"
                >
                  <Button variant="primary">Tiếp tục học</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Khám phá thêm</h2>
        <div className="surface-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-foreground/80">
                Theo dõi tiến độ học tập tại{" "}
                <Link href="/user/my-courses" className="font-medium text-primary hover:underline">
                  Khóa học của tôi
                </Link>
                .
              </p>
              <Link href="/user/library" className="mt-3 inline-block">
                <Button variant="secondary">Xem thư viện</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
