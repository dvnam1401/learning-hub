export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-gradient-to-r from-[rgb(var(--skeleton-from))] via-[rgb(var(--skeleton-via))] to-[rgb(var(--skeleton-to))] bg-shimmer ${className}`}
    />
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="surface-card p-5">
      <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
    </div>
  );
}

export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CourseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card flex items-center gap-4 p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="surface-card p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  );
}
