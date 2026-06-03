import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isDriveConfigured } from "@/lib/drive/client";
import { DriveStreamError } from "@/lib/drive/errors";
import {
  getPlaybackPlan,
  getQualityOptions,
  planToManifest,
} from "@/lib/drive/playback";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  if (!isDriveConfigured()) {
    return jsonError("Google Drive chưa cấu hình", 503);
  }

  const { fileId } = await params;
  const itag = new URL(req.url).searchParams.get("itag");

  try {
    const [plan, qualities] = await Promise.all([
      getPlaybackPlan(fileId, itag),
      getQualityOptions(fileId),
    ]);
    return jsonOk(planToManifest(fileId, plan, qualities));
  } catch (err) {
    if (err instanceof DriveStreamError) {
      return jsonError(err.message, err.status);
    }
    console.error(err);
    return jsonError("Không lấy được thông tin phát", 502);
  }
}
