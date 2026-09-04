"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeTime } from "@/lib/format";
import type { ClientWithProgress } from "@/lib/types";

export function ClientsTable({ clients }: { clients: ClientWithProgress[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [clients, query]);

  return (
    <div>
      <div className="relative mb-4 max-w-xs">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients…"
          className="input pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={clients.length === 0 ? "No clients yet" : "No matches"}
          description={
            clients.length === 0
              ? "Add your first client to start collecting documents."
              : "Try a different search term."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle text-left text-[12.5px] font-medium text-ink-muted">
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Contact
                </th>
                <th className="px-4 py-2.5 font-medium">Documents</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                  Last activity
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="group border-b border-border last:border-0 hover:bg-surface-subtle"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/clients/${c.id}`}
                      className="font-medium text-ink group-hover:text-accent"
                    >
                      {c.name}
                    </Link>
                    <p className="mt-0.5 text-[12.5px] text-ink-faint sm:hidden">
                      {c.email || c.phone}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">
                    <p className="text-[13px]">{c.email || "—"}</p>
                    <p className="text-[12.5px] text-ink-faint">{c.phone}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-ink">
                    {c.total_count > 0 ? `${c.received_count}/${c.total_count}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={c.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-[13px] text-ink-muted md:table-cell">
                    {c.last_activity_at ? relativeTime(c.last_activity_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
