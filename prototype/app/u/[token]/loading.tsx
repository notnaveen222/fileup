import { Skeleton } from "@/components/ui/Skeleton";

const SKELETON_ROWS = 4;

export default function ClientPortalLoading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-8 sm:py-12">
      <header className="mb-6 flex flex-col items-center gap-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3.5 w-56" />
      </header>

      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="flex flex-col gap-2.5">
        {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-border-strong px-3.5 py-3"
          >
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="mt-1.5 h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-16 shrink-0" />
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}
