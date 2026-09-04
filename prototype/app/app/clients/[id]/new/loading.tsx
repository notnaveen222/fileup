import { Skeleton } from "@/components/ui/Skeleton";

export default function NewRunLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-4 w-24" />

      <header className="mb-6">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2.5 h-3.5 w-72" />
      </header>

      <section className="mb-6">
        <Skeleton className="mb-2 h-3.5 w-20" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <Skeleton className="mb-2 h-3.5 w-40" />
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      </section>

      <section className="mb-6 flex flex-col gap-3 sm:max-w-md">
        <Skeleton className="h-[38px] w-full" />
        <Skeleton className="h-16 w-full" />
      </section>

      <div className="flex gap-2">
        <Skeleton className="h-[38px] w-32" />
        <Skeleton className="h-[38px] w-24" />
      </div>
    </div>
  );
}
