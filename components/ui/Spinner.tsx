export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Đang tải"
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary ${className}`}
    />
  );
}

export function LoadingBlock({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-muted">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );
}
