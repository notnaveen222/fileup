"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeTime } from "@/lib/format";
import type { RequestWithDocs } from "@/lib/types";

type Row = RequestWithDocs & { client_name: string };

export function RequestsTable({ requests }: { requests: Row[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.client_name.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)
    );
  }, [requests, query]);

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
          placeholder="Search requests…"
          className="input pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={requests.length === 0 ? "No collection runs yet" : "No matches"}
          description={
            requests.length === 0
              ? "Create one from a client's page to see it here."
              : "Try a different search term."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle text-left text-[12.5px] font-medium text-ink-muted">
                <th className="px-4 py-2.5 font-medium">Request</th>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Progress
                </th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="group border-b border-border last:border-0 hover:bg-surface-subtle"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/clients/${r.client_id}`}
                      className="font-medium text-ink group-hover:text-accent"
                    >
                      {r.label}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{r.client_name}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={r.received_count}
                        total={r.total_count}
                        size="sm"
                        className="w-24"
                      />
                      <span className="font-mono text-[12.5px] text-ink-muted">
                        {r.received_count}/{r.total_count}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={r.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-[13px] text-ink-muted md:table-cell">
                    {relativeTime(r.created_at)}
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
