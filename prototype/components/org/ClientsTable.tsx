"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeTime } from "@/lib/format";
import type { ClientWithProgress } from "@/lib/types";

export function ClientsTable({ clients }: { clients: ClientWithProgress[] }) {
  const router = useRouter();
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
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle text-left text-[12.5px] font-medium text-ink-muted">
                <th className="px-3 py-2.5 font-medium sm:px-4 lg:w-[30%]">
                  Client
                </th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell lg:w-[30%]">
                  Contact
                </th>
                <th className="w-24 whitespace-nowrap px-3 py-2.5 text-right font-medium sm:w-28 sm:px-4 lg:text-left">
                  Documents
                </th>
                <th className="hidden w-28 whitespace-nowrap px-4 py-2.5 font-medium lg:table-cell">
                  Status
                </th>
                <th className="hidden px-4 py-2.5 font-medium xl:table-cell">
                  Last activity
                </th>
                <th className="w-8 px-2 py-2.5 sm:hidden">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/app/clients/${c.id}`)}
                    className="group cursor-pointer border-b border-border last:border-0 hover:bg-surface-subtle active:bg-surface-sunken"
                  >
                    <td className="min-w-0 px-3 py-3 sm:px-4">
                      <Link
                        href={`/app/clients/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate font-medium text-ink group-hover:text-accent"
                      >
                        {c.name}
                      </Link>
                      <p className="mt-0.5 truncate text-[12.5px] text-ink-faint sm:hidden">
                        {c.email || c.phone}
                      </p>
                    </td>
                    <td className="hidden min-w-0 px-4 py-3 text-ink-muted lg:table-cell">
                      <p className="truncate text-[13px]">{c.email || "—"}</p>
                      <p className="truncate text-[12.5px] text-ink-faint">
                        {c.phone}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-[13px] text-ink sm:px-4 lg:text-left">
                      {c.total_count > 0 ? `${c.received_count}/${c.total_count}` : "—"}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
                      <Badge tone={c.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-[13px] text-ink-muted xl:table-cell">
                      {c.last_activity_at ? relativeTime(c.last_activity_at) : "—"}
                    </td>
                    <td className="px-2 py-3 text-ink-muted sm:hidden">
                      <ChevronRight size={15} />
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
