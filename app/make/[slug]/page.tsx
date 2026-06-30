import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// ── Helpers ───────────────────────────────────────────────────────────────────

function anon() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function yearSpan(min: number, max: number | null): string {
  return max ? `${min}–${max}` : `${min}–`;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: make } = await anon()
    .from("makes")
    .select("name")
    .eq("slug", slug)
    .single();

  if (!make) return { title: "Brand not found — Garage" };

  return {
    title: `${make.name} — Garage`,
    description: `All ${make.name} models and community cars on Garage.`,
    openGraph: {
      title: `${make.name} — Garage`,
      description: `Community-documented ${make.name} builds and history.`,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MakePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Authenticated client for aggregate counts (sees public + own private via RLS).
  // Falls back to anon behaviour when logged out.
  const supabase = await createClient();

  // ── 1. Make ────────────────────────────────────────────────────────────────
  const { data: make } = await anon()
    .from("makes")
    .select("id, name, slug, logo_path")
    .eq("slug", slug)
    .single();

  if (!make) notFound();

  // ── 2. All models for this make (public catalog — anon) ────────────────────
  const { data: models } = await anon()
    .from("models")
    .select("id, name, slug")
    .eq("make_id", make.id);

  if (!models || models.length === 0) notFound();

  const modelIds = models.map((m) => m.id);

  // ── 3. All generation rows for these models — year spans (anon) ────────────
  // Only needs id, model_ref_id, year_start, year_end — no sensitive fields.
  const { data: genRows } = await anon()
    .from("car_models")
    .select("id, model_ref_id, year_start, year_end")
    .in("model_ref_id", modelIds);

  const genIds = (genRows ?? []).map((g) => g.id);

  // ── 4. Aggregate car counts (authenticated client — RLS enforced) ──────────
  // Privacy: only id + model_id fetched; no VIN, visibility field, or owner info.
  // Public + user's own private visible; other users' private cars are not.
  const { data: visibleCars } = genIds.length > 0
    ? await supabase.from("cars").select("id, model_id").in("model_id", genIds)
    : { data: [] as { id: string; model_id: string }[] };

  // ── 5. Build lookup maps ───────────────────────────────────────────────────

  // Generation id → parent model id
  const genToModelId: Record<string, string> = {};
  // Per model: earliest year_start, latest year_end (null = still in production)
  const minYearByModel: Record<string, number> = {};
  const maxYearByModel: Record<string, number | null> = {};

  for (const g of genRows ?? []) {
    genToModelId[g.id] = g.model_ref_id;

    const curMin = minYearByModel[g.model_ref_id];
    if (curMin === undefined || g.year_start < curMin) {
      minYearByModel[g.model_ref_id] = g.year_start;
    }

    if (!(g.model_ref_id in maxYearByModel)) {
      maxYearByModel[g.model_ref_id] = g.year_end; // first entry
    } else if (maxYearByModel[g.model_ref_id] !== null) {
      // Extend upper bound, or mark as ongoing if any gen has no year_end
      if (g.year_end === null || g.year_end > (maxYearByModel[g.model_ref_id] ?? 0)) {
        maxYearByModel[g.model_ref_id] = g.year_end;
      }
    }
    // null (ongoing) is sticky once set
  }

  // Count visible cars per model; tally total for the brand
  const countByModelId: Record<string, number> = {};
  let totalCount = 0;
  for (const car of visibleCars ?? []) {
    const modelId = genToModelId[car.model_id];
    if (modelId) {
      countByModelId[modelId] = (countByModelId[modelId] ?? 0) + 1;
      totalCount++;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Sort models by earliest generation year ASC, then name for ties
  const sortedModels = [...models].sort((a, b) => {
    const ay = minYearByModel[a.id] ?? 9999;
    const by = minYearByModel[b.id] ?? 9999;
    return ay !== by ? ay - by : a.name.localeCompare(b.name);
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-safe-page-8 pb-7 border-b border-ink/8 text-center">
        {/* Brand logo — large, centered, progressive */}
        {(make as { logo_path?: string | null }).logo_path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${supabaseUrl}/storage/v1/object/public/catalog/${(make as { logo_path?: string | null }).logo_path}`}
            alt={`${make.name} logo`}
            className="h-20 w-auto object-contain mx-auto mb-5"
          />
        )}

        {/* Brand name — editorial Archivo display title */}
        <h1 className="font-display font-extrabold text-[3rem] leading-none tracking-tight text-ink">
          {make.name}
        </h1>

        {totalCount > 0 && (
          <p className="text-[0.55rem] uppercase tracking-[0.18em] text-ink-muted mt-3 leading-none">
            {totalCount} {totalCount === 1 ? "car" : "cars"} in the community
          </p>
        )}
      </div>

      {/* ── Models list ───────────────────────────────────────────────────── */}
      <div className="px-5 pt-6">
        {/* Section heading */}
        <div className="flex items-center gap-3 mb-2">
          <p className="text-[0.58rem] uppercase tracking-[0.2em] font-bold text-ink shrink-0 flex items-center gap-2">
            Models
            <span className="text-hint font-medium">{sortedModels.length}</span>
          </p>
          <div className="flex-1 h-px bg-ink/8" />
        </div>

        {/* Rows — one per model, ordered oldest-first by earliest generation year */}
        <div className="divide-y divide-ink/8">
          {sortedModels.map((model) => {
            const minYear = minYearByModel[model.id];
            const maxYear = maxYearByModel[model.id] ?? null;
            const count = countByModelId[model.id] ?? 0;

            return (
              <Link
                key={model.id}
                href={`/model/${model.slug}`}
                className="flex items-center gap-4 py-4 group"
              >
                {/* Left: name + year span */}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-[1.15rem] leading-tight text-ink group-hover:text-racing-green transition-colors truncate">
                    {model.name}
                  </p>
                  {minYear !== undefined && (
                    <p className="text-[0.52rem] uppercase tracking-[0.16em] text-hint mt-0.5 leading-none">
                      {yearSpan(minYear, maxYear)}
                    </p>
                  )}
                </div>

                {/* Right: count + chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  {count > 0 && (
                    <span className="text-[0.58rem] uppercase tracking-[0.1em] text-ink-muted tabular-nums">
                      {count} {count === 1 ? "car" : "cars"}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className="text-hint group-hover:text-racing-green transition-colors"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
