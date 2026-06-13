"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  id: string;
  storage_path: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  supabaseUrl: string;
}

export function PhotoGallery({ photos, supabaseUrl }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="text-ink/40 text-sm py-8 text-center">No photos yet.</p>
    );
  }

  function photoUrl(path: string) {
    return `${supabaseUrl}/storage/v1/object/public/car-photos/${path}`;
  }

  function prev() {
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
  }

  function next() {
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setLightboxIndex(i)}
            className="aspect-square overflow-hidden bg-card hover:opacity-90 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(photo.storage_path)}
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl(photos[lightboxIndex].storage_path)}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X size={24} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                <ChevronRight size={32} />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
                {lightboxIndex + 1} / {photos.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
