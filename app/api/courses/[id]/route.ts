import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  findCourseInIndex,
  getCourseTree,
} from "@/lib/catalog/reader";
import { getOverride, hasCourseAccess } from "@/lib/db/repositories";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const course = findCourseInIndex(id);
  if (!course) return jsonError("Không tìm thấy khóa học", 404);

  const allowed = await hasCourseAccess(user.id, id, user.role);
  if (!allowed) return jsonError("Chưa được cấp quyền", 403);

  const tree = getCourseTree(id);
  const override = await getOverride(id);

  return jsonOk({
    course: {
      ...course,
      name: override?.display_name || course.name,
      thumbnailUrl: override?.thumbnail_url ?? null,
    },
    tree,
  });
}
