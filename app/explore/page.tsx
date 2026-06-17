import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ExploreSearch } from "@/components/ExploreSearch";

export const metadata: Metadata = {
  title: "Explore — Garage",
  description: "Tag car models you've driven or want to drive.",
};

export default async function ExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch in parallel: user's tags + full catalog
  const [{ data: tags }, { data: allModels }] = await Promise.all([
    supabase
      .from("user_model_tags")
      .select("model_id, tag_type")
      .eq("user_id", user.id),
    supabase
      .from("car_models")
      .select("id, make, model, generation, chassis_code, year_start, year_end, engines, slug")
      .order("make")
      .order("model")
      .order("year_start"),
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
        allModels={allModels ?? []}
      />
    </div>
  );
}
