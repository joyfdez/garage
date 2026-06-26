import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  ModelGenerations,
  type Generation,
  type CommunityCar,
} from "@/components/ModelGenerations";

// ── Types ─────────────────────────────────────────────────────────────────────

type MakeRow = { name: string; slug: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function anonSupabase() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = anonSupabase();

  const { data: model } = await supabase
    .from("models")
    .select("name, make:makes(name)")
    .eq("slug", slug)
    .single();

  if (!model) return { title: "Model not found — Garage" };

  const make = (model.make as unknown as MakeRow | null)?.name ?? "";
  const title = `${make} ${model.name}`;

  return {
    title: `${title} — Garage`,
    description: `All generations and community cars for the ${title} on Garage.`,
    openGraph: {
      title: `${title} — Garage`,
      description: `Community-documented ${title} builds, history, and generations.`,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Authenticated client (sees: public cars + user's own private).
  // Also used for user tags. Falls back to anon behaviour when logged out.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 1. Model + make (public catalog — anon client) ─────────────────────────
  const anon = anonSupabase();
  const { data: model } = await anon
    .from("models")
    .select("id, name, slug, make:makes(name, slug)")
    .eq("slug", slug)
    .single();

  if (!model) notFound();

  const make = model.make as unknown as MakeRow | null;

  // ── 2. All generations for this model, ordered chronologically ─────────────
  const { data: rawGenerations } = await anon
    .from("car_models")
    .select("id, generation, chassis_code, year_start, year_end, engines, slug")
    .eq("model_ref_id", model.id)
    .order("year_start", { ascending: true });

  if (!rawGenerations || rawGenerations.length === 0) notFound();

  const generations: Generation[] = rawGenerations.map((g) => ({
    id: g.id,
    generation: g.generation,
    chassis_code: g.chassis_code,
    year_start: g.year_start,
    year_end: g.year_end,
    engines: g.engines ?? [],
    slug: g.slug,
  }));

  const genIds = generations.map((g) => g.id);

  // ── 3. Parallel data fetches ───────────────────────────────────────────────
  const [{ data: userTagRows }, { data: publicCarRows }, { data: allCarRows }] =
    await Promise.all([
      // User's driven/wishlist tags for these generations
      user
        ? supabase
            .from("user_model_tags")
            .select("model_id, tag_type")
            .eq("user_id", user.id)
            .in("model_id", genIds)
        : { data: [] as { model_id: string; tag_type: string }[] },

      // Public community cars only — RLS + explicit filter: privacy is enforced at both layers
      supabase
        .from("cars")
        .select(
          "slug, year, nickname, cover_photo_path, model_id, owner:profiles!current_owner_id(username, display_name)"
        )
        .in("model_id", genIds)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(40),

      // Aggregate counts: public + user's own private (what RLS allows).
      // Only id + model_id — no sensitive fields exposed.
      supabase.from("cars").select("id, model_id").in("model_id", genIds),
    ]);

  // ── 4. Build lookup maps ───────────────────────────────────────────────────

  // Per-generation total count (public + own private via RLS)
  const countByGenId: Record<string, number> = {};
  for (const car of allCarRows ?? []) {
    countByGenId[car.model_id] = (countByGenId[car.model_id] ?? 0) + 1;
  }
  const totalCount = (allCarRows ?? []).length;

  // Public cars grouped by generation — flatten owner join for serialisability
  type CarRow = {
    slug: string;
    year: number;
    nickname: string | null;
    cover_photo_path: string | null;
    model_id: string;
    owner: { username: string; display_name: string | null } | null;
  };

  const carsByGenId: Record<string, CommunityCar[]> = {};
  for (const car of (publicCarRows ?? []) as unknown as CarRow[]) {
    const mapped: CommunityCar = {
      slug: car.slug,
      year: car.year,
      nickname: car.nickname,
      cover_photo_path: car.cover_photo_path,
      model_id: car.model_id,
      ownerUsername: car.owner?.username ?? null,
    };
    if (!carsByGenId[car.model_id]) carsByGenId[car.model_id] = [];
    carsByGenId[car.model_id].push(mapped);
  }

  // Initial tag keys for the client component
  const initialTagKeys = (userTagRows ?? []).map(
    (t) => `${t.model_id}:${t.tag_type}`
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const makeName = make?.name ?? "";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-safe-page-8 pb-7 border-b border-ink/8">
        {/* Make name — plain text, not a link yet (brand pages are a later step) */}
        <p className="text-[0.52rem] uppercase tracking-[0.24em] font-bold text-hint mb-1.5 leading-none">
          {makeName}
        </p>

        {/* Model name — big Archivo display title */}
        <h1 className="font-display font-extrabold text-[2.75rem] leading-none tracking-tight text-ink">
          {model.name}
        </h1>

        {/* Community car count — aggregate (public + own private) */}
        {totalCount > 0 && (
          <p className="text-[0.55rem] uppercase tracking-[0.18em] text-ink-muted mt-3 leading-none">
            {totalCount} {totalCount === 1 ? "car" : "cars"} in the community
          </p>
        )}
      </div>

      {/* ── Generations list — client component for tag interactivity ────────── */}
      <ModelGenerations
        generations={generations}
        initialTagKeys={initialTagKeys}
        carsByGenId={carsByGenId}
        countByGenId={countByGenId}
        supabaseUrl={supabaseUrl}
        makeName={makeName}
        modelName={model.name}
        isLoggedIn={!!user}
      />
    </div>
  );
}
