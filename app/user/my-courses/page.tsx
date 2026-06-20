import { MyCoursesClient } from "./MyCoursesClient";

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <MyCoursesClient categoryParam={category ?? null} />;
}
