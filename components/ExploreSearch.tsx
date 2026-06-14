"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { toggleModelTag, TagType } from "@/lib/actions/modelTags";
import { toast } from "sonner";
import { BrowsePicker, CarModel } from "@/components/BrowsePicker";
import { ModelCard } from "@/components/ModelCard";
import { debounce } from "@/lib/utils/debounce";

// ── Types ─────────────────────────────────────────────────────────────────────

type InitialTag = { model_id: string; tag_type: string };

// ── Popular chips — iconic chassis codes / model names ────────────────────────

const POPULAR_CHIPS = [
  { label: "E30",          q: "E30"          },
  { label: "Miata NA",     q: "NA"           },
  { label: "Golf GTI",     q: "Golf GTI"     },
  { label: "AE86",         q: "AE86"         },
  { label: "911",          q: "Porsche 911"  },
  { label: "Land Cruiser", q: "Land Cruiser" },
  { label: "S2000",        q: "S2000"        },
  { label: "BRZ / 86",     q: "BRZ"         },
  { label: "Evo",          q: "Lancer Evo"  },
  { label: "STI",          q: "Impreza STI" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByMake(models: CarModel[]): [string, CarModel[]][] {
  const map = new Map<string, CarModel[]>();
  for (const m of models) {
    const arr = map.get(m.make);
    if (arr) arr.push(m);
    else map.set(m.make, [m]);
  }
  return [...map.entries()];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-[0.58rem] uppercase tracking-[0.2em] font-bold text-ink shrink-0 flex items-center gap-2">
        {children}
        {count !== undefined && (
          <span className="text-hint font-medium">{count}</span>
        )}
      </p>
      <div className="flex-1 h-px bg-ink/8" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExploreSearch({
  initialTags,
  allModels,
}: {
  initialTags: InitialTag[];
  allModels: CarModel[];
}) {
  const [tagSet, setTagSet] = useState<Set<string>>(
    () => new Set(initialTags.map((t) => `${t.model_id}:${t.tag_type}`))
  );
  const [query, setQuery]               = useState("");
  const [searchResults, setSearchResults] = useState<CarModel[]>([]);
  const [pending, setPending]           = useState<string | null>(null);
  const [browseOpen, setBrowseOpen]     = useState(false);
  const [browseSelected, setBrowseSelected] = useState<CarModel | null>(null);

  // Debounced search
  const search = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) { setSearchResults([]); return; }
      try {
        const res = await fetch(`/api/car-models?q=${encodeURIComponent(q)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch { /* ignore */ }
    }, 300),
    []
  );

  useEffect(() => { search(query); }, [query, search]);

  // Optimistic tag toggle
  async function handleToggle(modelId: string, tagType: TagType) {
    const key = `${modelId}:${tagType}`;
    if (pending) return;
    const wasTagged = tagSet.has(key);
    setTagSet((prev) => {
      const next = new Set(prev);
      wasTagged ? next.delete(key) : next.add(key);
      return next;
    });
    setPending(key);
    try {
      const result = await toggleModelTag(modelId, tagType);
      if (result.error) {
        setTagSet((prev) => {
          const next = new Set(prev);
          wasTagged ? next.add(key) : next.delete(key);
          return next;
        });
        toast.error("Couldn't save — please try again", {
          style: { borderLeft: "3px solid #ef4444" },
        });
      } else {
        const label = tagType === "driven" ? "Driven" : "Wishlist";
        toast(wasTagged ? `Removed from ${label}` : `Added to ${label}`, {
          style: { borderLeft: "3px solid #1A3A2E" },
        });
      }
    } finally {
      setPending(null);
    }
  }

  // Derived
  const isSearching = query.length >= 2;

  const taggedModelIds = useMemo(
    () => new Set([...tagSet].map((k) => k.split(":")[0])),
    [tagSet]
  );

  const taggedModels = useMemo(
    () => allModels.filter((m) => taggedModelIds.has(m.id)),
    [allModels, taggedModelIds]
  );

  const modelsByMake = useMemo(() => groupByMake(allModels), [allModels]);

  return (
    <div>
      {/* ── Search + chips ─────────────────────────────────────────────────── */}
      <div className="px-5 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-hint pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search make, model, chassis code… E30, Miata, GTI"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3.5 bg-white border border-ink/8 rounded-card text-sm placeholder:text-hint outline-none focus:border-ink/20 focus:ring-2 focus:ring-ink/5 transition-all"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setSearchResults([]); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-hint hover:text-ink-muted transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Popular chips — horizontal scroll */}
        <div className="-mx-5 overflow-x-auto">
          <div className="flex gap-2 px-5 w-max pb-1">
            {POPULAR_CHIPS.map((chip) => {
              const active = query === chip.q;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setQuery(active ? "" : chip.q)}
                  className={`flex-none text-[0.68rem] font-bold px-3.5 py-2 rounded-full transition-colors ${
                    active
                      ? "bg-racing-green text-white"
                      : "bg-white border border-ink/10 text-ink-muted hover:border-racing-green/30 hover:text-racing-green"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="px-5 mt-7">
        {isSearching ? (
          /* ── Search results ── */
          <section>
            {searchResults.length > 0 ? (
              <>
                <SectionHeading count={searchResults.length}>Results</SectionHeading>
                <div className="grid grid-cols-2 gap-3">
                  {searchResults.map((m) => (
                    <ModelCard
                      key={m.id}
                      model={m}
                      tagSet={tagSet}
                      pending={pending}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-ink-muted text-sm mb-1">No models found</p>
                <p className="text-hint text-xs">Try a different name or chassis code</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* ── Your tags ── */}
            {taggedModels.length > 0 && (
              <section className="mb-9">
                <SectionHeading count={taggedModels.length}>Your tags</SectionHeading>
                <div className="grid grid-cols-2 gap-3">
                  {taggedModels.map((m) => (
                    <ModelCard
                      key={m.id}
                      model={m}
                      tagSet={tagSet}
                      pending={pending}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Browse by make (collapsible) ── */}
            <div className="mb-9">
              <button
                type="button"
                onClick={() => setBrowseOpen((v) => !v)}
                className="flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.2em] font-bold text-hint hover:text-ink-muted transition-colors"
              >
                Browse by make
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${browseOpen ? "rotate-180" : ""}`}
                />
              </button>

              {browseOpen && (
                <div className="mt-4 space-y-4">
                  <BrowsePicker
                    onSelect={(m) => setBrowseSelected(m)}
                    disabled={false}
                  />
                  {browseSelected && (
                    <div className="grid grid-cols-2 gap-3">
                      <ModelCard
                        model={browseSelected}
                        tagSet={tagSet}
                        pending={pending}
                        onToggle={handleToggle}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Full catalog grid ── */}
            <section>
              <SectionHeading count={allModels.length}>Catalog</SectionHeading>

              {modelsByMake.map(([make, models]) => (
                <div key={make} className="mb-7">
                  <p className="text-[0.55rem] uppercase tracking-[0.18em] font-bold text-hint mb-3">
                    {make}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {models.map((m) => (
                      <ModelCard
                        key={m.id}
                        model={m}
                        tagSet={tagSet}
                        pending={pending}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
