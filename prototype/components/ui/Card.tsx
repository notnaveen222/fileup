import clsx from "clsx";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-lg)] border border-border bg-surface",
        className
      )}
    >
      {children}
    </div>
  );
}
