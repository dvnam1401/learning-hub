import { Readable } from "stream";
import { getOAuthClient } from "@/lib/drive/client";
import { DriveStreamError } from "@/lib/drive/errors";
import {
  type PlaybackPlan,
  type QualityOption,
  listQualityOptions,
  resolveHeight,
  selectPlaybackPlan,
  selectPlaybackPlanByItag,
} from "@/lib/drive/playback-select";

const PLAN_TTL_MS = 8 * 60 * 1000;
const mapCache = new Map<string, { map: string; exp: number }>();

export type PlaybackTrack = "default" | "video" | "audio";

async function fetchStreamMap(fileId: string): Promise<string> {
  const auth = getOAuthClient();
  if (!auth) {
    throw new DriveStreamError("Google Drive chưa cấu hình", 503);
  }

  const { token } = await auth.getAccessToken();
  if (!token) {
    throw new DriveStreamError("Không lấy được access token Google", 503);
  }

  const infoUrl = new URL("https://docs.google.com/get_video_info");
  infoUrl.searchParams.set("docid", fileId);
  infoUrl.searchParams.set("access_token", token);

  const infoRes = await fetch(infoUrl.toString());
  const infoText = await infoRes.text();
  const info = new URLSearchParams(infoText);

  if (info.get("status") !== "ok") {
    const reason = info.get("reason") ?? info.get("errorcode") ?? "unknown";
    throw new DriveStreamError(
      `Drive playback không khả dụng (${reason})`,
      403,
      "playbackUnavailable"
    );
  }

  const map =
    info.get("url_encoded_fmt_stream_map") ?? info.get("fmt_stream_map");
  if (!map) {
    throw new DriveStreamError("Drive không trả về stream playback", 502);
  }

  return map;
}

export async function getStreamMap(fileId: string): Promise<string> {
  const hit = mapCache.get(fileId);
  if (hit && hit.exp > Date.now()) return hit.map;

  const map = await fetchStreamMap(fileId);
  mapCache.set(fileId, { map, exp: Date.now() + PLAN_TTL_MS });
  return map;
}

export async function getPlaybackPlan(
  fileId: string,
  itag?: string | null
): Promise<PlaybackPlan> {
  const map = await getStreamMap(fileId);
  const plan = itag
    ? selectPlaybackPlanByItag(map, itag)
    : selectPlaybackPlan(map);
  if (!plan) {
    throw new DriveStreamError("Không parse được URL stream", 502);
  }
  return plan;
}

export async function getQualityOptions(
  fileId: string
): Promise<QualityOption[]> {
  const map = await getStreamMap(fileId);
  return listQualityOptions(map);
}

function resolveUrl(
  plan: PlaybackPlan,
  track: PlaybackTrack
): { url: string; height: number; itag: string | null; quality: string | null } {
  if (plan.mode === "single") {
    return {
      url: plan.url,
      height: plan.height,
      itag: plan.itag,
      quality: plan.quality,
    };
  }

  if (track === "audio") {
    return {
      url: plan.audio.url,
      height: 0,
      itag: plan.audio.itag,
      quality: plan.audio.quality,
    };
  }

  return {
    url: plan.video.url,
    height: plan.height,
    itag: plan.video.itag,
    quality: plan.video.quality,
  };
}

export function planToManifest(
  fileId: string,
  plan: PlaybackPlan,
  qualities: QualityOption[]
) {
  const itag =
    plan.mode === "single" ? plan.itag : plan.video.itag;
  const base = `/api/videos/${fileId}/stream`;
  const withItag = (extra: Record<string, string>) => {
    const params = new URLSearchParams(extra);
    if (itag) params.set("itag", itag);
    const q = params.toString();
    return q ? `${base}?${q}` : base;
  };

  if (plan.mode === "single") {
    return {
      mode: "single" as const,
      height: plan.height,
      itag: plan.itag,
      quality: plan.quality,
      streamUrl: withItag({}),
      qualities,
      selectedItag: itag,
    };
  }

  return {
    mode: "adaptive" as const,
    height: plan.height,
    itag: plan.video.itag,
    quality: plan.video.quality,
    videoUrl: withItag({ track: "video" }),
    audioUrl: withItag({ track: "audio" }),
    videoHeight: resolveHeight(plan.video),
    qualities,
    selectedItag: itag,
  };
}

async function proxyUrl(
  url: string,
  range?: string
): Promise<{
  stream: NodeJS.ReadableStream;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  status: number;
}> {
  const headers: Record<string, string> = {
    Referer: "https://drive.google.com/",
  };
  if (range) headers.Range = range;

  const mediaRes = await fetch(url, { headers });
  if (!mediaRes.ok || !mediaRes.body) {
    throw new DriveStreamError(
      `Proxy playback thất bại (${mediaRes.status})`,
      mediaRes.status >= 400 && mediaRes.status < 500 ? mediaRes.status : 502
    );
  }

  return {
    stream: Readable.fromWeb(
      mediaRes.body as import("stream/web").ReadableStream
    ),
    contentType: mediaRes.headers.get("content-type") ?? "video/mp4",
    contentLength: mediaRes.headers.get("content-length")
      ? parseInt(mediaRes.headers.get("content-length")!, 10)
      : undefined,
    contentRange: mediaRes.headers.get("content-range") ?? undefined,
    status: mediaRes.status === 206 ? 206 : 200,
  };
}

export async function getDrivePlaybackStream(
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
  playbackHeight: number;
  playbackItag: string | null;
  playbackQuality: string | null;
  playbackMode: PlaybackPlan["mode"];
}> {
  const plan = await getPlaybackPlan(fileId, itag);
  const effectiveTrack =
    plan.mode === "adaptive"
      ? track === "default"
        ? "video"
        : track
      : "default";

  const chosen = resolveUrl(
    plan,
    effectiveTrack === "default" ? "default" : effectiveTrack
  );

  const proxied = await proxyUrl(chosen.url, range);

  return {
    ...proxied,
    playbackHeight: plan.mode === "adaptive" ? plan.height : chosen.height,
    playbackItag: chosen.itag,
    playbackQuality: chosen.quality,
    playbackMode: plan.mode,
  };
}
