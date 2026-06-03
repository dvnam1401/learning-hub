import { getDrive } from "@/lib/drive/client";
import {
  downloadBlockedMessage,
  getDriveFileMetadata,
} from "@/lib/drive/metadata";
import { hasCachedVideo, readCachedVideoStream } from "@/lib/drive/cache";
import {
  getDrivePlaybackStream,
  type PlaybackTrack,
} from "@/lib/drive/playback";
import { DriveStreamError } from "@/lib/drive/errors";

export { isDriveConfigured } from "@/lib/drive/client";
export { DriveStreamError } from "@/lib/drive/errors";

function mapDriveError(err: unknown): DriveStreamError {
  if (err instanceof DriveStreamError) return err;

  const gaxios = err as {
    response?: {
      status?: number;
      data?: {
        error?: {
          message?: string;
          errors?: { reason?: string }[];
        };
      };
    };
  };
  const status = gaxios.response?.status ?? 502;
  const apiError = gaxios.response?.data?.error;
  const reason = apiError?.errors?.[0]?.reason;

  if (reason === "cannotDownloadFile" || status === 403) {
    return new DriveStreamError(
      "Google Drive API chặn tải trực tiếp; đang dùng playback proxy.",
      403,
      reason ?? "cannotDownloadFile"
    );
  }

  if (status === 404) {
    return new DriveStreamError("Không tìm thấy file trên Drive", 404, reason);
  }

  return new DriveStreamError(
    apiError?.message ?? "Không thể truy cập file Drive",
    status,
    reason
  );
}

async function getDriveAltMediaStream(
  fileId: string,
  range?: string
): Promise<{
  stream: NodeJS.ReadableStream;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  status: number;
}> {
  const drive = getDrive();
  if (!drive) {
    throw new DriveStreamError("Google Drive chưa cấu hình", 503);
  }

  const meta = await getDriveFileMetadata(fileId);
  if (!meta) {
    throw new DriveStreamError("Không đọc được metadata file", 404);
  }

  const requestHeaders: Record<string, string> = {};
  if (range) requestHeaders.Range = range;
  if (meta.resourceKey) {
    requestHeaders["X-Goog-Drive-Resource-Keys"] = `${fileId}/${meta.resourceKey}`;
  }

  const res = await drive.files.get(
    {
      fileId,
      alt: "media",
      supportsAllDrives: true,
      acknowledgeAbuse: true,
    },
    { responseType: "stream", headers: requestHeaders }
  );

  const stream = res.data as NodeJS.ReadableStream;
  const contentType =
    (res.headers?.["content-type"] as string) ?? meta.mimeType ?? "video/mp4";
  const contentLength = res.headers?.["content-length"]
    ? parseInt(String(res.headers["content-length"]), 10)
    : undefined;
  const contentRange = res.headers?.["content-range"] as string | undefined;

  return {
    stream,
    contentType,
    contentLength,
    contentRange,
    status: res.status === 206 ? 206 : 200,
  };
}

export async function getDriveFileStream(
  fileId: string,
  range?: string,
  track: PlaybackTrack = "default",
  itag?: string | null
): Promise<{
  stream: NodeJS.ReadableStream;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  status: number;
  playbackHeight?: number;
  playbackItag?: string | null;
  playbackQuality?: string | null;
  playbackMode?: "single" | "adaptive";
} | null> {
  const cached = readCachedVideoStream(fileId, range);
  if (cached && track === "default") return cached;

  try {
    return await getDrivePlaybackStream(fileId, range, track, itag);
  } catch (playbackErr) {
    const meta = await getDriveFileMetadata(fileId).catch(() => null);

    if (meta?.capabilities?.canDownload === true) {
      try {
        return await getDriveAltMediaStream(fileId, range);
      } catch (altErr) {
        throw mapDriveError(altErr);
      }
    }

    if (playbackErr instanceof DriveStreamError) {
      if (meta?.capabilities?.canDownload === false) {
        throw new DriveStreamError(
          `${playbackErr.message} ${downloadBlockedMessage(meta)}`,
          playbackErr.status,
          playbackErr.code
        );
      }
      throw playbackErr;
    }

    if (meta?.capabilities?.canDownload === false) {
      throw new DriveStreamError(downloadBlockedMessage(meta), 403);
    }

    throw playbackErr instanceof DriveStreamError
      ? playbackErr
      : new DriveStreamError("Không phát được video", 502);
  }
}
