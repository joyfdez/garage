"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export interface CarModel {
  id: string;
  make: string;
  model: string;
  generation: string;
  chassis_code: string | null;
  year_start: number;
  year_end: number | null;
  engines: string[];
  slug: string;
}

export function yearLabel(m: CarModel) {
  return `${m.year_start}–${m.year_end ?? "present"}`;
}

export function BrowsePicker({
  onSelect,
  disabled,
}: {
  onSelect: (m: CarModel) => void;
  disabled: boolean;
}) {
  const [makes, setMakes]       = useState<string[]>([]);
  const [makesError, setMakesError] = useState(false);
  const [makesRetry, setMakesRetry] = useState(0);
  const [make, setMake]         = useState("");
  const [models, setModels]     = useState<string[]>([]);
  const [modelsError, setModelsError] = useState(false);
  const [modelsRetry, setModelsRetry] = useState(0);
  const [model, setModel]       = useState("");
  const [generations, setGens]  = useState<CarModel[] | null>(null);
  const [gensError, setGensError] = useState(false);
  const [gensRetry, setGensRetry] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [pickedIdx, setPickedIdx] = useState(0);

  // stable ref so the fetch effect doesn't re-run when onSelect identity changes
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    setMakesError(false);
    fetch("/api/car-models/makes")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMakes)
      .catch(() => setMakesError(true));
  }, [makesRetry]);

  useEffect(() => {
    setModel("");
    setGens(null);
    setModelsError(false);
    if (!make) { setModels([]); return; }
    fetch(`/api/car-models/models?make=${encodeURIComponent(make)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setModels)
      .catch(() => setModelsError(true));
  }, [make, modelsRetry]);

  useEffect(() => {
    setGens(null);
    setGensError(false);
    setPickedIdx(0);
    if (!make || !model) return;
    setFetching(true);
    fetch(
      `/api/car-models/generations?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: CarModel[]) => {
        setGens(data);
        if (data.length === 1) onSelectRef.current(data[0]);
      })
      .catch(() => setGensError(true))
      .finally(() => setFetching(false));
  }, [make, model, gensRetry]);

  return (
    <div className={`space-y-3 transition-opacity ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      {/* Make */}
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Make</label>
        <div className="relative">
          <select
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="input-field w-full appearance-none pr-8"
          >
            <option value="">Select make…</option>
            {makes.map((mk) => (
              <option key={mk} value={mk}>{mk}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
        </div>
        {makesError && (
          <button
            type="button"
            onClick={() => setMakesRetry((n) => n + 1)}
            className="text-xs text-red-400 underline mt-1"
          >
            Couldn&apos;t load makes — tap to retry
          </button>
        )}
      </div>

      {/* Model */}
      {make && (
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Model</label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="input-field w-full appearance-none pr-8"
            >
              <option value="">Select model…</option>
              {models.map((mo) => (
                <option key={mo} value={mo}>{mo}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
          </div>
          {modelsError && (
            <button
              type="button"
              onClick={() => setModelsRetry((n) => n + 1)}
              className="text-xs text-red-400 underline mt-1"
            >
              Couldn&apos;t load models — tap to retry
            </button>
          )}
        </div>
      )}

      {/* Generation */}
      {make && model && (
        <>
          {fetching && (
            <p className="text-xs text-ink/40">Loading generations…</p>
          )}

          {!fetching && gensError && (
            <button
              type="button"
              onClick={() => setGensRetry((n) => n + 1)}
              className="text-xs text-red-400 underline"
            >
              Couldn&apos;t load generations — tap to retry
            </button>
          )}

          {!fetching && !gensError && generations !== null && generations.length === 0 && (
            <p className="text-xs text-red-400">
              No catalog entries found for {make} {model}.
            </p>
          )}

          {!fetching && !gensError && generations !== null && generations.length === 1 && (
            <p className="text-xs text-ink/40">
              {generations[0].generation} · {yearLabel(generations[0])}
            </p>
          )}

          {!fetching && !gensError && generations !== null && generations.length > 1 && (
            <div>
              <p className="text-xs text-ink/50 mb-2">Pick your generation:</p>
              <div className="space-y-1.5">
                {generations.map((g, i) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setPickedIdx(i);
                      onSelectRef.current(g);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      pickedIdx === i
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
