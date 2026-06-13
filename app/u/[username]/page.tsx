import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Settings } from "lucide-react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CarCard } from "@/components/CarCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url")
    .eq("username", username)
    .single();

  if (!data) return { title: "Profile not found" };

  return {
    title: `${data.display_name ?? `@${username}`} — Garage`,
    description: data.bio ?? `Check out ${data.display_name ?? username}'s cars on Garage.`,
    openGraph: {
      images: data.avatar_url ? [{ url: data.avatar_url }] : [],
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, location, country, bio, avatar_url, cover_photo_path")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const isOwner = user?.id === profile.id;

  // Cars (public only)
  const { data: cars } = await supabase
    .from("cars")
    .select(`
      id, slug, year, visibility, nickname, cover_photo_path,
      model:car_models(make, model, generation),
      custom_make, custom_model, custom_generation,
      car_events(count)
    `)
    .eq("current_owner_id", profile.id)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  // Ownership counters
  const { data: ownerships } = await supabase
    .from("ownerships")
    .select("car_id, end_date")
    .eq("user_id", profile.id);

  const allCarIds = new Set((ownerships ?? []).map((o) => o.car_id));
  const currentCarIds = new Set(
    (ownerships ?? []).filter((o) => !o.end_date).map((o) => o.car_id)
  );
  const ownedNow   = currentCarIds.size;
  const totalOwned = allCarIds.size;

  // Driven / Wishlist tags
  const { data: rawModelTags } = await supabase
    .from("user_model_tags")
    .select("model_id, tag_type, model:car_models!model_id(make, model, generation)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  type TagRow = { model_id: string; tag_type: string; model: { make: string; model: string; generation: string } | null };
  const modelTags = (rawModelTags ?? []) as unknown as TagRow[];
  const drivenTags  = modelTags.filter((t) => t.tag_type === "driven");
  const wishlistTags = modelTags.filter((t) => t.tag_type === "wishlist");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const coverUrl = profile.cover_photo_path
    ? `${supabaseUrl}/storage/v1/object/public/avatars/${profile.cover_photo_path}`
    : null;

  return (
    <div className="pb-24">
      {/* Cover photo */}
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" className="w-full aspect-[3/1] object-cover" />
      ) : (
        <div className="w-full aspect-[3/1] bg-card" />
      )}

      {/* Avatar + header */}
      <div className="px-4">
        <div className="flex items-end justify-between -mt-8 mb-3">
          {/* Avatar */}
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.display_name ?? profile.username}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-background shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-card ring-4 ring-background flex items-center justify-center font-display font-bold text-2xl text-ink/30 shrink-0">
              {profile.username[0].toUpperCase()}
            </div>
          )}

          {isOwner && (
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-sm text-ink/40 hover:text-ink transition-colors px-3 py-2 rounded-xl bg-card mb-1"
            >
              <Settings size={14} />
              Edit
            </Link>
          )}
        </div>

        {/* Name */}
        <h1 className="font-display font-bold text-xl leading-tight">
          {profile.display_name ?? `@${profile.username}`}
        </h1>
        <p className="text-ink/40 text-sm mb-3">@{profile.username}</p>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-ink/70 leading-relaxed mb-3">{profile.bio}</p>
        )}

        {/* Location / country */}
        {(profile.location || profile.country) && (
          <p className="flex items-center gap-1.5 text-sm text-ink/40 mb-4">
            <MapPin size={13} />
            {[profile.location, profile.country].filter(Boolean).join(", ")}
          </p>
        )}

        {/* Counters */}
        <div className="flex items-center gap-5 mb-6 flex-wrap">
          <div className="text-center">
            <p className="font-display font-bold text-lg leading-none">{ownedNow}</p>
            <p className="text-ink/40 text-xs mt-0.5">Owned now</p>
          </div>
          <div className="w-px h-6 bg-card" />
          <div className="text-center">
            <p className="font-display font-bold text-lg leading-none">{totalOwned}</p>
            <p className="text-ink/40 text-xs mt-0.5">Owned</p>
          </div>
          {drivenTags.length > 0 && (
            <>
              <div className="w-px h-6 bg-card" />
              <div className="text-center">
                <p className="font-display font-bold text-lg leading-none">{drivenTags.length}</p>
                <p className="text-ink/40 text-xs mt-0.5">Driven</p>
              </div>
            </>
          )}
          {wishlistTags.length > 0 && (
            <>
              <div className="w-px h-6 bg-card" />
              <div className="text-center">
                <p className="font-display font-bold text-lg leading-none">{wishlistTags.length}</p>
                <p className="text-ink/40 text-xs mt-0.5">Wishlist</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cars grid */}
      <div className="px-4">
        {!cars || cars.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-ink/30 text-sm">No public cars yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {cars.map((car) => {
              const rawModel = car.model as unknown;
              type ModelRow = { make: string; model: string; generation: string };
              const m: ModelRow | null = Array.isArray(rawModel)
                ? (rawModel[0] ?? null)
                : (rawModel as ModelRow | null);
              const make       = m?.make       ?? car.custom_make       ?? "";
              const model      = m?.model      ?? car.custom_model      ?? "";
              const generation = m?.generation ?? car.custom_generation ?? "";
              const eventCount =
                Array.isArray(car.car_events) && car.car_events.length > 0
                  ? (car.car_events[0] as { count: number }).count
                  : 0;

              return (
                <CarCard
                  key={car.id}
                  slug={car.slug}
                  year={car.year}
                  make={make}
                  model={model}
                  generation={generation}
                  nickname={car.nickname ?? null}
                  coverPhotoPath={car.cover_photo_path ?? null}
                  isPrivate={false}
                  eventCount={eventCount}
                  supabaseUrl={supabaseUrl}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Driven models */}
      {drivenTags.length > 0 && (
        <div className="px-4 mt-8">
          <h2 className="font-display font-bold text-base mb-3">Driven</h2>
          <ul className="space-y-1.5">
            {drivenTags.map((t) => (
              <li key={t.model_id} className="text-sm text-ink/70 px-4 py-2.5 bg-card rounded-xl">
                {t.model
                  ? `${t.model.make} ${t.model.model} ${t.model.generation}`
                  : t.model_id}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Wishlist models */}
      {wishlistTags.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="font-display font-bold text-base mb-3">Wishlist</h2>
          <ul className="space-y-1.5">
            {wishlistTags.map((t) => (
              <li key={t.model_id} className="text-sm text-ink/70 px-4 py-2.5 bg-card rounded-xl">
                {t.model
                  ? `${t.model.make} ${t.model.model} ${t.model.generation}`
                  : t.model_id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
