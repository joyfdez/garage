"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Plus, Gauge } from "lucide-react";
import { PhotoGallery } from "@/components/PhotoGallery";
import { convertMileage, formatMileage, type MileageUnit } from "@/lib/mileage";

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
}

interface Photo {
  id: string;
  storage_path: string;
  event_id: string | null;
}

interface PurchaseRecord {
  startDate: string | null;
  purchasePrice: number | null;
  currency: string | null;
  acquisitionConditionLabel: string | null;
  purchaseMileageValue: number | null;
  purchaseMileageUnit: string | null;
}

interface CarTabsProps {
  carSlug: string;
  isOwner: boolean;
  events: CarEvent[];
  photos: Photo[];
  supabaseUrl: string;
  viewerUnit?: MileageUnit;
  purchaseRecord?: PurchaseRecord;
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
}: {
  event: CarEvent;
  carSlug: string;
  supabaseUrl: string;
  index: number;
  viewerUnit?: MileageUnit;
}) {
  const coverPhoto = event.photos[0];
  const isFix = event.type === "fix";

  const displayMileage = event.mileage_value
    ? formatMileage(
        convertMileage(event.mileage_value, (event.mileage_unit ?? "km") as MileageUnit, viewerUnit),
        viewerUnit
      )
    : null;

  return (
    <Link
      href={`/car/${carSlug}/events/${event.id}`}
      className="block group fade-rise"
      style={{ "--rise-delay": `${index * 60}ms` } as React.CSSProperties}
    >
      <article>
        {/* Photo — 4:3, rounded top, image scales on hover */}
        {coverPhoto && (
          <div className="rounded-card overflow-hidden aspect-[4/3] mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${supabaseUrl}/storage/v1/object/public/car-photos/${coverPhoto.storage_path}`}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
          </div>
        )}

        {/* No-photo card — bordered box */}
        {!coverPhoto && (
          <div className="rounded-card border border-ink/8 bg-white mb-3 p-4">
            {/* Metadata inside no-photo card */}
            <p className="text-[0.58rem] uppercase tracking-[0.18em] font-semibold text-hint mb-1.5">
              <span className={isFix ? "text-ink-muted" : "text-green-bright"}>
                {TYPE_LABELS[event.type]}
              </span>
              <span className="text-hint mx-1.5">·</span>
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
            {displayMileage && (
              <p className="flex items-center gap-1 text-xs text-ink/40 mt-2">
                <Gauge size={11} />
                {displayMileage}
              </p>
            )}
          </div>
        )}

        {/* Below-photo text (only when photo exists) */}
        {coverPhoto && (
          <>
            {/* Metadata line — uppercase, spaced */}
            <p className="text-[0.58rem] uppercase tracking-[0.18em] font-semibold text-hint mb-1.5 flex items-center gap-2">
              <span className={isFix ? "text-ink-muted" : "text-green-bright"}>
                {TYPE_LABELS[event.type]}
              </span>
              <span className="text-hint/60">·</span>
              {formatEventDate(event.event_date)}
            </p>

            {/* Title — Archivo, large */}
            <h3 className="font-display font-bold text-xl leading-tight text-ink group-hover:text-green-bright transition-colors">
              {event.title}
            </h3>

            {isFix && event.details?.problem && (
              <p className="text-ink-muted text-sm mt-1 line-clamp-2">{event.details.problem}</p>
            )}
            {!isFix && event.description && (
              <p className="text-ink-muted text-sm mt-1 line-clamp-2">{event.description}</p>
            )}
            {displayMileage && (
              <p className="flex items-center gap-1 text-xs text-ink/40 mt-1">
                <Gauge size={11} />
                {displayMileage}
              </p>
            )}
          </>
        )}
      </article>
    </Link>
  );
}

// ── Purchase origin card ─────────────────────────────────────────────────────

function PurchaseCard({
  record,
  carSlug,
  isOwner,
  viewerUnit = "km",
}: {
  record: PurchaseRecord;
  carSlug: string;
  isOwner: boolean;
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

  const content = (
    <div className="rounded-card border border-dashed border-ink/12 bg-card p-4">
      <p className="text-[0.58rem] uppercase tracking-[0.18em] font-semibold text-hint mb-1.5">
        <span className="text-ink/35">ORIGIN</span>
        <span className="text-hint mx-1.5">·</span>
        {dateStr}
      </p>
      <h3 className="font-display font-bold text-lg text-ink">Purchased</h3>
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

export function CarTabs({ carSlug, isOwner, events, photos, supabaseUrl, viewerUnit = "km", purchaseRecord }: CarTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("timeline");

  const buildEvents = events.filter((e) => e.type === "build");
  const fixEvents   = events.filter((e) => e.type === "fix");
  const galleryPics = photos.map((p) => ({ id: p.id, storage_path: p.storage_path }));

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
          events.length === 0 && !purchaseRecord?.startDate
            ? <EmptyState carSlug={carSlug} isOwner={isOwner} />
            : <div className="space-y-8">
                {events.map((e, i) => (
                  <EventCard key={e.id} event={e} carSlug={carSlug} supabaseUrl={supabaseUrl} index={i} viewerUnit={viewerUnit} />
                ))}
                {purchaseRecord && (
                  <PurchaseCard record={purchaseRecord} carSlug={carSlug} isOwner={isOwner} viewerUnit={viewerUnit} />
                )}
              </div>
        )}

        {activeTab === "mods" && (
          buildEvents.length === 0
            ? <EmptyState carSlug={carSlug} isOwner={isOwner} />
            : <div className="space-y-8">
                {buildEvents.map((e, i) => (
                  <EventCard key={e.id} event={e} carSlug={carSlug} supabaseUrl={supabaseUrl} index={i} viewerUnit={viewerUnit} />
                ))}
              </div>
        )}

        {activeTab === "fixes" && (
          fixEvents.length === 0
            ? <EmptyState carSlug={carSlug} isOwner={isOwner} />
            : <div className="space-y-8">
                {fixEvents.map((e, i) => (
                  <EventCard key={e.id} event={e} carSlug={carSlug} supabaseUrl={supabaseUrl} index={i} viewerUnit={viewerUnit} />
                ))}
              </div>
        )}

        {activeTab === "gallery" && (
          <PhotoGallery photos={galleryPics} supabaseUrl={supabaseUrl} />
        )}
      </div>
    </div>
  );
}
