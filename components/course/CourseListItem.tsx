import Link from "next/link";
import { Clock, Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CourseListItem({
  id,
  name,
  videoCount,
  unlocked,
  onRequestAccess,
}: {
  id: string;
  name: string;
  videoCount: number;
  unlocked: boolean;
  onRequestAccess?: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
          unlocked ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
        }`}
      >
        {unlocked ? <LockOpen size={20} /> : <Lock size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900 line-clamp-2">{name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <Clock size={12} />
          {videoCount} bài học
        </p>
      </div>
      <div className="shrink-0">
        {unlocked ? (
          <Link href={`/user/courses/${id}`}>
            <Button variant="primary">Vào học</Button>
          </Link>
        ) : (
          <Button
            variant="primary"
            className="bg-orange-500 hover:bg-orange-600"
            onClick={onRequestAccess}
          >
            Yêu cầu mở
          </Button>
        )}
      </div>
    </div>
  );
}
