import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  findCourseInIndex,
  getCourseTree,
} from "@/lib/catalog/reader";
import { isHiddenUserCourse } from "@/lib/catalog/hidden-categories";
import { toPreviewTree } from "@/lib/catalog/preview-tree";
import { getOverride } from "@/lib/db/repositories";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const course = findCourseInIndex(id);
  if (!course) return jsonError("Không tìm thấy khóa học", 404);
  if (user.role !== "ADMIN" && isHiddenUserCourse(course)) {
    return jsonError("Không tìm thấy khóa học", 404);
  }

  const tree = getCourseTree(id);
  if (!tree) return jsonError("Không tìm thấy nội dung", 404);

  const override = await getOverride(id);

  return jsonOk({
    course: {
      id: course.id,
      name: override?.display_name || course.name,
      videoCount: course.videoCount,
    },
    tree: toPreviewTree(tree),
  });
}
