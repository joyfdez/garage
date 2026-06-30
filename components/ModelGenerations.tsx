"use client";

import { useState } from "react";
import Link from "next/link";
import { Route, Star, ChevronRight } from "lucide-react";
import { toggleModelTag, type TagType } from "@/lib/actions/modelTags";
import { toast } from "@/lib/toast";

export interface Generation {
  id: string;
  generation: string;
  chassis_code: string | null;
  year_start: number;
  year_end: number | null;
  engines: string[];
  slug: string;
}

// CommunityCar kept for compatibility — no longer rendered here (moved to generation page)
export interface CommunityCar {
  slug: string;
  year: number;
  nickname: string | null;
  cover_photo_path: string | null;
  model_id: string;
  ownerUsername: string | null;
}

// ModelPhoto kept for import compatibility with existing code
export interface ModelPhoto {
  storage_path: string;
  position: number;
}

interface ModelGenerationsProps {
  generations: Generation[];
  initialTagKeys: string[];
  countByGenId: Record<string, number>;
  isLoggedIn: boolean;
}

function yearLabel(start: number, end: number | null): string {
  return end ? `${start}–${end}` : `${start}–`;
}

export function ModelGenerations({
  generations,
  initialTagKeys,
  countByGenId,
  isLoggedIn,
}: ModelGenerationsProps) {
  const [tagSet, setTagSet] = useState<Set<string>>(
    () => new Set(initialTagKeys)
  );
  const [pending, setPending] = useState<string | null>(null);

  async function handleToggle(genId: string, type: TagType) {
    if (pending) return;
    const key = `${genId}:${type}`;
    const wasTagged = tagSet.has(key);

    setTagSet((prev) => {
      const next = new Set(prev);
      wasTagged ? next.delete(key) : next.add(key);
      return next;
    });
    setPending(genId);

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
      setPending(null);
    }
  }

  return (
    <div>
      {generations.map((gen, idx) => {
        const isDriven = tagSet.has(`${gen.id}:driven`);
        const isWishlist = tagSet.has(`${gen.id}:wishlist`);
        const isGenPending = pending === gen.id;
        const count = countByGenId[gen.id] ?? 0;
        const showChassis =
          gen.chassis_code && gen.chassis_code !== gen.generation;

        return (
          <div
            key={gen.id}
            className={idx > 0 ? "border-t border-ink/8" : ""}
          >
            <div className="px-5 py-5 flex items-start gap-3 justify-between">
              {/* ── Left: link to generation page ─────────────────────── */}
              <Link
                href={`/generation/${gen.slug}`}
                className="flex-1 min-w-0 group"
              >
                {/* Tagged accent bar */}
                <div
                  className={`h-[3px] w-8 rounded-full mb-2.5 transition-colors ${
                    isDriven
                      ? "bg-racing-green"
                      : isWishlist
                      ? "bg-green-bright/60"
                      : "bg-ink/8"
                  }`}
                />
                {/* Generation name */}
                <h2
                  className={`font-display font-bold text-[1.75rem] leading-none tracking-tight transition-colors ${
                    isDriven
                      ? "text-racing-green"
                      : "text-ink group-hover:text-racing-green"
                  }`}
                >
                  {gen.generation}
                </h2>
                {/* Year span + chassis */}
                <p className="text-[0.52rem] uppercase tracking-[0.18em] text-hint mt-1.5 leading-none">
                  {[
                    showChassis ? gen.chassis_code : null,
                    yearLabel(gen.year_start, gen.year_end),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {/* Engine chips */}
                {gen.engines.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {gen.engines.map((engine) => (
                      <span
                        key={engine}
                        className="text-[0.58rem] uppercase tracking-[0.06em] text-ink-muted bg-ink/[0.06] px-2 py-1 rounded-full leading-none"
                      >
                        {engine}
                      </span>
                    ))}
                  </div>
                )}
                {/* Car count */}
                {count > 0 && (
                  <p className="text-[0.52rem] uppercase tracking-[0.14em] text-hint mt-2.5 leading-none">
                    {count} {count === 1 ? "car" : "cars"} in Garage
                  </p>
                )}
              </Link>

              {/* ── Right: tag buttons + chevron ──────────────────────── */}
              <div className="flex flex-col items-end gap-3 shrink-0 pt-[calc(3px+10px)]">
                {isLoggedIn && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggle(gen.id, "driven")}
                      disabled={isGenPending}
                      className={`flex items-center gap-1 text-[0.62rem] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                        isDriven
                          ? "bg-racing-green text-white"
                          : "border border-ink/10 text-hint hover:border-racing-green/35 hover:text-racing-green"
                      }`}
                    >
                      <Route size={10} />
                      Driven
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(gen.id, "wishlist")}
                      disabled={isGenPending}
                      className={`flex items-center gap-1 text-[0.62rem] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                        isWishlist
                          ? "bg-green-bright text-white"
                          : "border border-ink/10 text-hint hover:border-green-bright/40 hover:text-green-bright"
                      }`}
                    >
                      <Star size={10} />
                      Wishlist
                    </button>
                  </div>
                )}
                <ChevronRight
                  size={14}
                  className={`transition-colors ${
                    isDriven ? "text-racing-green/50" : "text-hint"
                  }`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
