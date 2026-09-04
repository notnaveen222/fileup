import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ClientDetailLoading() {
  return (
    <div>
      <Link
        href="/app/clients"
        className="mb-4 inline-block text-[13px] text-ink-muted hover:text-ink"
      >
        ← All clients
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Skeleton className="h-6 w-40" />
          <div className="mt-2.5 flex items-center gap-4">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
        <Skeleton className="h-8 w-40" />
      </header>

      <div className="flex flex-col gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
              <Skeleton className="h-3.5 w-10 shrink-0" />
            </div>
            <Skeleton className="mt-3.5 h-1.5 w-full rounded-full" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-7 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
