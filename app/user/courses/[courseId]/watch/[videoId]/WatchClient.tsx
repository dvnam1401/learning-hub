"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CurriculumSidebar } from "@/components/video/CurriculumSidebar";
import type { CourseTreeNode } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import {
  findLessonScope,
  findVideoPath,
  getNextVideoIdInScope,
} from "@/lib/catalog/tree-utils";

export function WatchClient({
  courseId,
  videoId,
}: {
  courseId: string;
  videoId: string;
}) {
  const router = useRouter();
  const [course, setCourse] = useState<{ name: string } | null>(null);
  const [tree, setTree] = useState<CourseTreeNode | null>(null);
  const [initialTime, setInitialTime] = useState(0);
  const [videoName, setVideoName] = useState("");

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        setCourse(d.course);
        setTree(d.tree);
        const path = findVideoPath(d.tree, videoId);
        const videoNode = path?.[path.length - 1];
        setVideoName(videoNode?.name ?? "");
      });

    fetch(`/api/progress/${videoId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.progress?.current_time) {
          setInitialTime(d.progress.current_time);
        }
      });
  }, [courseId, videoId]);

  const lessonScope = useMemo(
    () => (tree ? findLessonScope(tree, videoId) : null),
    [tree, videoId]
  );

  function handleNext() {
    if (!tree) return;
    const scope = lessonScope ?? tree;
    const id = getNextVideoIdInScope(scope, videoId);
    if (id) router.push(`/user/courses/${courseId}/watch/${id}`);
  }

  if (!course || !tree) {
    return (
      <div className="-mx-4 -mt-4 min-h-[calc(100vh-3.5rem)] bg-slate-900 lg:-m-6">
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-slate-400">
          <div className="aspect-video w-full max-w-2xl animate-pulse rounded-xl bg-slate-800" />
          <p className="text-sm">Đang tải video...</p>
        </div>
      </div>
    );
  }

  const showLessonInBreadcrumb =
    lessonScope && lessonScope.id !== tree.id;

  return (
    <div className="-mx-4 -mt-4 min-h-[calc(100vh-3.5rem)] bg-slate-900 text-white lg:-m-6">
      <div className="border-b border-slate-700 px-4 py-3 text-sm text-slate-300 lg:px-6">
        <Link href={`/user/courses/${courseId}`} className="transition-colors hover:text-white">
          <span className="line-clamp-1">{course.name}</span>
        </Link>
        {showLessonInBreadcrumb && (
          <>
            <span className="mx-1.5 text-slate-600">/</span>
            <span className="text-slate-400">{lessonScope.name}</span>
          </>
        )}
        <span className="mx-1.5 text-slate-600">/</span>
        <span className="text-white">{videoName}</span>
      </div>
      <div className="grid gap-6 p-4 lg:grid-cols-3 lg:p-6">
        <div className="lg:col-span-2 space-y-4">
          <VideoPlayer
            fileId={videoId}
            videoId={videoId}
            courseId={courseId}
            initialTime={initialTime}
            onEnded={handleNext}
          />
          <div className="flex justify-end">
            <Button onClick={handleNext}>Bài tiếp</Button>
          </div>
        </div>
        <CurriculumSidebar
          tree={tree}
          courseId={courseId}
          currentVideoId={videoId}
        />
      </div>
    </div>
  );
}
