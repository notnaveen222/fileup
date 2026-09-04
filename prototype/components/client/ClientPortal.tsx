"use client";

import { useCallback, useState } from "react";
import { PartyPopper } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UploadRow, type UploadRowDoc } from "@/components/client/UploadRow";

interface ApiRequiredDoc {
  id: string;
  name: string;
  current: {
    id: string;
    file_name: string;
    size_bytes: number;
    url: string | null;
  } | null;
}

export interface ApiRequestData {
  org_name: string;
  client_name: string;
  label: string;
  description: string | null;
  status: "pending" | "complete";
  received_count: number;
  total_count: number;
  required: ApiRequiredDoc[];
}

function toRowDocs(data: ApiRequestData): UploadRowDoc[] {
  return data.required.map((rd) => ({
    requiredDocumentId: rd.id,
    name: rd.name,
    current: rd.current
      ? {
          uploadedDocumentId: rd.current.id,
          fileName: rd.current.file_name,
          sizeBytes: rd.current.size_bytes,
          url: rd.current.url,
        }
      : null,
  }));
}

export function ClientPortal({
  token,
  initialData,
}: {
  token: string;
  initialData: ApiRequestData;
}) {
  const [data, setData] = useState(initialData);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/requests/by-token/${token}`, { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, [token]);

  const docs = toRowDocs(data);
  const complete = data.total_count > 0 && data.received_count === data.total_count;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-8 sm:py-12">
      <header className="mb-6 text-center">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-ink-faint">
          {data.org_name}
        </p>
        <h1 className="mt-1 text-[19px] font-semibold tracking-tight text-ink">
          {data.label}
        </h1>
        {data.description && (
          <p className="mt-1.5 text-[13.5px] text-ink-muted">{data.description}</p>
        )}
      </header>

      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-ink-muted">
          <span>Progress</span>
          <span className="font-mono">
            {data.received_count} / {data.total_count}
          </span>
        </div>
        <ProgressBar value={data.received_count} total={data.total_count} />
      </div>

      {complete && (
        <div className="animate-fade-in mb-6 flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--success)]/25 bg-[var(--success-subtle)] px-5 py-6 text-center">
          <PartyPopper size={22} className="mb-2 text-[var(--success)]" />
          <p className="text-[15px] font-semibold text-ink">All documents received</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            You&apos;ve successfully submitted all requested documents.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {docs.map((doc) => (
          <UploadRow key={doc.requiredDocumentId} doc={doc} onChanged={refresh} />
        ))}
      </div>

      <p className="mt-8 text-center text-[11.5px] text-ink-faint">
        Uploaded for {data.client_name} · Secured by ClientCollect
      </p>
    </div>
  );
}
