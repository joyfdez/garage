import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ExploreSearch } from "@/components/ExploreSearch";

export const metadata: Metadata = {
  title: "Explore — Garage",
  description: "Browse car makes, models, and the most registered builds in the community.",
};

// ── Cached data fetchers (anon client — no cookies, safe to cache globally) ──

// All makes, alphabetical — catalog data, stable; revalidate every hour
const getMakes = unstable_cache(
  async () => {
    const supabase = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("makes")
      .select("id, name, slug")
      .order("name");
    return data ?? [];
  },
  ["explore-makes"],
  { revalidate: 3600 }
);

// Top 8 models by public car count — revalidate every 15 minutes
const getFeaturedModels = unstable_cache(
  async () => {
    const supabase = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Step 1: all public cars that reference a catalog model (model_id not null)
    const { data: carRows } = await supabase
      .from("cars")
      .select("model_id")
      .eq("visibility", "public")
      .not("model_id", "is", null);

    if (!carRows || carRows.length === 0) return [];

    // Step 2: count by generation (car_models.id)
    const countByGenId: Record<string, number> = {};
    for (const car of carRows) {
      if (car.model_id) {
        countByGenId[car.model_id] = (countByGenId[car.model_id] ?? 0) + 1;
      }
    }

    const genIds = Object.keys(countByGenId);
    if (genIds.length === 0) return [];

    // Step 3: resolve generation ids → model_ref_ids (models.id)
    const { data: genRows } = await supabase
      .from("car_models")
      .select("id, model_ref_id")
      .in("id", genIds);

    // Step 4: roll up counts to model level (sum across all generations of a model)
    const countByModelId: Record<string, number> = {};
    for (const gen of genRows ?? []) {
      countByModelId[gen.model_ref_id] =
        (countByModelId[gen.model_ref_id] ?? 0) + (countByGenId[gen.id] ?? 0);
    }

    // Step 5: sort by count DESC, take top 8
    const top8 = Object.entries(countByModelId)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (top8.length === 0) return [];

    const topIds = top8.map(([id]) => id);
    const countMap = Object.fromEntries(top8);

    // Step 6: fetch model details with make name
    const { data: models } = await supabase
      .from("models")
      .select("id, name, slug, make:makes(name, slug)")
      .in("id", topIds);

    return (models ?? [])
      .map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        make: m.make as unknown as { name: string; slug: string } | null,
        count: countMap[m.id] ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
  },
  ["explore-featured-models"],
  { revalidate: 900 }
);

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [makes, featuredModels] = await Promise.all([
    getMakes(),
    getFeaturedModels(),
  ]);

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-5 pb-6 pt-safe-page-8">
        <h1 className="font-display font-extrabold text-[2rem] leading-tight text-ink tracking-tight">
          Explore
        </h1>
        <p className="text-[0.6rem] uppercase tracking-[0.2em] font-bold text-hint mt-1.5">
          Browse makes&nbsp;&middot;&nbsp;models&nbsp;&middot;&nbsp;generations
        </p>
      </div>

      <ExploreSearch makes={makes} featuredModels={featuredModels} />
    </div>
  );
}
