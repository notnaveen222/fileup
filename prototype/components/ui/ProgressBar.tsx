import clsx from "clsx";

export function ProgressBar({
  value,
  total,
  size = "md",
  className,
}: {
  value: number;
  total: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const complete = total > 0 && value >= total;

  return (
    <div
      className={clsx(
        "w-full overflow-hidden rounded-full bg-surface-sunken",
        size === "sm" ? "h-1.5" : "h-2",
        className
      )}
    >
      <div
        className={clsx(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          complete ? "bg-[var(--success)]" : "bg-accent"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
