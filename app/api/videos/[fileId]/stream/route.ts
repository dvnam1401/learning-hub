import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/api/response";
import {
  DriveStreamError,
  getDriveFileStream,
  isDriveConfigured,
} from "@/lib/drive/stream";
import { Readable } from "stream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const user = await getSession();
  if (!user) return jsonError("Unauthorized", 401);

  if (!isDriveConfigured()) {
    return jsonError("Google Drive chưa cấu hình", 503);
  }

  const { fileId } = await params;
  const range = request.headers.get("range") ?? undefined;
  const trackParam = request.nextUrl.searchParams.get("track");
  const itag = request.nextUrl.searchParams.get("itag");
  const track =
    trackParam === "video" || trackParam === "audio"
      ? trackParam
      : "default";

  try {
    const result = await getDriveFileStream(fileId, range, track, itag);
    if (!result) return jsonError("Không thể phát video", 502);

    const webStream = Readable.toWeb(
      result.stream as Readable
    ) as ReadableStream;

    const headers: HeadersInit = {
      "Content-Type": result.contentType,
      "Accept-Ranges": "bytes",
    };
    if (result.contentLength) {
      headers["Content-Length"] = String(result.contentLength);
    }
    if (result.contentRange) {
      headers["Content-Range"] = result.contentRange;
    }
    if (result.playbackHeight) {
      headers["X-Playback-Height"] = String(result.playbackHeight);
    }
    if (result.playbackQuality) {
      headers["X-Playback-Quality"] = result.playbackQuality;
    }
    if (result.playbackItag) {
      headers["X-Playback-Itag"] = result.playbackItag;
    }
    if (result.playbackMode) {
      headers["X-Playback-Mode"] = result.playbackMode;
    }

    return new Response(webStream, {
      status: result.status,
      headers,
    });
  } catch (err) {
    if (err instanceof DriveStreamError) {
      return jsonError(err.message, err.status);
    }
    console.error(err);
    return jsonError("Không thể phát video", 502);
  }
}
