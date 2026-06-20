"use client";

import { useState } from "react";
import { ListTree } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CourseCurriculumPreview } from "@/components/course/CourseCurriculumPreview";
import type { CoursePreviewNode } from "@/lib/catalog/preview-tree";

export function CourseContentPreviewButton({
  courseId,
  courseName,
}: {
  courseId: string;
  courseName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState<CoursePreviewNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    setOpen(true);
    if (tree) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/preview`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tải được nội dung");
      setTree(data.tree);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={handleOpen}>
        <span className="inline-flex items-center gap-1.5">
          <ListTree size={14} />
          Xem nội dung
        </span>
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={courseName}
        size="lg"
      >
        {loading && (
          <p className="py-8 text-center text-sm text-slate-500">Đang tải...</p>
        )}
        {error && (
          <p className="py-8 text-center text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && tree && <CourseCurriculumPreview tree={tree} />}
      </Modal>
    </>
  );
}
