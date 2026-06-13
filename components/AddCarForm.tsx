"use client";

import {
  useActionState, useRef, useState, useCallback, useEffect,
} from "react";
import { Search, ChevronDown, Lock, Globe, X, Check, ChevronRight, Eye, EyeOff, DollarSign } from "lucide-react";
import { createCar, CarState } from "@/lib/actions/car";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { BrowsePicker, CarModel, yearLabel } from "@/components/BrowsePicker";

interface UploadedPhoto {
  path: string;
  previewUrl: string;
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function AddCarForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<CarState, FormData>(createCar, null);

  // Shared model state — set by either search or browse
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [manualMode, setManualMode] = useState(false);

  // Search path
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CarModel[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isPrivate, setIsPrivate] = useState(false);
  const [purchasePricePublic, setPurchasePricePublic] = useState(false);
  const [currency, setCurrency] = useState("EUR");

  const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY"];
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const search = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) { setSearchResults([]); return; }
      const res = await fetch(`/api/car-models?q=${encodeURIComponent(q)}`);
      if (res.ok) setSearchResults(await res.json());
    }, 300),
    []
  );

  useEffect(() => { search(query); }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectFromSearch(m: CarModel) {
    setSelectedModel(m);
    setQuery(`${m.make} ${m.model} ${m.generation}`);
    setSearchResults([]);
    setShowDropdown(false);
  }

  function clearSelection() {
    setSelectedModel(null);
    setQuery("");
    setSearchResults([]);
  }

  async function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    const tempId = crypto.randomUUID();
    const uploaded: UploadedPhoto[] = [];
    for (const file of Array.from(files)) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true, fileType: "image/webp",
        });
        const webpFile = new File([compressed], `${crypto.randomUUID()}.webp`, { type: "image/webp" });
        const path = `${userId}/${tempId}/${webpFile.name}`;
        const { error } = await supabase.storage.from("car-photos").upload(path, webpFile);
        if (!error) uploaded.push({ path, previewUrl: URL.createObjectURL(webpFile) });
      } catch { /* skip */ }
    }
    setPhotos((prev) => [...prev, ...uploaded]);
    setUploading(false);
  }

  function removePhoto(path: string) {
    setPhotos((prev) => prev.filter((p) => p.path !== path));
  }

  const displayMake = selectedModel?.make ?? "";
  const displayModel = selectedModel ? `${selectedModel.model} ${selectedModel.generation}` : "";

  return (
    <form action={action} className="space-y-8 pb-24">
      {/* Hidden model fields */}
      <input type="hidden" name="model_id" value={selectedModel?.id ?? ""} />
      <input type="hidden" name="display_make" value={displayMake} />
      <input type="hidden" name="display_model" value={displayModel} />
      {photos.map((p, i) => (
        <input key={p.path} type="hidden"
          name={i === 0 ? "cover_photo_path" : `photo_path_${i}`}
          value={p.path} />
      ))}

      {/* ── Section 1: Find your car ── */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-lg">Find your car</h2>

        {/* Selected model confirmation banner */}
        {selectedModel && !manualMode && (
          <div className="flex items-center justify-between bg-orange/8 border border-orange/20 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <Check size={15} className="text-orange flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm leading-tight truncate">
                  {selectedModel.make} {selectedModel.model} {selectedModel.generation}
                </p>
                <p className="text-xs text-ink/40">{yearLabel(selectedModel)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="text-ink/30 hover:text-ink/60 ml-3 flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {!manualMode && (
          <>
            {/* Path A: Smart search */}
            <div ref={dropdownRef} className="relative">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Type chassis code, model name… (E30, Miata, GTI)"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) clearSelection();
                  }}
                  onFocus={() => { if (query.length >= 2) setShowDropdown(true); }}
                  className="w-full pl-9 pr-9 py-3 bg-card rounded-xl text-sm placeholder:text-ink/30 outline-none focus:ring-2 focus:ring-orange/40"
                  autoComplete="off"
                />
                {query && (
                  <button type="button" onClick={clearSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60">
                    <X size={14} />
                  </button>
                )}
              </div>

              {showDropdown && searchResults.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-card rounded-xl shadow-lg overflow-hidden">
                  {searchResults.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onMouseDown={() => selectFromSearch(m)}
                        className="w-full text-left px-4 py-3 hover:bg-background text-sm flex items-center justify-between gap-3"
                      >
                        <span>
                          <span className="font-medium">{m.make} {m.model} {m.generation}</span>
                          {m.chassis_code && m.chassis_code !== m.generation && (
                            <span className="text-ink/40 ml-1">({m.chassis_code})</span>
                          )}
                        </span>
                        <span className="text-ink/35 text-xs flex-shrink-0 flex items-center gap-1">
                          {yearLabel(m)}
                          <ChevronRight size={11} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-card" />
              <span className="text-xs text-ink/30">or browse by make</span>
              <div className="flex-1 h-px bg-card" />
            </div>

            {/* Path B: Cascading picker */}
            <BrowsePicker
              onSelect={(m) => { setSelectedModel(m); setQuery(""); }}
              disabled={!!selectedModel}
            />

            {/* Manual fallback */}
            <button
              type="button"
              onClick={() => { setManualMode(true); clearSelection(); }}
              className="text-sm text-ink/40 underline underline-offset-2 hover:text-ink/70"
            >
              Can't find it? Add it manually
            </button>
          </>
        )}

        {/* Manual entry */}
        {manualMode && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Make *</label>
                <input name="custom_make" required placeholder="Alfa Romeo" className="input-field w-full" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Model *</label>
                <input name="custom_model" required placeholder="GTV" className="input-field w-full" />
              </div>
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Generation / trim</label>
              <input name="custom_generation" placeholder="916 Series" className="input-field w-full" />
            </div>
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="text-sm text-ink/40 underline underline-offset-2 hover:text-ink/70"
            >
              Search catalog instead
            </button>
          </div>
        )}
      </section>

      {/* ── Section 2: Details ── */}
      <section>
        <h2 className="font-display font-bold text-lg mb-4">Details</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Year *</label>
              <input
                name="year"
                type="number"
                required
                placeholder="1992"
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
                placeholder={selectedModel?.engines[0] ?? "M20B25"}
                className="input-field w-full"
              />
              {selectedModel && selectedModel.engines.length > 0 && (
                <datalist id="engine-options">
                  {selectedModel.engines.map((e) => (
                    <option key={e} value={e} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Transmission</label>
              <input name="transmission" placeholder="5-speed manual" className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Color</label>
              <input name="color" placeholder="Dakar Yellow" className="input-field w-full" />
            </div>
          </div>

          <div>
            <label className="text-xs text-ink/50 mb-1 block">Nickname</label>
            <input name="nickname" placeholder="Project Potato" className="input-field w-full" />
          </div>

          <div>
            <label className="text-xs text-ink/50 mb-1 block">Location</label>
            <input name="location" placeholder="Barcelona, Spain" className="input-field w-full" />
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
        </div>
      </section>

      {/* ── Section 3: Photos ── */}
      <section>
        <h2 className="font-display font-bold text-lg mb-1">Photos</h2>
        <p className="text-ink/40 text-xs mb-4">First photo becomes the cover. Optional.</p>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {photos.map((p, i) => (
              <div key={p.path} className="relative w-20 h-20 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] bg-orange text-white px-1 rounded font-medium">Cover</span>
                )}
                <button type="button" onClick={() => removePhoto(p.path)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white">
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
        <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only"
          onChange={(e) => handlePhotos(e.target.files)} />
      </section>

      {/* ── Section 4: Purchase details ── */}
      <section>
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-1.5 text-sm text-ink/40 hover:text-ink/70 list-none">
            <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
            Purchase details (optional)
          </summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Purchase date</label>
                <input name="purchase_date" type="date" className="input-field w-full" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Price paid</label>
                <div className="relative">
                  <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
                  <input name="purchase_price" type="number" min={0} step="any" placeholder="0"
                    className="input-field w-full pl-7" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field w-24"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setPurchasePricePublic((v) => !v)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  purchasePricePublic ? "text-orange" : "text-ink/40 hover:text-ink/60"
                }`}
              >
                {purchasePricePublic ? <Eye size={12} /> : <EyeOff size={12} />}
                {purchasePricePublic ? "Price visible publicly" : "Price is private"}
              </button>
            </div>
            <input type="hidden" name="purchase_price_public" value={String(purchasePricePublic)} />
          </div>
        </details>
      </section>

      {/* ── Section 5: VIN ── */}
      <section>
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-1.5 text-sm text-ink/40 hover:text-ink/70 list-none">
            <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
            VIN (optional, always private)
          </summary>
          <div className="mt-3">
            <input name="vin" placeholder="WBA…" maxLength={17}
              className="input-field w-full font-mono tracking-wider uppercase"
              onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }} />
            <p className="text-xs text-ink/30 mt-1 flex items-center gap-1">
              <Lock size={10} />Never shown publicly
            </p>
          </div>
        </details>
      </section>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

      <div className="fixed bottom-16 inset-x-0 px-4 md:static md:bottom-auto md:px-0">
        <button
          type="submit"
          disabled={pending || uploading}
          className="w-full bg-orange text-white font-display font-bold py-4 rounded-2xl text-base hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add to garage"}
        </button>
      </div>
    </form>
  );
}
