"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench, Hammer, Clock, Images, Plus, Calendar } from "lucide-react";
import { PhotoGallery } from "@/components/PhotoGallery";

type EventType = "build" | "fix";

interface CarEvent {
  id: string;
  type: EventType;
  title: string;
  description: string | null;
  details: { problem?: string; diagnosis?: string; solution?: string } | null;
  event_date: string;
  photos: { id: string; storage_path: string }[];
}

interface Photo {
  id: string;
  storage_path: string;
  event_id: string | null;
}

interface CarTabsProps {
  carSlug: string;
  isOwner: boolean;
  events: CarEvent[];
  photos: Photo[];
  supabaseUrl: string;
}

type Tab = "timeline" | "mods" | "fixes" | "gallery";

const TYPE_LABELS: Record<EventType, string> = {
  build: "Build",
  fix: "Fix",
};

function EventCard({ event, carSlug, supabaseUrl }: { event: CarEvent; carSlug: string; supabaseUrl: string }) {
  const isFix = event.type === "fix";
  const coverPhoto = event.photos[0];

  return (
    <Link href={`/car/${carSlug}/events/${event.id}`} className="block group">
    <div className="bg-card rounded-2xl overflow-hidden group-hover:ring-2 group-hover:ring-orange/20 transition-shadow">
      {coverPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${supabaseUrl}/storage/v1/object/public/car-photos/${coverPhoto.storage_path}`}
          alt={event.title}
          className="w-full aspect-[16/9] object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              event.type === "build"
                ? "bg-orange/10 text-orange"
                : event.type === "fix"
                ? "bg-ink/8 text-ink/60"
                : "bg-ink/8 text-ink/60"
            }`}
          >
            {TYPE_LABELS[event.type]}
          </span>
          <span className="text-xs text-ink/30 flex items-center gap-1">
            <Calendar size={11} />
            {new Date(event.event_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <h3 className="font-display font-bold text-base leading-snug mb-2">{event.title}</h3>

        {isFix && event.details && (
          <div className="space-y-2 text-sm">
            {event.details.problem && (
              <div>
                <span className="text-xs uppercase tracking-wide text-ink/30 font-medium">Problem</span>
                <p className="text-ink/70 mt-0.5">{event.details.problem}</p>
              </div>
            )}
            {event.details.solution && (
              <div>
                <span className="text-xs uppercase tracking-wide text-ink/30 font-medium">Solution</span>
                <p className="text-ink/70 mt-0.5">{event.details.solution}</p>
              </div>
            )}
          </div>
        )}

        {!isFix && event.description && (
          <p className="text-sm text-ink/70 line-clamp-3">{event.description}</p>
        )}
      </div>
    </div>
    </Link>
  );
}

function EmptyTimeline({ carSlug, isOwner }: { carSlug: string; isOwner: boolean }) {
  return (
    <div className="py-16 text-center">
      <Clock size={32} className="text-ink/15 mx-auto mb-3" />
      <p className="font-display font-bold text-base mb-1">No entries yet</p>
      {isOwner ? (
        <>
          <p className="text-ink/40 text-sm mb-6">This car's story starts here.</p>
          <Link
            href={`/car/${carSlug}/events/new`}
            className="inline-flex items-center gap-2 bg-orange text-white font-display font-bold px-5 py-2.5 rounded-2xl hover:bg-orange-600 transition-colors text-sm"
          >
            <Plus size={15} />
            Add your first update
          </Link>
        </>
      ) : (
        <p className="text-ink/40 text-sm">Check back later.</p>
      )}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "mods", label: "Mods", icon: Hammer },
  { id: "fixes", label: "Fixes", icon: Wrench },
  { id: "gallery", label: "Gallery", icon: Images },
];

export function CarTabs({ carSlug, isOwner, events, photos, supabaseUrl }: CarTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("timeline");

  const buildEvents = events.filter((e) => e.type === "build");
  const fixEvents = events.filter((e) => e.type === "fix");
  const galleryPhotos = photos.map((p) => ({ id: p.id, storage_path: p.storage_path }));

  return (
    <div>
      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-card">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === id
                  ? "border-orange text-orange"
                  : "border-transparent text-ink/40 hover:text-ink/70"
              }`}
            >
              <Icon size={14} />
              {label}
              {id === "mods" && buildEvents.length > 0 && (
                <span className="text-xs bg-card rounded-full px-1.5 py-0.5 text-ink/50 ml-1">{buildEvents.length}</span>
              )}
              {id === "fixes" && fixEvents.length > 0 && (
                <span className="text-xs bg-card rounded-full px-1.5 py-0.5 text-ink/50 ml-1">{fixEvents.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4">
        {activeTab === "timeline" && (
          <>
            {events.length === 0 ? (
              <EmptyTimeline carSlug={carSlug} isOwner={isOwner} />
            ) : (
              <div className="space-y-4">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} carSlug={carSlug} supabaseUrl={supabaseUrl} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "mods" && (
          <>
            {buildEvents.length === 0 ? (
              <EmptyTimeline carSlug={carSlug} isOwner={isOwner} />
            ) : (
              <div className="space-y-4">
                {buildEvents.map((e) => (
                  <EventCard key={e.id} event={e} carSlug={carSlug} supabaseUrl={supabaseUrl} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "fixes" && (
          <>
            {fixEvents.length === 0 ? (
              <EmptyTimeline carSlug={carSlug} isOwner={isOwner} />
            ) : (
              <div className="space-y-4">
                {fixEvents.map((e) => (
                  <EventCard key={e.id} event={e} carSlug={carSlug} supabaseUrl={supabaseUrl} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "gallery" && (
          <PhotoGallery photos={galleryPhotos} supabaseUrl={supabaseUrl} />
        )}
      </div>
    </div>
  );
}
