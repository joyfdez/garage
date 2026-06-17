import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AddEventForm } from "@/components/AddEventForm";

export default async function AddEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [carResult, profileResult] = await Promise.all([
    supabase
      .from("cars")
      .select("id, slug, year, current_owner_id, model:car_models(make, model, generation), custom_make, custom_model")
      .eq("slug", slug)
      .single(),
    supabase
      .from("profiles")
      .select("mileage_unit")
      .eq("id", user.id)
      .single(),
  ]);
  const { data: car } = carResult;
  const preferredUnit = (profileResult.data?.mileage_unit === "mi" ? "mi" : "km") as "km" | "mi";

  if (!car) notFound();
  if (car.current_owner_id !== user.id) notFound();

  type ModelRow = { make: string; model: string; generation: string };
  const rawModel = car.model as unknown;
  const m: ModelRow | null = Array.isArray(rawModel)
    ? (rawModel[0] ?? null)
    : (rawModel as ModelRow | null);
  const make = m?.make ?? car.custom_make ?? "";
  const model = m?.model ?? car.custom_model ?? "";

  return (
    <div className="px-4 pb-6 pt-safe-page max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/car/${slug}`}
          className="text-ink/40 hover:text-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl">Add update</h1>
          <p className="text-ink/40 text-xs">
            {car.year} {make} {model}
          </p>
        </div>
      </div>

      <AddEventForm carSlug={slug} userId={user.id} preferredUnit={preferredUnit} />
    </div>
  );
}
