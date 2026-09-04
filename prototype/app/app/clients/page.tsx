import { listClients } from "@/lib/store/queries";
import { ClientsTable } from "@/components/org/ClientsTable";
import { AddClientButton } from "@/components/org/AddClientButton";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await listClients();

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

      <ClientsTable clients={clients} />
    </div>
  );
}
