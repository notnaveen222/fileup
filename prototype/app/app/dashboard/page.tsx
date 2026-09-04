import { getDashboardStats } from "@/lib/store/queries";
import { StatCard } from "@/components/org/StatCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          A snapshot of document collection across all your clients.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total clients" value={stats.totalClients} />
        <StatCard
          label="Pending requests"
          value={stats.pendingRequests}
          hint="Collection runs not yet complete"
        />
        <StatCard
          label="Documents awaiting"
          value={stats.documentsAwaiting}
          hint="Across all pending requests"
        />
      </div>
    </div>
  );
}
