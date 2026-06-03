"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

export function CourseSearchBox({
  value,
  onChange,
  placeholder = "Tìm khóa học...",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative min-w-[240px] flex-1 ${className}`}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />
      <Input
        className="pl-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
