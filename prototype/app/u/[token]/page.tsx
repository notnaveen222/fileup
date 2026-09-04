import { getRequestByToken, markLinkOpened, getDocumentUrl } from "@/lib/store/queries";
import { ClientPortal, type ApiRequestData } from "@/components/client/ClientPortal";

export const dynamic = "force-dynamic";

export default async function ClientUploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await getRequestByToken(token);

  if (!request) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-[15px] font-semibold text-ink">Link not found</p>
        <p className="mt-1.5 max-w-xs text-[13.5px] text-ink-muted">
          This upload link doesn&apos;t exist or has been removed. Check the link
          and try again.
        </p>
      </div>
    );
  }

  await markLinkOpened(token);

  const required = await Promise.all(
    request.required.map(async (rd) => ({
      id: rd.id,
      name: rd.name,
      current: rd.current
        ? {
            id: rd.current.id,
            file_name: rd.current.file_name,
            size_bytes: rd.current.size_bytes,
            url: await getDocumentUrl(rd.current.id),
          }
        : null,
    }))
  );

  const data: ApiRequestData = {
    org_name: request.org_name,
    client_name: request.client_name,
    label: request.label,
    description: request.description,
    status: request.status,
    received_count: request.received_count,
    total_count: request.total_count,
    required,
  };

  return <ClientPortal token={token} initialData={data} />;
}
