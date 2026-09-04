"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRCodeImage({ value, size = 168 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#16181d", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div
      className="flex items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface p-3"
      style={{ width: size + 24, height: size + 24 }}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="Upload link QR code" width={size} height={size} />
      ) : (
        <div className="h-full w-full animate-pulse rounded bg-surface-sunken" />
      )}
    </div>
  );
}
