/**
 * Hand-rolled minimal valid single-page PDF, no dependency. Used only to
 * give seeded demo "uploads" a real file behind them (so View/Open in the
 * org UI works for seed data) instead of a metadata row pointing at
 * nothing.
 */
export function makePlaceholderPdf(title: string, subtitle: string): Buffer {
  const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const stream =
    `BT /F1 16 Tf 28 150 Td (${esc(title)}) Tj ET\n` +
    `BT /F1 11 Tf 28 128 Td (${esc(subtitle)}) Tj ET\n` +
    `BT /F1 9 Tf 28 40 Td (Sample document generated for the ClientCollect demo) Tj ET`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 320 200] /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  offsets.push(body.length);
  body += `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`;

  const xrefStart = body.length;
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  body += xref;
  body += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(body, "utf-8");
}
