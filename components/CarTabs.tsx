"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Plus, Gauge, Tag, Hammer, Wrench, Flag } from "lucide-react";
import { FullscreenPhotoViewer, type ViewerPhoto } from "@/components/FullscreenPhotoViewer";
import { PhotoGallery } from "@/components/PhotoGallery";
import { convertMileage, formatMileage, type MileageUnit } from "@/lib/mileage";
import { CURRENCIES } from "@/lib/car-options";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { deleteEvent } from "@/lib/actions/event";

type EventType = "build" | "fix";

interface CarEvent {
  id: string;
  type: EventType;
  title: string;
  description: string | null;
  details: { problem?: string; diagnosis?: string; solution?: string } | null;
  event_date: string;
  photos: { id: string; storage_path: string }[];
  mileage_value: number | null;
  mileage_unit: string | null;
  amount?: number | null;
}

interface Photo {
  id: string;
  storage_path: string;
  event_id: string | null;
  event_type?: string | null;
  event_title?: string | null;
}

interface PurchaseRecord {
  startDate: string | null;
  purchasePrice: number | null;
  currency: string | null;
  acquisitionConditionLabel: string | null;
  purchaseMileageValue: number | null;
  purchaseMileageUnit: string | null;
  coverPhotoPath?: string | null;
}

interface SoldRecord {
  endDate: string;
  salePrice: number | null;
  currency: string | null;
  saleMileageValue: number | null;
  saleMileageUnit: string | null;
  saleDescription: string | null;
  salePhotoPath: string | null;
}

interface CarTabsProps {
  carSlug: string;
  isOwner: boolean;
  events: CarEvent[];
  photos: Photo[];
  supabaseUrl: string;
  viewerUnit?: MileageUnit;
  purchaseRecord?: PurchaseRecord;
  saleRecord?: SoldRecord;
  carCurrency?: string;
}

type Tab = "timeline" | "mods" | "fixes" | "gallery";

const TYPE_LABELS: Record<EventType, string> = {
  build: "MOD",
  fix: "FIX",
};

const TABS: { id: Tab; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "mods",     label: "Mods" },
  { id: "fixes",    label: "Fixes" },
  { id: "gallery",  label: "Gallery" },
];

function formatEventDate(d: string) {
  return new Date(d)
    .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    .toUpperCase();
}

// ── Event card — editorial, photo-first ──────────────────────────────────────

