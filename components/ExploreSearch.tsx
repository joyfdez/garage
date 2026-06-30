"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { CarModel, yearLabel } from "@/components/BrowsePicker";
import { debounce } from "@/lib/utils/debounce";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Make { id: string; name: string; slug: string; logo_path: string | null }
interface FeaturedModel {
  id: string;
  name: string;
  slug: string;
  make: { name: string; slug: string } | null;
  count: number;
}

// ── Slug derivation — mirrors catalog_populate's translate + regexp SQL ───────

const ACCENT_MAP: Record<string, string> = {
  é:'e', è:'e', ê:'e', ë:'e',
  à:'a', â:'a', ä:'a',
  î:'i', ï:'i',
  ô:'o', ö:'o',
  ù:'u', û:'u', ü:'u',
  ç:'c',
};

function normSlug(s: string): string {
  return s
    .replace(/[éèêëàâäîïôöùûüç]/g, (c) => ACCENT_MAP[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function modelPageSlug(make: string, model: string): string {
  return `${normSlug(make)}-${normSlug(model)}`;
}

// ── Popular search chips ──────────────────────────────────────────────────────

const POPULAR_CHIPS = [
  { label: "E30",          q: "E30"          },
  { label: "Miata NA",     q: "NA"           },
  { label: "Golf GTI",     q: "Golf GTI"     },
  { label: "AE86",         q: "AE86"         },
  { label: "911",          q: "Porsche 911"  },
  { label: "Land Cruiser", q: "Land Cruiser" },
  { label: "S2000",        q: "S2000"        },
  { label: "BRZ / 86",    q: "BRZ"          },
  { label: "Evo",          q: "Lancer Evo"   },
  { label: "STI",          q: "Impreza STI"  },
] as const;

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

// Catalog card for search results — no tag buttons, links to model page
function CatalogCard({ model }: { model: CarModel }) {
  const showChassis =
    model.chassis_code && model.chassis_code !== model.generation;
  const meta = [
    showChassis ? model.chassis_code : null,
    yearLabel(model),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/model/${modelPageSlug(model.make, model.model)}`}
      className="block group"
    >
      <div className="bg-white rounded-card border border-ink/8 overflow-hidden transition-colors group-hover:border-racing-green/25">
        <div className="h-[3px] bg-racing-green/10 group-hover:bg-racing-green/40 transition-colors" />
        <div className="p-3.5 space-y-1.5">
          <p className="text-[0.52rem] uppercase tracking-[0.2em] font-bold text-hint leading-none">
            {model.make}
          </p>
          <h3 className="font-display font-bold text-base leading-tight text-ink group-hover:text-racing-green transition-colors">
            {model.model}
            {model.generation && (
              <span className="text-ink/45"> {model.generation}</span>
            )}
          </h3>
          {meta && (
            <p className="text-[0.52rem] uppercase tracking-[0.14em] text-hint leading-none">
              {meta}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExploreSearch({
  makes,
  featuredModels,
}: {
  makes: Make[];
  featuredModels: FeaturedModel[];
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CarModel[]>([]);

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

  const isSearching = query.length >= 2;

  return (
    <div>
      {/* ── Search bar + chips ─────────────────────────────────────────────── */}
      <div className="px-5 space-y-4">
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

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="px-5 mt-7">
        {isSearching ? (
          /* ── Search results ─────────────────────────────────────────────── */
          <section>
            {searchResults.length > 0 ? (
              <>
                <SectionHeading count={searchResults.length}>Results</SectionHeading>
                <div className="grid grid-cols-2 gap-3">
                  {searchResults.map((m) => (
                    <CatalogCard key={m.id} model={m} />
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
            {/* ── Featured models ──────────────────────────────────────── */}
            {featuredModels.length > 0 && (
              <section className="mb-9">
                <SectionHeading>Most registered</SectionHeading>
                <div className="grid grid-cols-2 gap-3">
                  {featuredModels.map((model) => (
                    <Link
                      key={model.id}
                      href={`/model/${model.slug}`}
                      className="block group"
                    >
                      <div className="bg-white border border-ink/8 rounded-card p-4 group-hover:border-racing-green/25 transition-colors h-full">
                        <p className="text-[0.5rem] uppercase tracking-[0.2em] text-hint mb-0.5 leading-none">
                          {model.make?.name}
                        </p>
                        <h3 className="font-display font-bold text-base leading-tight text-ink group-hover:text-racing-green transition-colors">
                          {model.name}
                        </h3>
                        <p className="text-[0.52rem] uppercase tracking-[0.12em] text-hint mt-2 leading-none">
                          {model.count} {model.count === 1 ? "car" : "cars"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Brands ───────────────────────────────────────────────── */}
            <section className="mb-9">
              <SectionHeading count={makes.length}>Brands</SectionHeading>
              <div className="grid grid-cols-3 gap-2">
                {makes.map((make) => {
                  const logoUrl = make.logo_path
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalog/${make.logo_path}`
                    : null;
                  return (
                    <Link
                      key={make.id}
                      href={`/make/${make.slug}`}
                      className="block group"
                    >
                      <div className="bg-white border border-ink/8 rounded-xl px-2 py-3.5 group-hover:border-racing-green/30 transition-colors flex flex-col items-center gap-2">
                        {/* Logo or placeholder */}
                        <div className="h-8 flex items-center justify-center">
                          {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logoUrl}
                              alt=""
                              className="h-8 w-full object-contain"
                              aria-hidden="true"
                            />
                          ) : (
                            <span className="text-[0.65rem] font-bold text-hint/60 uppercase tracking-wider">
                              {make.name.slice(0, 3)}
                            </span>
                          )}
                        </div>
                        {/* Brand name */}
                        <p className="text-[0.6rem] font-bold text-ink-muted group-hover:text-racing-green transition-colors text-center leading-tight">
                          {make.name}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
