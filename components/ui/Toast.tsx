"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export type ToastMessage = {
  text: string;
  type?: "success" | "error";
};

export function Toast({
  message,
  onClose,
}: {
  message: ToastMessage;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const Icon = message.type === "error" ? XCircle : CheckCircle;
  const iconClass =
    message.type === "error" ? "text-red-400" : "text-emerald-400";

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
    >
      <Icon size={18} className={`shrink-0 ${iconClass}`} />
      {message.text}
    </div>
  );
}
