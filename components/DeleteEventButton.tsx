"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEvent } from "@/lib/actions/event";

export function DeleteEventButton({ eventId, carSlug }: { eventId: string; carSlug: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteEvent(eventId);
      if (result && "error" in result) {
        toast.error(result.error);
        setDeleting(false);
        setConfirming(false);
      } else {
        toast.success("Event deleted", { style: { borderLeft: "3px solid #1A3A2E" } });
        router.push(`/car/${carSlug}`);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-ink/15 rounded-input text-red-400 hover:text-red-600 hover:border-red-200 transition-colors"
      >
        <Trash2 size={13} />
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50/40 px-4 py-3">
      <p className="text-xs text-red-700 font-medium flex-1">Delete this event? This can&apos;t be undone.</p>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={deleting}
        className="text-xs text-ink/50 hover:text-ink px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
