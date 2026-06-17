"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Hammer, Wrench } from "lucide-react";
import { updateEvent, EventState } from "@/lib/actions/event";
import { CURRENCIES } from "@/lib/car-options";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

interface UploadedPhoto {
  path: string;
  previewUrl: string;
}

interface ExistingPhoto {
  id: string;
  storage_path: string;
}

type EventType = "build" | "fix";

function parseDigits(val: string) { return val.replace(/[^0-9]/g, ""); }
function formatInt(raw: string) {
  const n = parseInt(raw, 10);
  return raw && !isNaN(n) ? n.toLocaleString("en-US") : "";
}

export function EditEventForm({
  event,
  carSlug,
  carCurrency = "EUR",
  photos: initialPhotos,
  userId,
  preferredUnit = "km",
  supabaseUrl,
}: {
  event: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    details: { problem?: string; diagnosis?: string; solution?: string } | null;
    event_date: string;
    mileage_value: number | null;
    mileage_unit: string | null;
    amount: number | null;
  };
  carSlug: string;
  carCurrency?: string;
  photos: ExistingPhoto[];
  userId: string;
  preferredUnit?: "km" | "mi";
  supabaseUrl: string;
}) {
  const [state, action, pending] = useActionState<EventState, FormData>(updateEvent, null);
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [type, setType] = useState<EventType>((event.type as EventType) ?? "build");
  const [mileageUnit, setMileageUnit] = useState<"km" | "mi">(
    (event.mileage_unit as "km" | "mi") ?? preferredUnit
  );
  const [rawMileage, setRawMileage] = useState(
    event.mileage_value != null ? String(event.mileage_value) : ""
  );
  const [rawAmount, setRawAmount] = useState(
    event.amount != null ? String(Math.round(event.amount)) : ""
  );
  const currencySymbol = CURRENCIES.find((c) => c.value === carCurrency)?.symbol ?? carCurrency;

  // Photo state
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(initialPhotos);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state && "carSlug" in state) {
      setNavigating(true);
      toast.success("Event updated", { style: { borderLeft: "3px solid #1A3A2E" } });
      router.push(`/car/${state.carSlug}/events/${state.eventId}`);
    }
  }, [state, router]);

  function removeExistingPhoto(id: string) {
    setExistingPhotos((prev) => prev.filter((p) => p.id !== id));
    setRemovedPhotoIds((prev) => [...prev, id]);
  }

  function removeNewPhoto(path: string) {
    setNewPhotos((prev) => prev.filter((p) => p.path !== path));
  }

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
        const webpFile = new File([compressed], `${crypto.randomUUID()}.webp`, { type: "image/webp" });
        const path = `${userId}/${tempId}/${webpFile.name}`;
        const { error } = await supabase.storage.from("car-photos").upload(path, webpFile);
        if (!error) uploaded.push({ path, previewUrl: URL.createObjectURL(webpFile) });
        else failed++;
      } catch {
        failed++;
      }
    }

    setNewPhotos((prev) => [...prev, ...uploaded]);
    if (failed > 0) {
      setUploadError(
        failed === files.length
          ? "Photos couldn't be uploaded — check your connection and try again."
          : `${failed} of ${files.length} photos failed to upload.`
      );
    }
    setUploading(false);
  }

  const allPhotoCount = existingPhotos.length + newPhotos.length;

  return (
    <form action={action} className="space-y-6 pb-24">
      <input type="hidden" name="event_id" value={event.id} />
      <input type="hidden" name="car_slug" value={carSlug} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="deleted_photo_ids" value={removedPhotoIds.join(",")} />
      {newPhotos.map((p, i) => (
        <input key={p.path} type="hidden" name={`photo_path_${i + 1}`} value={p.path} />
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
                ? "border-racing-green bg-racing-green/5 text-racing-green"
                : "border-card text-ink/40"
            }`}
          >
            <Hammer size={22} strokeWidth={type === "build" ? 2 : 1.5} />
            <span className="font-display font-bold text-sm">Build update</span>
            <span className="text-xs text-center leading-snug opacity-70 px-2">Mod, upgrade, or install</span>
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
            <span className="text-xs text-center leading-snug opacity-70 px-2">Diagnosis, repair, service</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Title *</label>
        <input
          name="title"
          required
          defaultValue={event.title}
          placeholder={type === "build" ? "Cold air intake install" : "Coolant leak — thermostat housing"}
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
            defaultValue={event.description ?? ""}
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
              defaultValue={event.details?.problem ?? ""}
              placeholder="What was wrong? What symptoms did you notice?"
              className="input-field w-full resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Diagnosis</label>
            <textarea
              name="diagnosis"
              rows={2}
              defaultValue={event.details?.diagnosis ?? ""}
              placeholder="What caused it? How did you find the root cause?"
              className="input-field w-full resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Solution</label>
            <textarea
              name="solution"
              rows={2}
              defaultValue={event.details?.solution ?? ""}
              placeholder="What did you do to fix it? Parts replaced, torque specs, tips…"
              className="input-field w-full resize-none"
            />
          </div>
        </div>
      )}

      {/* Mileage */}
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Odometer</label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={formatInt(rawMileage)}
            onChange={(e) => setRawMileage(parseDigits(e.target.value))}
            placeholder="85,000"
            className="input-field flex-1"
          />
          <div className="flex rounded-xl overflow-hidden border border-card text-sm font-medium">
            {(["km", "mi"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setMileageUnit(u)}
                className={`px-3 py-3 transition-colors ${
                  mileageUnit === u ? "bg-ink text-paper" : "bg-card text-ink/50 hover:bg-ink/10"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <input type="hidden" name="mileage_value" value={rawMileage} />
        <input type="hidden" name="mileage_unit" value={mileageUnit} />
      </div>

      {/* Amount spent */}
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Amount spent</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink/30 pointer-events-none select-none">
            {currencySymbol}
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={formatInt(rawAmount)}
            onChange={(e) => setRawAmount(parseDigits(e.target.value))}
            placeholder="0"
            className="input-field w-full pl-8"
          />
        </div>
        <input type="hidden" name="amount" value={rawAmount} />
      </div>

      {/* Date */}
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Date</label>
        <input
          name="event_date"
          type="date"
          defaultValue={event.event_date}
          className="input-field w-full"
        />
      </div>

      {/* Photos */}
      <div>
        <p className="text-xs text-ink/50 mb-2">Photos</p>
        {allPhotoCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {existingPhotos.map((p, i) => (
              <div key={p.id} className="relative w-20 h-20 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${supabaseUrl}/storage/v1/object/public/car-photos/${p.storage_path}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {i === 0 && newPhotos.length === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] bg-racing-green text-white px-1 rounded font-medium">Cover</span>
                )}
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(p.id)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {newPhotos.map((p, i) => (
              <div key={p.path} className="relative w-20 h-20 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                {existingPhotos.length === 0 && i === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] bg-racing-green text-white px-1 rounded font-medium">Cover</span>
                )}
                <button
                  type="button"
                  onClick={() => removeNewPhoto(p.path)}
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
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-ink/20 rounded-xl text-sm text-ink/50 hover:border-racing-green/40 hover:text-racing-green transition-colors disabled:opacity-50"
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
        {uploadError && <p className="text-xs text-red-500 mt-1.5">{uploadError}</p>}
      </div>

      {state && "error" in state && <p className="text-sm text-red-500">{state.error}</p>}

      <div className="fixed bottom-16 inset-x-0 px-4 md:static md:bottom-auto md:px-0">
        <button
          type="submit"
          disabled={pending || navigating || uploading}
          className="w-full bg-ink text-paper font-display font-bold py-4 rounded-2xl text-base hover:bg-ink/85 transition-colors disabled:opacity-50"
        >
          {pending || navigating ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
