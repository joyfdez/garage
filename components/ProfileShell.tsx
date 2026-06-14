"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Car,
  Clock,
  CheckCircle2,
  Heart,
  MapPin,
  Settings,
  Plus,
  Lock,
} from "lucide-react";
import { CarModel } from "@/components/BrowsePicker";
import { ModelCard } from "@/components/ModelCard";
import { toggleModelTag, TagType } from "@/lib/actions/modelTags";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CarData {
  slug: string;
  year: number;
  make: string;
  model: string;
  generation: string;
  nickname: string | null;
  coverPhotoPath: string | null;
  isPrivate: boolean;
  eventCount: number;
  ownershipPeriod: string | null;
}

export interface ProfileShellProps {
  username: string;
  displayName: string | null;
  location: string | null;
  country: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverPhotoPath: string | null;
  currentCars: CarData[];
  previousCars: CarData[];
  drivenModels: CarModel[];
  wishlistModels: CarModel[];
  initialTagKeys: string[];
  supabaseUrl: string;
  isOwner: boolean;
}

type Tab = "owned-now" | "owned" | "driven" | "wishlist";

// ── Counter tab config ────────────────────────────────────────────────────────

const TABS = [
  { id: "owned-now" as Tab, label: "OWNED\nNOW", icon: Car          },
  { id: "owned"     as Tab, label: "OWNED",       icon: Clock        },
  { id: "driven"    as Tab, label: "DRIVEN",       icon: CheckCircle2 },
  { id: "wishlist"  as Tab, label: "WISHLIST",     icon: Heart        },
] as const;

// ── Inline CarCard for Profile (avoids client-boundary issues with next/link) ─

