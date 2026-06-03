import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/Button";

export default async function UserDashboardPage() {
  const user = await getSession();
  let items: Array<{
    course_id: string;
    courseName: string;
    video_id: string;
    current_time: number;
  }> = [];

  try {
    const { headers } = await import("next/headers");
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
    <div>
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Continue Learning</h1>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Tiếp tục học</h2>
        {items.length === 0 ? (
          <p className="text-slate-500">
            Chưa có bài học dở.{" "}
            <Link href="/user/library" className="text-indigo-600">
              Khám phá thư viện
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.video_id}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <h3 className="font-semibold">{item.courseName}</h3>
                <p className="mt-1 text-sm text-slate-500">Đang học dở</p>
                <Link
                  href={`/user/courses/${item.course_id}/watch/${item.video_id}`}
                  className="mt-4 inline-block"
                >
                  <Button variant="secondary">Resume</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent Progress</h2>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-slate-600">
            Xin chào, {user?.displayName ?? user?.username}! Theo dõi tiến độ
            tại{" "}
            <Link href="/user/my-courses" className="text-indigo-600">
              Khóa học của tôi
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
