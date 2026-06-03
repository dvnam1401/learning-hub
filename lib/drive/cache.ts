import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from "fs";
import path from "path";
import { getDrive } from "@/lib/drive/client";
import {
  downloadBlockedMessage,
  getDriveFileMetadata,
  ownerEmail,
} from "@/lib/drive/metadata";

const CACHE_DIR = path.join(process.cwd(), "data", "video-cache");

export function getVideoCachePath(fileId: string): string {
  return path.join(CACHE_DIR, `${fileId}.mp4`);
}

export function hasCachedVideo(fileId: string): boolean {
  return existsSync(getVideoCachePath(fileId));
}

export function readCachedVideoStream(fileId: string, range?: string) {
  const filePath = getVideoCachePath(fileId);
  if (!existsSync(filePath)) return null;

  const { size } = statSync(filePath);
  const contentType = "video/mp4";

  if (!range) {
    return {
      stream: createReadStream(filePath),
      contentType,
      contentLength: size,
      status: 200 as const,
    };
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return null;

  const start = match[1] === "" ? 0 : parseInt(match[1], 10);
  const end = match[2] === "" ? size - 1 : parseInt(match[2], 10);
  if (start >= size || end >= size || start > end) return null;

  const chunkSize = end - start + 1;
  return {
    stream: createReadStream(filePath, { start, end }),
    contentType,
    contentLength: chunkSize,
    contentRange: `bytes ${start}-${end}/${size}`,
    status: 206 as const,
  };
}

export async function downloadVideoToCache(
  fileId: string
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const drive = getDrive();
  if (!drive) {
    return { ok: false, message: "Google Drive chưa cấu hình" };
  }

  const meta = await getDriveFileMetadata(fileId);
  if (!meta) {
    return { ok: false, message: "Không đọc được metadata file" };
  }
  if (meta.capabilities?.canDownload === false) {
    return { ok: false, message: downloadBlockedMessage(meta) };
  }

  mkdirSync(CACHE_DIR, { recursive: true });
  const outPath = getVideoCachePath(fileId);

  const headers: Record<string, string> = {};
  if (meta.resourceKey) {
    headers["X-Goog-Drive-Resource-Keys"] = `${fileId}/${meta.resourceKey}`;
  }

  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true, acknowledgeAbuse: true },
    { responseType: "stream", headers }
  );

  await new Promise<void>((resolve, reject) => {
    const ws = createWriteStream(outPath);
    (res.data as NodeJS.ReadableStream)
      .pipe(ws)
      .on("finish", resolve)
      .on("error", reject);
  });

  return { ok: true, path: outPath };
}

export async function cacheStatusForFile(fileId: string) {
  const cached = hasCachedVideo(fileId);
  const meta = await getDriveFileMetadata(fileId);
  return {
    fileId,
    cached,
    canDownload: meta?.capabilities?.canDownload ?? null,
    owner: meta ? ownerEmail(meta) : null,
    name: meta?.name ?? null,
  };
}
