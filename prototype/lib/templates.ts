/**
 * Hardcoded quick-pick presets — not a manageable "Templates" feature (that
 * screen is deferred, see PLAN.md §3). Picking one just pre-fills the run
 * label and checks its documents; everything stays editable afterward.
 */
export interface QuickTemplate {
  name: string;
  documents: string[];
}

export const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    name: "Income Tax Return",
    documents: [
      "PAN",
      "Aadhaar",
      "Bank Statement",
      "Form 16",
      "Previous ITR",
      "Investment Proofs",
    ],
  },
  {
    name: "GST Filing",
    documents: ["GST Certificate", "Sales Invoices", "Purchase Invoices", "Bank Statement"],
  },
  {
    name: "New Employee",
    documents: [
      "Aadhaar",
      "PAN",
      "Photograph",
      "Degree Certificate",
      "Previous Employment Letter",
    ],
  },
  {
    name: "Loan Application",
    documents: [
      "PAN",
      "Aadhaar",
      "Bank Statement",
      "GST Certificate",
      "Sales Invoices",
      "Salary Slips",
    ],
  },
];

/** Common document types offered individually, beyond whatever a template adds. */
export const COMMON_DOCUMENTS = [
  "PAN",
  "Aadhaar",
  "Photograph",
  "Bank Statement",
  "Form 16",
  "Previous ITR",
  "Investment Proofs",
  "GST Certificate",
  "Sales Invoices",
  "Purchase Invoices",
  "Degree Certificate",
  "Previous Employment Letter",
  "Salary Slips",
  "Rent Agreement",
  "Address Proof",
  "Cancelled Cheque",
];
