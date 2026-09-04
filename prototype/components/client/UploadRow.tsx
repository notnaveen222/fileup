"use client";

import { useRef, useState } from "react";
import { Check, UploadCloud, X, Loader2, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { fileSize } from "@/lib/format";

export interface UploadRowDoc {
  requiredDocumentId: string;
  name: string;
  current: {
    uploadedDocumentId: string;
    fileName: string;
    sizeBytes: number;
    url: string | null;
  } | null;
}

export function UploadRow({
  doc,
  onSetCurrent,
}: {
  doc: UploadRowDoc;
  onSetCurrent: (current: UploadRowDoc["current"]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = uploading || removing;

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/uploads/${doc.requiredDocumentId}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Upload failed — try again");
        return;
      }
      // The upload itself can't be shown before it actually finishes, but
      // once it has, the server hands back everything needed to update the
      // row directly — no extra round trip to re-fetch the whole request.
      onSetCurrent({
        uploadedDocumentId: data.document.id,
        fileName: data.document.file_name,
        sizeBytes: data.document.size_bytes,
        url: data.document.url,
      });
    } catch {
      setError("Upload failed — try again");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    const previous = doc.current;
    // Optimistic: nothing about removing a file needs to wait on the
    // network, so update the row immediately and only roll back if the
    // request actually fails.
    onSetCurrent(null);
    setRemoving(true);
    try {
      const res = await fetch(`/api/uploads/${doc.requiredDocumentId}`, { method: "DELETE" });
      if (!res.ok) {
        onSetCurrent(previous);
        setError("Couldn't remove — try again");
      }
    } catch {
      onSetCurrent(previous);
      setError("Couldn't remove — try again");
    } finally {
      setRemoving(false);
    }
  }

  const uploaded = Boolean(doc.current);

  return (
    <div>
      <div
        className={clsx(
          "flex items-center gap-3 rounded-[var(--radius-md)] border px-3.5 py-3 transition-colors",
          uploaded
            ? "border-[var(--success)]/30 bg-[var(--success-subtle)]"
            : busy
              ? "border-border-strong"
              : "border-dashed border-border-strong"
        )}
      >
        <span
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            uploaded ? "bg-[var(--success)] text-white" : "bg-surface-sunken text-ink-faint"
          )}
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : uploaded ? (
            <Check size={15} strokeWidth={2.5} />
          ) : (
            <UploadCloud size={15} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-ink">{doc.name}</p>
          {uploaded && doc.current ? (
            <p className="truncate text-[12px] text-ink-muted">
              {doc.current.fileName} · {fileSize(doc.current.sizeBytes)}
            </p>
          ) : (
            <p className="text-[12px] text-ink-faint">
              {uploading ? "Uploading…" : "PDF, JPG or PNG"}
            </p>
          )}
          {error && <p className="mt-0.5 text-[12px] text-[var(--danger)]">{error}</p>}
        </div>

        {uploaded && doc.current ? (
          <div className="flex shrink-0 items-center gap-1">
            {doc.current.url && (
              <a
                href={doc.current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
                aria-label="View file"
              >
                <ExternalLink size={14} />
              </a>
            )}
            <button
              onClick={handleRemove}
              disabled={busy}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-[var(--danger)] disabled:opacity-50"
              aria-label="Remove file"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="shrink-0 rounded-[var(--radius-sm)] bg-ink px-3.5 py-2 text-[12.5px] font-medium text-white disabled:opacity-50"
          >
            Upload
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
