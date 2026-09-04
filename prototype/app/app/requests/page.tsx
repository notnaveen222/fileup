import { listRequests } from "@/lib/store/queries";
import { RequestsTable } from "@/components/org/RequestsTable";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const requests = await listRequests();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">
          Document Requests
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every collection run, across every client.
        </p>
      </header>

      <RequestsTable requests={requests} />
    </div>
  );
}
