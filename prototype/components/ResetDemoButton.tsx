"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function ResetDemoButton() {
  const router = useRouter();
  const { show } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      show("Demo data reset");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-faint hover:text-ink disabled:opacity-50"
    >
      <RotateCcw size={12} className={loading ? "animate-spin" : ""} />
      {loading ? "Resetting…" : "Reset demo data"}
    </button>
  );
}
