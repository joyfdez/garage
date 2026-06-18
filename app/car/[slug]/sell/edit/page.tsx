import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditSaleForm } from "@/components/EditSaleForm";

export default async function EditSalePage({
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

  const [ownershipResult, profileResult] = await Promise.all([
    supabase
      .from("ownerships")
      .select("id, end_date, sale_price, sale_price_public, currency, sale_mileage_value, sale_mileage_unit, sale_description, sale_photo_path")
      .eq("car_id", car.id)
      .eq("user_id", user.id)
      .not("end_date", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("mileage_unit").eq("id", user.id).single(),
  ]);

  const { data: ownership } = ownershipResult;
  if (!ownership) redirect(`/car/${slug}`);

  const preferredUnit = (profileResult.data?.mileage_unit === "mi" ? "mi" : "km") as "km" | "mi";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

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
    <div className="px-4 pb-6 pt-safe-page max-w-lg">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/car/${slug}`} className="text-ink/40 hover:text-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-xl">Edit sale</h1>
      </div>
      <p className="text-ink/40 text-sm mb-8 pl-9">{carName}</p>

      <EditSaleForm
        carId={car.id}
        carName={carName}
        userId={user.id}
        saleDate={ownership.end_date}
        salePrice={(ownership as { sale_price?: number | null }).sale_price ?? null}
        salePricePublic={(ownership as { sale_price_public?: boolean | null }).sale_price_public ?? false}
        currency={ownership.currency ?? "EUR"}
        saleMileageValue={(ownership as { sale_mileage_value?: number | null }).sale_mileage_value ?? null}
        saleMileageUnit={(ownership as { sale_mileage_unit?: string | null }).sale_mileage_unit ?? null}
        saleDescription={(ownership as { sale_description?: string | null }).sale_description ?? null}
        salePhotoPath={(ownership as { sale_photo_path?: string | null }).sale_photo_path ?? null}
        supabaseUrl={supabaseUrl}
        preferredUnit={preferredUnit}
      />
    </div>
  );
}
