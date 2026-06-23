"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "@/lib/toast";
import { undoSale } from "@/lib/actions/car";

export function UndoSaleButton({ carId, carSlug }: { carId: string; carSlug: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);

  async function handleUndo() {
    setWorking(true);
    try {
      const result = await undoSale(carId);
      if ("error" in result) {
        toast.error(result.error);
        setWorking(false);
        setConfirming(false);
      } else {
        toast.success("Sale undone — car is back in your garage");
        router.push(`/car/${carSlug}`);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setWorking(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-ink/15 rounded-input text-ink-muted hover:text-ink hover:border-ink/25 transition-colors"
      >
        <RotateCcw size={13} />
        Undo sale
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-ink/15 bg-card px-4 py-3 w-full">
      <p className="text-xs text-ink/60 flex-1">Mark as not sold and return to garage?</p>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={working}
        className="text-xs text-ink/50 hover:text-ink px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleUndo}
        disabled={working}
        className="text-xs bg-ink hover:bg-ink/85 disabled:opacity-50 text-paper font-bold px-3 py-1.5 rounded-lg transition-colors"
      >
        {working ? "Undoing…" : "Yes, undo"}
      </button>
    </div>
  );
}
