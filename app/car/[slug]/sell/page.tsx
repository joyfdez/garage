import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MarkAsSoldForm } from "@/components/MarkAsSoldForm";

export default async function SellCarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: car } = await supabase
    .from("cars")
    .select(`
      id, slug, year, current_owner_id,
      model:car_models(make, model, generation),
      custom_make, custom_model, custom_generation
    `)
    .eq("slug", slug)
    .single();

  if (!car || car.current_owner_id !== user.id) notFound();

  // Only show this page if there's an active (unsold) ownership
  const { data: activeOwnership } = await supabase
    .from("ownerships")
    .select("id, currency")
    .eq("car_id", car.id)
    .eq("user_id", user.id)
    .is("end_date", null)
    .maybeSingle();

  if (!activeOwnership) redirect(`/car/${slug}`);

  type ModelRow = { make: string; model: string; generation: string };
  const rawModel = car.model as unknown;
  const m: ModelRow | null = Array.isArray(rawModel)
    ? (rawModel[0] ?? null)
    : (rawModel as ModelRow | null);

  const make = m?.make ?? car.custom_make ?? "";
  const model = m?.model ?? car.custom_model ?? "";
  const generation = m?.generation ?? car.custom_generation ?? "";
  const carName = `${car.year} ${make} ${model}${generation ? ` ${generation}` : ""}`;

  return (
    <div className="px-4 py-6 max-w-lg">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/car/${slug}`} className="text-ink/40 hover:text-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-xl">Mark as sold</h1>
      </div>
      <p className="text-ink/40 text-sm mb-8 pl-9">
        {carName} will move to your previously owned section. You can still edit its history.
      </p>

      <MarkAsSoldForm
        carId={car.id}
        carName={carName}
        purchaseCurrency={activeOwnership.currency ?? "EUR"}
      />
    </div>
  );
}
