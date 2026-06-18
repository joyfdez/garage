import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AddEventForm } from "@/components/AddEventForm";

export default async function AddEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { slug } = await params;
  const { type: typeParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: car } = await supabase
    .from("cars")
    .select("id, slug, year, current_owner_id, model:car_models(make, model, generation), custom_make, custom_model")
    .eq("slug", slug)
    .single();

  if (!car) notFound();
  if (car.current_owner_id !== user.id) notFound();

  const [profileResult, ownershipResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("mileage_unit")
      .eq("id", user.id)
      .single(),
    supabase
      .from("ownerships")
      .select("currency, end_date")
      .eq("user_id", user.id)
      .eq("car_id", car.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const preferredUnit = (profileResult.data?.mileage_unit === "mi" ? "mi" : "km") as "km" | "mi";
  const purchaseCurrency = ownershipResult.data?.currency ?? "EUR";
  const isSold = !!(ownershipResult.data?.end_date);

  // Don't let someone re-sell an already-sold car via this route
  if (typeParam === "sold" && isSold) redirect(`/car/${slug}`);

  type ModelRow = { make: string; model: string; generation: string };
  const rawModel = car.model as unknown;
  const m: ModelRow | null = Array.isArray(rawModel)
    ? (rawModel[0] ?? null)
    : (rawModel as ModelRow | null);
  const make = m?.make ?? car.custom_make ?? "";
  const model = m?.model ?? car.custom_model ?? "";

  const initialType = typeParam === "sold" ? ("sold" as const) : undefined;
  const pageTitle = typeParam === "sold" ? "Mark as sold" : "Add update";

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
          <h1 className="font-display font-bold text-xl">{pageTitle}</h1>
          <p className="text-ink/40 text-xs">
            {car.year} {make} {model}
          </p>
        </div>
      </div>

      <AddEventForm
        carSlug={slug}
        carId={car.id}
        userId={user.id}
        preferredUnit={preferredUnit}
        carCurrency={purchaseCurrency}
        purchaseCurrency={purchaseCurrency}
        initialType={initialType}
        isSold={isSold}
      />
    </div>
  );
}
