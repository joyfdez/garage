import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileShell, type CarData } from "@/components/ProfileShell";
import type { CarModel } from "@/components/BrowsePicker";

export const metadata: Metadata = {
  title: "My Profile — Garage",
};

function formatOwnershipPeriod(start: string | null, end: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  if (!start && !end) return "";
  if (!start) return `Until ${fmt(end!)}`;
  if (!end) return `Since ${fmt(start)}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, location, country, bio, avatar_url, cover_photo_path")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  // Fetch in parallel: ownerships + model tags
  const [{ data: rawOwnerships }, { data: rawTags }] = await Promise.all([
    supabase
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
      .order("created_at", { ascending: false }),

    supabase
      .from("user_model_tags")
      .select(`
        model_id, tag_type,
        model:car_models!model_id(
          id, make, model, generation, chassis_code, year_start, year_end, engines, slug
        )
      `)
      .eq("user_id", user.id),
  ]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // ── Process ownerships ───────────────────────────────────────────────────

  type RawModel = { make: string; model: string; generation: string } | null;
  type RawCar = {
    id: string; slug: string; year: number; visibility: string;
    nickname: string | null; cover_photo_path: string | null;
    model: unknown; custom_make: string | null;
    custom_model: string | null; custom_generation: string | null;
    car_events: { count: number }[] | null;
  } | null;

  function processOwnership(o: NonNullable<typeof rawOwnerships>[number]): CarData | null {
    const rawCar = o.car as unknown;
    const car = (Array.isArray(rawCar) ? rawCar[0] : rawCar) as RawCar;
    if (!car) return null;

    const rawM = car.model as unknown;
    const m = (Array.isArray(rawM) ? rawM[0] : rawM) as RawModel;

    const eventCount =
      Array.isArray(car.car_events) && car.car_events.length > 0
        ? (car.car_events[0] as { count: number }).count
        : 0;

    return {
      slug:           car.slug,
      year:           car.year,
      make:           m?.make       ?? car.custom_make       ?? "",
      model:          m?.model      ?? car.custom_model      ?? "",
      generation:     m?.generation ?? car.custom_generation ?? "",
      nickname:       car.nickname,
      coverPhotoPath: car.cover_photo_path,
      isPrivate:      car.visibility === "private",
      eventCount,
      ownershipPeriod: formatOwnershipPeriod(o.start_date, o.end_date),
    };
  }

  const currentCars: CarData[]  = [];
  const previousCars: CarData[] = [];

  for (const o of rawOwnerships ?? []) {
    const car = processOwnership(o);
    if (!car) continue;
    (o.end_date ? previousCars : currentCars).push(car);
  }

  // ── Process model tags ───────────────────────────────────────────────────

  type TagRow = {
    model_id: string;
    tag_type: string;
    model: CarModel | null;
  };
  const tags = (rawTags ?? []) as unknown as TagRow[];

  const drivenModels   = tags.filter((t) => t.tag_type === "driven"   && t.model).map((t) => t.model!);
  const wishlistModels = tags.filter((t) => t.tag_type === "wishlist" && t.model).map((t) => t.model!);
  const initialTagKeys = tags.map((t) => `${t.model_id}:${t.tag_type}`);

  return (
    <ProfileShell
      username={profile.username}
      displayName={profile.display_name ?? null}
      location={profile.location ?? null}
      country={profile.country ?? null}
      bio={profile.bio ?? null}
      avatarUrl={profile.avatar_url ?? null}
      coverPhotoPath={profile.cover_photo_path ?? null}
      currentCars={currentCars}
      previousCars={previousCars}
      drivenModels={drivenModels}
      wishlistModels={wishlistModels}
      initialTagKeys={initialTagKeys}
      supabaseUrl={supabaseUrl}
      isOwner
    />
  );
}
