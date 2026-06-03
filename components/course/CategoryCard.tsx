import Link from "next/link";
import { BookOpen } from "lucide-react";

export function CategoryCard({
  id,
  name,
  courseCount,
  videoCount,
  href,
}: {
  id: string;
  name: string;
  courseCount: number;
  videoCount: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <BookOpen size={20} />
      </div>
      <h3 className="font-semibold text-slate-900 line-clamp-2">{name}</h3>
      <p className="mt-2 text-sm text-slate-500">
        {courseCount} khóa học · {videoCount.toLocaleString("vi-VN")} video
      </p>
    </Link>
  );
}
