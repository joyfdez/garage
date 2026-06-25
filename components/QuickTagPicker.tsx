"use client";

import { useState, useCallback, useRef } from "react";
import { Search, X, Check } from "lucide-react";
import { toggleModelTag, type TagType } from "@/lib/actions/modelTags";
import { toast } from "@/lib/toast";
import { yearLabel, type CarModel } from "@/components/BrowsePicker";
import { debounce } from "@/lib/utils/debounce";

interface QuickTagPickerProps {
  tagType: TagType;
  initialModels: CarModel[];
}

function ModelRow({
  model,
  tagged,
  pending,
  onToggle,
}: {
  model: CarModel;
  tagged: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={pending}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-card border text-left transition-colors ${
        tagged
          ? "bg-racing-green/8 border-racing-green/20 hover:bg-racing-green/12"
          : "bg-white border-ink/8 hover:border-ink/20"
      }`}
    >
      <div className="min-w-0">
        <p className="font-display font-bold text-sm text-ink leading-tight">
          {model.make} {model.model}
          {model.generation && (
            <span className="text-ink/40 font-normal ml-1">{model.generation}</span>
          )}
        </p>
        <p className="text-[0.63rem] text-hint mt-0.5 uppercase tracking-[0.1em]">
          {yearLabel(model)}
          {model.chassis_code && ` · ${model.chassis_code}`}
        </p>
      </div>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-3 transition-colors ${
          tagged
            ? "bg-racing-green text-paper"
            : "border border-ink/20"
        }`}
      >
        {tagged && <Check size={12} />}
      </div>
    </button>
  );
}

export function QuickTagPicker({ tagType, initialModels }: QuickTagPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CarModel[]>([]);
  const [searching, setSearching] = useState(false);
  const [tagged, setTagged] = useState<Set<string>>(
    () => new Set(initialModels.map((m) => m.id))
  );
  const [pending, setPending] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        const r = await fetch(`/api/car-models?q=${encodeURIComponent(q)}`, {
          signal: abortRef.current.signal,
        });
        setResults(await r.json());
      } catch {
        // aborted — ignore
      } finally {
        setSearching(false);
      }
    }, 300),
    []
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (q.length >= 2) setSearching(true);
    else setResults([]);
    runSearch(q);
  }

  async function toggle(model: CarModel) {
    if (pending) return;
    setPending(model.id);
    const wasTagged = tagged.has(model.id);
    setTagged((prev) => {
      const next = new Set(prev);
      wasTagged ? next.delete(model.id) : next.add(model.id);
      return next;
    });
    const { error } = await toggleModelTag(model.id, tagType);
    if (error) {
      setTagged((prev) => {
        const next = new Set(prev);
        wasTagged ? next.add(model.id) : next.delete(model.id);
        return next;
      });
      toast.error("Couldn't save — try again");
    }
    setPending(null);
  }

  const listLabel = tagType === "driven" ? "driven list" : "wishlist";
  const searchPlaceholder =
    tagType === "driven"
      ? "Search a car you've driven…"
      : "Search a car you want to drive…";

  const taggedInitialModels = initialModels.filter((m) => tagged.has(m.id));

  return (
    <div className="px-5">
      {/* Search */}
      <div className="relative mb-5">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-hint pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-ink/12 rounded-input text-sm text-ink placeholder:text-hint focus:outline-none focus:border-racing-green/40 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-hint hover:text-ink transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search results */}
      {query.length >= 2 && (
        <>
          {searching && (
            <p className="text-xs text-hint text-center py-4">Searching…</p>
          )}
          {!searching && results.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-6">
              No models found for &ldquo;{query}&rdquo;
            </p>
          )}
          {!searching && results.length > 0 && (
            <ul className="space-y-2 mb-6">
              {results.map((m) => (
                <li key={m.id}>
                  <ModelRow
                    model={m}
                    tagged={tagged.has(m.id)}
                    pending={pending === m.id}
                    onToggle={() => toggle(m)}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Tagged models list (shown when not searching) */}
      {!query && (
        <>
          {taggedInitialModels.length > 0 ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[0.58rem] uppercase tracking-[0.2em] font-bold text-hint shrink-0">
                  Your {listLabel}
                </p>
                <div className="flex-1 h-px bg-ink/8" />
                <p className="text-[0.58rem] text-hint shrink-0">{taggedInitialModels.length}</p>
              </div>
              <ul className="space-y-2">
                {taggedInitialModels.map((m) => (
                  <li key={m.id}>
                    <ModelRow
                      model={m}
                      tagged={tagged.has(m.id)}
                      pending={pending === m.id}
                      onToggle={() => toggle(m)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-ink-muted text-sm">
                {tagType === "driven"
                  ? "Search for a car to mark it as driven."
                  : "Search for a car to add to your wishlist."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
