import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Mail, Phone } from "lucide-react";
import { getClient, getRequest } from "@/lib/store/queries";
import { RunCard } from "@/components/org/RunCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const runs = (await Promise.all(client.runs.map((r) => getRequest(r.id)))).filter(
    (r): r is NonNullable<typeof r> => r !== null
  );

  return (
    <div>
      <Link
        href="/app/clients"
        className="mb-4 inline-block text-[13px] text-ink-muted hover:text-ink"
      >
        ← All clients
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">
            {client.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
            {client.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={13} /> {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={13} /> {client.phone}
              </span>
            )}
          </div>
        </div>
        <Link href={`/app/clients/${client.id}/new`}>
          <Button size="sm">
            <Plus size={15} />
            New collection run
          </Button>
        </Link>
      </header>

      {runs.length === 0 ? (
        <EmptyState
          title="No collection runs yet"
          description="Start a run to send this client a document checklist and upload link."
          action={
            <Link href={`/app/clients/${client.id}/new`}>
              <Button size="sm">
                <Plus size={15} />
                New collection run
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}