function EventCard({
  event,
  carSlug,
  supabaseUrl,
  index,
  viewerUnit = "km",
  isOwner = false,
  carCurrency = "EUR",
}: {
  event: CarEvent;
  carSlug: string;
  supabaseUrl: string;
  index: number;
  viewerUnit?: MileageUnit;
  isOwner?: boolean;
  carCurrency?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const coverPhoto = event.photos[0];
  const hasMultiplePhotos = event.photos.length > 1;
  const isFix = event.type === "fix";
  const amountSymbol = CURRENCIES.find((c) => c.value === carCurrency)?.symbol ?? carCurrency;

  const displayMileage = event.mileage_value
    ? formatMileage(
        convertMileage(event.mileage_value, (event.mileage_unit ?? "km") as MileageUnit, viewerUnit),
        viewerUnit
      )
    : null;

  // All event photos as viewer-ready objects (with breadcrumb data)
  const viewerPhotos: ViewerPhoto[] = event.photos.map((p) => ({
    id: p.id,
    url: `${supabaseUrl}/storage/v1/object/public/car-photos/${p.storage_path}`,
    eventId: event.id,
    eventTitle: event.title,
    eventType: event.type,
    carSlug,
  }));

  // Shared label row for below-photo and no-photo states
  const TypeIcon = isFix
    ? <Wrench size={9} className={isFix ? "text-ink-muted" : "text-green-bright"} />
    : <Hammer size={9} className="text-green-bright" />;

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteEvent(event.id);
      if (result && "error" in result) {
        toast.error(result.error);
        setDeleting(false);
        setConfirming(false);
      } else {
        toast.success("Event deleted");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <article
      className="fade-rise"
      style={{ "--rise-delay": `${index * 60}ms` } as React.CSSProperties}
    >
      <Link href={`/car/${carSlug}/events/${event.id}`} className="block group">
        {/* Photo — 4:3, rounded top, image scales on hover.
            When multiple photos: clicking intercepts navigation and opens lightbox instead. */}
        {coverPhoto && (
          <div
            className="rounded-card overflow-hidden aspect-[4/3] mb-3 relative"
            onClick={hasMultiplePhotos ? (e) => { e.stopPropagation(); setLightboxOpen(true); } : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${supabaseUrl}/storage/v1/object/public/car-photos/${coverPhoto.storage_path}`}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
            {/* +N badge — shows how many additional photos exist */}
            {hasMultiplePhotos && (
              <div
                aria-label={`${event.photos.length} photos`}
                className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold text-white"
                style={{ background: "rgba(0,0,0,0.55)" }}
              >
                +{event.photos.length - 1}
              </div>
            )}
          </div>
        )}

        {/* No-photo card — bordered box */}
        {!coverPhoto && (
          <div className="rounded-card border border-ink/8 bg-white mb-3 p-4">
            <p className="text-[0.58rem] uppercase tracking-[0.18em] font-semibold text-hint mb-1.5 flex items-center gap-1.5">
              {TypeIcon}
              <span className={isFix ? "text-ink-muted" : "text-green-bright"}>
                {TYPE_LABELS[event.type]}
              </span>
              <span className="text-hint mx-0.5">·</span>
              {formatEventDate(event.event_date)}
            </p>
            <h3 className="font-display font-bold text-xl leading-tight text-ink">
              {event.title}
            </h3>
            {isFix && event.details?.problem && (
              <p className="text-ink-muted text-sm mt-2 line-clamp-2">{event.details.problem}</p>
            )}
            {!isFix && event.description && (
              <p className="text-ink-muted text-sm mt-2 line-clamp-2">{event.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {displayMileage && (
                <p className="flex items-center gap-1 text-xs text-ink/40">
                  <Gauge size={11} />
                  {displayMileage}
                </p>
              )}
              {event.amount != null && (
                <p className="text-xs text-ink/40">
                  {amountSymbol}{Math.round(event.amount).toLocaleString("en-US")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Below-photo text (only when photo exists) */}
        {coverPhoto && (
          <>
            <p className="text-[0.58rem] uppercase tracking-[0.18em] font-semibold text-hint mb-1.5 flex items-center gap-1.5">
              {TypeIcon}
              <span className={isFix ? "text-ink-muted" : "text-green-bright"}>
                {TYPE_LABELS[event.type]}
              </span>
              <span className="text-hint/60 mx-0.5">·</span>
              {formatEventDate(event.event_date)}
            </p>
            <h3 className="font-display font-bold text-xl leading-tight text-ink group-hover:text-green-bright transition-colors">
              {event.title}
            </h3>
            {isFix && event.details?.problem && (
              <p className="text-ink-muted text-sm mt-1 line-clamp-2">{event.details.problem}</p>
            )}
            {!isFix && event.description && (
              <p className="text-ink-muted text-sm mt-1 line-clamp-2">{event.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              {displayMileage && (
                <p className="flex items-center gap-1 text-xs text-ink/40">
                  <Gauge size={11} />
                  {displayMileage}
                </p>
              )}
              {event.amount != null && (
                <p className="text-xs text-ink/40">
                  {amountSymbol}{Math.round(event.amount).toLocaleString("en-US")}
                </p>
              )}
            </div>
          </>
        )}
      </Link>

      {/* Owner actions — edit + delete (outside the link) */}
      {isOwner && (
        <div className="mt-2">
          {!confirming ? (
            <div className="flex gap-3">
              <Link
                href={`/car/${carSlug}/events/${event.id}/edit`}
                className="text-xs text-ink/40 hover:text-ink transition-colors"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="text-xs text-ink/40 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink/50">Delete this event?</span>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="text-xs text-ink/40 hover:text-ink transition-colors disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Multi-photo lightbox */}
      {lightboxOpen && (
        <FullscreenPhotoViewer
          photos={viewerPhotos}
          initialIndex={0}
          onClose={() => setLightboxOpen(false)}
          alt={event.title}
        />
      )}
    </article>
  );
}

// ── Purchase origin card ─────────────────────────────────────────────────────

function PurchaseCard({
  record,
  carSlug,
  isOwner,
  supabaseUrl,
  viewerUnit = "km",
}: {
  record: PurchaseRecord;
  carSlug: string;
  isOwner: boolean;
  supabaseUrl: string;
  viewerUnit?: MileageUnit;
}) {
  if (!record.startDate) return null;

  const dateStr = new Date(record.startDate)
    .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    .toUpperCase();

  const mileageStr = record.purchaseMileageValue
    ? formatMileage(
        convertMileage(
          record.purchaseMileageValue,
          (record.purchaseMileageUnit ?? "km") as MileageUnit,
          viewerUnit
        ),
        viewerUnit
      )
    : null;

  const priceStr =
    record.purchasePrice != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: record.currency ?? "EUR",
          maximumFractionDigits: 0,
        }).format(record.purchasePrice)
      : null;

  const photoUrl = record.coverPhotoPath
    ? `${supabaseUrl}/storage/v1/object/public/car-photos/${record.coverPhotoPath}`
    : null;

  const content = (
    <article>
      {photoUrl && (
        <div className="rounded-card overflow-hidden aspect-[4/3] mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="Purchased" className="w-full h-full object-cover" />
        </div>
      )}

      <div className={photoUrl ? "" : "rounded-card border border-ink/8 bg-white mb-3 p-4"}>
        <p className="text-[0.58rem] uppercase tracking-[0.18em] font-semibold text-hint mb-1.5 flex items-center gap-1.5">
          <Flag size={9} className="text-ink/35" />
          <span className="text-ink/35">ORIGIN</span>
          <span className="text-hint mx-0.5">·</span>
          {dateStr}
        </p>
        <h3 className="font-display font-bold text-xl leading-tight text-ink">Purchased</h3>
        {(priceStr || mileageStr || record.acquisitionConditionLabel) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-ink/50">
            {priceStr && <span>{priceStr}</span>}
            {mileageStr && (
              <span className="flex items-center gap-1">
                <Gauge size={11} />
                {mileageStr}
              </span>
            )}
            {record.acquisitionConditionLabel && (
              <span>{record.acquisitionConditionLabel}</span>
            )}
          </div>
        )}
        {isOwner && (
          <p className="text-[0.6rem] text-ink/25 mt-2.5 uppercase tracking-[0.1em]">
            Edit via car settings
          </p>
        )}
      </div>
    </article>
  );

  if (isOwner) {
    return (
      <Link href={`/car/${carSlug}/edit`} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

// ── Sold card ────────────────────────────────────────────────────────────────

function SoldCard({
  record,
  carSlug,
  isOwner,
  supabaseUrl,
  viewerUnit = "km",
}: {
  record: SoldRecord;
  carSlug: string;
  isOwner: boolean;
  supabaseUrl: string;
  viewerUnit?: MileageUnit;
}) {
  const dateStr = new Date(record.endDate)
    .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    .toUpperCase();

  const mileageStr = record.saleMileageValue
    ? formatMileage(
        convertMileage(
          record.saleMileageValue,
          (record.saleMileageUnit ?? "km") as MileageUnit,
          viewerUnit
        ),
        viewerUnit
      )
    : null;

  const priceStr =
    record.salePrice != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: record.currency ?? "EUR",
          maximumFractionDigits: 0,
        }).format(record.salePrice)
      : null;

  const photoUrl = record.salePhotoPath
    ? `${supabaseUrl}/storage/v1/object/public/car-photos/${record.salePhotoPath}`
    : null;

  const content = (
    <article>
      {photoUrl && (
        <div className="rounded-card overflow-hidden aspect-[4/3] mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="Sold" className="w-full h-full object-cover" />
        </div>
      )}

      <div className={photoUrl ? "" : "rounded-card border border-ink/8 bg-white mb-3 p-4"}>
        <p className="text-[0.58rem] uppercase tracking-[0.18em] font-semibold text-hint mb-1.5 flex items-center gap-1.5">
          <Tag size={9} className="text-[#FF5A1F]" />
          <span className="text-[#FF5A1F]">SOLD</span>
          <span className="text-hint mx-0.5">·</span>
          {dateStr}
        </p>
        <h3 className="font-display font-bold text-xl leading-tight text-ink">Sold</h3>
        {record.saleDescription && (
          <p className="text-ink-muted text-sm mt-1 line-clamp-3">{record.saleDescription}</p>
        )}
        {(priceStr || mileageStr) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-ink/50">
            {priceStr && <span>{priceStr}</span>}
            {mileageStr && (
              <span className="flex items-center gap-1">
                <Gauge size={11} />
                {mileageStr}
              </span>
            )}
          </div>
        )}
        {isOwner && (
          <p className="text-[0.6rem] text-ink/25 mt-2.5 uppercase tracking-[0.1em]">
            Edit via car settings
          </p>
        )}
      </div>
    </article>
  );

  if (isOwner) {
    return (
      <Link href={`/car/${carSlug}/sell/edit`} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ carSlug, isOwner }: { carSlug: string; isOwner: boolean }) {
  return (
    <div className="py-16 text-center">
      <Clock size={28} className="text-hint mx-auto mb-3" />
      <p className="font-display font-bold text-base mb-1 text-ink">No entries yet</p>
      {isOwner ? (
        <>
          <p className="text-ink-muted text-sm mb-6">This car&apos;s story starts here.</p>
          <Link
            href={`/car/${carSlug}/events/new`}
            className="inline-flex items-center gap-2 bg-ink text-paper font-display font-bold px-5 py-2.5 rounded-card text-sm hover:bg-ink/85 transition-colors"
          >
            <Plus size={14} />
            Add your first update
          </Link>
        </>
      ) : (
        <p className="text-ink-muted text-sm">Check back later.</p>
      )}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

export function CarTabs({ carSlug, isOwner, events, photos, supabaseUrl, viewerUnit = "km", purchaseRecord, saleRecord, carCurrency = "EUR" }: CarTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("timeline");

  const buildEvents = events.filter((e) => e.type === "build");
  const fixEvents   = events.filter((e) => e.type === "fix");

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  return (
    <div>
      {/* ── Tab bar — equal-width, sliding green underline ── */}
      <div className="sticky top-0 z-10 bg-paper/90 backdrop-blur-sm border-b border-ink/8">
        <div className="relative flex">
          {TABS.map(({ id, label }, i) => {
            const count =
              id === "mods" ? buildEvents.length
              : id === "fixes" ? fixEvents.length
              : null;

            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === id ? "text-ink" : "text-hint hover:text-ink-muted"
                }`}
              >
                {label}
                {count !== null && count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === id
                      ? "bg-ink/8 text-ink-muted"
                      : "bg-ink/5 text-hint"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Sliding underline — moves via CSS transform */}
          <div
            className="absolute bottom-0 left-0 h-[2px] bg-green-bright"
            style={{
              width: "25%",
              transform: `translateX(${activeIndex * 100}%)`,
              transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 py-5">
        {activeTab === "timeline" && (
          events.length === 0 && !purchaseRecord?.startDate && !saleRecord
            ? <EmptyState carSlug={carSlug} isOwner={isOwner} />
            : <div className="space-y-8">
                {saleRecord && (
                  <SoldCard record={saleRecord} carSlug={carSlug} isOwner={isOwner} supabaseUrl={supabaseUrl} viewerUnit={viewerUnit} />
                )}
                {events.map((e, i) => (
                  <EventCard key={e.id} event={e} carSlug={carSlug} supabaseUrl={supabaseUrl} index={i} viewerUnit={viewerUnit} isOwner={isOwner} carCurrency={carCurrency} />
                ))}
                {purchaseRecord && (
                  <PurchaseCard record={purchaseRecord} carSlug={carSlug} isOwner={isOwner} supabaseUrl={supabaseUrl} viewerUnit={viewerUnit} />
                )}
              </div>
        )}

        {activeTab === "mods" && (
          buildEvents.length === 0
            ? <EmptyState carSlug={carSlug} isOwner={isOwner} />
            : <div className="space-y-8">
                {buildEvents.map((e, i) => (
                  <EventCard key={e.id} event={e} carSlug={carSlug} supabaseUrl={supabaseUrl} index={i} viewerUnit={viewerUnit} isOwner={isOwner} carCurrency={carCurrency} />
                ))}
              </div>
        )}

        {activeTab === "fixes" && (
          fixEvents.length === 0
            ? <EmptyState carSlug={carSlug} isOwner={isOwner} />
            : <div className="space-y-8">
                {fixEvents.map((e, i) => (
                  <EventCard key={e.id} event={e} carSlug={carSlug} supabaseUrl={supabaseUrl} index={i} viewerUnit={viewerUnit} isOwner={isOwner} carCurrency={carCurrency} />
                ))}
              </div>
        )}

        {activeTab === "gallery" && (
          <PhotoGallery photos={photos} supabaseUrl={supabaseUrl} carSlug={carSlug} />
        )}
      </div>
    </div>
  );
}
