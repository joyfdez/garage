"use client";

import { useState } from "react";
import { Hammer, Wrench, Tag } from "lucide-react";
import { FullscreenPhotoViewer, type ViewerPhoto } from "@/components/FullscreenPhotoViewer";

interface Photo {
  id: string;
  storage_path: string;
  event_id?: string | null;
  event_type?: string | null;
  event_title?: string | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
  supabaseUrl: string;
  carSlug: string;
}

function EventTypeIcon({ type }: { type: string }) {
  if (type === "build") return <Hammer size={10} className="text-white/85" />;
  if (type === "fix") return <Wrench size={10} className="text-white/85" />;
  if (type === "sold") return <Tag size={10} className="text-white/85" />;
  return null;
}

export function PhotoGallery({ photos, supabaseUrl, carSlug }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="text-ink/40 text-sm py-8 text-center">No photos yet.</p>
    );
  }

  function photoUrl(path: string) {
    return `${supabaseUrl}/storage/v1/object/public/car-photos/${path}`;
  }

  const viewerPhotos: ViewerPhoto[] = photos.map((p) => ({
    id: p.id,
    url: photoUrl(p.storage_path),
    eventId: p.event_id ?? undefined,
    eventTitle: p.event_title ?? undefined,
    eventType: p.event_type ?? undefined,
    carSlug: p.event_id ? carSlug : undefined,
  }));

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setLightboxIndex(i)}
            className="aspect-square overflow-hidden bg-card hover:opacity-90 transition-opacity relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(photo.storage_path)}
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Event-type icon overlay — only on event photos */}
            {photo.event_type && (
              <div
                aria-hidden="true"
                className="absolute bottom-1 left-1 w-5 h-5 flex items-center justify-center rounded"
                style={{ background: "rgba(0,0,0,0.52)" }}
              >
                <EventTypeIcon type={photo.event_type} />
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <FullscreenPhotoViewer
          photos={viewerPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
