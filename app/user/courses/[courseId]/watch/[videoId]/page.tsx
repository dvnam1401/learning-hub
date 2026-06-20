import { WatchClient } from "./WatchClient";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ courseId: string; videoId: string }>;
}) {
  const { courseId, videoId } = await params;
  return <WatchClient courseId={courseId} videoId={videoId} />;
}
