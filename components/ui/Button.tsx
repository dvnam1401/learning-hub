import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";

const styles: Record<Variant, string> = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
  secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
  danger: "bg-red-500 hover:bg-red-600 text-white",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
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
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
