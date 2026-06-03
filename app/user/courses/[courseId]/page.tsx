"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { CourseTreeNode } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { CourseCurriculum } from "@/components/course/CourseCurriculum";
import { getTopCategoryName } from "@/lib/catalog/categories";

function firstVideo(node: CourseTreeNode): { id: string; name: string } | null {
  if (node.type === "video" && node.fileId) {
    return { id: node.fileId, name: node.name };
  }
  for (const c of node.children) {
    const v = firstVideo(c);
    if (v) return v;
  }
  return null;
}

function countVideos(node: CourseTreeNode): number {
  if (node.type === "video") return 1;
  return node.children.reduce((s, c) => s + countVideos(c), 0);
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<{
    name: string;
    path: string;
    videoCount: number;
  } | null>(null);
  const [tree, setTree] = useState<CourseTreeNode | null>(null);
  const [continueVideoId, setContinueVideoId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Forbidden");
        return r.json();
      })
      .then((d) => {
        setCourse(d.course);
        setTree(d.tree);
      })
      .catch(() => router.push("/user/library"));

    fetch("/api/progress/continue")
      .then((r) => r.json())
      .then((d) => {
        const item = (d.items ?? []).find(
          (i: { course_id: string; video_id: string }) => i.course_id === courseId
        );
        if (item) setContinueVideoId(item.video_id);
      })
      .catch(() => undefined);
  }, [courseId, router]);

  if (!course || !tree) return <p>Đang tải...</p>;

  const start = firstVideo(tree);
  const resumeId = continueVideoId ?? start?.id;
  const totalVideos = countVideos(tree);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-2 text-sm text-slate-500">
        {getTopCategoryName(course.path)}
      </p>
      <h1 className="mb-2 text-3xl font-bold text-slate-900">{course.name}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {totalVideos} bài học · {course.videoCount} video
      </p>
      {resumeId && (
        <Link href={`/user/courses/${courseId}/watch/${resumeId}`}>
          <Button>{continueVideoId ? "Tiếp tục học" : "Bắt đầu học"}</Button>
        </Link>
      )}
      <div className="mt-8">
        <CourseCurriculum tree={tree} courseId={courseId} />
      </div>
    </div>
  );
}
