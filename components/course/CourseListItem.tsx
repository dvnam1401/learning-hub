import Link from "next/link";
import { Clock, Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CourseContentPreviewButton } from "@/components/course/CourseContentPreviewButton";

export function CourseListItem({
  id,
  name,
  videoCount,
  unlocked,
  bundledGift,
  accessPending,
  requesting,
  onRequestAccess,
}: {
  id: string;
  name: string;
  videoCount: number;
  unlocked: boolean;
  bundledGift?: boolean;
  accessPending?: boolean;
  requesting?: boolean;
  onRequestAccess?: () => void;
}) {
  return (
    <div className="surface-card flex flex-col gap-3 p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:flex-row sm:items-center sm:gap-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
          unlocked ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
        }`}
      >
        {unlocked ? <LockOpen size={20} /> : <Lock size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground line-clamp-2">{name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <Clock size={12} />
          {videoCount} bài học
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <CourseContentPreviewButton courseId={id} courseName={name} />
        {unlocked ? (
          <Link href={`/user/courses/${id}`}>
            <Button variant="primary">Vào học</Button>
          </Link>
        ) : bundledGift ? (
          <span className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500">
            Tặng kèm cùng nhóm
          </span>
        ) : accessPending ? (
          <Button variant="secondary" disabled>
            Đang chờ duyệt
          </Button>
        ) : (
          <Button
            variant="primary"
            className="bg-orange-500 hover:bg-orange-600"
            disabled={requesting}
            onClick={onRequestAccess}
          >
            {requesting ? "Đang gửi..." : "Yêu cầu mở"}
          </Button>
        )}
      </div>
    </div>
  );
}
