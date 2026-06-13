"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { toggleModelTag, TagType } from "@/lib/actions/modelTags";
import { BrowsePicker, CarModel, yearLabel } from "@/components/BrowsePicker";
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

function ModelCard({
  model,
  tagSet,
  pending,
  onToggle,
}: {
  model: CarModel;
  tagSet: Set<string>;
  pending: string | null;
  onToggle: (id: string, type: TagType) => void;
}) {
  const isDriven   = tagSet.has(`${model.id}:driven`);
  const isWishlist = tagSet.has(`${model.id}:wishlist`);

  const metaParts = [
    model.chassis_code && model.chassis_code !== model.generation
      ? model.chassis_code
      : null,
    yearLabel(model),
  ].filter(Boolean);

  return (
    <div
      className={`bg-white rounded-card border overflow-hidden transition-colors ${
        isDriven || isWishlist ? "border-ink/15" : "border-ink/8"
      }`}
    >
      {/* Top accent bar — coloured when tagged */}
      <div
        className={`h-[3px] ${
          isDriven ? "bg-racing-green" : isWishlist ? "bg-ink/20" : "bg-transparent"
        }`}
      />

      <div className="p-3.5 flex flex-col gap-2.5">
        {/* Make + model name */}
        <div>
          <p className="text-[0.52rem] uppercase tracking-[0.2em] font-bold text-hint mb-0.5 leading-none">
            {model.make}
          </p>
          <h3 className="font-display font-bold text-base leading-tight text-ink">
            {model.model}
            {model.generation && (
              <span className="text-ink/45 font-semibold"> {model.generation}</span>
            )}
          </h3>
        </div>

        {/* Chassis code + year range */}
        {metaParts.length > 0 && (
          <p className="text-[0.52rem] uppercase tracking-[0.14em] text-hint leading-none">
            {metaParts.join(" · ")}
          </p>
        )}

        {/* Tag buttons */}
        <div className="flex gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onToggle(model.id, "driven")}
            disabled={!!pending}
            className={`flex-1 text-[0.65rem] font-bold py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              isDriven
                ? "bg-racing-green text-white"
                : "border border-ink/10 text-hint hover:border-racing-green/35 hover:text-racing-green"
            }`}
          >
            Driven
          </button>
          <button
            type="button"
            onClick={() => onToggle(model.id, "wishlist")}
            disabled={!!pending}
            className={`flex-1 text-[0.65rem] font-bold py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              isWishlist
                ? "bg-ink text-paper"
                : "border border-ink/10 text-hint hover:border-ink/25 hover:text-ink-muted"
            }`}
          >
            Wishlist
          </button>
        </div>
      </div>
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
