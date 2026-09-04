"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const widthClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" }[width];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="animate-fade-in absolute inset-0 bg-[#0d0f14]/40"
        onClick={onClose}
      />
      <div
        className={`animate-fade-in relative z-10 w-full ${widthClass} rounded-t-[var(--radius-lg)] border border-border bg-surface p-5 shadow-xl shadow-black/10 sm:rounded-[var(--radius-lg)]`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint hover:bg-surface-subtle hover:text-ink"
            aria-label="Close"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M11.5 3.5l-8 8M3.5 3.5l8 8"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
