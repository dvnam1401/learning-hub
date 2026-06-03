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
        className={`w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none transition-colors hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}
