"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fell through — user cancelled or share failed
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card text-sm font-medium text-ink/70 hover:text-ink transition-colors"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