function ProfileCarCard({
  car,
  supabaseUrl,
}: {
  car: CarData;
  supabaseUrl: string;
}) {
  const coverUrl = car.coverPhotoPath
    ? `${supabaseUrl}/storage/v1/object/public/car-photos/${car.coverPhotoPath}`
    : null;

  return (
    <Link href={`/car/${car.slug}`} className="block group">
      <div className="bg-white rounded-card border border-ink/8 overflow-hidden">
        {/* Photo / typographic cover */}
        <div className="aspect-[4/3] relative overflow-hidden">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-racing-green flex flex-col justify-end p-3">
              <p className="text-[0.5rem] uppercase tracking-[0.18em] font-bold text-white/50 leading-none mb-1">
                {car.make}
              </p>
              <p className="font-display font-extrabold text-white text-sm leading-tight">
                {car.model}
                {car.generation && (
                  <span className="text-white/55 font-semibold ml-1">
                    {car.generation}
                  </span>
                )}
              </p>
              <p className="text-white/30 text-[0.58rem] mt-1">{car.year}</p>
            </div>
          )}

          {/* Private badge */}
          {car.isPrivate && (
            <div className="absolute top-2 right-2 bg-paper/90 backdrop-blur-sm rounded-full p-1">
              <Lock size={10} className="text-ink-muted" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-display font-bold text-sm leading-tight text-ink">
            {car.year} {car.make} {car.model}
            {car.generation && (
              <span className="text-ink/40 font-normal ml-1">{car.generation}</span>
            )}
          </p>
          {car.nickname && (
            <p className="text-ink-muted text-xs mt-0.5 truncate">{car.nickname}</p>
          )}
          {car.ownershipPeriod && (
            <p className="text-hint text-xs mt-0.5">{car.ownershipPeriod}</p>
          )}
          {car.eventCount > 0 && (
            <p className="text-hint text-xs mt-0.5">
              {car.eventCount} {car.eventCount === 1 ? "entry" : "entries"}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Cars section ─────────────────────────────────────────────────────────────

function CarsSection({
  current,
  previous,
  supabaseUrl,
  isOwner,
  showBoth,
}: {
  current: CarData[];
  previous: CarData[];
  supabaseUrl: string;
  isOwner: boolean;
  showBoth: boolean;
}) {
  const carsToShow = showBoth ? current : current;
  const prevToShow = showBoth ? previous : [];

  if (carsToShow.length === 0 && prevToShow.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display font-bold text-base mb-1 text-ink">No cars yet</p>
        {isOwner ? (
          <>
            <p className="text-ink-muted text-sm mb-6">Add your first car to start your garage.</p>
            <Link
              href="/garage/new"
              className="inline-flex items-center gap-2 bg-ink text-paper font-display font-bold px-5 py-2.5 rounded-card text-sm hover:bg-ink/85 transition-colors"
            >
              <Plus size={14} />
              Add your first car
            </Link>
          </>
        ) : (
          <p className="text-ink-muted text-sm">No public cars yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {carsToShow.length > 0 && (
        <div>
          <div className="grid grid-cols-2 gap-3">
            {carsToShow.map((car) => (
              <ProfileCarCard key={car.slug} car={car} supabaseUrl={supabaseUrl} />
            ))}
          </div>
          {isOwner && (
            <div className="mt-4">
              <Link
                href="/garage/new"
                className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-ink/12 rounded-card text-sm text-ink-muted hover:border-racing-green/30 hover:text-racing-green transition-colors"
              >
                <Plus size={14} />
                Add a car
              </Link>
            </div>
          )}
        </div>
      )}

      {prevToShow.length > 0 && (
        <div>
          <p className="text-[0.58rem] uppercase tracking-[0.2em] font-bold text-hint mb-3">
            Previously owned
          </p>
          <div className="grid grid-cols-2 gap-3">
            {prevToShow.map((car) => (
              <ProfileCarCard key={car.slug} car={car} supabaseUrl={supabaseUrl} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Models section ────────────────────────────────────────────────────────────

function ModelsSection({
  models,
  tagSet,
  pending,
  onToggle,
  emptyLabel,
}: {
  models: CarModel[];
  tagSet: Set<string>;
  pending: string | null;
  onToggle: (id: string, type: TagType) => void;
  emptyLabel: string;
}) {
  if (models.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted text-sm mb-1">{emptyLabel}</p>
        <Link href="/explore" className="text-xs text-green-bright hover:underline">
          Browse models in Explore →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {models.map((m) => (
        <ModelCard
          key={m.id}
          model={m}
          tagSet={tagSet}
          pending={pending}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileShell({
  username,
  displayName,
  location,
  country,
  bio,
  avatarUrl,
  coverPhotoPath,
  currentCars,
  previousCars,
  drivenModels,
  wishlistModels,
  initialTagKeys,
  supabaseUrl,
  isOwner,
}: ProfileShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>("owned-now");

  // ── Tag state (for driven/wishlist model cards) ───
  const [tagSet, setTagSet] = useState<Set<string>>(
    () => new Set(initialTagKeys)
  );
  const [pending, setPending] = useState<string | null>(null);

  async function handleToggle(modelId: string, tagType: TagType) {
    const key = `${modelId}:${tagType}`;
    if (pending) return;
    const wasTagged = tagSet.has(key);
    setTagSet((prev) => {
      const next = new Set(prev);
      wasTagged ? next.delete(key) : next.add(key);
      return next;
    });
    setPending(key);
    try {
      const result = await toggleModelTag(modelId, tagType);
      if (result.error) {
        setTagSet((prev) => {
          const next = new Set(prev);
          wasTagged ? next.add(key) : next.delete(key);
          return next;
        });
      }
    } finally {
      setPending(null);
    }
  }

  // Derive live filtered lists (so untagging removes the card)
  const liveDriven   = drivenModels.filter((m) => tagSet.has(`${m.id}:driven`));
  const liveWishlist = wishlistModels.filter((m) => tagSet.has(`${m.id}:wishlist`));

  // Counts — read directly from tagSet so they update live regardless of
  // whether a tag was added here or from another page in the same session.
  const tagSetDrivenCount   = [...tagSet].filter((k) => k.endsWith(":driven")).length;
  const tagSetWishlistCount = [...tagSet].filter((k) => k.endsWith(":wishlist")).length;

  const counts: Record<Tab, number> = {
    "owned-now": currentCars.length,
    owned:       currentCars.length + previousCars.length,
    driven:      tagSetDrivenCount,
    wishlist:    tagSetWishlistCount,
  };

  // ── URLs ──
  // cover_photo_path may be a full versioned URL (new uploads) or a bare storage
  // path (legacy data). Detect by prefix so both display correctly.
  const coverUrl = coverPhotoPath
    ? coverPhotoPath.startsWith("http")
      ? coverPhotoPath
      : `${supabaseUrl}/storage/v1/object/public/avatars/${coverPhotoPath}`
    : null;

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">

      {/* ── Cover ── */}
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" className="w-full aspect-[3/1] object-cover" />
      ) : (
        <div className="w-full aspect-[3/1] bg-ink/5" />
      )}

      {/* ── Avatar + header ── */}
      <div className="px-5">
        <div className="flex items-end justify-between -mt-8 mb-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName ?? username}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-paper shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-racing-green/15 ring-4 ring-paper flex items-center justify-center font-display font-extrabold text-2xl text-racing-green shrink-0">
              {username[0].toUpperCase()}
            </div>
          )}

          {isOwner && (
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors px-3 py-2 rounded-card bg-white border border-ink/8 mb-1"
            >
              <Settings size={13} />
              Edit profile
            </Link>
          )}
        </div>

        <h1 className="font-display font-extrabold text-xl leading-tight text-ink">
          {displayName ?? `@${username}`}
        </h1>
        <p className="text-hint text-sm mb-2">@{username}</p>

        {bio && (
          <p className="text-sm text-ink/70 leading-relaxed mb-2">{bio}</p>
        )}

        {(location || country) && (
          <p className="flex items-center gap-1.5 text-xs text-hint mb-5">
            <MapPin size={11} />
            {[location, country].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      {/* ── Counter / tab block ── */}
      <div className="px-5 mb-6">
        <div className="bg-white rounded-card border border-ink/8 overflow-hidden">
          {/* Racing-green accent bar */}
          <div className="h-[3px] bg-racing-green" />

          <div className="grid grid-cols-4">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-0.5 py-3.5 px-1 transition-colors border-b-2 ${
                    isActive
                      ? "border-racing-green bg-racing-green/6 text-racing-green"
                      : "border-transparent text-hint hover:text-ink-muted"
                  }`}
                >
                  <tab.icon size={12} strokeWidth={isActive ? 2 : 1.5} />
                  <span className="font-display font-extrabold text-[1.4rem] leading-none">
                    {counts[tab.id]}
                  </span>
                  <span className="text-[0.4rem] uppercase tracking-[0.13em] font-bold text-center leading-[1.3] whitespace-pre-line">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content module ── fades on tab change via key ── */}
      <div key={activeTab} className="tab-fade px-5">
        {activeTab === "owned-now" && (
          <CarsSection
            current={currentCars}
            previous={[]}
            supabaseUrl={supabaseUrl}
            isOwner={isOwner}
            showBoth={false}
          />
        )}

        {activeTab === "owned" && (
          <CarsSection
            current={currentCars}
            previous={previousCars}
            supabaseUrl={supabaseUrl}
            isOwner={isOwner}
            showBoth={true}
          />
        )}

        {activeTab === "driven" && (
          <ModelsSection
            models={liveDriven}
            tagSet={tagSet}
            pending={pending}
            onToggle={handleToggle}
            emptyLabel="No models tagged as driven yet."
          />
        )}

        {activeTab === "wishlist" && (
          <ModelsSection
            models={liveWishlist}
            tagSet={tagSet}
            pending={pending}
            onToggle={handleToggle}
            emptyLabel="Your wishlist is empty."
          />
        )}
      </div>
    </div>
  );
}
