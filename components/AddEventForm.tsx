"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Hammer, Wrench, Tag, Eye, EyeOff, DollarSign } from "lucide-react";
import { createEvent, EventState } from "@/lib/actions/event";
import { markAsSold, CarState } from "@/lib/actions/car";
import { CURRENCIES } from "@/lib/car-options";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

interface UploadedPhoto {
  path: string;
  previewUrl: string;
}

type EventType = "build" | "fix" | "sold";

function parseDigits(val: string) { return val.replace(/[^0-9]/g, ""); }
function formatInt(raw: string) {
  const n = parseInt(raw, 10);
  return raw && !isNaN(n) ? n.toLocaleString("en-US") : "";
}

export function AddEventForm({
  carSlug,
  carId,
  userId,
  preferredUnit = "km",
  carCurrency = "EUR",
  purchaseCurrency = "EUR",
  initialType,
  isSold = false,
}: {
  carSlug: string;
  carId: string;
  userId: string;
  preferredUnit?: "km" | "mi";
  carCurrency?: string;
  purchaseCurrency?: string;
  initialType?: EventType;
  isSold?: boolean;
}) {
  const [eventState, eventAction, eventPending] = useActionState<EventState, FormData>(createEvent, null);
  const [soldState, soldAction, soldPending] = useActionState<CarState, FormData>(markAsSold, null);
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [type, setType] = useState<EventType>(initialType ?? "build");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [salePhotos, setSalePhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const saleFileRef = useRef<HTMLInputElement>(null);
  const [mileageUnit, setMileageUnit] = useState<"km" | "mi">(preferredUnit);
  const [saleMileageUnit, setSaleMileageUnit] = useState<"km" | "mi">(preferredUnit);
  const [rawAmount, setRawAmount] = useState("");
  const [pricePublic, setPricePublic] = useState(false);
  const currencySymbol = CURRENCIES.find((c) => c.value === carCurrency)?.symbol ?? carCurrency;
  const saleLockedCurrency = purchaseCurrency || "EUR";

  useEffect(() => {
    if (eventState && "carSlug" in eventState) {
      setNavigating(true);
      toast.success("Update posted", { style: { borderLeft: "3px solid #1A3A2E" } });
      router.push(`/car/${eventState.carSlug}/events/${eventState.eventId}`);
    }
  }, [eventState, router]);

  useEffect(() => {
    if (soldState && "slug" in soldState) {
      setNavigating(true);
      toast.success("Marked as sold", { style: { borderLeft: "3px solid #1A3A2E" } });
      router.push(`/car/${soldState.slug}`);
    }
  }, [soldState, router]);

  async function handlePhotos(files: FileList | null, forSale = false) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    const supabase = createClient();
    const tempId = crypto.randomUUID();
    const uploaded: UploadedPhoto[] = [];
    let failed = 0;

    const filesToProcess = forSale ? [files[0]] : Array.from(files);

    for (const file of filesToProcess) {
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

    if (forSale) {
      setSalePhotos(uploaded.slice(0, 1));
    } else {
      setPhotos((prev) => [...prev, ...uploaded]);
    }
    if (failed > 0) {
      setUploadError(
        failed === files.length
          ? "Photo couldn't be uploaded — check your connection and try again."
          : `${failed} of ${files.length} photos failed to upload.`
      );
    }
    setUploading(false);
  }

  function removePhoto(path: string) {
    setPhotos((prev) => prev.filter((p) => p.path !== path));
  }

  const isSoldType = type === "sold";
  const pending = isSoldType ? soldPending : eventPending;
  const currentAction = isSoldType ? soldAction : eventAction;
  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={currentAction} className="space-y-6 pb-24">
      {/* Hidden fields — event flow */}
      {!isSoldType && (
        <>
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
        </>
      )}

      {/* Hidden fields — sold flow */}
      {isSoldType && (
        <>
          <input type="hidden" name="car_id" value={carId} />
          <input type="hidden" name="sale_price_public" value={String(pricePublic)} />
          {salePhotos[0] && (
            <input type="hidden" name="sale_photo_path" value={salePhotos[0].path} />
          )}
        </>
      )}

      {/* Type selector */}
      <div>
        <p className="text-xs text-ink/50 mb-2">What kind of update is this?</p>
        <div className={`grid gap-2 ${isSold ? "grid-cols-2" : "grid-cols-3"}`}>
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
            <span className="text-xs text-center leading-snug opacity-70 px-1">
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
            <span className="text-xs text-center leading-snug opacity-70 px-1">
              Diagnosis, repair, service
            </span>
          </button>
          {!isSold && (
            <button
              type="button"
              onClick={() => setType("sold")}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-colors ${
                type === "sold"
                  ? "border-[#FF5A1F] bg-[#FF5A1F]/5 text-[#FF5A1F]"
                  : "border-card text-ink/40"
              }`}
            >
              <Tag size={22} strokeWidth={type === "sold" ? 2 : 1.5} />
              <span className="font-display font-bold text-sm">Mark as sold</span>
              <span className="text-xs text-center leading-snug opacity-70 px-1">
                Record the handover
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Build / Fix fields ── */}
      {!isSoldType && (
        <>
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

          {/* Mileage */}
          <div>
            <label className="text-xs text-ink/50 mb-1 block">
              Odometer <span className="text-ink/30">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                name="mileage_value"
                type="number"
                min={1}
                max={9999999}
                placeholder="85000"
                className="input-field flex-1"
              />
              <div className="flex rounded-xl overflow-hidden border border-card text-sm font-medium">
                {(["km", "mi"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setMileageUnit(u)}
                    className={`px-3 py-3 transition-colors ${
                      mileageUnit === u
                        ? "bg-ink text-paper"
                        : "bg-card text-ink/50 hover:bg-ink/10"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
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
                className={`input-field w-full ${currencySymbol.length === 1 ? "pl-8" : "pl-12"}`}
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
              defaultValue={today}
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
                      <span className="absolute top-1 left-1 text-[9px] bg-racing-green text-white px-1 rounded font-medium">
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
            {uploadError && (
              <p className="text-xs text-red-500 mt-1.5">{uploadError}</p>
            )}
          </div>
        </>
      )}

      {/* ── Sold fields ── */}
      {isSoldType && (
        <>
          {/* Sale date */}
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Sale date *</label>
            <input
              name="sale_date"
              type="date"
              required
              defaultValue={today}
              max={today}
              className="input-field w-full"
            />
          </div>

          {/* Mileage at sale */}
          <div>
            <label className="text-xs text-ink/50 mb-1 block">
              Odometer at sale <span className="text-ink/30">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                name="sale_mileage_value"
                type="number"
                min={1}
                max={9999999}
                placeholder="120000"
                className="input-field flex-1"
              />
              <div className="flex rounded-xl overflow-hidden border border-card text-sm font-medium">
                {(["km", "mi"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setSaleMileageUnit(u)}
                    className={`px-3 py-3 transition-colors ${
                      saleMileageUnit === u
                        ? "bg-ink text-paper"
                        : "bg-card text-ink/50 hover:bg-ink/10"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <input type="hidden" name="sale_mileage_unit" value={saleMileageUnit} />
          </div>

          {/* Sale price */}
          <div className="space-y-2">
            <label className="text-xs text-ink/50 block">
              Sale price <span className="text-ink/30">(optional)</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
                <input
                  name="sale_price"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  className="input-field w-full pl-8"
                />
              </div>
              <div className="input-field w-24 flex items-center justify-center text-ink/50 text-sm select-none">
                {saleLockedCurrency}
              </div>
              <input type="hidden" name="currency" value={saleLockedCurrency} />
            </div>
            <button
              type="button"
              onClick={() => setPricePublic((v) => !v)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                pricePublic ? "text-racing-green" : "text-ink/40 hover:text-ink/60"
              }`}
            >
              {pricePublic ? <Eye size={12} /> : <EyeOff size={12} />}
              {pricePublic
                ? "Price visible on public car page"
                : "Price is private (only you see it)"}
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-ink/50 mb-1 block">
              Notes <span className="text-ink/30">(optional)</span>
            </label>
            <textarea
              name="sale_description"
              rows={4}
              placeholder="How did the sale go? Who was the buyer? Any thoughts on this chapter…"
              className="input-field w-full resize-none"
            />
          </div>

          {/* Sale photo */}
          <div>
            <p className="text-xs text-ink/50 mb-2">
              Photo <span className="text-ink/30">(optional)</span>
            </p>
            {salePhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {salePhotos.map((p) => (
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
                    <button
                      type="button"
                      onClick={() => setSalePhotos([])}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {salePhotos.length === 0 && (
              <button
                type="button"
                onClick={() => saleFileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-ink/20 rounded-xl text-sm text-ink/50 hover:border-[#FF5A1F]/40 hover:text-[#FF5A1F] transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "+ Add photo"}
              </button>
            )}
            <input
              ref={saleFileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handlePhotos(e.target.files, true)}
            />
            {uploadError && (
              <p className="text-xs text-red-500 mt-1.5">{uploadError}</p>
            )}
          </div>
        </>
      )}

      {/* Errors */}
      {!isSoldType && eventState && "error" in eventState && (
        <p className="text-sm text-red-500">{eventState.error}</p>
      )}
      {isSoldType && soldState && "error" in soldState && (
        <p className="text-sm text-red-500">{soldState.error}</p>
      )}

      {/* Submit */}
      <div className="fixed bottom-16 inset-x-0 px-4 md:static md:bottom-auto md:px-0">
        <button
          type="submit"
          disabled={pending || navigating || uploading}
          className="w-full bg-ink text-paper font-display font-bold py-4 rounded-2xl text-base hover:bg-ink/85 transition-colors disabled:opacity-50"
        >
          {pending || navigating
            ? "Saving…"
            : isSoldType
            ? "Mark as sold"
            : "Post update"}
        </button>
      </div>
    </form>
  );
}
