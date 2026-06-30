import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  ModelGenerations,
  type Generation,
} from "@/components/ModelGenerations";
import { CatalogBreadcrumb } from "@/components/CatalogBreadcrumb";

// ── Types ─────────────────────────────────────────────────────────────────────

type MakeRow = { name: string; slug: string; logo_path: string | null };

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

  const make = (model.make as unknown as { name: string } | null)?.name ?? "";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 1. Model + make ────────────────────────────────────────────────────────
  const anon = anonSupabase();
  const { data: model } = await anon
    .from("models")
    .select("id, name, slug, description, make:makes(name, slug, logo_path)")
    .eq("slug", slug)
    .single();

  if (!model) notFound();

  const make = model.make as unknown as MakeRow | null;

  // ── 2. All generations for this model ─────────────────────────────────────
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

  // ── 3. User tags + aggregate car count ────────────────────────────────────
  const [{ data: userTagRows }, { data: allCarRows }] = await Promise.all([
    user
      ? supabase
          .from("user_model_tags")
          .select("model_id, tag_type")
          .eq("user_id", user.id)
          .in("model_id", genIds)
      : { data: [] as { model_id: string; tag_type: string }[] },

    genIds.length > 0
      ? supabase.from("cars").select("id, model_id").in("model_id", genIds)
      : { data: [] as { id: string; model_id: string }[] },
  ]);

  // ── 4. Build counts ────────────────────────────────────────────────────────
  const countByGenId: Record<string, number> = {};
  let totalCount = 0;
  for (const car of allCarRows ?? []) {
    countByGenId[car.model_id] = (countByGenId[car.model_id] ?? 0) + 1;
    totalCount++;
  }

  const initialTagKeys = (userTagRows ?? []).map(
    (t) => `${t.model_id}:${t.tag_type}`
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const makeName = make?.name ?? "";
  const makeLogoUrl = make?.logo_path
    ? `${supabaseUrl}/storage/v1/object/public/catalog/${make.logo_path}`
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      {/* ── Header — centered ────────────────────────────────────────────────── */}
      <div className="px-5 pt-safe-page-8 pb-7 border-b border-ink/8 text-center">
        {/* Model name */}
        <h1 className="font-display font-extrabold text-[2.75rem] leading-none tracking-tight text-ink">
          {model.name}
        </h1>

        {/* Make breadcrumb — navigable link with logo */}
        {make && (
          <CatalogBreadcrumb
            items={[
              { label: makeName, href: `/make/${make.slug}`, logoUrl: makeLogoUrl },
            ]}
          />
        )}

        {/* Model description */}
        {(model as { description?: string | null }).description && (
          <p className="text-sm text-ink-muted leading-relaxed mt-4 max-w-prose mx-auto text-left">
            {(model as { description?: string | null }).description}
          </p>
        )}

        {/* Community car count */}
        {totalCount > 0 && (
          <p className="text-[0.55rem] uppercase tracking-[0.18em] text-ink-muted mt-3 leading-none">
            {totalCount} {totalCount === 1 ? "car" : "cars"} in the community
          </p>
        )}
      </div>

      {/* ── Generations list ─────────────────────────────────────────────────── */}
      <ModelGenerations
        generations={generations}
        initialTagKeys={initialTagKeys}
        countByGenId={countByGenId}
        isLoggedIn={!!user}
      />
    </div>
  );
}
