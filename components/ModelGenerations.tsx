"use client";

import { useState } from "react";
import Link from "next/link";
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

export interface CommunityCar {
  slug: string;
  year: number;
  nickname: string | null;
  cover_photo_path: string | null;
  model_id: string;
  ownerUsername: string | null;
}

interface ModelGenerationsProps {
  generations: Generation[];
  initialTagKeys: string[]; // serialisable: ["<gen_id>:driven", ...]
  carsByGenId: Record<string, CommunityCar[]>;
  countByGenId: Record<string, number>;
  supabaseUrl: string;
  makeName: string;
  modelName: string;
  isLoggedIn: boolean;
}

function yearLabel(start: number, end: number | null): string {
  return end ? `${start}–${end}` : `${start}–`;
}

export function ModelGenerations({
  generations,
  initialTagKeys,
  carsByGenId,
  countByGenId,
  supabaseUrl,
  makeName,
  modelName,
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

    // Optimistic update
    setTagSet((prev) => {
      const next = new Set(prev);
      wasTagged ? next.delete(key) : next.add(key);
      return next;
    });
    setPending(genId);

    try {
      const result = await toggleModelTag(genId, type);
      if (result.error) {
        // Roll back
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
        const cars = carsByGenId[gen.id] ?? [];
        const count = countByGenId[gen.id] ?? 0;
        const showChassis =
          gen.chassis_code && gen.chassis_code !== gen.generation;

        return (
          <section
            key={gen.id}
            className={`px-5 py-7 ${idx > 0 ? "border-t border-ink/8" : ""}`}
          >
            {/* ── Generation header ─────────────────────────────────────── */}
            <div className="flex items-start gap-4 justify-between mb-4">
              <div className="min-w-0">
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
                <h2
                  className={`font-display font-bold text-[1.75rem] leading-none tracking-tight ${
                    isDriven ? "text-racing-green" : "text-ink"
                  }`}
                >
                  {gen.generation}
                </h2>
                <p className="text-[0.52rem] uppercase tracking-[0.18em] text-hint mt-1.5 leading-none">
                  {[
                    showChassis ? gen.chassis_code : null,
                    yearLabel(gen.year_start, gen.year_end),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              {/* Tag buttons */}
              {isLoggedIn && (
                <div className="flex gap-1.5 shrink-0 pt-[calc(3px+10px)]">
                  <button
                    type="button"
                    onClick={() => handleToggle(gen.id, "driven")}
                    disabled={isGenPending}
                    className={`text-[0.62rem] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                      isDriven
                        ? "bg-racing-green text-white"
                        : "border border-ink/10 text-hint hover:border-racing-green/35 hover:text-racing-green"
                    }`}
                  >
                    Driven
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(gen.id, "wishlist")}
                    disabled={isGenPending}
                    className={`text-[0.62rem] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                      isWishlist
                        ? "bg-green-bright text-white"
                        : "border border-ink/10 text-hint hover:border-green-bright/40 hover:text-green-bright"
                    }`}
                  >
                    Wishlist
                  </button>
                </div>
              )}
            </div>

            {/* ── Engine chips ──────────────────────────────────────────── */}
            {gen.engines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
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

            {/* ── Community cars ────────────────────────────────────────── */}
            {count > 0 && (
              <div>
                <p className="text-[0.52rem] uppercase tracking-[0.18em] font-bold text-hint mb-3">
                  {count} {count === 1 ? "car" : "cars"} in Garage
                </p>

                {cars.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {cars.map((car) => {
                      const photoUrl = car.cover_photo_path
                        ? `${supabaseUrl}/storage/v1/object/public/car-photos/${car.cover_photo_path}`
                        : null;

                      return (
                        <Link
                          key={car.slug}
                          href={`/car/${car.slug}`}
                          className="block shrink-0 w-[120px] group"
                        >
                          {/* Photo */}
                          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-racing-green mb-2 relative">
                            {photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photoUrl}
                                alt={`${car.year} ${makeName} ${modelName}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-end p-2">
                                <p className="font-display font-bold text-white/80 text-xs leading-tight">
                                  {car.year}
                                  <br />
                                  <span className="text-white/40 text-[0.6rem]">
                                    {modelName}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <p className="text-[0.65rem] font-semibold text-ink leading-tight truncate">
                            {car.year}
                            {car.nickname ? (
                              <span className="text-ink/60 font-normal ml-1">
                                {car.nickname}
                              </span>
                            ) : null}
                          </p>
                          {car.ownerUsername && (
                            <p className="text-[0.58rem] text-ink-muted truncate mt-0.5">
                              @{car.ownerUsername}
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
