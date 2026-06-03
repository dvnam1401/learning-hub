"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CurriculumSidebar } from "@/components/video/CurriculumSidebar";
import type { CourseTreeNode } from "@/lib/types";
import { Button } from "@/components/ui/Button";

function flattenVideos(node: CourseTreeNode): string[] {
  const ids: string[] = [];
  const walk = (n: CourseTreeNode) => {
    if (n.type === "video" && n.fileId) ids.push(n.fileId);
    n.children.forEach(walk);
  };
  walk(node);
  return ids;
}

function getNextVideoId(tree: CourseTreeNode, current: string): string | null {
  const list = flattenVideos(tree);
  const i = list.indexOf(current);
  return i >= 0 && i < list.length - 1 ? list[i + 1] : null;
}

export default function WatchPage() {
  const { courseId, videoId } = useParams<{
    courseId: string;
    videoId: string;
  }>();
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
        const findName = (n: CourseTreeNode): string | null => {
          if (n.type === "video" && n.fileId === videoId) return n.name;
          for (const c of n.children) {
            const x = findName(c);
            if (x) return x;
          }
          return null;
        };
        setVideoName(findName(d.tree) ?? "");
      });

    fetch(`/api/progress/${videoId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.progress?.current_time) {
          setInitialTime(d.progress.current_time);
        }
      });
  }, [courseId, videoId]);

  function handleNext() {
    if (!tree) return;
    const id = getNextVideoId(tree, videoId);
    if (id) router.push(`/user/courses/${courseId}/watch/${id}`);
  }

  if (!course || !tree) return <p className="text-white">Đang tải...</p>;

  return (
    <div className="-m-6 bg-slate-900 min-h-screen text-white">
      <div className="border-b border-slate-700 px-6 py-3 text-sm text-slate-300">
        <Link href={`/user/courses/${courseId}`} className="hover:text-white">
          {course.name}
        </Link>
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
