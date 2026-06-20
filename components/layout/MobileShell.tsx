"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function MobileShell({
  sidebar,
  children,
  title = "Learning Hub",
}: {
  sidebar: ReactNode;
  children: ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở menu"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu size={22} />
        </button>
        <span className="flex-1 truncate font-semibold text-foreground">{title}</span>
        <ThemeToggle />
      </div>

      {open && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto p-4 pt-[4.5rem] lg:p-6 lg:pt-6">
        {children}
      </main>
    </div>
  );
}
