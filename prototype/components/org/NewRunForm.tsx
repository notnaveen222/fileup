"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Plus, X, Copy, ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { QRCodeImage } from "@/components/ui/QRCode";
import { COMMON_DOCUMENTS, QUICK_TEMPLATES } from "@/lib/templates";
import type { Client } from "@/lib/types";

export function NewRunForm({ client }: { client: Client }) {
  const { show } = useToast();

  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [customDocs, setCustomDocs] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  function applyTemplate(name: string, documents: string[]) {
    setActiveTemplate(name);
    setSelected(documents);
    setCustomDocs([]);
    if (!label.trim() || QUICK_TEMPLATES.some((t) => t.name === label)) {
      setLabel(name);
    }
  }

  function toggleDoc(name: string) {
    setActiveTemplate(null);
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  }

  function addCustomDoc() {
    const name = customInput.trim();
    if (!name) return;
    if (selected.includes(name) || customDocs.includes(name)) {
      setCustomInput("");
      return;
    }
    setActiveTemplate(null);
    setCustomDocs((prev) => [...prev, name]);
    setSelected((prev) => [...prev, name]);
    setCustomInput("");
  }

  function removeCustomDoc(name: string) {
    setCustomDocs((prev) => prev.filter((d) => d !== name));
    setSelected((prev) => prev.filter((d) => d !== name));
  }

  const allDocs = [...selected];
  const canSubmit = label.trim().length > 0 && allDocs.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          label,
          description: description || null,
          documentNames: allDocs,
        }),
      });
      if (!res.ok) throw new Error();
      const request = await res.json();
      setCreatedToken(request.token);
    } catch {
      show("Couldn't create the request — try again", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdToken) {
    return <SuccessPanel token={createdToken} clientId={client.id} />;
  }

  return (
    <div>
      <Link
        href={`/app/clients/${client.id}`}
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={13} /> {client.name}
      </Link>

      <header className="mb-6">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">
          New collection run
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          For <span className="font-medium text-ink">{client.name}</span> — choose a
          template or build the checklist yourself.
        </p>
      </header>

      <section className="mb-6">
        <p className="mb-2 text-[13px] font-medium text-ink-muted">Quick start</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => applyTemplate(t.name, t.documents)}
              className={clsx(
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                activeTemplate === t.name
                  ? "border-ink bg-ink text-white"
                  : "border-border-strong text-ink-muted hover:border-ink hover:text-ink"
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-2 text-[13px] font-medium text-ink-muted">
          Documents required ({allDocs.length} selected)
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {COMMON_DOCUMENTS.map((doc) => {
            const checked = selected.includes(doc);
            return (
              <button
                key={doc}
                type="button"
                onClick={() => toggleDoc(doc)}
                className={clsx(
                  "flex items-center gap-2 rounded-[var(--radius-sm)] border px-2.5 py-2 text-left text-[13px] transition-colors",
                  checked
                    ? "border-accent bg-accent-subtle text-accent-hover"
                    : "border-border-strong text-ink-muted hover:border-ink hover:text-ink"
                )}
              >
                <span
                  className={clsx(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                    checked ? "border-accent bg-accent text-white" : "border-border-strong"
                  )}
                >
                  {checked && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="truncate">{doc}</span>
              </button>
            );
          })}
        </div>

        {customDocs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {customDocs.map((doc) => (
              <span
                key={doc}
                className="flex items-center gap-1.5 rounded-full border border-accent bg-accent-subtle px-3 py-1 text-[12.5px] font-medium text-accent-hover"
              >
                {doc}
                <button onClick={() => removeCustomDoc(doc)} aria-label={`Remove ${doc}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex max-w-sm gap-2">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomDoc();
              }
            }}
            placeholder="Add a custom document…"
            className="input"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addCustomDoc}>
            <Plus size={14} />
            Add
          </Button>
        </div>
      </section>

      <section className="mb-6 flex flex-col gap-3 sm:max-w-md">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-muted">
            Run label
          </span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Income Tax Return — FY 2025-26"
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-muted">
            Note to client (optional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anything the client should know before uploading."
            rows={2}
            className="input resize-none"
          />
        </label>
      </section>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? "Creating…" : "Create request"}
        </Button>
        <Link href={`/app/clients/${client.id}`}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  );
}

function SuccessPanel({ token, clientId }: { token: string; clientId: string }) {
  const { show } = useToast();
  const [origin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );
  const [copied, setCopied] = useState(false);

  const url = `${origin}/u/${token}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    show("Upload link copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-md py-6 text-center">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--success-subtle)]">
        <Check size={20} className="text-[var(--success)]" strokeWidth={2.5} />
      </div>
      <h1 className="text-[18px] font-semibold text-ink">Request created successfully</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Share this link with your client — no account needed on their end.
      </p>

      <div className="mt-6 flex justify-center">
        <QRCodeImage value={url || " "} />
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-[var(--radius-sm)] border border-border-strong bg-surface-subtle p-2 pl-3">
        <span className="min-w-0 flex-1 truncate text-left font-mono text-[12.5px] text-ink-muted">
          {url}
        </span>
        <Button size="sm" variant="secondary" onClick={copy}>
          <Copy size={13} />
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        <Link href={`/app/clients/${clientId}`}>
          <Button variant="secondary">Back to client</Button>
        </Link>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost">Open as client →</Button>
        </a>
      </div>
    </div>
  );
}
