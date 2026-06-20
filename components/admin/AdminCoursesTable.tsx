"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getSubCategoryName, getTopCategoryName } from "@/lib/catalog/categories";

export type AdminCourseRow = {
  id: string;
  name: string;
  path: string;
  videoCount: number;
  hidden?: boolean;
};

export function AdminCoursesTable({
  courses,
  onEdit,
  onHide,
}: {
  courses: AdminCourseRow[];
  onEdit: (c: AdminCourseRow) => void;
  onHide: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm text-foreground">
        <thead className="border-b border-border bg-accent text-left text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Khóa học</th>
            <th className="px-4 py-3 font-medium">Danh mục</th>
            <th className="px-4 py-3 font-medium">Video</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
            <th className="px-4 py-3 font-medium">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id} className="border-b border-border last:border-0 transition-colors hover:bg-accent">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground line-clamp-2">{c.name}</p>
                <p className="mt-0.5 text-xs text-muted line-clamp-1">
                  {getSubCategoryName(c.path) ?? getTopCategoryName(c.path)}
                </p>
              </td>
              <td className="px-4 py-3 text-muted">
                {getTopCategoryName(c.path)}
              </td>
              <td className="px-4 py-3 text-muted">{c.videoCount}</td>
              <td className="px-4 py-3">
                {c.hidden ? (
                  <Badge tone="gray">Ẩn</Badge>
                ) : (
                  <Badge tone="green">Hiện</Badge>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => onEdit(c)}>
                    Sửa
                  </Button>
                  {!c.hidden && (
                    <Button variant="ghost" onClick={() => onHide(c.id)}>
                      Ẩn
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
