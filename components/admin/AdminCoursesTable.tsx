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
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b bg-slate-50 text-left text-slate-600">
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
            <tr key={c.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900 line-clamp-2">{c.name}</p>
                <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                  {getSubCategoryName(c.path) ?? getTopCategoryName(c.path)}
                </p>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {getTopCategoryName(c.path)}
              </td>
              <td className="px-4 py-3 text-slate-600">{c.videoCount}</td>
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
