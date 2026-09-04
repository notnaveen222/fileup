"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ArrowLeftRight } from "lucide-react";
import clsx from "clsx";
import { NAV_ITEMS } from "@/lib/nav";

export function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-ink text-[11px] font-semibold text-white">
          C
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-ink">
          ClientCollect
        </span>
      </div>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-ink-muted hover:bg-surface-subtle"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-[#0d0f14]/40"
            onClick={() => setOpen(false)}
          />
          <div className="animate-fade-in absolute right-0 top-0 flex h-full w-64 flex-col bg-surface p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-ink">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint hover:bg-surface-subtle"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2.5 text-[14px] font-medium",
                      active
                        ? "bg-ink text-white"
                        : "text-ink-muted hover:bg-surface-subtle hover:text-ink"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="mt-3 flex items-center gap-2.5 rounded-[var(--radius-sm)] border-t border-border px-2.5 pt-4 pb-2 text-[13px] font-medium text-ink-muted"
              >
                <ArrowLeftRight size={15} />
                Switch demo view
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
