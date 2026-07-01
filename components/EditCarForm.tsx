"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Globe, Lock, Star, X, Camera, ChevronDown, Calendar, Search, Check, ChevronRight, ArrowLeft } from "lucide-react";
import { ColorPicker } from "@/components/ColorPicker";
import { toast } from "@/lib/toast";
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
import { type CarModel, yearLabel } from "@/components/BrowsePicker";
import { debounce } from "@/lib/utils/debounce";
import { useFormGuard, confirmDiscard } from "@/lib/hooks/useFormGuard";
import {
  FUEL_OPTIONS, DRIVETRAIN_OPTIONS, BODY_TYPE_OPTIONS, TRANSMISSION_OPTIONS,
  CURRENCIES, YEAR_OPTIONS,
} from "@/lib/car-options";

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
  catalogModel?: CarModel | null;
  fuel: string | null;
  drivetrain: string | null;
  horsepower: number | null;
  body_type: string | null;
  color_base: string | null;
  trim: string | null;
  // Ownership / purchase fields
  ownershipId?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  purchasePricePublic?: boolean;
  purchaseCurrency?: string;
  purchaseMileageValue?: number | null;
  purchaseMileageUnit?: string | null;
  preferredUnit?: "km" | "mi";
}

export interface PhotoItem {
  id: string;
  storage_path: string;
}

