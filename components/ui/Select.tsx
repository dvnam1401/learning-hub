"use client";

import { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`w-full cursor-pointer appearance-none rounded-lg border border-border bg-card px-4 py-2.5 pr-10 text-sm text-foreground outline-none transition-colors hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
