/** Single source of truth for accepted upload types — shared by the client
 *  picker (accept attr + hint text) and the server-side validation, so the
 *  two can't drift apart. */
export const ALLOWED_UPLOAD_TYPES = [
  { mime: "application/pdf", ext: ".pdf", label: "PDF" },
  { mime: "image/jpeg", ext: ".jpg,.jpeg", label: "JPG" },
  { mime: "image/png", ext: ".png", label: "PNG" },
  { mime: "image/webp", ext: ".webp", label: "WEBP" },
  { mime: "image/heic", ext: ".heic", label: "HEIC" },
  { mime: "image/heif", ext: ".heif", label: "HEIF" },
  {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: ".docx",
    label: "DOCX",
  },
  { mime: "application/msword", ext: ".doc", label: "DOC" },
  {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: ".xlsx",
    label: "XLSX",
  },
  { mime: "application/vnd.ms-excel", ext: ".xls", label: "XLS" },
  { mime: "text/csv", ext: ".csv", label: "CSV" },
] as const;

export const ALLOWED_UPLOAD_MIME_TYPES = new Set<string>(
  ALLOWED_UPLOAD_TYPES.map((t): string => t.mime)
);

/** For the file input's `accept` attribute — mime types plus extensions,
 *  since some browsers (esp. on Windows) don't resolve .docx/.xlsx mimes. */
export const UPLOAD_ACCEPT_ATTR: string = ALLOWED_UPLOAD_TYPES.map(
  (t): string => t.mime
)
  .concat(ALLOWED_UPLOAD_TYPES.map((t): string => t.ext))
  .join(",");

export const UPLOAD_HINT_TEXT = "PDF, image, Word or Excel";

export const UPLOAD_REJECTION_MESSAGE =
  "Only PDF, image (JPG/PNG/WEBP/HEIC), Word or Excel files are supported";