// ── Inline cascade picker (same as AddCarForm) ───────────────────────────────
function CascadePicker({
  onResolve,
}: {
  onResolve: (model: CarModel, year: string) => void;
}) {
  const [makes, setMakes]             = useState<string[]>([]);
  const [cMake, setCMake]             = useState("");
  const [cModels, setCModels]         = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [cModel, setCModel]           = useState("");
  const [generations, setGens]        = useState<CarModel[] | null>(null);
  const [fetching, setFetching]       = useState(false);
  const [pickIdx, setPickIdx]         = useState(0);

  const onResolveRef = useRef(onResolve);
  onResolveRef.current = onResolve;

  useEffect(() => {
    fetch("/api/car-models/makes").then((r) => r.json()).then(setMakes).catch(() => {});
  }, []);

  useEffect(() => {
    setCModel("");
    setCModels([]);
    setGens(null);
    if (!cMake) { setLoadingModels(false); return; }
    setLoadingModels(true);
    fetch(`/api/car-models/models?make=${encodeURIComponent(cMake)}`)
      .then((r) => r.json())
      .then(setCModels)
      .catch(() => {})
      .finally(() => setLoadingModels(false));
  }, [cMake]);

  useEffect(() => {
    setGens(null);
    setPickIdx(0);
    if (!cMake || !cModel) return;
    setFetching(true);
    fetch(
      `/api/car-models/generations?make=${encodeURIComponent(cMake)}&model=${encodeURIComponent(cModel)}`
    )
      .then((r) => r.json())
      .then((data: CarModel[]) => {
        setGens(data);
        if (data.length === 1) {
          onResolveRef.current(data[0], String(data[0].year_start));
        }
      })
      .catch(() => setGens([]))
      .finally(() => setFetching(false));
  }, [cMake, cModel]);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Make</label>
        <div className="relative">
          <select
            value={cMake}
            onChange={(e) => setCMake(e.target.value)}
            className="input-field w-full appearance-none pr-8"
          >
            <option value="">Select make…</option>
            {makes.map((mk) => <option key={mk} value={mk}>{mk}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
        </div>
      </div>

      {cMake && (
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Model</label>
          <div className="relative">
            <select
              value={cModel}
              onChange={(e) => setCModel(e.target.value)}
              disabled={loadingModels}
              className="input-field w-full appearance-none pr-8 disabled:opacity-50"
            >
              {loadingModels ? (
                <option value="">Loading models…</option>
              ) : (
                <>
                  <option value="">Select model…</option>
                  {cModels.map((mo) => <option key={mo} value={mo}>{mo}</option>)}
                </>
              )}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
          </div>
        </div>
      )}

      {cMake && cModel && (
        <>
          {fetching && <p className="text-xs text-ink/40">Loading generations…</p>}

          {!fetching && generations !== null && generations.length === 0 && (
            <p className="text-xs text-red-400">
              {cMake} {cModel} isn&apos;t in the catalog. Use &ldquo;Add it manually&rdquo; below.
            </p>
          )}

          {!fetching && generations !== null && generations.length > 1 && (
            <div>
              <p className="text-xs text-ink/50 mb-2">Pick your generation:</p>
              <div className="space-y-1.5">
                {generations.map((g, i) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setPickIdx(i);
                      onResolveRef.current(g, String(g.year_start));
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      pickIdx === i
                        ? "border-racing-green bg-racing-green/5 text-racing-green"
                        : "border-card text-ink/60 hover:border-ink/20"
                    }`}
                  >
                    <span className="font-medium">
                      {g.generation}
                      {g.chassis_code && g.chassis_code !== g.generation && (
                        <span className="text-ink/40 font-normal ml-1.5">({g.chassis_code})</span>
                      )}
                    </span>
                    <span className="text-xs text-ink/40">{yearLabel(g)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function photoUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/car-photos/${path}`;
}

export function EditCarForm({
  car,
  photos: initialPhotos,
  supabaseUrl,
  userId,
  backHref,
}: {
  car: CarForEdit;
  photos: PhotoItem[];
  supabaseUrl: string;
  userId: string;
  backHref: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<CarState, FormData>(updateCar, null);
  const [navigating, setNavigating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  useFormGuard(isDirty);
  const [isPrivate, setIsPrivate] = useState(car.visibility === "private");
  const [purchasePricePublic, setPurchasePricePublic] = useState(car.purchasePricePublic ?? false);
  const [purchaseMileageUnit, setPurchaseMileageUnit] = useState<"km" | "mi">(
    (car.purchaseMileageUnit as "km" | "mi") ?? car.preferredUnit ?? "km"
  );
  const [year, setYear] = useState(String(car.year));
  const [currency, setCurrency] = useState(car.purchaseCurrency ?? "EUR");
  const [rawPrice, setRawPrice] = useState(
    car.purchasePrice != null ? String(Math.round(car.purchasePrice)) : ""
  );
  const [rawMileage, setRawMileage] = useState(
    car.purchaseMileageValue != null ? String(car.purchaseMileageValue) : ""
  );
  const currencySymbol = CURRENCIES.find((c) => c.value === currency)?.symbol ?? currency;
  const [colorBase, setColorBase] = useState<string | null>(car.color_base ?? null);

  // Model picker state
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(car.catalogModel ?? null);
  const [manualMode, setManualMode] = useState(!car.model_id);
  const [cascadeKey, setCascadeKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CarModel[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) { setSearchResults([]); return; }
      try {
        const res = await fetch(`/api/car-models?q=${encodeURIComponent(q)}`);
        if (res.ok) setSearchResults(await res.json());
        else setSearchResults([]);
      } catch {
        setSearchResults([]);
      }
    }, 300),
    []
  );

  useEffect(() => { doSearch(searchQuery); }, [searchQuery, doSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleModelResolve = useCallback((model: CarModel, _year: string) => {
    setSelectedModel(model);
    setIsDirty(true);
  }, []);

  function handleSearchSelect(model: CarModel) {
    setSelectedModel(model);
    setSearchQuery("");
    setSearchResults([]);
    setIsDirty(true);
  }

  function handleClearModel() {
    setSelectedModel(null);
    setCascadeKey((k) => k + 1);
    setSearchQuery("");
    setSearchResults([]);
    setIsDirty(true);
  }

  function parseDigits(val: string) { return val.replace(/[^0-9]/g, ""); }
  function formatInt(raw: string) {
    const n = parseInt(raw, 10);
    return raw && !isNaN(n) ? n.toLocaleString("en-US") : "";
  }

  useEffect(() => {
    if (!state) return;
    if ("slug" in state) {
      setNavigating(true);
      toast.success("Changes saved");
      router.push(`/car/${state.slug}`);
    } else if ("error" in state) {
      toast.error(state.error);
    }
  }, [state, router]);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteCar() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const err = await deleteCar(car.id);
      if (err) {
        setDeleteError(err);
        setDeleting(false);
        return;
      }
      toast.success("Car deleted");
      router.push("/garage");
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
    }
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
        if (!error) uploaded.push({ id: crypto.randomUUID(), storage_path: path });
        else failed++;
      } catch {
        failed++;
      }
    }

    if (uploaded.length > 0) {
      const err = await addPhotosToGallery(car.id, uploaded.map((p) => p.storage_path));
      if (err) {
        setPhotoError(err);
      } else {
        setPhotos((prev) => [...prev, ...uploaded]);
      }
    }

    if (failed > 0) {
      setPhotoError(
        failed === files.length
          ? "Photos couldn't be uploaded — check your connection and try again."
          : `${failed} of ${files.length} photos failed to upload.`
      );
    }

    setUploading(false);
  }, [car.id, userId]);

  const isPhotoBlocked = working || uploading;

  return (
    <div className="space-y-10 pb-24">
      {/* ── Header with guarded back button ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => { if (confirmDiscard(isDirty)) router.push(backHref); }}
          className="text-ink/40 hover:text-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display font-bold text-xl">Edit car</h1>
      </div>

      {/* ── Details form ── */}
      <form action={action} className="space-y-6" onChange={() => setIsDirty(true)}>
        <input type="hidden" name="car_id" value={car.id} />

        <section className="space-y-4">
          <h2 className="font-display font-bold text-lg">Car details</h2>

          {/* Model — catalog picker, always editable */}
          <div className="space-y-3">
            <input type="hidden" name="model_id" value={selectedModel?.id ?? ""} />

            {/* ── Confirmed: catalog model selected ── */}
            {selectedModel && !manualMode && (
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Model</label>
                <div className="flex items-center justify-between bg-racing-green/8 border border-racing-green/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Check size={15} className="text-racing-green flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-tight">
                        {selectedModel.make} {selectedModel.model}{" "}
                        <span className="text-ink/60">{selectedModel.generation}</span>
                        {selectedModel.chassis_code && selectedModel.chassis_code !== selectedModel.generation && (
                          <span className="text-ink/40 font-normal ml-1">({selectedModel.chassis_code})</span>
                        )}
                      </p>
                      <p className="text-xs text-ink/40">{yearLabel(selectedModel)}</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleClearModel}
                    className="text-ink/30 hover:text-ink/60 ml-3 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Picking: search + cascade ── */}
            {!selectedModel && !manualMode && (
              <>
                <div>
                  <label className="text-xs text-ink/50 mb-2 block">Model</label>
                  <div ref={searchRef} className="relative">
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Know your chassis? Type E30, S13, Miata…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-9 py-3 bg-card rounded-xl text-sm placeholder:text-ink/30 outline-none focus:ring-2 focus:ring-racing-green/20"
                        autoComplete="off"
                      />
                      {searchQuery && (
                        <button type="button"
                          onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {searchResults.length > 0 && (
                      <ul className="absolute z-20 mt-1 w-full bg-white border border-card rounded-xl shadow-lg overflow-hidden">
                        {searchResults.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onMouseDown={() => handleSearchSelect(m)}
                              className="w-full text-left px-4 py-3 hover:bg-paper text-sm flex items-center justify-between gap-3"
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
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-card" />
                  <span className="text-xs text-ink/30">or select step by step</span>
                  <div className="flex-1 h-px bg-card" />
                </div>

                <CascadePicker key={cascadeKey} onResolve={handleModelResolve} />

                <button
                  type="button"
                  onClick={() => { setManualMode(true); setIsDirty(true); }}
                  className="text-sm text-ink/40 underline underline-offset-2 hover:text-ink/70"
                >
                  Can&apos;t find it? Add it manually
                </button>
              </>
            )}

            {/* ── Manual: free-text entry ── */}
            {manualMode && (
              <div className="space-y-3">
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
                </div>
                <div>
                  <label className="text-xs text-ink/50 mb-1 block">Generation / trim</label>
                  <input
                    name="custom_generation"
                    defaultValue={car.custom_generation ?? ""}
                    className="input-field w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setManualMode(false); setCascadeKey((k) => k + 1); setIsDirty(true); }}
                  className="text-sm text-ink/40 underline underline-offset-2 hover:text-ink/70"
                >
                  Search catalog instead
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Year *</label>
              <div className="relative">
                <select
                  name="year"
                  required
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="input-field w-full appearance-none pr-8"
                >
                  <option value="">Select year…</option>
                  {YEAR_OPTIONS.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
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
              <label className="text-xs text-ink/50 mb-1 block">Fuel</label>
              <div className="relative">
                <select name="fuel" defaultValue={car.fuel ?? ""} className="input-field w-full appearance-none pr-8">
                  <option value="">Fuel type…</option>
                  {FUEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Body</label>
              <div className="relative">
                <select name="body_type" defaultValue={car.body_type ?? ""} className="input-field w-full appearance-none pr-8">
                  <option value="">Body type…</option>
                  {BODY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Drivetrain</label>
              <div className="relative">
                <select name="drivetrain" defaultValue={car.drivetrain ?? ""} className="input-field w-full appearance-none pr-8">
                  <option value="">Drivetrain…</option>
                  {DRIVETRAIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Transmission</label>
              <div className="relative">
                <select name="transmission" defaultValue={car.transmission ?? ""} className="input-field w-full appearance-none pr-8">
                  <option value="">Gearbox…</option>
                  {TRANSMISSION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-ink/50 mb-2 block">Color</label>
            <ColorPicker value={colorBase} onChange={(v) => { setColorBase(v); setIsDirty(true); }} />
            <input type="hidden" name="color_base" value={colorBase ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Horsepower</label>
              <input
                name="horsepower"
                type="number"
                min={1}
                max={5000}
                defaultValue={car.horsepower ?? ""}
                placeholder="240"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Color name</label>
              <input
                name="color"
                defaultValue={car.color ?? ""}
                placeholder="Dakar Yellow"
                className="input-field w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-ink/50 mb-1 block">Trim / version</label>
            <input
              name="trim"
              defaultValue={car.trim ?? ""}
              placeholder="Competition, Type S, GTI…"
              className="input-field w-full"
            />
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
                onClick={() => { setIsPrivate(false); setIsDirty(true); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  !isPrivate ? "bg-ink text-paper border-ink" : "bg-card text-ink/50 border-card"
                }`}
              >
                <Globe size={13} />Public
              </button>
              <button
                type="button"
                onClick={() => { setIsPrivate(true); setIsDirty(true); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  isPrivate ? "bg-ink text-paper border-ink" : "bg-card text-ink/50 border-card"
                }`}
              >
                <Lock size={13} />Private
              </button>
            </div>
            <input type="hidden" name="visibility" value={isPrivate ? "private" : "public"} />
          </div>
        </section>

        {/* ── Purchase details ── */}
        {car.ownershipId && (
          <section className="space-y-4 pt-2 border-t border-card">
            <h2 className="font-display font-bold text-lg">Purchase details</h2>
            <input type="hidden" name="ownership_id" value={car.ownershipId} />

            <div>
              <label className="text-xs text-ink/50 mb-1 block">Date acquired</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
                <input
                  name="purchase_date"
                  type="date"
                  defaultValue={car.purchaseDate ?? ""}
                  className="input-field w-full max-w-full pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-ink/50 mb-1 block">Price paid</label>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    name="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="input-field appearance-none pr-7 pl-3"
                  >
                    {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
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
                  <input type="hidden" name="purchase_price" value={rawPrice} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-ink/50 mb-2 block">Price visibility</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setPurchasePricePublic(true); setIsDirty(true); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    purchasePricePublic ? "bg-ink text-paper border-ink" : "bg-card text-ink/50 border-card"
                  }`}
                >
                  <Globe size={13} />Public
                </button>
                <button
                  type="button"
                  onClick={() => { setPurchasePricePublic(false); setIsDirty(true); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    !purchasePricePublic ? "bg-ink text-paper border-ink" : "bg-card text-ink/50 border-card"
                  }`}
                >
                  <Lock size={13} />Private
                </button>
              </div>
              <input type="hidden" name="purchase_price_public" value={purchasePricePublic ? "true" : "false"} />
            </div>

            <div>
              <label className="text-xs text-ink/50 mb-1 block">Odometer at purchase</label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatInt(rawMileage)}
                    onChange={(e) => setRawMileage(parseDigits(e.target.value))}
                    placeholder="84,000"
                    className="input-field w-full"
                  />
                  <input type="hidden" name="purchase_mileage_value" value={rawMileage} />
                </div>
                <div className="flex rounded-xl border border-ink/10 overflow-hidden text-sm font-medium">
                  {(["km", "mi"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => { setPurchaseMileageUnit(u); setIsDirty(true); }}
                      className={`px-3 py-2 transition-colors ${
                        purchaseMileageUnit === u
                          ? "bg-ink text-paper"
                          : "bg-card text-ink/50 hover:text-ink"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="purchase_mileage_unit" value={purchaseMileageUnit} />
              </div>
            </div>
          </section>
        )}

        {state && "error" in state && <p className="text-sm text-red-500">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || navigating}
          className="w-full bg-ink text-paper font-display font-bold py-4 rounded-2xl text-base hover:bg-ink/85 transition-colors disabled:opacity-50"
        >
          {pending || navigating ? "Saving…" : "Save changes"}
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
                  <span className="absolute top-1.5 left-1.5 bg-racing-green text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
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
            className="aspect-square rounded-xl border-2 border-dashed border-ink/15 flex flex-col items-center justify-center gap-1 text-ink/30 hover:border-racing-green/40 hover:text-racing-green transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-ink/20 border-t-racing-green rounded-full animate-spin" />
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
