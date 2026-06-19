import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Gauge, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { convertMileage, formatMileage, type MileageUnit } from "@/lib/mileage";
import { CURRENCIES } from "@/lib/car-options";
import { ShareButton } from "@/components/ShareButton";
import { PhotoGallery } from "@/components/PhotoGallery";
import { DeleteEventButton } from "@/components/DeleteEventButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: car } = await supabase
    .from("cars")
    .select("year, visibility, model:car_models(make, model), custom_make, custom_model")
    .eq("slug", slug)
    .single();

  if (!car || car.visibility === "private") return { title: "Event not found" };

  const { data: event } = await supabase
    .from("car_events")
    .select("title, description, details")
    .eq("id", id)
    .single();

  if (!event) return { title: "Event not found" };

  const { data: firstPhoto } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("event_id", id)
    .order("position")
    .limit(1)
    .single();

  type ModelRow = { make: string; model: string };
  const rawModel = car.model as unknown;
  const m: ModelRow | null = Array.isArray(rawModel) ? (rawModel[0] ?? null) : (rawModel as ModelRow | null);
  const make = m?.make ?? car.custom_make ?? "";
  const model = m?.model ?? car.custom_model ?? "";

  const title = `${event.title} — ${car.year} ${make} ${model}`;
  const details = event.details as { problem?: string } | null;
  const description =
    event.description?.slice(0, 150) ??
    details?.problem?.slice(0, 150) ??
    `An update on this ${car.year} ${make} ${model}.`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const imageUrl = firstPhoto?.storage_path
    ? `${supabaseUrl}/storage/v1/object/public/car-photos/${firstPhoto.storage_path}`
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

const TYPE_LABELS: Record<string, string> = {
  build: "Build",
  fix: "Fix",
  service: "Service",
  story: "Story",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: car } = await supabase
    .from("cars")
    .select("id, slug, year, visibility, current_owner_id, model:car_models(make, model, generation), custom_make, custom_model")
    .eq("slug", slug)
    .single();

  if (!car) notFound();

  const isOwner = user?.id === car.current_owner_id;
  if (car.visibility === "private" && !isOwner) notFound();

  const [eventResult, profileResult, ownershipResult] = await Promise.all([
    supabase
      .from("car_events")
      .select("id, type, title, description, details, event_date, mileage_value, mileage_unit, amount")
      .eq("id", id)
      .eq("car_id", car.id)
      .single(),
    user
      ? supabase.from("profiles").select("mileage_unit").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("ownerships")
      .select("currency")
      .eq("car_id", car.id)
      .eq("user_id", car.current_owner_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const { data: event } = eventResult;
  const viewerUnit: MileageUnit = profileResult.data?.mileage_unit === "mi" ? "mi" : "km";
  const carCurrency = ownershipResult.data?.currency ?? "EUR";

  if (!event) notFound();

  const { data: photos } = await supabase
    .from("photos")
    .select("id, storage_path")
    .eq("event_id", event.id)
    .order("position");

  type ModelRow = { make: string; model: string; generation: string };
  const rawModel = car.model as unknown;
  const m: ModelRow | null = Array.isArray(rawModel)
    ? (rawModel[0] ?? null)
    : (rawModel as ModelRow | null);
  const make = m?.make ?? car.custom_make ?? "";
  const model = m?.model ?? car.custom_model ?? "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const isFix = event.type === "fix";
  const eventAmount = (event as { amount?: number | null }).amount ?? null;
  const amountCurrencySymbol = CURRENCIES.find((c) => c.value === carCurrency)?.symbol ?? carCurrency;
  const details = event.details as {
    problem?: string;
    diagnosis?: string;
    solution?: string;
  } | null;
  const coverPhoto = photos?.[0];

  const displayMileage = (event as { mileage_value?: number | null }).mileage_value
    ? formatMileage(
        convertMileage(
          (event as { mileage_value: number }).mileage_value,
          ((event as { mileage_unit?: string | null }).mileage_unit ?? "km") as MileageUnit,
          viewerUnit
        ),
        viewerUnit
      )
    : null;

  return (
    <div className="pb-24">
      {/* Cover photo */}
      {coverPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${supabaseUrl}/storage/v1/object/public/car-photos/${coverPhoto.storage_path}`}
          alt={event.title}
          className="w-full aspect-[4/3] object-cover"
        />
      )}

      <div
          className="px-4 pb-4"
          style={{ paddingTop: coverPhoto ? "1rem" : "calc(1rem + env(safe-area-inset-top, 0px))" }}
        >
        {/* Back nav */}
        <Link
          href={`/car/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-ink/40 hover:text-ink/70 mb-4 transition-colors"
        >
          <ArrowLeft size={13} />
          {car.year} {make} {model}
        </Link>

        {/* Type badge + date + mileage + amount */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              event.type === "build"
                ? "bg-racing-green/10 text-racing-green"
                : "bg-ink/8 text-ink/60"
            }`}
          >
            {TYPE_LABELS[event.type] ?? event.type}
          </span>
          <span className="text-xs text-ink/30 flex items-center gap-1">
            <Calendar size={11} />
            {new Date(event.event_date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {displayMileage && (
            <span className="text-xs text-ink/30 flex items-center gap-1">
              <Gauge size={11} />
              {displayMileage}
            </span>
          )}
          {eventAmount != null && (
            <span className="text-xs text-ink/30">
              {amountCurrencySymbol}{Math.round(eventAmount).toLocaleString("en-US")} spent
            </span>
          )}
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              href={`/car/${slug}/events/${id}/edit`}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-ink/15 rounded-input text-ink hover:bg-ink/5 transition-colors"
            >
              <Pencil size={13} />
              Edit
            </Link>
            <DeleteEventButton eventId={id} carSlug={slug} />
          </div>
        )}

        {/* Title */}
        <h1 className="font-display font-bold text-2xl leading-tight mb-4">
          {event.title}
        </h1>

        {/* Content */}
        {isFix && details ? (
          <div className="space-y-5">
            {details.problem && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-ink/30 font-medium mb-1.5">
                  Problem
                </h2>
                <p className="text-ink/80 leading-relaxed">{details.problem}</p>
              </div>
            )}
            {details.diagnosis && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-ink/30 font-medium mb-1.5">
                  Diagnosis
                </h2>
                <p className="text-ink/80 leading-relaxed">{details.diagnosis}</p>
              </div>
            )}
            {details.solution && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-ink/30 font-medium mb-1.5">
                  Solution
                </h2>
                <p className="text-ink/80 leading-relaxed">{details.solution}</p>
              </div>
            )}
          </div>
        ) : (
          event.description && (
            <p className="text-ink/80 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )
        )}

        {/* Share */}
        <div className="mt-6 pt-4 border-t border-card">
          <ShareButton
            url={`${siteUrl}/car/${slug}/events/${id}`}
            title={event.title}
          />
        </div>

        {/* Photo gallery (remaining photos after cover) */}
        {photos && photos.length > 1 && (
          <div className="mt-6">
            <h2 className="text-xs uppercase tracking-widest text-ink/30 font-medium mb-3">
              Photos
            </h2>
            <PhotoGallery
              photos={photos.slice(1)}
              supabaseUrl={supabaseUrl}
              carSlug={slug}
            />
          </div>
        )}
      </div>
    </div>
  );
}
