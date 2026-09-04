export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <p className="text-[13px] font-medium text-ink-muted">{label}</p>
      <p className="mt-2 font-mono text-[28px] font-medium leading-none tracking-tight text-ink">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[12.5px] text-ink-faint">{hint}</p>}
    </div>
  );
}
