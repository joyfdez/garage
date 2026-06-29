import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditEventForm } from "@/components/EditEventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: car } = await supabase
    .from("cars")
    .select("id, slug, year, current_owner_id, model:car_models(make, model), custom_make, custom_model")
    .eq("slug", slug)
    .single();

  if (!car) notFound();
  if (car.current_owner_id !== user.id) notFound();

  const [eventResult, photosResult, profileResult, ownershipResult] = await Promise.all([
    supabase
      .from("car_events")
      .select("id, type, title, description, details, event_date, mileage_value, mileage_unit, amount")
      .eq("id", id)
      .eq("car_id", car.id)
      .single(),
    supabase
      .from("photos")
      .select("id, storage_path")
      .eq("event_id", id)
      .order("position"),
    supabase.from("profiles").select("mileage_unit").eq("id", user.id).single(),
    supabase
      .from("ownerships")
      .select("currency")
      .eq("car_id", car.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: event } = eventResult;
  if (!event) notFound();

  const photos = photosResult.data ?? [];
  const preferredUnit = (profileResult.data?.mileage_unit === "mi" ? "mi" : "km") as "km" | "mi";
  const carCurrency = ownershipResult.data?.currency ?? "EUR";

  type ModelRow = { make: string; model: string };
  const rawModel = car.model as unknown;
  const m: ModelRow | null = Array.isArray(rawModel) ? (rawModel[0] ?? null) : (rawModel as ModelRow | null);
  const make = m?.make ?? car.custom_make ?? "";
  const model = m?.model ?? car.custom_model ?? "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return (
    <div className="px-4 pb-6 pt-safe-page max-w-lg">
      <EditEventForm
        event={{
          id: event.id,
          type: event.type,
          title: event.title,
          description: event.description,
          details: event.details as { problem?: string; diagnosis?: string; solution?: string } | null,
          event_date: event.event_date,
          mileage_value: event.mileage_value,
          mileage_unit: event.mileage_unit,
          amount: (event as { amount?: number | null }).amount ?? null,
        }}
        carSlug={slug}
        carCurrency={carCurrency}
        photos={photos}
        userId={user.id}
        preferredUnit={preferredUnit}
        supabaseUrl={supabaseUrl}
        backHref={`/car/${slug}/events/${id}`}
        pageTitle="Edit event"
        pageSubtitle={`${car.year} ${make} ${model}`}
      />
    </div>
  );
}
