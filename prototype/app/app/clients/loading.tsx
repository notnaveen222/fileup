import { AddClientButton } from "@/components/org/AddClientButton";
import { Skeleton } from "@/components/ui/Skeleton";

const SKELETON_ROWS = 6;

export default function ClientsLoading() {
  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">
            Clients
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Everyone you&apos;re collecting documents from.
          </p>
        </div>
        <div className="shrink-0">
          <AddClientButton />
        </div>
      </header>

      <div className="mb-4 h-9 max-w-xs">
        <Skeleton className="h-full w-full" />
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-subtle text-left text-[12.5px] font-medium text-ink-muted">
              <th className="px-3 py-2.5 font-medium sm:px-4 lg:w-[30%]">
                Client
              </th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell lg:w-[30%]">
                Contact
              </th>
              <th className="w-24 whitespace-nowrap px-3 py-2.5 text-right font-medium sm:w-28 sm:px-4 lg:text-left">
                Documents
              </th>
              <th className="hidden w-28 whitespace-nowrap px-4 py-2.5 font-medium lg:table-cell">
                Status
              </th>
              <th className="hidden px-4 py-2.5 font-medium xl:table-cell">
                Last activity
              </th>
              <th className="w-8 px-2 py-2.5">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-3 py-3 sm:px-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-1.5 h-3 w-36 sm:hidden" />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="mt-1.5 h-3 w-24" />
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <Skeleton className="ml-auto h-3.5 w-10 lg:ml-0" />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className="hidden px-4 py-3 xl:table-cell">
                  <Skeleton className="h-3.5 w-16" />
                </td>
                <td className="px-2 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
