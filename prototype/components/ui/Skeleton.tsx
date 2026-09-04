import clsx from "clsx";

/** Building block for loading.tsx fallbacks — sized per use site to match
 *  the real content it stands in for, so nothing shifts when data arrives. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-[var(--radius-sm)] bg-surface-sunken",
        className
      )}
    />
  );
}
