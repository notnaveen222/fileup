import clsx from "clsx";

type Tone = "pending" | "complete" | "mixed" | "none" | "neutral";

const toneClasses: Record<Tone, string> = {
  complete: "bg-[var(--success-subtle)] text-[var(--success)]",
  pending: "bg-[var(--warning-subtle)] text-[var(--warning)]",
  mixed: "bg-[var(--warning-subtle)] text-[var(--warning)]",
  none: "bg-surface-sunken text-ink-faint",
  neutral: "bg-surface-sunken text-ink-muted",
};

const toneLabel: Record<Tone, string> = {
  complete: "Complete",
  pending: "Pending",
  mixed: "Mixed",
  none: "No runs yet",
  neutral: "",
};

export function Badge({
  tone,
  children,
}: {
  tone: Tone;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          tone === "complete" && "bg-[var(--success)]",
          (tone === "pending" || tone === "mixed") && "bg-[var(--warning)]",
          (tone === "none" || tone === "neutral") && "bg-ink-faint"
        )}
      />
      {children ?? toneLabel[tone]}
    </span>
  );
}
