import { Skeleton } from "@/components/ui/Skeleton";

const SKELETON_ROWS = 6;

export default function RequestsLoading() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">
          Document Requests
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every collection run, across every client.
        </p>
      </header>

      <div className="mb-4 h-9 max-w-xs">
        <Skeleton className="h-full w-full" />
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-subtle text-left text-[12.5px] font-medium text-ink-muted">
              <th className="px-4 py-2.5 font-medium">Request</th>
              <th className="px-4 py-2.5 font-medium">Client</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                Progress
              </th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-3.5 w-24" />
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-1.5 w-24 rounded-full" />
                    <Skeleton className="h-3.5 w-8" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Skeleton className="h-3.5 w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
