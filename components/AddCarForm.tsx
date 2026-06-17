"use client";

import {
  useActionState, useRef, useState, useCallback, useEffect,
} from "react";
import { useRouter } from "next/navigation";
import {
  Search, ChevronDown, Lock, Globe, X, Check, ChevronRight,
  Eye, EyeOff, Calendar,
} from "lucide-react";
import { createCar, CarState } from "@/lib/actions/car";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { type CarModel, yearLabel } from "@/components/BrowsePicker";
import { ColorPicker } from "@/components/ColorPicker";
import { debounce } from "@/lib/utils/debounce";
import {
  FUEL_OPTIONS, DRIVETRAIN_OPTIONS, BODY_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS, ACQUISITION_OPTIONS, CURRENCIES, YEAR_OPTIONS,
} from "@/lib/car-options";

interface UploadedPhoto {
  path: string;
  previewUrl: string;
}

// ── Inline cascade (primary path) ────────────────────────────────────────────
// Like BrowsePicker but fires onResolve(model, year) — year is captured here
// as step 3, so the parent doesn't need a separate year input for cascade path.

function CascadePicker({
  onResolve,
}: {
  onResolve: (model: CarModel, year: string) => void;
}) {
  const [makes, setMakes]         = useState<string[]>([]);
  const [cMake, setCMake]         = useState("");
  const [cModels, setCModels]     = useState<string[]>([]);
  const [cModel, setCModel]       = useState("");
  const [generations, setGens]    = useState<CarModel[] | null>(null);
  const [fetching, setFetching]   = useState(false);
  const [pickIdx, setPickIdx]     = useState(0);

  // stable ref so the effect doesn't re-run when the callback identity changes
  const onResolveRef = useRef(onResolve);
  onResolveRef.current = onResolve;

  useEffect(() => {
    fetch("/api/car-models/makes").then((r) => r.json()).then(setMakes).catch(() => {});
  }, []);

  useEffect(() => {
    setCModel(""); setGens(null);
    if (!cMake) { setCModels([]); return; }
    fetch(`/api/car-models/models?make=${encodeURIComponent(cMake)}`)
      .then((r) => r.json()).then(setCModels).catch(() => {});
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
      {/* Step 1 — Make */}
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

      {/* Step 2 — Model */}
      {cMake && (
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Model</label>
          <div className="relative">
            <select
              value={cModel}
              onChange={(e) => setCModel(e.target.value)}
              className="input-field w-full appearance-none pr-8"
            >
              <option value="">Select model…</option>
              {cModels.map((mo) => <option key={mo} value={mo}>{mo}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Step 3 — Generation (replaces blind year input) */}
      {cMake && cModel && (
        <>
          {fetching && (
            <p className="text-xs text-ink/40">Loading generations…</p>
          )}

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

// ── Main form ─────────────────────────────────────────────────────────────────

export function AddCarForm({
  userId,
  preferredUnit = "km",
}: {
  userId: string;
  preferredUnit?: "km" | "mi";
}) {
  const [state, action, pending] = useActionState<CarState, FormData>(createCar, null);
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (state && "slug" in state) {
      setNavigating(true);
      state.warnings?.forEach((w) =>
        toast.warning(w, { style: { borderLeft: "3px solid #D97706" } })
      );
      toast.success("Car added to your garage", {
        style: { borderLeft: "3px solid #1A3A2E" },
      });
      router.push(`/car/${state.slug}`);
    }
  }, [state, router]);

  // Model resolution state
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [finalYear, setFinalYear] = useState("");      // submitted to form
  const [yearInput, setYearInput] = useState("");       // controlled input (search path)
  const [selectedEngine, setSelectedEngine] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [cascadeKey, setCascadeKey] = useState(0);     // force remount on clear

  // Search (secondary path)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CarModel[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Other form state
  const [isPrivate, setIsPrivate] = useState(false);
  const [purchasePricePublic, setPurchasePricePublic] = useState(false);
  const [currency, setCurrency] = useState("EUR");
  const [rawPrice, setRawPrice] = useState("");
  const [rawMileage, setRawMileage] = useState("");
  const [purchaseMileageUnit, setPurchaseMileageUnit] = useState<"km" | "mi">(preferredUnit);
  const currencySymbol = CURRENCIES.find((c) => c.value === currency)?.symbol ?? currency;
  const [colorBase, setColorBase] = useState<string | null>(null);

  function parseDigits(val: string) { return val.replace(/[^0-9]/g, ""); }
  function formatInt(raw: string) {
    const n = parseInt(raw, 10);
    return raw && !isNaN(n) ? n.toLocaleString("en-US") : "";
  }
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Search debounce — race-safe: no showDropdown boolean, results drive visibility
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

  // Cascade resolves: generation known, year_start stored as default, input left blank
  const handleCascadeResolve = useCallback((model: CarModel, year: string) => {
    setSelectedModel(model);
    setFinalYear(year);    // year_start — used as stored year if user doesn't specify
    setYearInput("");      // leave blank; placeholder shows year_start
    setSelectedEngine(model.engines.length === 1 ? model.engines[0] : "");
  }, []);

  // Search resolves: generation fully known, default to year_start
  function handleSearchSelect(model: CarModel) {
    setSelectedModel(model);
    setFinalYear(String(model.year_start));  // default; user can optionally narrow
    setYearInput("");
    setSelectedEngine(model.engines.length === 1 ? model.engines[0] : "");
    setSearchQuery("");
    setSearchResults([]);
  }

  function handleClear() {
    setSelectedModel(null);
    setFinalYear("");
    setYearInput("");
    setSelectedEngine("");
    setCascadeKey((k) => k + 1);
    setSearchQuery("");
    setSearchResults([]);
  }

  function handleYearSelect(val: string) {
    setYearInput(val);
    setFinalYear(val || (selectedModel ? String(selectedModel.year_start) : ""));
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
          maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true, fileType: "image/webp",
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
    <form action={action} className="space-y-8 pb-24">
      {/* ── Hidden fields ── */}
      <input type="hidden" name="model_id" value={selectedModel?.id ?? ""} />
      <input type="hidden" name="display_make" value={selectedModel?.make ?? ""} />
      <input type="hidden" name="display_model" value={
        selectedModel ? `${selectedModel.model} ${selectedModel.generation}` : ""
      } />
      {/* Year + engine hidden inputs — only in catalog mode (manual mode uses visible inputs) */}
      {selectedModel && !manualMode && (
        <>
          <input type="hidden" name="year" value={finalYear} />
          <input type="hidden" name="engine" value={selectedEngine} />
        </>
      )}
      {photos.map((p, i) => (
        <input key={p.path} type="hidden"
          name={i === 0 ? "cover_photo_path" : `photo_path_${i}`}
          value={p.path} />
      ))}

      {/* ── Section 1: Find your car ── */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-lg">Find your car</h2>

        {/* ── Confirmed state ── */}
        {selectedModel && !manualMode && (
          <div className="space-y-4">
            {/* Confirmation banner */}
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
                  <p className="text-xs text-ink/40">
                    {yearLabel(selectedModel)}
                    {yearInput && (
                      <span className="ml-1.5 text-ink/60 font-medium">· {yearInput}</span>
                    )}
                  </p>
                </div>
              </div>
              <button type="button" onClick={handleClear}
                className="text-ink/30 hover:text-ink/60 ml-3 flex-shrink-0">
                <X size={14} />
              </button>
            </div>

            {/* Year — optional dropdown, only valid years for this generation */}
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Year</label>
              <div className="relative">
                <select
                  value={yearInput}
                  onChange={(e) => handleYearSelect(e.target.value)}
                  className="input-field w-full appearance-none pr-8"
                >
                  <option value="">Select year…</option>
                  {Array.from(
                    { length: (selectedModel.year_end ?? new Date().getFullYear()) - selectedModel.year_start + 1 },
                    (_, i) => selectedModel.year_start + i
                  ).map((yr) => (
                    <option key={yr} value={String(yr)}>{yr}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
            </div>

            {/* Engine — shown immediately once generation is confirmed */}
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Engine</label>
              {selectedModel.engines.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedEngine}
                    onChange={(e) => setSelectedEngine(e.target.value)}
                    className="input-field w-full appearance-none pr-8"
                  >
                    <option value="">Select engine…</option>
                    {selectedModel.engines.map((eng) => (
                      <option key={eng} value={eng}>{eng}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
                </div>
              ) : (
                <input
                  value={selectedEngine}
                  onChange={(e) => setSelectedEngine(e.target.value)}
                  placeholder="e.g. M20B25"
                  className="input-field w-full"
                />
              )}
            </div>
          </div>
        )}

        {/* ── Finding state: search + cascade ── */}
        {!selectedModel && !manualMode && (
          <>
            {/* Search — secondary path */}
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

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-card" />
              <span className="text-xs text-ink/30">or select step by step</span>
              <div className="flex-1 h-px bg-card" />
            </div>

            {/* Cascade — primary path */}
            <CascadePicker key={cascadeKey} onResolve={handleCascadeResolve} />

            {/* Manual fallback */}
            <button
              type="button"
              onClick={() => { setManualMode(true); handleClear(); }}
              className="text-sm text-ink/40 underline underline-offset-2 hover:text-ink/70"
            >
              Can&apos;t find it? Add it manually
            </button>
          </>
        )}

        {/* ── Manual entry ── */}
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
          {/* Year + Engine — only in manual mode; cascade/search capture them above */}
          {manualMode && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Year *</label>
                <div className="relative">
                  <select name="year" required className="input-field w-full appearance-none pr-8">
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
                <input name="engine" placeholder="M20B25" className="input-field w-full" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Fuel</label>
              <div className="relative">
                <select name="fuel" className="input-field w-full appearance-none pr-8">
                  <option value="">Fuel type…</option>
                  {FUEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Body</label>
              <div className="relative">
                <select name="body_type" className="input-field w-full appearance-none pr-8">
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
                <select name="drivetrain" className="input-field w-full appearance-none pr-8">
                  <option value="">Drivetrain…</option>
                  {DRIVETRAIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Transmission</label>
              <div className="relative">
                <select name="transmission" className="input-field w-full appearance-none pr-8">
                  <option value="">Gearbox…</option>
                  {TRANSMISSION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-ink/50 mb-2 block">Color</label>
            <ColorPicker value={colorBase} onChange={setColorBase} />
            <input type="hidden" name="color_base" value={colorBase ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Horsepower</label>
              <input name="horsepower" type="number" min={1} max={5000} placeholder="240" className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Color name</label>
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
                  !isPrivate ? "bg-ink text-paper border-ink" : "bg-card text-ink/50 border-card"
                }`}
              >
                <Globe size={13} />Public
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  isPrivate ? "bg-ink text-paper border-ink" : "bg-card text-ink/50 border-card"
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
                  <span className="absolute top-1 left-1 text-[9px] bg-racing-green text-white px-1 rounded font-medium">Cover</span>
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
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-ink/20 rounded-xl text-sm text-ink/50 hover:border-racing-green/40 hover:text-racing-green transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "+ Add photos"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only"
          onChange={(e) => handlePhotos(e.target.files)} />
        {uploadError && (
          <p className="text-xs text-red-500 mt-1.5">{uploadError}</p>
        )}
      </section>

      {/* ── Section 4: Purchase details ── */}
      <section>
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-1.5 text-sm text-ink/40 hover:text-ink/70 list-none">
            <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
            Purchase details
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Acquired as</label>
              <div className="relative">
                <select name="acquisition_condition" className="input-field w-full appearance-none pr-8">
                  <option value="">Condition when acquired…</option>
                  {ACQUISITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs text-ink/50 mb-1 block">Date acquired</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
                <input name="purchase_date" type="date" className="input-field w-full pl-9" />
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
                    className="input-field w-full pl-9"
                  />
                  <input type="hidden" name="purchase_price" value={rawPrice} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPurchasePricePublic((v) => !v)}
                className={`flex items-center gap-1.5 text-xs mt-1.5 transition-colors ${
                  purchasePricePublic ? "text-racing-green" : "text-ink/40 hover:text-ink/60"
                }`}
              >
                {purchasePricePublic ? <Eye size={12} /> : <EyeOff size={12} />}
                {purchasePricePublic ? "Price visible publicly" : "Price is private"}
              </button>
              <input type="hidden" name="purchase_price_public" value={String(purchasePricePublic)} />
            </div>

            <div>
              <label className="text-xs text-ink/50 mb-1 block">Odometer at purchase</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatInt(rawMileage)}
                    onChange={(e) => setRawMileage(parseDigits(e.target.value))}
                    placeholder="84,500"
                    className="input-field w-full"
                  />
                  <input type="hidden" name="purchase_mileage_value" value={rawMileage} />
                </div>
                <div className="flex rounded-xl border border-ink/10 overflow-hidden text-sm font-medium">
                  {(["km", "mi"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setPurchaseMileageUnit(u)}
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
          </div>
        </details>
      </section>

      {/* ── Section 5: VIN ── */}
      <section>
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-1.5 text-sm text-ink/40 hover:text-ink/70 list-none">
            <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
            VIN (always private)
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

      {state && "error" in state && <p className="text-sm text-red-500">{state.error}</p>}

      <div className="fixed bottom-16 inset-x-0 px-4 md:static md:bottom-auto md:px-0">
        <button
          type="submit"
          disabled={pending || navigating || uploading}
          className="w-full bg-ink text-paper font-display font-bold py-4 rounded-2xl text-base hover:bg-ink/85 transition-colors disabled:opacity-50"
        >
          {pending || navigating ? "Saving…" : "Add to garage"}
        </button>
      </div>
    </form>
  );
}
