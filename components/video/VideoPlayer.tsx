"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FastForward,
  Maximize,
  Pause,
  Play,
  Rewind,
  Settings,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useVideoShortcuts } from "@/components/video/useVideoShortcuts";

const SPEEDS = [0.5, 1, 1.25, 1.5, 2, 2.5];
const SEEK_STEP = 10;

type QualityOption = { itag: string; height: number; label: string };

type Manifest =
  | {
      mode: "single";
      height: number;
      quality: string | null;
      streamUrl: string;
      qualities: QualityOption[];
      selectedItag: string | null;
    }
  | {
      mode: "adaptive";
      height: number;
      quality: string | null;
      videoUrl: string;
      audioUrl: string;
      qualities: QualityOption[];
      selectedItag: string | null;
    };

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  fileId,
  videoId,
  courseId,
  initialTime = 0,
  onEnded,
}: {
  fileId: string;
  videoId: string;
  courseId: string;
  initialTime?: number;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const restoreRef = useRef<{ time: number; playing: boolean } | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveProgress = useCallback(
    async (time: number, dur: number) => {
      await fetch(`/api/progress/${videoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, currentTime: time, duration: dur }),
      });
    },
    [videoId, courseId]
  );

  const loadManifest = useCallback(
    (itag?: string | null) => {
      setLoadError(null);
      const url = itag
        ? `/api/videos/${fileId}/manifest?itag=${itag}`
        : `/api/videos/${fileId}/manifest`;
      fetch(url)
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? "Không tải manifest");
          setManifest(data);
        })
        .catch((e) =>
          setLoadError(e instanceof Error ? e.message : "Không tải video")
        );
    },
    [fileId]
  );

  useEffect(() => {
    loadManifest();
  }, [loadManifest]);

  useEffect(() => {
    if (!showSettings) return;
    const onClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showSettings]);

  const syncTime = useCallback((time: number) => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (v) v.currentTime = time;
    if (a) a.currentTime = time;
    setCurrentTime(time);
  }, []);

  const applyMute = useCallback(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (v) {
      if (manifest?.mode === "adaptive") {
        v.muted = true;
        v.volume = 0;
      } else {
        v.muted = muted;
        v.volume = muted ? 0 : 1;
      }
    }
    if (a) {
      a.muted = muted;
      a.volume = muted ? 0 : 1;
    }
  }, [muted, manifest]);

  useEffect(() => {
    applyMute();
  }, [applyMute]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !manifest) return;

    const onMeta = () => {
      setDuration(v.duration || 0);
      applyMute();
      const pending = restoreRef.current;
      if (pending) {
        syncTime(pending.time);
        restoreRef.current = null;
        if (pending.playing) {
          v.play().catch(() => undefined);
          audioRef.current?.play().catch(() => undefined);
        }
      }
    };
    const onTime = () => {
      if (!seeking) {
        setCurrentTime(v.currentTime);
        if (audioRef.current && manifest.mode === "adaptive") {
          if (Math.abs(audioRef.current.currentTime - v.currentTime) > 0.25) {
            audioRef.current.currentTime = v.currentTime;
          }
        }
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveProgress(v.currentTime, v.duration || 0);
      }, 3000);
    };

    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [manifest, saveProgress, seeking, syncTime, applyMute]);

  useEffect(() => {
    const v = videoRef.current;
    if (v && initialTime > 0 && manifest && !restoreRef.current) {
      syncTime(initialTime);
    }
  }, [initialTime, manifest, syncTime]);

  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (v) v.playbackRate = speed;
    if (a) a.playbackRate = speed;
  }, [speed]);

  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v) return;
    if (v.paused) {
      try {
        await v.play();
        if (manifest?.mode === "adaptive" && a) await a.play();
        setPlaying(true);
      } catch {
        setLoadError("Trình duyệt chặn phát tự động. Bấm Play lại.");
      }
    } else {
      v.pause();
      a?.pause();
      setPlaying(false);
    }
  }, [manifest]);

  const seekBy = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v || !duration) return;
      syncTime(Math.min(Math.max(0, v.currentTime + delta), duration));
    },
    [duration, syncTime]
  );

  useVideoShortcuts({
    onTogglePlay: togglePlay,
    onToggleMute: () => setMuted((m) => !m),
    onSeekBy: seekBy,
    onFullscreen: () => videoRef.current?.requestFullscreen(),
  });

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    syncTime(Number(e.target.value));
  };

  const changeQuality = (itag: string) => {
    if (manifest?.selectedItag === itag) return;
    restoreRef.current = { time: currentTime, playing };
    loadManifest(itag);
  };

  const qualityLabel =
    manifest?.qualities.find((q) => q.itag === manifest.selectedItag)?.label ??
    (manifest && manifest.height > 0 ? `${manifest.height}p` : "Auto");

  const settingsLabel = `${qualityLabel} · ${speed}x`;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const videoSrc =
    manifest?.mode === "single"
      ? manifest.streamUrl
      : manifest?.mode === "adaptive"
        ? manifest.videoUrl
        : undefined;

  return (
    <div className="overflow-hidden rounded-xl bg-slate-900">
      {loadError ? (
        <div className="flex aspect-video w-full items-center justify-center bg-slate-800 px-6 text-center text-sm text-red-300">
          {loadError}
        </div>
      ) : !manifest ? (
        <div className="flex aspect-video w-full items-center justify-center text-sm text-slate-400">
          Đang tải video...
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            className="aspect-video w-full"
            muted={manifest.mode === "adaptive" || muted}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={onEnded}
            onLoadedMetadata={applyMute}
            onError={() => setLoadError("Không phát được video.")}
          />
          {manifest.mode === "adaptive" && (
            <audio
              ref={audioRef}
              key={manifest.audioUrl}
              src={manifest.audioUrl}
              className="hidden"
              muted={muted}
              onLoadedMetadata={applyMute}
              onError={() => setLoadError("Không phát được âm thanh.")}
            />
          )}
        </>
      )}
      <div className="bg-slate-900 px-4 pb-3 pt-2">
        <div className="group relative mb-3">
          <div className="h-1.5 rounded-full bg-slate-700 transition-all group-hover:h-2">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            disabled={!duration}
            onChange={handleSeek}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Tiến độ video"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-white">
          <button type="button" onClick={togglePlay} className="p-1" title="Phát/Dừng (Space)">
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button type="button" onClick={() => seekBy(-SEEK_STEP)} className="p-1" title="Lùi 10s (←)">
            <Rewind size={18} />
          </button>
          <button type="button" onClick={() => seekBy(SEEK_STEP)} className="p-1" title="Tua 10s (→)">
            <FastForward size={18} />
          </button>
          <button type="button" onClick={onEnded} className="p-1" title="Bài tiếp">
            <SkipForward size={20} />
          </button>
          <span className="text-xs text-slate-300">
            {formatTime(currentTime)} / {duration ? formatTime(duration) : "--:--"}
          </span>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="ml-auto p-1 text-slate-400 hover:text-white"
            title="Tắt/bật âm (M)"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-300 hover:text-white"
              title="Cài đặt phát"
            >
              <Settings size={14} />
              {settingsLabel}
            </button>
            {showSettings && manifest && (
              <div className="absolute bottom-full right-0 z-10 mb-1 w-44 rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-lg">
                {manifest.qualities.length > 0 && (
                  <label className="mb-3 block">
                    <span className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
                      Chất lượng
                    </span>
                    <select
                      value={manifest.selectedItag ?? ""}
                      onChange={(e) => changeQuality(e.target.value)}
                      className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white"
                    >
                      {manifest.qualities.map((q) => (
                        <option key={q.itag} value={q.itag}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
                    Tốc độ
                  </span>
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  >
                    {SPEEDS.map((s) => (
                      <option key={s} value={s}>
                        {s}x
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
          <button
            type="button"
            className="p-1"
            title="Toàn màn hình (F)"
            onClick={() => videoRef.current?.requestFullscreen()}
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
