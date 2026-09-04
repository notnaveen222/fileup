import { customAlphabet } from "nanoid";
import type { DB } from "@/lib/types";

const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  12
);

const ORG_ID = "org_abc_associates";

function daysAgo(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/**
 * Builds a fresh copy of the demo dataset. Used both for the initial
 * data/db.json seed and for the "reset demo data" action.
 */
export function buildSeed(): DB {
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

  const clientId = (n: number) => `client_${n}`;
  const requestId = (n: number) => `req_${n}`;
  const reqDocId = (n: number) => `rd_${n}`;
  const uploadId = (n: number) => `ud_${n}`;

  let rdSeq = 1;
  let udSeq = 1;
  let actSeq = 1;

  function log(
    daysBack: number,
    hour: number,
    type: DB["activity_logs"][number]["type"],
    message: string,
    clientIdRef: string | null,
    requestIdRef: string | null
  ) {
    db.activity_logs.push({
      id: `act_${actSeq++}`,
      org_id: ORG_ID,
      client_id: clientIdRef,
      request_id: requestIdRef,
      type,
      message,
      created_at: daysAgo(daysBack, hour),
    });
  }

  function addRun(
    reqIdNum: number,
    cId: string,
    label: string,
    description: string | null,
    docNames: string[],
    createdDaysAgo: number,
    opts: {
      uploadedIdx?: number[]; // which required-doc indices already have a file
      opened?: boolean;
      completed?: boolean;
    } = {}
  ) {
    const rId = requestId(reqIdNum);
    const uploadedIdx = opts.uploadedIdx ?? [];
    const isComplete = uploadedIdx.length === docNames.length && docNames.length > 0;

    db.document_requests.push({
      id: rId,
      org_id: ORG_ID,
      client_id: cId,
      label,
      description,
      token: nanoid(),
      status: isComplete ? "complete" : "pending",
      created_at: daysAgo(createdDaysAgo),
      first_opened_at: opts.opened ? daysAgo(createdDaysAgo - 1) : null,
      completed_at: isComplete ? daysAgo(Math.max(createdDaysAgo - 2, 0)) : null,
    });

    docNames.forEach((name, idx) => {
      const rdId = reqDocId(rdSeq++);
      db.required_documents.push({
        id: rdId,
        request_id: rId,
        name,
        sort_order: idx,
      });

      if (uploadedIdx.includes(idx)) {
        const udId = uploadId(udSeq++);
        db.uploaded_documents.push({
          id: udId,
          required_document_id: rdId,
          file_name: `${name.replace(/\s+/g, "_")}.pdf`,
          storage_key: `seed/${rdId}.pdf`,
          mime_type: "application/pdf",
          size_bytes: 240_000 + idx * 15_000,
          version: 1,
          is_current: true,
          uploaded_at: daysAgo(createdDaysAgo - 1, 14 + (idx % 4)),
        });
      }
    });

    return rId;
  }

  // --- Ravi Kumar: active ITR run, mostly complete ---
  db.clients.push({
    id: clientId(1),
    org_id: ORG_ID,
    name: "Ravi Kumar",
    email: "ravi.kumar@gmail.com",
    phone: "+91 98765 43210",
    created_at: daysAgo(30),
  });
  log(30, 9, "client_created", "Ravi Kumar was added as a client", clientId(1), null);

  const raviReq = addRun(
    1,
    clientId(1),
    "Income Tax Return — FY 2024-25",
    "Documents needed to file your ITR for FY 2024-25.",
    ["PAN", "Aadhaar", "Photograph", "Bank Statement", "Form 16", "Previous ITR", "Investment Proofs"],
    9,
    { uploadedIdx: [0, 1, 2, 3, 4], opened: true }
  );
  log(9, 9, "request_created", "Income Tax Return request created for Ravi Kumar", clientId(1), raviReq);
  log(8, 11, "link_opened", "Ravi Kumar opened the upload link", clientId(1), raviReq);
  log(8, 12, "document_uploaded", "Ravi Kumar uploaded PAN.pdf", clientId(1), raviReq);
  log(8, 12, "document_uploaded", "Ravi Kumar uploaded Aadhaar.pdf", clientId(1), raviReq);
  log(7, 15, "document_uploaded", "Ravi Kumar uploaded Photograph.pdf", clientId(1), raviReq);
  log(2, 10, "document_uploaded", "Ravi Kumar uploaded Bank_Statement.pdf", clientId(1), raviReq);
  log(1, 18, "document_uploaded", "Ravi Kumar uploaded Form_16.pdf", clientId(1), raviReq);

  // --- ABC Pvt Ltd: complete GST run ---
  db.clients.push({
    id: clientId(2),
    org_id: ORG_ID,
    name: "ABC Pvt Ltd",
    email: "accounts@abcpvtltd.in",
    phone: "+91 90000 11122",
    created_at: daysAgo(60),
  });
  log(60, 9, "client_created", "ABC Pvt Ltd was added as a client", clientId(2), null);

  const abcReq = addRun(
    2,
    clientId(2),
    "GST Filing — Q1 2025-26",
    "Quarterly GST filing documents.",
    ["GST Certificate", "Sales Invoices", "Purchase Invoices", "Bank Statement"],
    14,
    { uploadedIdx: [0, 1, 2, 3], opened: true }
  );
  log(14, 9, "request_created", "GST Filing request created for ABC Pvt Ltd", clientId(2), abcReq);
  log(13, 10, "link_opened", "ABC Pvt Ltd opened the upload link", clientId(2), abcReq);
  log(12, 11, "document_uploaded", "ABC Pvt Ltd uploaded GST_Certificate.pdf", clientId(2), abcReq);
  log(12, 16, "document_uploaded", "ABC Pvt Ltd uploaded Sales_Invoices.pdf", clientId(2), abcReq);
  log(12, 16, "document_uploaded", "ABC Pvt Ltd uploaded Purchase_Invoices.pdf", clientId(2), abcReq);
  log(12, 17, "document_uploaded", "ABC Pvt Ltd uploaded Bank_Statement.pdf", clientId(2), abcReq);
  log(12, 17, "request_completed", "ABC Pvt Ltd completed the GST Filing request", clientId(2), abcReq);

  // --- Suresh Traders: two runs, one older loan app run (mostly pending), one new ITR run just started ---
  db.clients.push({
    id: clientId(3),
    org_id: ORG_ID,
    name: "Suresh Traders",
    email: "suresh.traders@yahoo.in",
    phone: "+91 91234 56789",
    created_at: daysAgo(45),
  });
  log(45, 9, "client_created", "Suresh Traders was added as a client", clientId(3), null);

  const sureshLoanReq = addRun(
    3,
    clientId(3),
    "Loan Application — Working Capital",
    null,
    ["PAN", "Aadhaar", "Bank Statement", "GST Certificate", "Sales Invoices"],
    20,
    { uploadedIdx: [0, 1], opened: true }
  );
  log(20, 9, "request_created", "Loan Application request created for Suresh Traders", clientId(3), sureshLoanReq);
  log(19, 10, "link_opened", "Suresh Traders opened the upload link", clientId(3), sureshLoanReq);
  log(19, 11, "document_uploaded", "Suresh Traders uploaded PAN.pdf", clientId(3), sureshLoanReq);
  log(18, 13, "document_uploaded", "Suresh Traders uploaded Aadhaar.pdf", clientId(3), sureshLoanReq);
  log(3, 9, "reminder_sent", "Reminder sent to Suresh Traders for Loan Application", clientId(3), sureshLoanReq);

  const sureshItrReq = addRun(
    4,
    clientId(3),
    "Income Tax Return — FY 2024-25",
    null,
    ["PAN", "Aadhaar", "Bank Statement", "Form 16"],
    2,
    { uploadedIdx: [], opened: false }
  );
  log(2, 9, "request_created", "Income Tax Return request created for Suresh Traders", clientId(3), sureshItrReq);

  // --- Priya Sharma: no runs yet (empty state on client detail); created before the
  // others so the empty state sorts to the end of the clients list, not the top ---
  db.clients.push({
    id: clientId(4),
    org_id: ORG_ID,
    name: "Priya Sharma",
    email: "priya.sharma@outlook.com",
    phone: "+91 99887 66554",
    created_at: daysAgo(75),
  });
  log(75, 15, "client_created", "Priya Sharma was added as a client", clientId(4), null);

  // sort activity feed newest first for convenience (store keeps insertion order; consumers can re-sort too)
  db.activity_logs.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return db;
}

export const DEFAULT_ORG_ID = ORG_ID;
