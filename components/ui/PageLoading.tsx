import { CategoryGridSkeleton } from "@/components/ui/Skeleton";

export function PageLoading({
  title = "Đang tải...",
  variant = "grid",
}: {
  title?: string;
  variant?: "grid" | "list" | "minimal";
}) {
  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/20" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted/15" />
      </div>
      {variant === "grid" ? (
        <CategoryGridSkeleton count={8} />
      ) : (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      )}
      <p className="sr-only">{title}</p>
    </div>
  );
}
