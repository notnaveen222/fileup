import { NextRequest, NextResponse } from "next/server";
import { getRequestByToken, markLinkOpened } from "@/lib/store/queries";
import { getDocumentUrl } from "@/lib/store/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const request = await getRequestByToken(token);
  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await markLinkOpened(token);

  const requiredWithUrls = await Promise.all(
    request.required.map(async (rd) => ({
      ...rd,
      current: rd.current
        ? { ...rd.current, url: await getDocumentUrl(rd.current.id) }
        : null,
    }))
  );

  return NextResponse.json({ ...request, required: requiredWithUrls });
}
