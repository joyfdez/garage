import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Which car? — Garage" };

type RawModel = { make: string; model: string; generation: string } | null;
type RawCar = {
  slug: string;
  year: number;
  visibility: string;
  nickname: string | null;
  cover_photo_path: string | null;
  model: unknown;
  custom_make: string | null;
  custom_model: string | null;
  custom_generation: string | null;
};

type CarEntry = {
  slug: string;
  year: number;
  make: string;
  model: string;
  generation: string;
  nickname: string | null;
  coverPhotoPath: string | null;
  isPrivate: boolean;
};

export default async function CarUpdatePickerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: ownerships } = await supabase
    .from("ownerships")
    .select(`
      end_date,
      car:cars!car_id(
        slug, year, visibility, nickname, cover_photo_path,
        model:car_models(make, model, generation),
        custom_make, custom_model, custom_generation
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const active: CarEntry[] = [];
  const sold: CarEntry[] = [];

  for (const o of ownerships ?? []) {
    const rawCar = o.car as unknown;
    const car = (Array.isArray(rawCar) ? rawCar[0] : rawCar) as RawCar | null;
    if (!car) continue;
    const rawM = car.model as unknown;
    const m = (Array.isArray(rawM) ? rawM[0] : rawM) as RawModel;
    const entry: CarEntry = {
      slug: car.slug,
      year: car.year,
      make: m?.make ?? car.custom_make ?? "",
      model: m?.model ?? car.custom_model ?? "",
      generation: m?.generation ?? car.custom_generation ?? "",
      nickname: car.nickname,
      coverPhotoPath: car.cover_photo_path,
      isPrivate: car.visibility === "private",
    };
    (o.end_date ? sold : active).push(entry);
  }

  function CarGrid({ cars, isSold = false }: { cars: CarEntry[]; isSold?: boolean }) {
    return (
      <div className="grid grid-cols-3 gap-2.5">
        {cars.map((car) => {
          const coverUrl = car.coverPhotoPath
            ? `${supabaseUrl}/storage/v1/object/public/car-photos/${car.coverPhotoPath}`
            : null;
          return (
            <Link
              key={car.slug}
              href={`/car/${car.slug}/events/new`}
              className="block group rounded-card overflow-hidden border border-ink/8 bg-white hover:border-racing-green/25 transition-colors"
            >
              {/* Photo */}
              <div className="aspect-[4/3] relative overflow-hidden">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-racing-green flex items-end p-2">
                    <p className="font-display font-extrabold text-white/80 text-[0.65rem] leading-tight truncate">
                      {car.make} {car.model}
                    </p>
                  </div>
                )}
                {car.isPrivate && (
                  <div className="absolute top-1.5 right-1.5 bg-paper/90 rounded-full p-0.5">
                    <Lock size={8} className="text-ink-muted" />
                  </div>
                )}
                {isSold && (
                  <div className="absolute bottom-0 inset-x-0 bg-ink/55 text-white text-[9px] font-medium text-center py-0.5 tracking-wide">
                    Sold
                  </div>
                )}
              </div>
              {/* Label */}
              <div className="p-2">
                <p className="font-display font-bold text-[0.7rem] leading-tight text-ink truncate">
                  {car.year} {car.model}
                </p>
                {car.nickname && (
                  <p className="text-ink/40 text-[0.6rem] truncate mt-0.5">{car.nickname}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  const hasAnyCar = active.length > 0 || sold.length > 0;

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      <div className="px-5 pt-safe-page-8 pb-5">
        <Link
          href="/add"
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors mb-5"
        >
          <ArrowLeft size={13} />
          Add
        </Link>
        <h1 className="font-display font-extrabold text-2xl text-ink">Which car?</h1>
        <p className="text-ink-muted text-sm mt-1">Tap a car to log an update.</p>
      </div>

      <div className="px-5">
        {!hasAnyCar && (
          <div className="py-16 text-center">
            <p className="text-ink-muted text-sm mb-3">No cars in your garage yet.</p>
            <Link
              href="/garage/new"
              className="text-sm font-medium text-green-bright hover:underline"
            >
              Add your first car →
            </Link>
          </div>
        )}

        {active.length > 0 && (
          <div className={sold.length > 0 ? "mb-8" : ""}>
            {sold.length > 0 && (
              <p className="text-[0.58rem] uppercase tracking-[0.18em] font-bold text-hint mb-3">
                Current
              </p>
            )}
            <CarGrid cars={active} />
          </div>
        )}

        {sold.length > 0 && (
          <div>
            <p className="text-[0.58rem] uppercase tracking-[0.18em] font-bold text-hint mb-3">
              Previously owned
            </p>
            <CarGrid cars={sold} isSold />
          </div>
        )}
      </div>
    </div>
  );
}
