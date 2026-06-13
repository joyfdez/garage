"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import { Globe, Lock, Star, X, Camera } from "lucide-react";
import {
  updateCar,
  setCarCover,
  deleteCarPhoto,
  addPhotosToGallery,
  deleteCar,
  CarState,
} from "@/lib/actions/car";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

export interface CarForEdit {
  id: string;
  slug: string;
  year: number;
  engine: string | null;
  transmission: string | null;
  color: string | null;
  nickname: string | null;
  location: string | null;
  visibility: "public" | "private";
  cover_photo_path: string | null;
  model_id: string | null;
  engines: string[];
  displayMake: string;
  displayModel: string;
  displayGeneration: string;
  custom_make: string | null;
  custom_model: string | null;
  custom_generation: string | null;
}

export interface PhotoItem {
  id: string;
  storage_path: string;
}

function photoUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/car-photos/${path}`;
}

export function EditCarForm({
  car,
  photos: initialPhotos,
  supabaseUrl,
  userId,
}: {
  car: CarForEdit;
  photos: PhotoItem[];
  supabaseUrl: string;
  userId: string;
}) {
  const [state, action, pending] = useActionState<CarState, FormData>(updateCar, null);
  const [isPrivate, setIsPrivate] = useState(car.visibility === "private");

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteCar() {
    setDeleting(true);
    setDeleteError(null);
    const err = await deleteCar(car.id);
    if (err) {
      setDeleteError(err);
      setDeleting(false);
    }
    // On success, deleteCar redirects — no need to update state
  }

  // Photo state
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [coverPath, setCoverPath] = useState(car.cover_photo_path);
  const [working, setWorking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSetCover = useCallback(async (storagePath: string) => {
    setWorking(true);
    setPhotoError(null);
    const err = await setCarCover(car.id, storagePath);
    if (err) setPhotoError(err);
    else setCoverPath(storagePath);
    setWorking(false);
  }, [car.id]);

  const handleDelete = useCallback(async (photo: PhotoItem) => {
    if (!confirm("Delete this photo? This can't be undone.")) return;
    setWorking(true);
    setPhotoError(null);
    const err = await deleteCarPhoto(photo.id, photo.storage_path, car.id);
    if (err) {
      setPhotoError(err);
    } else {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      if (coverPath === photo.storage_path) setCoverPath(null);
    }
    setWorking(false);
  }, [car.id, coverPath]);

  const handleAddPhotos = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setPhotoError(null);
    const supabase = createClient();
    const tempId = crypto.randomUUID();
    const uploaded: PhotoItem[] = [];

    for (const file of Array.from(files)) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp",
        });
        const webpFile = new File([compressed], `${crypto.randomUUID()}.webp`, { type: "image/webp" });
        const path = `${userId}/${tempId}/${webpFile.name}`;
        const { error } = await supabase.storage.from("car-photos").upload(path, webpFile);
        if (!error) uploaded.push({ id: crypto.randomUUID(), storage_path: path });
      } catch { /* skip */ }
    }

    if (uploaded.length > 0) {
      const err = await addPhotosToGallery(car.id, uploaded.map((p) => p.storage_path));
      if (err) {
        setPhotoError(err);
      } else {
        setPhotos((prev) => [...prev, ...uploaded]);
      }
    }

    setUploading(false);
  }, [car.id, userId]);

  const isPhotoBlocked = working || uploading;

  return (
    <div className="space-y-10 pb-24">
      {/* ── Details form ── */}
      <form action={action} className="space-y-6">
        <input type="hidden" name="car_id" value={car.id} />

        <section className="space-y-4">
          <h2 className="font-display font-bold text-lg">Car details</h2>

          {/* Model — read-only for catalog cars, editable for custom */}
          {car.model_id ? (
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Model</label>
              <p className="px-3 py-3 bg-card rounded-xl text-sm text-ink/60">
                {car.displayMake} {car.displayModel}
                {car.displayGeneration && (
                  <span className="text-ink/40 ml-1">{car.displayGeneration}</span>
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Make *</label>
                <input
                  name="custom_make"
                  required
                  defaultValue={car.custom_make ?? ""}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Model *</label>
                <input
                  name="custom_model"
                  required
                  defaultValue={car.custom_model ?? ""}
                  className="input-field w-full"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-ink/50 mb-1 block">Generation / trim</label>
                <input
                  name="custom_generation"
                  defaultValue={car.custom_generation ?? ""}
                  className="input-field w-full"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Year *</label>
              <input
                name="year"
                type="number"
                required
                defaultValue={car.year}
                min={1885}
                max={new Date().getFullYear() + 2}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Engine</label>
              <input
                name="engine"
                list="engine-options"
                defaultValue={car.engine ?? ""}
                placeholder="M20B25"
                className="input-field w-full"
              />
              {car.engines.length > 0 && (
                <datalist id="engine-options">
                  {car.engines.map((e) => <option key={e} value={e} />)}
                </datalist>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Transmission</label>
              <input
                name="transmission"
                defaultValue={car.transmission ?? ""}
                placeholder="5-speed manual"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Color</label>
              <input
                name="color"
                defaultValue={car.color ?? ""}
                placeholder="Dakar Yellow"
                className="input-field w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-ink/50 mb-1 block">Nickname</label>
            <input
              name="nickname"
              defaultValue={car.nickname ?? ""}
              placeholder="Project Potato"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="text-xs text-ink/50 mb-1 block">Location</label>
            <input
              name="location"
              defaultValue={car.location ?? ""}
              placeholder="Barcelona, Spain"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="text-xs text-ink/50 mb-2 block">Visibility</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  !isPrivate ? "bg-ink text-background border-ink" : "bg-card text-ink/50 border-card"
                }`}
              >
                <Globe size={13} />Public
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  isPrivate ? "bg-ink text-background border-ink" : "bg-card text-ink/50 border-card"
                }`}
              >
                <Lock size={13} />Private
              </button>
            </div>
            <input type="hidden" name="visibility" value={isPrivate ? "private" : "public"} />
          </div>
        </section>

        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange text-white font-display font-bold py-4 rounded-2xl text-base hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* ── Photos ── */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display font-bold text-lg">Photos</h2>
          <p className="text-xs text-ink/40 mt-0.5">
            Tap <Star size={10} className="inline" /> to set the cover photo.
          </p>
        </div>

        {photoError && <p className="text-sm text-red-500">{photoError}</p>}

        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => {
            const isCover = coverPath === photo.storage_path;
            return (
              <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl(supabaseUrl, photo.storage_path)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {/* Cover badge */}
                {isCover && (
                  <span className="absolute top-1.5 left-1.5 bg-orange text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star size={8} fill="currentColor" />Cover
                  </span>
                )}
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5">
                  <button
                    type="button"
                    title="Set as cover"
                    disabled={isCover || isPhotoBlocked}
                    onClick={() => handleSetCover(photo.storage_path)}
                    className="bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white rounded-lg p-1.5 transition-colors"
                  >
                    <Star size={13} fill={isCover ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    title="Delete photo"
                    disabled={isPhotoBlocked}
                    onClick={() => handleDelete(photo)}
                    className="bg-white/20 hover:bg-red-500/70 disabled:opacity-40 text-white rounded-lg p-1.5 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add photos tile */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-ink/15 flex flex-col items-center justify-center gap-1 text-ink/30 hover:border-orange/40 hover:text-orange transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-ink/20 border-t-orange rounded-full animate-spin" />
            ) : (
              <>
                <Camera size={20} />
                <span className="text-[10px] font-medium">Add</span>
              </>
            )}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => handleAddPhotos(e.target.files)}
        />
      </section>

      {/* ── Danger zone ── */}
      <section className="border-t border-card pt-8">
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-400 hover:text-red-600 transition-colors"
          >
            Delete this car…
          </button>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 space-y-3">
            <p className="font-display font-bold text-sm text-red-700">
              Delete {car.displayMake} {car.displayModel}
              {car.displayGeneration ? ` ${car.displayGeneration}` : ""}?
            </p>
            <p className="text-xs text-red-600/70 leading-relaxed">
              All events and photos will be permanently deleted. This cannot be undone.
            </p>
            {deleteError && (
              <p className="text-xs text-red-600">{deleteError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleDeleteCar}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-display font-bold text-sm py-2.5 rounded-xl transition-colors"
              >
                {deleting ? "Deleting…" : "Yes, delete it"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-card text-ink/60 font-medium text-sm py-2.5 rounded-xl hover:bg-ink/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
