import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditCarForm, CarForEdit, PhotoItem } from "@/components/EditCarForm";

export default async function EditCarPage({
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
      id, slug, year, visibility, nickname, cover_photo_path,
      engine, transmission, color, color_base, location, current_owner_id, model_id,
      fuel, drivetrain, horsepower, body_type,
      custom_make, custom_model, custom_generation,
      model:car_models(make, model, generation, engines)
    `)
    .eq("slug", slug)
    .single();

  if (!car) notFound();
  if (car.current_owner_id !== user.id) notFound();

  const [photosResult, ownershipResult, profileResult] = await Promise.all([
    supabase.from("photos").select("id, storage_path").eq("car_id", car.id).order("position"),
    supabase
      .from("ownerships")
      .select("id, start_date, purchase_price, purchase_price_public, currency, purchase_mileage_value, purchase_mileage_unit")
      .eq("car_id", car.id)
      .eq("user_id", user.id)
      .is("end_date", null)
      .maybeSingle(),
    supabase.from("profiles").select("mileage_unit").eq("id", user.id).single(),
  ]);

  const { data: rawPhotos } = photosResult;
  const activeOwnership = ownershipResult.data;
  const preferredUnit = (profileResult.data?.mileage_unit === "mi" ? "mi" : "km") as "km" | "mi";

  type ModelRow = { make: string; model: string; generation: string; engines: string[] };
  const rawModel = car.model as unknown;
  const m: ModelRow | null = Array.isArray(rawModel)
    ? (rawModel[0] ?? null)
    : (rawModel as ModelRow | null);

  const carForEdit: CarForEdit = {
    id: car.id,
    slug: car.slug,
    year: car.year,
    engine: car.engine,
    transmission: car.transmission,
    color: car.color,
    nickname: car.nickname,
    location: car.location,
    visibility: car.visibility as "public" | "private",
    cover_photo_path: car.cover_photo_path,
    model_id: car.model_id,
    engines: m?.engines ?? [],
    displayMake: m?.make ?? car.custom_make ?? "",
    displayModel: m?.model ?? car.custom_model ?? "",
    displayGeneration: m?.generation ?? car.custom_generation ?? "",
    custom_make: car.custom_make,
    custom_model: car.custom_model,
    custom_generation: car.custom_generation,
    fuel: (car as { fuel?: string | null }).fuel ?? null,
    drivetrain: (car as { drivetrain?: string | null }).drivetrain ?? null,
    horsepower: (car as { horsepower?: number | null }).horsepower ?? null,
    body_type: (car as { body_type?: string | null }).body_type ?? null,
    color_base: (car as { color_base?: string | null }).color_base ?? null,
    ownershipId: activeOwnership?.id ?? null,
    purchaseDate: activeOwnership?.start_date ?? null,
    purchasePrice: (activeOwnership as { purchase_price?: number | null } | null)?.purchase_price ?? null,
    purchasePricePublic: (activeOwnership as { purchase_price_public?: boolean | null } | null)?.purchase_price_public ?? false,
    purchaseCurrency: activeOwnership?.currency ?? "EUR",
    purchaseMileageValue: (activeOwnership as { purchase_mileage_value?: number | null } | null)?.purchase_mileage_value ?? null,
    purchaseMileageUnit: (activeOwnership as { purchase_mileage_unit?: string | null } | null)?.purchase_mileage_unit ?? null,
    preferredUnit,
  };

  const photos: PhotoItem[] = (rawPhotos ?? []).map((p) => ({
    id: p.id,
    storage_path: p.storage_path,
  }));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return (
    <div className="px-4 pb-6 pt-safe-page max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/car/${slug}`}
          className="text-ink/40 hover:text-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-xl">Edit car</h1>
      </div>

      <EditCarForm
        car={carForEdit}
        photos={photos}
        supabaseUrl={supabaseUrl}
        userId={user.id}
      />
    </div>
  );
}
