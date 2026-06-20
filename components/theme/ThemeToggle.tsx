"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Chuyển sáng" : "Chuyển tối"}
      className={`rounded-lg p-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-foreground" />
      ) : (
        <Moon size={18} className="text-muted" />
      )}
    </button>
  );
}
