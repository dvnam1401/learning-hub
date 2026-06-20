import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";

const styles: Record<Variant, string> = {
  primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
  secondary:
    "bg-card border border-border text-foreground hover:bg-accent",
  danger: "bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-500",
  ghost: "bg-transparent text-muted hover:bg-accent hover:text-foreground",
  success: "bg-emerald-500 hover:bg-emerald-600 text-white",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
