import { CourseDetailClient } from "./CourseDetailClient";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <CourseDetailClient courseId={courseId} />;
}
