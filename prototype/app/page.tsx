import Link from "next/link";
import { Building2, Smartphone, ArrowRight } from "lucide-react";
import { listRequests } from "@/lib/store/queries";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResetDemoButton } from "@/components/ResetDemoButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const openRuns = (await listRequests()).filter((r) => r.status === "pending");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-9 w-9 items-center justify-center rounded-[8px] bg-ink text-[14px] font-semibold text-white">
            C
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">
            ClientCollect
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[14.5px] text-ink-muted">
            Create a document checklist, send your client one secure link, and
            see exactly what&apos;s been received and what&apos;s still missing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/app/clients"
            className="group flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-colors hover:border-ink"
          >
            <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-surface-sunken text-ink">
              <Building2 size={17} />
            </span>
            <h2 className="text-[15px] font-semibold text-ink">I&apos;m the business</h2>
            <p className="mt-1.5 flex-1 text-[13.5px] text-ink-muted">
              Manage clients, create document checklists, and track what&apos;s
              been collected.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-ink">
              View clients
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <div className="flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-surface-sunken text-ink">
              <Smartphone size={17} />
            </span>
            <h2 className="text-[15px] font-semibold text-ink">I&apos;m the client</h2>
            <p className="mt-1.5 text-[13.5px] text-ink-muted">
              Open an active upload link, the way a client would receive it.
            </p>

            <div className="mt-4 flex flex-1 flex-col gap-1.5">
              {openRuns.length === 0 ? (
                <p className="text-[13px] text-ink-faint">
                  No open requests right now — create one from the business side.
                </p>
              ) : (
                openRuns.slice(0, 4).map((r) => (
                  <Link
                    key={r.id}
                    href={`/u/${r.token}`}
                    className="group/row flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border px-3 py-2 hover:border-ink"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {r.client_name}
                      </p>
                      <p className="truncate text-[12px] text-ink-faint">{r.label}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <ProgressBar
                        value={r.received_count}
                        total={r.total_count}
                        size="sm"
                        className="w-12"
                      />
                      <span className="font-mono text-[11.5px] text-ink-muted">
                        {r.received_count}/{r.total_count}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <ResetDemoButton />
        </div>
      </div>
    </div>
  );
}
