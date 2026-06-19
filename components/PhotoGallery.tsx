"use client";

import { useState } from "react";
import { FullscreenPhotoViewer } from "@/components/FullscreenPhotoViewer";

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

  const viewerPhotos = photos.map((p) => ({ id: p.id, url: photoUrl(p.storage_path) }));

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
        <FullscreenPhotoViewer
          photos={viewerPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
