import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ExploreSearch } from "@/components/ExploreSearch";

export const metadata: Metadata = {
  title: "Explore — Garage",
  description: "Tag car models you've driven or want to drive.",
};

// car_models is public-read seed data — cache the full catalog for 1 hour.
// Uses a plain anon client so the cached function doesn't touch cookies.
const getCatalog = unstable_cache(
  async () => {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("car_models")
      .select("id, make, model, generation, chassis_code, year_start, year_end, engines, slug")
      .order("make")
      .order("model")
      .order("year_start");
    return data ?? [];
  },
  ["car-models-catalog"],
  { revalidate: 3600 }
);

export default async function ExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch in parallel: user's tags (per-user, not cacheable) + catalog (cached 1h)
  const [{ data: tags }, allModels] = await Promise.all([
    supabase
      .from("user_model_tags")
      .select("model_id, tag_type")
      .eq("user_id", user.id),
    getCatalog(),
  ]);

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      {/* ── Header ── */}
      <div className="px-5 pb-6 pt-safe-page-8">
        <h1 className="font-display font-extrabold text-[2rem] leading-tight text-ink tracking-tight">
          Explore
        </h1>
        <p className="text-[0.6rem] uppercase tracking-[0.2em] font-bold text-hint mt-1.5">
          Tag what you&apos;ve driven&nbsp;&middot;&nbsp;Build your wishlist
        </p>
      </div>

      <ExploreSearch
        initialTags={tags ?? []}
        allModels={allModels}
      />
    </div>
  );
}
