"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { updateSaleDetails, CarState } from "@/lib/actions/car";
import { CURRENCIES } from "@/lib/car-options";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

function parseDigits(val: string) { return val.replace(/[^0-9]/g, ""); }
function formatInt(raw: string) {
  const n = parseInt(raw, 10);
  return raw && !isNaN(n) ? n.toLocaleString("en-US") : "";
}

interface UploadedPhoto {
  path: string;
  previewUrl: string;
}

export function EditSaleForm({
  carId,
  carName,
  userId,
  saleDate: initialSaleDate,
  salePrice: initialSalePrice,
  salePricePublic: initialSalePricePublic,
  currency: initialCurrency,
  saleMileageValue: initialSaleMileageValue,
  saleMileageUnit: initialSaleMileageUnit,
  saleDescription: initialSaleDescription,
  salePhotoPath: initialSalePhotoPath,
  supabaseUrl,
  preferredUnit = "km",
}: {
  carId: string;
  carName: string;
  userId: string;
  saleDate: string | null;
  salePrice: number | null;
  salePricePublic: boolean;
  currency: string;
  saleMileageValue: number | null;
  saleMileageUnit: string | null;
  saleDescription: string | null;
  salePhotoPath: string | null;
  supabaseUrl: string;
  preferredUnit?: "km" | "mi";
}) {
  const [state, action, pending] = useActionState<CarState, FormData>(updateSaleDetails, null);
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [pricePublic, setPricePublic] = useState(initialSalePricePublic);
  const [currency, setCurrency] = useState(initialCurrency || "EUR");
  const [rawPrice, setRawPrice] = useState(
    initialSalePrice != null ? String(Math.round(initialSalePrice)) : ""
  );
  const [rawMileage, setRawMileage] = useState(
    initialSaleMileageValue != null ? String(initialSaleMileageValue) : ""
  );
  const [saleMileageUnit, setSaleMileageUnit] = useState<"km" | "mi">(
    (initialSaleMileageUnit as "km" | "mi") ?? preferredUnit
  );
  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(initialSalePhotoPath);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const currencySymbol = CURRENCIES.find((c) => c.value === currency)?.symbol ?? currency;

  const currentPhotoPath = photo?.path ?? existingPhotoPath ?? null;
  const currentPhotoUrl = photo
    ? photo.previewUrl
    : existingPhotoPath
    ? `${supabaseUrl}/storage/v1/object/public/car-photos/${existingPhotoPath}`
    : null;

  useEffect(() => {
    if (!state) return;
    if ("slug" in state) {
      setNavigating(true);
      toast.success("Sale details updated");
      router.push(`/car/${state.slug}`);
    } else if ("error" in state) {
      toast.error(state.error);
    }
  }, [state, router]);

  async function handlePhoto(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    const supabase = createClient();
    const tempId = crypto.randomUUID();

    try {
      const compressed = await imageCompression(files[0], {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
      });
      const webpFile = new File([compressed], `${crypto.randomUUID()}.webp`, { type: "image/webp" });
      const path = `${userId}/${tempId}/${webpFile.name}`;
      const { error } = await supabase.storage.from("car-photos").upload(path, webpFile);
      if (!error) {
        setPhoto({ path, previewUrl: URL.createObjectURL(webpFile) });
        setExistingPhotoPath(null);
      } else {
        setUploadError("Photo couldn't be uploaded — check your connection and try again.");
      }
    } catch {
      setUploadError("Photo couldn't be uploaded — check your connection and try again.");
    }
    setUploading(false);
  }

  function removePhoto() {
    setPhoto(null);
    setExistingPhotoPath(null);
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="car_id" value={carId} />
      <input type="hidden" name="sale_price_public" value={String(pricePublic)} />
      <input type="hidden" name="sale_photo_path" value={currentPhotoPath ?? ""} />

      <div>
        <label className="text-xs text-ink/50 mb-1 block">Sale date *</label>
        <input
          name="sale_date"
          type="date"
          required
          defaultValue={initialSaleDate ?? ""}
          className="input-field w-full"
        />
      </div>

      <div>
        <label className="text-xs text-ink/50 mb-1 block">Odometer at sale</label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={formatInt(rawMileage)}
            onChange={(e) => setRawMileage(parseDigits(e.target.value))}
            placeholder="120,000"
            className="input-field flex-1"
          />
          <div className="flex rounded-xl overflow-hidden border border-card text-sm font-medium">
            {(["km", "mi"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setSaleMileageUnit(u)}
                className={`px-3 py-3 transition-colors ${
                  saleMileageUnit === u ? "bg-ink text-paper" : "bg-card text-ink/50 hover:bg-ink/10"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <input type="hidden" name="sale_mileage_value" value={rawMileage} />
        <input type="hidden" name="sale_mileage_unit" value={saleMileageUnit} />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-ink/50 block">Sale price</label>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-field appearance-none pr-7 pl-3"
            >
              {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink/30 pointer-events-none select-none">
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={formatInt(rawPrice)}
              onChange={(e) => setRawPrice(parseDigits(e.target.value))}
              placeholder="0"
              className={`input-field w-full ${currencySymbol.length === 1 ? "pl-9" : "pl-12"}`}
            />
          </div>
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="sale_price" value={rawPrice} />
        </div>

        <button
          type="button"
          onClick={() => setPricePublic((v) => !v)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            pricePublic ? "text-racing-green" : "text-ink/40 hover:text-ink/60"
          }`}
        >
          {pricePublic ? <Eye size={12} /> : <EyeOff size={12} />}
          {pricePublic ? "Price visible on public car page" : "Price is private (only you see it)"}
        </button>
      </div>

      <div>
        <label className="text-xs text-ink/50 mb-1 block">
          Notes <span className="text-ink/30">(optional)</span>
        </label>
        <textarea
          name="sale_description"
          rows={4}
          defaultValue={initialSaleDescription ?? ""}
          placeholder="How did the sale go? Who was the buyer? Any thoughts on this chapter…"
          className="input-field w-full resize-none"
        />
      </div>

      <div>
        <p className="text-xs text-ink/50 mb-2">
          Photo <span className="text-ink/30">(optional)</span>
        </p>
        {currentPhotoUrl && (
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentPhotoUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"
              >
                <X size={10} />
              </button>
            </div>
          </div>
        )}
        {!currentPhotoUrl && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-ink/20 rounded-xl text-sm text-ink/50 hover:border-[#FF5A1F]/40 hover:text-[#FF5A1F] transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "+ Add photo"}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handlePhoto(e.target.files)}
        />
        {uploadError && <p className="text-xs text-red-500 mt-1.5">{uploadError}</p>}
      </div>

      {state && "error" in state && <p className="text-sm text-red-500">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || navigating || uploading}
        className="w-full bg-ink text-paper font-display font-bold py-4 rounded-2xl text-base hover:bg-ink/80 transition-colors disabled:opacity-50"
      >
        {pending || navigating ? "Saving…" : "Save sale details"}
      </button>
    </form>
  );
}
