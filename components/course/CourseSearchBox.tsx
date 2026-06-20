"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

export function CourseSearchBox({
  value,
  onChange,
  placeholder = "Tìm khóa học...",
  className = "",
  loading = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
}) {
  return (
    <div className={`relative min-w-[240px] flex-1 ${className}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />
      <Input
        className="pl-10 pr-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          <Spinner className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
