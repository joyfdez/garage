import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { createClient } from "@/lib/supabase/server";
import { QuickTagPicker } from "@/components/QuickTagPicker";
import type { CarModel } from "@/components/BrowsePicker";

export const metadata: Metadata = { title: "Add driven car — Garage" };

export default async function AddDrivenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tags } = await supabase
    .from("user_model_tags")
    .select(`
      model:car_models!model_id(
        id, make, model, generation, chassis_code, year_start, year_end, engines, slug
      )
    `)
    .eq("user_id", user.id)
    .eq("tag_type", "driven");

  type TagRow = { model: CarModel | CarModel[] | null };
  const drivenModels = ((tags ?? []) as unknown as TagRow[])
    .map((t) => (Array.isArray(t.model) ? t.model[0] : t.model))
    .filter((m): m is CarModel => !!m);

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      <div className="px-5 pt-safe-page-8 pb-5">
        <StickyPageHeader title="Add driven car" back={{ href: "/add", label: "Add" }}>
          <p className="text-ink-muted text-sm mt-1">
            Mark models you&apos;ve driven or owned.
          </p>
        </StickyPageHeader>
      </div>

      <QuickTagPicker tagType="driven" initialModels={drivenModels} />
    </div>
  );
}
