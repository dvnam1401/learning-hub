import type { ReactNode } from "react";

export function Collapsible({
  open,
  children,
  className = "",
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      } ${className}`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
