"use client";

import { useState } from "react";
import { Check, Circle, Copy, Bell, ChevronDown, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import { fullDate, fileSize } from "@/lib/format";
import type { RequestWithDocs } from "@/lib/types";

export function RunCard({ run }: { run: RequestWithDocs }) {
  const { show } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function copyLink() {
    const url = `${window.location.origin}/u/${run.token}`;
    await navigator.clipboard.writeText(url);
    show("Upload link copied");
  }

  async function sendReminder() {
    setSending(true);
    try {
      await fetch(`/api/requests/${run.id}/reminder`, { method: "POST" });
      show(`Reminder sent — ${run.received_count}/${run.total_count} received so far`);
    } finally {
      setSending(false);
    }
  }

  async function openDocument(uploadedDocumentId: string) {
    setOpeningId(uploadedDocumentId);
    try {
      const res = await fetch(`/api/documents/${uploadedDocumentId}`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14.5px] font-semibold text-ink">{run.label}</h3>
              <Badge tone={run.status} />
            </div>
            {run.description && (
              <p className="mt-1 text-[13px] text-ink-muted">{run.description}</p>
            )}
            <p className="mt-1 text-[12px] text-ink-faint">
              Created {fullDate(run.created_at)}
              {!run.first_opened_at && " · link not opened yet"}
            </p>
          </div>
          <p className="shrink-0 font-mono text-[13px] text-ink-muted">
            {run.received_count}/{run.total_count}
          </p>
        </div>

        <ProgressBar value={run.received_count} total={run.total_count} className="mt-3" />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={copyLink}>
            <Copy size={13} />
            Copy link
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={sendReminder}
            disabled={sending || run.status === "complete"}
          >
            <Bell size={13} />
            {sending ? "Sending…" : "Send reminder"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            View documents
            <ChevronDown
              size={13}
              className={clsx("transition-transform", expanded && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="animate-fade-in border-t border-border px-4 py-3 sm:px-5">
          <ul className="divide-y divide-border">
            {run.required.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  {doc.current ? (
                    <Check size={15} className="shrink-0 text-[var(--success)]" />
                  ) : (
                    <Circle size={13} className="shrink-0 text-ink-faint" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[13.5px] text-ink">{doc.name}</p>
                    {doc.current && (
                      <p className="truncate text-[12px] text-ink-faint">
                        {doc.current.file_name} · {fileSize(doc.current.size_bytes)}
                      </p>
                    )}
                  </div>
                </div>
                {doc.current ? (
                  <button
                    onClick={() => openDocument(doc.current!.id)}
                    disabled={openingId === doc.current.id}
                    className="flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-accent hover:text-accent-hover disabled:opacity-50"
                  >
                    {openingId === doc.current.id ? "Opening…" : "Open"}
                    <ExternalLink size={12} />
                  </button>
                ) : (
                  <span className="shrink-0 text-[12.5px] text-ink-faint">Missing</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
