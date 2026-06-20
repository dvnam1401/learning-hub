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

  if (!course || !tree) return <p className="text-white">Đang tải...</p>;

  const showLessonInBreadcrumb =
    lessonScope && lessonScope.id !== tree.id;

  return (
    <div className="-m-6 bg-slate-900 min-h-screen text-white">
      <div className="border-b border-slate-700 px-6 py-3 text-sm text-slate-300">
        <Link href={`/user/courses/${courseId}`} className="hover:text-white">
          {course.name}
        </Link>
        {showLessonInBreadcrumb && (
          <>
            {" > "}
            <span>{lessonScope.name}</span>
          </>
        )}
        {" > "}
        <span>{videoName}</span>
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-3">
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
