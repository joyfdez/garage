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

  const { data: tags } = await supabase
    .from("user_model_tags")
    .select("model_id, tag_type")
    .eq("user_id", user.id);

  return (
    <div className="pb-24 px-4">
      <div className="pt-6 pb-5">
        <h1 className="font-display font-bold text-2xl">Explore</h1>
        <p className="text-ink/40 text-sm mt-1">Tag models you&apos;ve driven or want to drive.</p>
      </div>
      <ExploreSearch initialTags={tags ?? []} />
    </div>
  );
}
