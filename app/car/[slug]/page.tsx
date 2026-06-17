import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Lock, Plus, Pencil, Tag, Gauge } from "lucide-react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShareButton } from "@/components/ShareButton";
import { CarTabs } from "@/components/CarTabs";
import { CarHero, type HeroPhoto } from "@/components/CarHero";
import {
  FUEL_OPTIONS, BODY_TYPE_OPTIONS, DRIVETRAIN_OPTIONS, ACQUISITION_OPTIONS,
} from "@/lib/car-options";
import { convertMileage, formatMileage, type MileageUnit } from "@/lib/mileage";

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
      fuel, drivetrain, horsepower, body_type,
      model:car_models(make, model, generation, chassis_code),
      custom_make, custom_model, custom_generation,
      owner:profiles!current_owner_id(username, display_name, avatar_url)
    `)
    .eq("slug", slug)
    .single();

  if (!car) notFound();

  const isOwner = user?.id === car.current_owner_id;
  if (car.visibility === "private" && !isOwner) notFound();

  const { data: ownershipRaw } = await supabase
    .from("v_ownerships")
    .select("start_date, end_date, purchase_price, purchase_price_public, sale_price, sale_price_public, currency, acquisition_condition, purchase_mileage_value, purchase_mileage_unit, sale_mileage_value, sale_mileage_unit")
    .eq("car_id", car.id)
    .eq("user_id", car.current_owner_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ownership = ownershipRaw;
  const isSold = !!(ownership?.end_date);

  // Viewer's preferred mileage unit (default km for logged-out viewers)
  const viewerUnit: MileageUnit = user
    ? await supabase.from("profiles").select("mileage_unit").eq("id", user.id).single()
        .then(({ data }) => (data?.mileage_unit === "mi" ? "mi" : "km"))
    : "km";

  // Derive current mileage from the most recent event that has a reading
  const { data: latestMileageRow } = await supabase
    .from("car_events")
    .select("mileage_value, mileage_unit")
    .eq("car_id", car.id)
    .not("mileage_value", "is", null)
    .order("event_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentMileage = latestMileageRow?.mileage_value
    ? {
        value: convertMileage(
          latestMileageRow.mileage_value,
          (latestMileageRow.mileage_unit ?? "km") as MileageUnit,
          viewerUnit
        ),
        unit: viewerUnit,
      }
    : null;

  const { data: rawEvents } = await supabase
    .from("car_events")
    .select("id, type, title, description, details, event_date, mileage_value, mileage_unit")
    .eq("car_id", car.id)
    .order("event_date", { ascending: false });

  const events = rawEvents ?? [];

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
  const chassisCode = m?.chassis_code;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  // Hero carousel: all non-event photos ordered by position (cover is position 0)
  const heroPhotos: HeroPhoto[] = (allPhotos ?? [])
    .filter((p) => !p.event_id)
    .map((p) => ({
      id: p.id,
      url: `${supabaseUrl}/storage/v1/object/public/car-photos/${p.storage_path}`,
    }));

  // Metadata line in hero: engine · transmission · color
  const heroSpecs = [car.engine, car.transmission, car.color].filter(Boolean);

  function formatPrice(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  }

  function optLabel(opts: readonly { value: string; label: string }[], val: string | null) {
    if (!val) return null;
    return opts.find((o) => o.value === val)?.label ?? null;
  }

  // Chips for structured car specs (only non-null values)
  const specChips = [
    optLabel(FUEL_OPTIONS, car.fuel as string | null),
    optLabel(BODY_TYPE_OPTIONS, car.body_type as string | null),
    optLabel(DRIVETRAIN_OPTIONS, car.drivetrain as string | null),
    (car as { horsepower?: number | null }).horsepower
      ? `${(car as { horsepower: number }).horsepower} hp`
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-paper min-h-dvh page-enter">

      {/* ── HERO ── swipeable photo carousel, ~70svh ───────────────────────── */}
      <CarHero
        photos={heroPhotos}
        alt={`${car.year} ${make} ${model}`}
        placeholderYear={car.year}
      >
        {/* Gradient scrim — darkens bottom of photo for legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 25%, rgba(14,13,10,0.3) 55%, rgba(14,13,10,0.62) 100%)",
          }}
        />

        {/* Glass bar — blurred surface, text lives here */}
        <div className="glass-bar absolute inset-x-0 bottom-0 px-5 pt-12 pb-6">
          {/* Sold badge */}
          {isSold && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50 mb-2">
              No longer owned
            </p>
          )}

          {/* Private indicator */}
          {car.visibility === "private" && (
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50 mb-2">
              <Lock size={9} />
              Private
            </p>
          )}

          {/* Car title */}
          <h1 className="font-display font-extrabold text-[2.4rem] leading-[0.95] text-white tracking-tight">
            {car.year} {make} {model}
          </h1>

          {/* Generation + chassis code */}
          {generation && (
            <p className="text-white/60 text-[0.65rem] uppercase tracking-[0.18em] mt-1.5 font-semibold">
              {generation}
              {chassisCode && chassisCode !== generation && (
                <span className="text-white/40 font-normal"> · {chassisCode}</span>
              )}
            </p>
          )}

          {/* Engine · transmission · color */}
          {heroSpecs.length > 0 && (
            <p className="text-white/45 text-[0.6rem] uppercase tracking-[0.16em] mt-0.5">
              {heroSpecs.join(" · ")}
            </p>
          )}

          {/* Owner + location */}
          {(owner || car.location) && (
            <div className="flex items-center gap-3 mt-2.5 text-white/50 text-xs">
              {owner && (
                <Link
                  href={`/u/${owner.username}`}
                  className="hover:text-white/80 transition-colors"
                >
                  @{owner.username}
                </Link>
              )}
              {car.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {car.location}
                </span>
              )}
            </div>
          )}
        </div>
      </CarHero>

      {/* ── Below-hero: nickname · ownership · actions ──────────────────────── */}
      <div className="px-5 pt-4 pb-2 fade-rise" style={{ "--rise-delay": "40ms" } as React.CSSProperties}>
        {/* Nickname */}
        {car.nickname && (
          <p className="text-ink-muted text-sm italic mb-3">&ldquo;{car.nickname}&rdquo;</p>
        )}

        {/* Structured spec chips — fuel · body · drivetrain · hp */}
        {specChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {specChips.map((chip) => (
              <span
                key={chip}
                className="px-2.5 py-1 rounded-full bg-card text-xs text-ink/60 font-medium"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Current mileage */}
        {currentMileage && (
          <p className="flex items-center gap-1.5 text-xs text-ink-muted mb-3">
            <Gauge size={12} className="text-ink/40" />
            <span className="font-medium text-ink">
              {formatMileage(currentMileage.value, currentMileage.unit)}
            </span>
          </p>
        )}

        {/* Ownership dates + prices */}
        {ownership && (
          <div className="text-xs text-ink-muted mb-4 space-y-0.5">
            {(ownership.start_date || ownership.end_date) && (
              <p className="uppercase tracking-[0.1em] text-[0.6rem] font-semibold text-hint">
                {ownership.start_date ? formatDate(ownership.start_date) : "—"}
                {" – "}
                {ownership.end_date ? formatDate(ownership.end_date) : "Present"}
              </p>
            )}
            {optLabel(ACQUISITION_OPTIONS, (ownership as { acquisition_condition?: string | null }).acquisition_condition ?? null) && (
              <p className="text-hint text-[0.7rem]">
                Acquired as{" "}
                <span className="text-ink/60">
                  {optLabel(ACQUISITION_OPTIONS, (ownership as { acquisition_condition?: string | null }).acquisition_condition ?? null)}
                </span>
              </p>
            )}
            {ownership.purchase_price != null && (
              <p>
                Purchased{" "}
                <span className="text-ink font-medium">
                  {formatPrice(ownership.purchase_price, ownership.currency ?? "EUR")}
                </span>
              </p>
            )}
            {ownership.sale_price != null && isSold && (
              <p>
                Sold for{" "}
                <span className="text-ink font-medium">
                  {formatPrice(ownership.sale_price, ownership.currency ?? "EUR")}
                </span>
              </p>
            )}
            {isSold && (ownership as { sale_mileage_value?: number | null }).sale_mileage_value && (
              <p className="flex items-center gap-1">
                <Gauge size={11} className="text-ink/30" />
                {formatMileage(
                  convertMileage(
                    (ownership as { sale_mileage_value: number }).sale_mileage_value,
                    ((ownership as { sale_mileage_unit?: string | null }).sale_mileage_unit ?? "km") as MileageUnit,
                    viewerUnit
                  ),
                  viewerUnit
                )}
                {" "}at sale
              </p>
            )}
          </div>
        )}

        {/* ── Action row — editorial: thin-border buttons, ink filled "Add update" ── */}
        <div className="flex flex-wrap gap-2">
          <ShareButton
            url={`${siteUrl}/car/${car.slug}`}
            title={`${car.year} ${make} ${model}${car.nickname ? ` — ${car.nickname}` : ""}`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-ink/15 rounded-input text-ink hover:bg-ink/5 transition-colors"
          />

          {isOwner && (
            <>
              <Link
                href={`/car/${car.slug}/edit`}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-ink/15 rounded-input text-ink hover:bg-ink/5 transition-colors"
              >
                <Pencil size={13} />
                Edit
              </Link>

              {!isSold && (
                <Link
                  href={`/car/${car.slug}/sell`}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-ink/15 rounded-input text-ink-muted hover:text-ink hover:border-ink/25 transition-colors"
                >
                  <Tag size={13} />
                  Mark as sold
                </Link>
              )}

              {/* Primary action — filled ink */}
              <Link
                href={`/car/${car.slug}/events/new`}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold bg-ink text-paper rounded-input hover:bg-ink/85 transition-colors"
              >
                <Plus size={13} />
                Add update
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="mt-3">
        <CarTabs
          carSlug={car.slug}
          isOwner={isOwner}
          events={eventsWithPhotos}
          photos={galleryPhotos}
          supabaseUrl={supabaseUrl}
          viewerUnit={viewerUnit}
          purchaseRecord={ownership ? {
            startDate: ownership.start_date ?? null,
            purchasePrice: ownership.purchase_price ?? null,
            currency: ownership.currency ?? null,
            acquisitionConditionLabel: optLabel(ACQUISITION_OPTIONS, (ownership as { acquisition_condition?: string | null }).acquisition_condition ?? null),
            purchaseMileageValue: (ownership as { purchase_mileage_value?: number | null }).purchase_mileage_value ?? null,
            purchaseMileageUnit: (ownership as { purchase_mileage_unit?: string | null }).purchase_mileage_unit ?? null,
          } : undefined}
        />
      </div>
    </div>
  );
}
