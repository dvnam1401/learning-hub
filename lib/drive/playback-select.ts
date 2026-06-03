export type StreamCandidate = {
  url: string;
  itag: string | null;
  quality: string | null;
  type: string;
  width: number;
  height: number;
  size: number;
  bitrate: number;
  hasVideo: boolean;
  hasAudio: boolean;
};

export type PlaybackPlan =
  | {
      mode: "single";
      url: string;
      height: number;
      itag: string | null;
      quality: string | null;
      mime: string;
    }
  | {
      mode: "adaptive";
      video: StreamCandidate;
      audio: StreamCandidate;
      height: number;
    };

const ITAG_HEIGHT: Record<string, number> = {
  "313": 2160,
  "271": 1440,
  "37": 1080,
  "46": 1080,
  "137": 1080,
  "248": 1080,
  "399": 1080,
  "22": 720,
  "45": 720,
  "136": 720,
  "247": 720,
  "59": 480,
  "44": 480,
  "135": 480,
  "18": 360,
  "43": 360,
  "134": 360,
  "140": 0,
  "141": 0,
  "17": 144,
};

const QUALITY_HEIGHT: Record<string, number> = {
  hd2160: 2160,
  hd1440: 1440,
  hd1080: 1080,
  hd720: 720,
  large: 480,
  medium: 360,
  small: 240,
  tiny: 144,
};

export function parseStreamMap(map: string): StreamCandidate[] {
  return map
    .split(",")
    .map(parseStreamEntry)
    .filter((c): c is StreamCandidate => c !== null);
}

function parseStreamEntry(part: string): StreamCandidate | null {
  const trimmed = part.trim();
  if (!trimmed) return null;

  let url: string | null = null;
  let itag: string | null = null;
  let quality: string | null = null;
  let type = "";
  let width = 0;
  let height = 0;
  let size = 0;
  let bitrate = 0;

  if (trimmed.includes("url=")) {
    const params = new URLSearchParams(trimmed);
    url = params.get("url");
    itag = params.get("itag");
    quality = params.get("quality");
    type = params.get("type") ?? "";
    width = parseInt(params.get("width") ?? "0", 10) || 0;
    height = parseInt(params.get("height") ?? "0", 10) || 0;
    size = parseInt(params.get("size") ?? "0", 10) || 0;
    bitrate = parseInt(params.get("bitrate") ?? "0", 10) || 0;
  } else {
    const pipe = trimmed.indexOf("|");
    if (pipe === -1) return null;
    itag = trimmed.slice(0, pipe);
    url = trimmed.slice(pipe + 1);
    type = "legacy";
  }

  if (!url) return null;

  const lower = type.toLowerCase();
  const hasVideo =
    lower.includes("avc") ||
    lower.includes("vp9") ||
    lower.includes("av01") ||
    lower.includes("video/") ||
    lower === "legacy";
  const hasAudio =
    lower.includes("mp4a") ||
    lower.includes("opus") ||
    lower.includes("audio/");

  return {
    url,
    itag,
    quality,
    type,
    width,
    height,
    size,
    bitrate,
    hasVideo,
    hasAudio,
  };
}

export function resolveHeight(c: StreamCandidate): number {
  if (c.height > 0) return c.height;
  if (c.itag && ITAG_HEIGHT[c.itag]) return ITAG_HEIGHT[c.itag];
  if (c.quality && QUALITY_HEIGHT[c.quality]) return QUALITY_HEIGHT[c.quality];
  return 0;
}

function codecBonus(c: StreamCandidate): number {
  const t = c.type.toLowerCase();
  if (t.includes("avc1") || (t.includes("video/mp4") && c.hasVideo)) return 2_000_000;
  if (t.includes("vp9") || t.includes("webm")) return 800_000;
  if (t.includes("mp4a") || t.includes("audio/mp4")) return 1_500_000;
  if (t.includes("opus")) return 600_000;
  return 0;
}

function scoreStream(c: StreamCandidate): number {
  const h = resolveHeight(c);
  let score = h * 10_000_000;
  if (c.width > 0) score += c.width * 1000;
  if (c.size > 0) score += Math.min(c.size, 800_000);
  if (c.bitrate > 0) score += Math.min(c.bitrate, 400_000);
  score += codecBonus(c);
  return score;
}

function pickBest(pool: StreamCandidate[]): StreamCandidate | null {
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => scoreStream(b) - scoreStream(a))[0];
}

export function selectPlaybackPlan(map: string): PlaybackPlan | null {
  return buildPlanFromCandidates(parseStreamMap(map));
}

export type QualityOption = {
  itag: string;
  height: number;
  label: string;
};

export function listQualityOptions(map: string): QualityOption[] {
  const all = parseStreamMap(map);
  const seen = new Map<string, QualityOption>();

  for (const c of all) {
    if (!c.hasVideo || !c.itag) continue;
    const height = resolveHeight(c);
    if (height <= 0) continue;
    const existing = seen.get(c.itag);
    if (!existing || height > existing.height) {
      seen.set(c.itag, { itag: c.itag, height, label: `${height}p` });
    }
  }

  return [...seen.values()].sort((a, b) => b.height - a.height);
}

function buildPlanFromCandidates(all: StreamCandidate[]): PlaybackPlan | null {
  const combined = all.filter((c) => c.hasVideo && c.hasAudio);
  const videoOnly = all.filter((c) => c.hasVideo && !c.hasAudio);
  const audioOnly = all.filter((c) => c.hasAudio && !c.hasVideo);

  const bestCombined = pickBest(combined);
  const bestVideo = pickBest(videoOnly);
  const bestAudio = pickBest(audioOnly);

  const combinedH = bestCombined ? resolveHeight(bestCombined) : 0;
  const videoH = bestVideo ? resolveHeight(bestVideo) : 0;

  if (
    bestVideo &&
    bestAudio &&
    videoH > combinedH
  ) {
    return {
      mode: "adaptive",
      video: bestVideo,
      audio: bestAudio,
      height: videoH,
    };
  }

  if (bestCombined) {
    return {
      mode: "single",
      url: bestCombined.url,
      height: combinedH,
      itag: bestCombined.itag,
      quality: bestCombined.quality,
      mime: bestCombined.type || "video/mp4",
    };
  }

  if (bestVideo) {
    return {
      mode: "single",
      url: bestVideo.url,
      height: videoH,
      itag: bestVideo.itag,
      quality: bestVideo.quality,
      mime: bestVideo.type || "video/mp4",
    };
  }

  return null;
}

export function selectPlaybackPlanByItag(
  map: string,
  itag: string
): PlaybackPlan | null {
  const all = parseStreamMap(map);
  const target = all.find((c) => c.itag === itag && c.hasVideo);
  if (!target) return buildPlanFromCandidates(all);

  if (target.hasAudio) {
    return {
      mode: "single",
      url: target.url,
      height: resolveHeight(target),
      itag: target.itag,
      quality: target.quality,
      mime: target.type || "video/mp4",
    };
  }

  const audioOnly = all.filter((c) => c.hasAudio && !c.hasVideo);
  const bestAudio = pickBest(audioOnly);
  if (bestAudio) {
    return {
      mode: "adaptive",
      video: target,
      audio: bestAudio,
      height: resolveHeight(target),
    };
  }

  return {
    mode: "single",
    url: target.url,
    height: resolveHeight(target),
    itag: target.itag,
    quality: target.quality,
    mime: target.type || "video/mp4",
  };
}
