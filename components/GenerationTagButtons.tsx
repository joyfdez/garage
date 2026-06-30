"use client";

import { useState } from "react";
import { Route, Star } from "lucide-react";
import { toggleModelTag, type TagType } from "@/lib/actions/modelTags";
import { toast } from "@/lib/toast";

interface Props {
  genId: string;
  initialTagKeys: string[];
}

export function GenerationTagButtons({ genId, initialTagKeys }: Props) {
  const [tagSet, setTagSet] = useState(() => new Set(initialTagKeys));
  const [pending, setPending] = useState(false);

  const isDriven = tagSet.has(`${genId}:driven`);
  const isWishlist = tagSet.has(`${genId}:wishlist`);

  async function handleToggle(type: TagType) {
    if (pending) return;
    const key = `${genId}:${type}`;
    const wasTagged = tagSet.has(key);

    setTagSet((prev) => {
      const next = new Set(prev);
      wasTagged ? next.delete(key) : next.add(key);
      return next;
    });
    setPending(true);

    try {
      const result = await toggleModelTag(genId, type);
      if (result.error) {
        setTagSet((prev) => {
          const next = new Set(prev);
          wasTagged ? next.add(key) : next.delete(key);
          return next;
        });
        toast.error("Couldn't save — please try again");
      } else {
        const label = type === "driven" ? "Driven" : "Wishlist";
        toast.info(wasTagged ? `Removed from ${label}` : `Added to ${label}`);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      <button
        type="button"
        onClick={() => handleToggle("driven")}
        disabled={pending}
        className={`flex items-center gap-1.5 text-[0.62rem] font-bold px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50 ${
          isDriven
            ? "bg-racing-green text-white"
            : "border border-ink/10 text-hint hover:border-racing-green/35 hover:text-racing-green"
        }`}
      >
        <Route size={11} />
        Driven
      </button>
      <button
        type="button"
        onClick={() => handleToggle("wishlist")}
        disabled={pending}
        className={`flex items-center gap-1.5 text-[0.62rem] font-bold px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50 ${
          isWishlist
            ? "bg-green-bright text-white"
            : "border border-ink/10 text-hint hover:border-green-bright/40 hover:text-green-bright"
        }`}
      >
        <Star size={11} />
        Wishlist
      </button>
    </div>
  );
}
