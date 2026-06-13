import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Lock, Plus, Pencil, Tag } from "lucide-react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShareButton } from "@/components/ShareButton";
import { CarTabs } from "@/components/CarTabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: car } = await supabase
    .from("cars")
    .select(`
      year, nickname, cover_photo_path, visibility,
      model:car_models(make, model, generation),
      custom_make, custom_model, custom_generation
    `)
    .eq("slug", slug)
    .single();

  if (!car || car.visibility === "private") return { title: "Car not found" };

  type ModelRow = { make: string; model: string; generation: string };
  const rawModel = car.model as unknown;
  const m: ModelRow | null = Array.isArray(rawModel) ? (rawModel[0] ?? null) : (rawModel as ModelRow | null);
  const make = m?.make ?? car.custom_make ?? "";
  const model = m?.model ?? car.custom_model ?? "";
  const generation = m?.generation ?? car.custom_generation ?? "";

  const title = `${car.year} ${make} ${model}${generation ? ` ${generation}` : ""}${car.nickname ? ` — ${car.nickname}` : ""}`;
  const description = `Track the life of this ${car.year} ${make} ${model} on Garage.`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const imageUrl = car.cover_photo_path
    ? `${supabaseUrl}/storage/v1/object/public/car-photos/${car.cover_photo_path}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 900 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function CarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: car } = await supabase
    .from("cars")
    .select(`
      id, slug, year, visibility, nickname, cover_photo_path,
      engine, transmission, color, location, current_owner_id,
      model:car_models(make, model, generation, chassis_code),
      custom_make, custom_model, custom_generation,
      owner:profiles!current_owner_id(username, display_name, avatar_url)
    `)
    .eq("slug", slug)
    .single();

  if (!car) notFound();

  const isOwner = user?.id === car.current_owner_id;
  if (car.visibility === "private" && !isOwner) notFound();

  // Fetch the owner's current ownership record to determine sold state + prices
  const { data: ownershipRaw } = await supabase
    .from("v_ownerships")
    .select("start_date, end_date, purchase_price, purchase_price_public, sale_price, sale_price_public, currency")
    .eq("car_id", car.id)
    .eq("user_id", car.current_owner_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ownership = ownershipRaw;
  const isSold = !!(ownership?.end_date);

  // Fetch events with their photos
  const { data: rawEvents } = await supabase
    .from("car_events")
    .select("id, type, title, description, details, event_date")
    .eq("car_id", car.id)
    .order("event_date", { ascending: false });

  const events = rawEvents ?? [];

  // Fetch event photos grouped (attach to events)
  const { data: allPhotos } = await supabase
    .from("photos")
    .select("id, storage_path, event_id, position")
    .eq("car_id", car.id)
    .order("position");

  const photosByEvent: Record<string, { id: string; storage_path: string }[]> = {};
  const galleryPhotos: { id: string; storage_path: string; event_id: string | null }[] = [];

  for (const p of allPhotos ?? []) {
    galleryPhotos.push({ id: p.id, storage_path: p.storage_path, event_id: p.event_id });
    if (p.event_id) {
      photosByEvent[p.event_id] = photosByEvent[p.event_id] ?? [];
      photosByEvent[p.event_id].push({ id: p.id, storage_path: p.storage_path });
    }
  }

  const eventsWithPhotos = events.map((e) => ({
    ...e,
    photos: photosByEvent[e.id] ?? [],
  }));

  type ModelRow = { make: string; model: string; generation: string; chassis_code?: string };
  type OwnerRow = { username: string; display_name: string | null; avatar_url: string | null };
  const rawModel = car.model as unknown;
  const m: ModelRow | null = Array.isArray(rawModel) ? (rawModel[0] ?? null) : (rawModel as ModelRow | null);
  const rawOwner = car.owner as unknown;
  const owner: OwnerRow | null = Array.isArray(rawOwner) ? (rawOwner[0] ?? null) : (rawOwner as OwnerRow | null);
  const make = m?.make ?? car.custom_make ?? "";
  const model = m?.model ?? car.custom_model ?? "";
  const generation = m?.generation ?? car.custom_generation ?? "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const coverUrl = car.cover_photo_path
    ? `${supabaseUrl}/storage/v1/object/public/car-photos/${car.cover_photo_path}`
    : null;

  const specs = [car.engine, car.transmission, car.color].filter(Boolean);

  function formatPrice(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  }

  return (
    <div className="pb-24">
      {/* Hero photo */}
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={`${car.year} ${make} ${model}`}
          className="w-full aspect-[4/3] object-cover"
          priority-hint="high"
        />
      ) : (
        <div className="w-full aspect-[4/3] bg-card flex items-center justify-center">
          <span className="text-ink/10 font-display font-bold text-4xl">
            {car.year}
          </span>
        </div>
      )}

      {/* Car info */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h1 className="font-display font-bold text-xl leading-tight">
                {car.year} {make} {model}
                {generation && (
                  <span className="text-ink/40 font-normal ml-1.5 text-lg">{generation}</span>
                )}
              </h1>
              {car.visibility === "private" && (
                <Lock size={14} className="text-ink/30 flex-shrink-0" />
              )}
              {isSold && (
                <span className="text-[10px] font-bold bg-ink/10 text-ink/50 px-2 py-0.5 rounded-full tracking-wide uppercase">
                  No longer owned
                </span>
              )}
            </div>
            {car.nickname && (
              <p className="text-ink/50 text-sm italic mb-1">"{car.nickname}"</p>
            )}
          </div>
        </div>

        {/* Owner + location */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-ink/50 mb-3">
          {owner && (
            <Link href={`/u/${owner.username}`} className="hover:text-ink transition-colors">
              @{owner.username}
            </Link>
          )}
          {car.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {car.location}
            </span>
          )}
        </div>

        {/* Specs */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {specs.map((spec) => (
              <span
                key={spec}
                className="text-xs bg-card text-ink/60 px-2.5 py-1 rounded-full font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Ownership period + prices */}
        {ownership && (
          <div className="text-xs text-ink/40 mb-3 space-y-0.5">
            {(ownership.start_date || ownership.end_date) && (
              <p>
                {ownership.start_date ? formatDate(ownership.start_date) : "—"}
                {" – "}
                {ownership.end_date ? formatDate(ownership.end_date) : "Present"}
              </p>
            )}
            {ownership.purchase_price != null && (
              <p>Purchased: {formatPrice(ownership.purchase_price, ownership.currency ?? "EUR")}</p>
            )}
            {ownership.sale_price != null && isSold && (
              <p>Sold for: {formatPrice(ownership.sale_price, ownership.currency ?? "EUR")}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <ShareButton
            url={`${siteUrl}/car/${car.slug}`}
            title={`${car.year} ${make} ${model}${car.nickname ? ` — ${car.nickname}` : ""}`}
          />
          {isOwner && (
            <>
              <Link
                href={`/car/${car.slug}/edit`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card text-ink/60 text-sm font-medium hover:bg-ink/10 transition-colors"
              >
                <Pencil size={14} />
                Edit
              </Link>
              {!isSold && (
                <Link
                  href={`/car/${car.slug}/sell`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card text-ink/60 text-sm font-medium hover:bg-ink/10 transition-colors"
                >
                  <Tag size={14} />
                  Mark as sold
                </Link>
              )}
              <Link
                href={`/car/${car.slug}/events/new`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <Plus size={14} />
                Add update
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-2">
        <CarTabs
          carSlug={car.slug}
          isOwner={isOwner}
          events={eventsWithPhotos}
          photos={galleryPhotos}
          supabaseUrl={supabaseUrl}
        />
      </div>
    </div>
  );
}
