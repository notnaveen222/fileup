import { notFound } from "next/navigation";
import { getClient } from "@/lib/store/queries";
import { NewRunForm } from "@/components/org/NewRunForm";

export const dynamic = "force-dynamic";

export default async function NewRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return <NewRunForm client={client} />;
}
