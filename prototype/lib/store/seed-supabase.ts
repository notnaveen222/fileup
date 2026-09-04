import { storage } from "@/lib/storage";
import { makePlaceholderPdf } from "@/lib/placeholder-pdf";
import type { DB } from "@/lib/types";

const ORG_ID = "org_abc_associates";

function daysAgo(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/**
 * Same demo dataset as lib/store/seed.ts, but for the Supabase-backed
 * store: every "already uploaded" seed document is a real placeholder PDF
 * written through the active storage adapter, so View/Open works on seed
 * data too (the JSON/local-disk seed doesn't do this — see PLAN.md).
 */
export async function buildSupabaseSeed(): Promise<DB> {
  const db: DB = {
    organizations: [
      { id: ORG_ID, name: "ABC & Associates", created_at: daysAgo(120) },
    ],
    clients: [],
    document_requests: [],
    required_documents: [],
    uploaded_documents: [],
    activity_logs: [],
  };

  let rdSeq = 1;
  let udSeq = 1;
  let actSeq = 1;

  function log(
    daysBack: number,
    hour: number,
    type: DB["activity_logs"][number]["type"],
    message: string,
    clientId: string | null,
    requestId: string | null
  ) {
    db.activity_logs.push({
      id: `act_${actSeq++}`,
      org_id: ORG_ID,
      client_id: clientId,
      request_id: requestId,
      type,
      message,
      created_at: daysAgo(daysBack, hour),
    });
  }

  async function addRun(
    reqIdNum: number,
    clientId: string,
    clientName: string,
    label: string,
    description: string | null,
    docNames: string[],
    createdDaysAgo: number,
    opts: { uploadedIdx?: number[]; opened?: boolean } = {}
  ) {
    const rId = `req_${reqIdNum}`;
    const uploadedIdx = opts.uploadedIdx ?? [];
    const isComplete = uploadedIdx.length === docNames.length && docNames.length > 0;

    db.document_requests.push({
      id: rId,
      org_id: ORG_ID,
      client_id: clientId,
      label,
      description,
      token: `seedtoken${reqIdNum}${Math.random().toString(36).slice(2, 10)}`,
      status: isComplete ? "complete" : "pending",
      created_at: daysAgo(createdDaysAgo),
      first_opened_at: opts.opened ? daysAgo(createdDaysAgo - 1) : null,
      completed_at: isComplete ? daysAgo(Math.max(createdDaysAgo - 2, 0)) : null,
    });

    for (let idx = 0; idx < docNames.length; idx++) {
      const name = docNames[idx];
      const rdId = `rd_${rdSeq++}`;
      db.required_documents.push({ id: rdId, request_id: rId, name, sort_order: idx });

      if (uploadedIdx.includes(idx)) {
        const fileName = `${name.replace(/\s+/g, "_")}.pdf`;
        const buffer = makePlaceholderPdf(name, `${clientName} — ${label}`);
        const storageKey = await storage.put({
          key: `${rId}/${rdId}/seed-${fileName}`,
          buffer,
          mimeType: "application/pdf",
        });
        db.uploaded_documents.push({
          id: `ud_${udSeq++}`,
          required_document_id: rdId,
          file_name: fileName,
          storage_key: storageKey,
          mime_type: "application/pdf",
          size_bytes: buffer.byteLength,
          version: 1,
          is_current: true,
          uploaded_at: daysAgo(createdDaysAgo - 1, 14 + (idx % 4)),
        });
      }
    }

    return rId;
  }

  // Ravi Kumar
  db.clients.push({
    id: "client_1",
    org_id: ORG_ID,
    name: "Ravi Kumar",
    email: "ravi.kumar@gmail.com",
    phone: "+91 98765 43210",
    created_at: daysAgo(30),
  });
  log(30, 9, "client_created", "Ravi Kumar was added as a client", "client_1", null);

  const raviReq = await addRun(
    1,
    "client_1",
    "Ravi Kumar",
    "Income Tax Return — FY 2024-25",
    "Documents needed to file your ITR for FY 2024-25.",
    ["PAN", "Aadhaar", "Photograph", "Bank Statement", "Form 16", "Previous ITR", "Investment Proofs"],
    9,
    { uploadedIdx: [0, 1, 2, 3, 4], opened: true }
  );
  log(9, 9, "request_created", "Income Tax Return request created for Ravi Kumar", "client_1", raviReq);
  log(8, 11, "link_opened", "Ravi Kumar opened the upload link", "client_1", raviReq);
  log(8, 12, "document_uploaded", "Ravi Kumar uploaded PAN.pdf", "client_1", raviReq);
  log(8, 12, "document_uploaded", "Ravi Kumar uploaded Aadhaar.pdf", "client_1", raviReq);
  log(7, 15, "document_uploaded", "Ravi Kumar uploaded Photograph.pdf", "client_1", raviReq);
  log(2, 10, "document_uploaded", "Ravi Kumar uploaded Bank_Statement.pdf", "client_1", raviReq);
  log(1, 18, "document_uploaded", "Ravi Kumar uploaded Form_16.pdf", "client_1", raviReq);

  // ABC Pvt Ltd
  db.clients.push({
    id: "client_2",
    org_id: ORG_ID,
    name: "ABC Pvt Ltd",
    email: "accounts@abcpvtltd.in",
    phone: "+91 90000 11122",
    created_at: daysAgo(60),
  });
  log(60, 9, "client_created", "ABC Pvt Ltd was added as a client", "client_2", null);

  const abcReq = await addRun(
    2,
    "client_2",
    "ABC Pvt Ltd",
    "GST Filing — Q1 2025-26",
    "Quarterly GST filing documents.",
    ["GST Certificate", "Sales Invoices", "Purchase Invoices", "Bank Statement"],
    14,
    { uploadedIdx: [0, 1, 2, 3], opened: true }
  );
  log(14, 9, "request_created", "GST Filing request created for ABC Pvt Ltd", "client_2", abcReq);
  log(13, 10, "link_opened", "ABC Pvt Ltd opened the upload link", "client_2", abcReq);
  log(12, 11, "document_uploaded", "ABC Pvt Ltd uploaded GST_Certificate.pdf", "client_2", abcReq);
  log(12, 16, "document_uploaded", "ABC Pvt Ltd uploaded Sales_Invoices.pdf", "client_2", abcReq);
  log(12, 16, "document_uploaded", "ABC Pvt Ltd uploaded Purchase_Invoices.pdf", "client_2", abcReq);
  log(12, 17, "document_uploaded", "ABC Pvt Ltd uploaded Bank_Statement.pdf", "client_2", abcReq);
  log(12, 17, "request_completed", "ABC Pvt Ltd completed the GST Filing request", "client_2", abcReq);

  // Suresh Traders — two runs
  db.clients.push({
    id: "client_3",
    org_id: ORG_ID,
    name: "Suresh Traders",
    email: "suresh.traders@yahoo.in",
    phone: "+91 91234 56789",
    created_at: daysAgo(45),
  });
  log(45, 9, "client_created", "Suresh Traders was added as a client", "client_3", null);

  const loanReq = await addRun(
    3,
    "client_3",
    "Suresh Traders",
    "Loan Application — Working Capital",
    null,
    ["PAN", "Aadhaar", "Bank Statement", "GST Certificate", "Sales Invoices"],
    20,
    { uploadedIdx: [0, 1], opened: true }
  );
  log(20, 9, "request_created", "Loan Application request created for Suresh Traders", "client_3", loanReq);
  log(19, 10, "link_opened", "Suresh Traders opened the upload link", "client_3", loanReq);
  log(19, 11, "document_uploaded", "Suresh Traders uploaded PAN.pdf", "client_3", loanReq);
  log(18, 13, "document_uploaded", "Suresh Traders uploaded Aadhaar.pdf", "client_3", loanReq);
  log(3, 9, "reminder_sent", "Reminder sent to Suresh Traders for Loan Application", "client_3", loanReq);

  const itrReq2 = await addRun(
    4,
    "client_3",
    "Suresh Traders",
    "Income Tax Return — FY 2024-25",
    null,
    ["PAN", "Aadhaar", "Bank Statement", "Form 16"],
    2,
    { uploadedIdx: [], opened: false }
  );
  log(2, 9, "request_created", "Income Tax Return request created for Suresh Traders", "client_3", itrReq2);

  // Priya Sharma — no runs yet
  db.clients.push({
    id: "client_4",
    org_id: ORG_ID,
    name: "Priya Sharma",
    email: "priya.sharma@outlook.com",
    phone: "+91 99887 66554",
    created_at: daysAgo(1),
  });
  log(1, 15, "client_created", "Priya Sharma was added as a client", "client_4", null);

  db.activity_logs.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return db;
}

export const SUPABASE_DEFAULT_ORG_ID = ORG_ID;
