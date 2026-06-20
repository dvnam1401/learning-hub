import { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-accent disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
