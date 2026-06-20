"use client";

import Link from "next/link";
import { Clock, Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface CourseCardProps {
  id: string;
  name: string;
  videoCount: number;
  unlocked: boolean;
  progress?: number;
  thumbnailUrl?: string | null;
  onRequestAccess?: () => void;
}

export function CourseCard({
  id,
  name,
  videoCount,
  unlocked,
  progress = 0,
  thumbnailUrl,
  onRequestAccess,
}: CourseCardProps) {
  return (
    <div className="surface-card overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-video bg-gradient-to-br from-accent to-muted/30">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Lock className="text-white" size={40} />
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded p-1 ${
            unlocked ? "bg-emerald-500" : "bg-slate-500"
          }`}
        >
          {unlocked ? (
            <LockOpen size={14} className="text-white" />
          ) : (
            <Lock size={14} className="text-white" />
          )}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2">{name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <Clock size={12} />
          {videoCount} video
        </p>
        {unlocked && progress > 0 && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-accent">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">{progress}% hoàn thành</p>
          </div>
        )}
        <div className="mt-4">
          {unlocked ? (
            <Link href={`/user/courses/${id}`}>
              <Button className="w-full" variant="primary">
                {progress > 0 ? "Tiếp tục" : "Học ngay"}
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              variant="primary"
              onClick={onRequestAccess}
            >
              Yêu cầu mở khóa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
