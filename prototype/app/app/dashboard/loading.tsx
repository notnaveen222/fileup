import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          A snapshot of document collection across all your clients.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <Skeleton className="h-[13px] w-24" />
            <Skeleton className="mt-3 h-7 w-14" />
            <Skeleton className="mt-2.5 h-[12.5px] w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
