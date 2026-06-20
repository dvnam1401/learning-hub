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
      className="block surface-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:translate-y-0"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <BookOpen size={20} />
      </div>
      <h3 className="font-semibold text-foreground line-clamp-2">{name}</h3>
      <p className="mt-2 text-sm text-muted">
        {courseCount} khóa học · {videoCount.toLocaleString("vi-VN")} video
      </p>
    </Link>
  );
}
