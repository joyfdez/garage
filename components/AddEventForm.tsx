"use client";

import { useActionState, useRef, useState } from "react";
import { X, Hammer, Wrench } from "lucide-react";
import { createEvent, EventState } from "@/lib/actions/event";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

interface UploadedPhoto {
  path: string;
  previewUrl: string;
}

type EventType = "build" | "fix";

export function AddEventForm({
  carSlug,
  userId,
}: {
  carSlug: string;
  userId: string;
}) {
  const [state, action, pending] = useActionState<EventState, FormData>(
    createEvent,
    null
  );
  const [type, setType] = useState<EventType>("build");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    const supabase = createClient();
    const tempId = crypto.randomUUID();
    const uploaded: UploadedPhoto[] = [];
    let failed = 0;

    for (const file of Array.from(files)) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp",
        });
        const webpFile = new File(
          [compressed],
          `${crypto.randomUUID()}.webp`,
          { type: "image/webp" }
        );
        const path = `${userId}/${tempId}/${webpFile.name}`;
        const { error } = await supabase.storage
          .from("car-photos")
          .upload(path, webpFile);
        if (!error) {
          uploaded.push({ path, previewUrl: URL.createObjectURL(webpFile) });
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setPhotos((prev) => [...prev, ...uploaded]);
    if (failed > 0) {
      setUploadError(
        failed === files.length
          ? "Photos couldn't be uploaded — check your connection and try again."
          : `${failed} of ${files.length} photos failed to upload.`
      );
    }
    setUploading(false);
  }

  function removePhoto(path: string) {
    setPhotos((prev) => prev.filter((p) => p.path !== path));
  }

  return (
    <form action={action} className="space-y-6 pb-24">
      {/* Hidden fields */}
      <input type="hidden" name="car_slug" value={carSlug} />
      <input type="hidden" name="type" value={type} />
      {photos.map((p, i) => (
        <input
          key={p.path}
          type="hidden"
          name={i === 0 ? "cover_photo_path" : `photo_path_${i}`}
          value={p.path}
        />
      ))}

      {/* Type selector */}
      <div>
        <p className="text-xs text-ink/50 mb-2">What kind of update is this?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("build")}
            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-colors ${
              type === "build"
                ? "border-orange bg-orange/5 text-orange"
                : "border-card text-ink/40"
            }`}
          >
            <Hammer size={22} strokeWidth={type === "build" ? 2 : 1.5} />
            <span className="font-display font-bold text-sm">Build update</span>
            <span className="text-xs text-center leading-snug opacity-70 px-2">
              Mod, upgrade, or install
            </span>
          </button>
          <button
            type="button"
            onClick={() => setType("fix")}
            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-colors ${
              type === "fix"
                ? "border-ink bg-ink/5 text-ink"
                : "border-card text-ink/40"
            }`}
          >
            <Wrench size={22} strokeWidth={type === "fix" ? 2 : 1.5} />
            <span className="font-display font-bold text-sm">Fix / repair</span>
            <span className="text-xs text-center leading-snug opacity-70 px-2">
              Diagnosis, repair, service
            </span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Title *</label>
        <input
          name="title"
          required
          placeholder={
            type === "build"
              ? "Cold air intake install"
              : "Coolant leak — thermostat housing"
          }
          className="input-field w-full"
        />
      </div>

      {/* Build: description */}
      {type === "build" && (
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Description</label>
          <textarea
            name="description"
            rows={4}
            placeholder="What did you do? Why? Any notes for future reference…"
            className="input-field w-full resize-none"
          />
        </div>
      )}

      {/* Fix: structured fields */}
      {type === "fix" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Problem</label>
            <textarea
              name="problem"
              rows={2}
              placeholder="What was wrong? What symptoms did you notice?"
              className="input-field w-full resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Diagnosis</label>
            <textarea
              name="diagnosis"
              rows={2}
              placeholder="What caused it? How did you find the root cause?"
              className="input-field w-full resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Solution</label>
            <textarea
              name="solution"
              rows={2}
              placeholder="What did you do to fix it? Parts replaced, torque specs, tips…"
              className="input-field w-full resize-none"
            />
          </div>
        </div>
      )}

      {/* Date */}
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Date</label>
        <input
          name="event_date"
          type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
          className="input-field w-full"
        />
        <p className="text-xs text-ink/30 mt-1">
          You can backfill older events.
        </p>
      </div>

      {/* Photos */}
      <div>
        <p className="text-xs text-ink/50 mb-2">Photos (optional)</p>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {photos.map((p, i) => (
              <div
                key={p.path}
                className="relative w-20 h-20 rounded-lg overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] bg-orange text-white px-1 rounded font-medium">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(p.path)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-ink/20 rounded-xl text-sm text-ink/50 hover:border-orange/40 hover:text-orange transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "+ Add photos"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => handlePhotos(e.target.files)}
        />
        {uploadError && (
          <p className="text-xs text-red-500 mt-1.5">{uploadError}</p>
        )}
      </div>

      {/* Error */}
      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      {/* Submit */}
      <div className="fixed bottom-16 inset-x-0 px-4 md:static md:bottom-auto md:px-0">
        <button
          type="submit"
          disabled={pending || uploading}
          className="w-full bg-orange text-white font-display font-bold py-4 rounded-2xl text-base hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Post update"}
        </button>
      </div>
    </form>
  );
}
