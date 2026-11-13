export function LegalContentSkeleton() {
  return (
    <div className="mt-6 flex flex-col items-start gap-6 lg:flex-row animate-pulse">
      {/* Sidebar Skeleton */}
      <aside className="w-full shrink-0 lg:w-[280px]">
        <div className="rounded-xl border border-border/50 bg-background p-6 shadow-sm space-y-4">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="space-y-3 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded w-3/4" />
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 rounded-xl border border-border/50 bg-background p-8 shadow-sm md:p-10 space-y-8 w-full">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-1/3 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        ))}
      </main>
    </div>
  );
}
