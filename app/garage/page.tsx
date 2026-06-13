import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CarCard } from "@/components/CarCard";

function formatOwnershipPeriod(start: string | null, end: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  if (!start && !end) return "";
  if (!start) return `Until ${fmt(end!)}`;
  if (!end) return `Since ${fmt(start)}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

type ModelRow = { make: string; model: string; generation: string } | null;

export default async function GaragePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawOwnerships } = await supabase
    .from("ownerships")
    .select(`
      id, start_date, end_date,
      car:cars!car_id(
        id, slug, year, visibility, nickname, cover_photo_path,
        model:car_models(make, model, generation),
        custom_make, custom_model, custom_generation,
        car_events(count)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  type OwnershipRow = NonNullable<typeof rawOwnerships>[number];

  function carDataFromOwnership(o: OwnershipRow) {
    const rawCar = o.car as unknown;
    const car = (Array.isArray(rawCar) ? rawCar[0] : rawCar) as {
      id: string; slug: string; year: number; visibility: string;
      nickname: string | null; cover_photo_path: string | null;
      model: unknown; custom_make: string | null;
      custom_model: string | null; custom_generation: string | null;
      car_events: { count: number }[] | null;
    } | null;
    if (!car) return null;

    const rawModel = car.model as unknown;
    const m: ModelRow = Array.isArray(rawModel)
      ? (rawModel[0] as ModelRow ?? null)
      : (rawModel as ModelRow);

    const make = m?.make ?? car.custom_make ?? "";
    const model = m?.model ?? car.custom_model ?? "";
    const generation = m?.generation ?? car.custom_generation ?? "";
    const eventCount =
      Array.isArray(car.car_events) && car.car_events.length > 0
        ? (car.car_events[0] as { count: number }).count
        : 0;

    return { car, make, model, generation, eventCount };
  }

  const ownerships = rawOwnerships ?? [];
  const current = ownerships.filter((o) => !o.end_date);
  const previous = ownerships.filter((o) => !!o.end_date);
  const hasAny = ownerships.length > 0;

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">My Garage</h1>
        <Link
          href="/garage/new"
          className="flex items-center gap-1.5 bg-orange text-white text-sm font-medium px-3 py-2 rounded-xl hover:bg-orange-600 transition-colors"
        >
          <Plus size={15} />
          Add car
        </Link>
      </div>

      {!hasAny ? (
        <div className="py-16 text-center">
          <p className="font-display font-bold text-lg mb-2">Your garage is empty</p>
          <p className="text-ink/40 text-sm mb-6">Add your first car to get started.</p>
          <Link
            href="/garage/new"
            className="inline-flex items-center gap-2 bg-orange text-white font-display font-bold px-6 py-3 rounded-2xl hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            Add your first car
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Current */}
          {current.length > 0 && (
            <section>
              <div className="grid grid-cols-2 gap-3">
                {current.map((o) => {
                  const d = carDataFromOwnership(o);
                  if (!d) return null;
                  return (
                    <CarCard
                      key={o.id}
                      slug={d.car.slug}
                      year={d.car.year}
                      make={d.make}
                      model={d.model}
                      generation={d.generation}
                      nickname={d.car.nickname}
                      coverPhotoPath={d.car.cover_photo_path}
                      isPrivate={d.car.visibility === "private"}
                      eventCount={d.eventCount}
                      supabaseUrl={supabaseUrl}
                      ownershipPeriod={o.start_date ? formatOwnershipPeriod(o.start_date, null) : null}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Previously owned */}
          {previous.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-base text-ink/40 mb-3">Previously owned</h2>
              <div className="grid grid-cols-2 gap-3">
                {previous.map((o) => {
                  const d = carDataFromOwnership(o);
                  if (!d) return null;
                  return (
                    <CarCard
                      key={o.id}
                      slug={d.car.slug}
                      year={d.car.year}
                      make={d.make}
                      model={d.model}
                      generation={d.generation}
                      nickname={d.car.nickname}
                      coverPhotoPath={d.car.cover_photo_path}
                      isPrivate={d.car.visibility === "private"}
                      eventCount={d.eventCount}
                      supabaseUrl={supabaseUrl}
                      previouslyOwned
                      ownershipPeriod={formatOwnershipPeriod(o.start_date, o.end_date)}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
