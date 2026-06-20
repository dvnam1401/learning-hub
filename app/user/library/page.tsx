import { LibraryClient } from "./LibraryClient";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <LibraryClient categoryParam={category ?? null} />;
}
