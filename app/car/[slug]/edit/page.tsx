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
      engine, transmission, color, location, current_owner_id, model_id,
      custom_make, custom_model, custom_generation,
      model:car_models(make, model, generation, engines)
    `)
    .eq("slug", slug)
    .single();

  if (!car) notFound();
  if (car.current_owner_id !== user.id) notFound();

  const { data: rawPhotos } = await supabase
    .from("photos")
    .select("id, storage_path")
    .eq("car_id", car.id)
    .order("position");

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
  };

  const photos: PhotoItem[] = (rawPhotos ?? []).map((p) => ({
    id: p.id,
    storage_path: p.storage_path,
  }));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return (
    <div className="px-4 py-6 max-w-lg">
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
