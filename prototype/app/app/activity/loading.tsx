import { Skeleton } from "@/components/ui/Skeleton";

const SKELETON_ROWS = 8;

export default function ActivityLoading() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">
          Activity
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Everything happening across your clients, most recent first.
        </p>
      </header>

      <ul className="flex flex-col gap-0.5">
        {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
          <li key={i} className="flex items-start gap-3 px-2 py-2.5">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-2/3" />
            </div>
            <Skeleton className="h-3 w-14 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}
