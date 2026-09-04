"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import clsx from "clsx";
import { NAV_ITEMS } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface-subtle/60 md:flex">
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-ink text-[11px] font-semibold text-white">
          C
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-ink">
          ClientCollect
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-ink text-white"
                  : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13px] font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <ArrowLeftRight size={15} strokeWidth={2} />
          Switch demo view
        </Link>
      </div>
    </aside>
  );
}
