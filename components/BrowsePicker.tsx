"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { debounce } from "@/lib/utils/debounce";

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
  const [makes, setMakes] = useState<string[]>([]);
  const [make, setMake] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [matches, setMatches] = useState<CarModel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    fetch("/api/car-models/makes")
      .then((r) => r.json())
      .then(setMakes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setModel("");
    setYear("");
    setMatches(null);
    if (!make) { setModels([]); return; }
    fetch(`/api/car-models/models?make=${encodeURIComponent(make)}`)
      .then((r) => r.json())
      .then(setModels)
      .catch(() => {});
  }, [make]);

  useEffect(() => {
    setYear("");
    setMatches(null);
  }, [model]);

  const resolve = useCallback(
    debounce(async (m: string, mod: string, y: string) => {
      const yr = parseInt(y, 10);
      if (!m || !mod || isNaN(yr) || yr < 1885 || yr > new Date().getFullYear() + 2) {
        setMatches(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/car-models/resolve?make=${encodeURIComponent(m)}&model=${encodeURIComponent(mod)}&year=${yr}`
        );
        const data: CarModel[] = await res.json();
        setMatches(data);
        setSelectedIdx(0);
        if (data.length === 1) onSelect(data[0]);
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }, 350),
    [onSelect]
  );

  useEffect(() => {
    resolve(make, model, year);
  }, [make, model, year, resolve]);

  const outOfRange = matches !== null && matches.length === 0 && year.length === 4;

  return (
    <div className={`space-y-3 transition-opacity ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
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
      </div>

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
        </div>
      )}

      {make && model && (
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 1992"
            min={1885}
            max={new Date().getFullYear() + 2}
            className={`input-field w-full ${outOfRange ? "ring-2 ring-red-400/40" : ""}`}
          />
        </div>
      )}

      {loading && <p className="text-xs text-ink/40">Resolving generation…</p>}

      {outOfRange && !loading && (
        <p className="text-xs text-red-400">
          {year} is outside the range for {make} {model} in the catalog.
        </p>
      )}

      {!loading && matches && matches.length > 1 && (
        <div>
          <p className="text-xs text-ink/50 mb-2">Multiple generations match — pick yours:</p>
          <div className="space-y-1.5">
            {matches.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setSelectedIdx(i); onSelect(m); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  selectedIdx === i
                    ? "border-racing-green bg-racing-green/5 text-racing-green"
                    : "border-card text-ink/60 hover:border-ink/20"
                }`}
              >
                <span className="font-medium">
                  {m.generation}
                  {m.chassis_code && m.chassis_code !== m.generation && (
                    <span className="text-ink/40 font-normal ml-1.5">({m.chassis_code})</span>
                  )}
                </span>
                <span className="text-xs text-ink/40">{yearLabel(m)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
