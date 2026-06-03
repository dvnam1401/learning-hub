import { useEffect } from "react";

export function useVideoShortcuts({
  onTogglePlay,
  onToggleMute,
  onSeekBy,
  onFullscreen,
}: {
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSeekBy: (delta: number) => void;
  onFullscreen: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        onTogglePlay();
        return;
      }
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        onToggleMute();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSeekBy(-10);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onSeekBy(10);
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        onFullscreen();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTogglePlay, onToggleMute, onSeekBy, onFullscreen]);
}
