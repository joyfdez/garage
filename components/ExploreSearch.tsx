"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { toggleModelTag, TagType } from "@/lib/actions/modelTags";
import { BrowsePicker, CarModel, yearLabel } from "@/components/BrowsePicker";
import { debounce } from "@/lib/utils/debounce";

type InitialTag = { model_id: string; tag_type: string };

function TagButtons({
  modelId,
  tagSet,
  pending,
  onToggle,
}: {
  modelId: string;
  tagSet: Set<string>;
  pending: string | null;
  onToggle: (id: string, type: TagType) => void;
}) {
  const isDriven = tagSet.has(`${modelId}:driven`);
  const isWishlist = tagSet.has(`${modelId}:wishlist`);
  return (
    <div className="flex gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => onToggle(modelId, "driven")}
        disabled={pending === `${modelId}:driven` || pending === `${modelId}:wishlist`}
        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          isDriven
            ? "bg-orange text-white"
            : "bg-background text-ink/50 hover:text-ink border border-card"
        }`}
      >
        Driven
      </button>
      <button
        type="button"
        onClick={() => onToggle(modelId, "wishlist")}
        disabled={pending === `${modelId}:driven` || pending === `${modelId}:wishlist`}
        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          isWishlist
            ? "bg-ink text-white"
            : "bg-background text-ink/50 hover:text-ink border border-card"
        }`}
      >
        Wishlist
      </button>
    </div>
  );
}

function ModelRow({
  model,
  tagSet,
  pending,
  onToggle,
}: {
  model: CarModel;
  tagSet: Set<string>;
  pending: string | null;
  onToggle: (id: string, type: TagType) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 bg-card rounded-xl">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight truncate">
          {model.make} {model.model}{" "}
          <span className="text-ink/60">{model.generation}</span>
          {model.chassis_code && model.chassis_code !== model.generation && (
            <span className="text-ink/40 font-normal ml-1">({model.chassis_code})</span>
          )}
        </p>
        <p className="text-xs text-ink/40">{yearLabel(model)}</p>
      </div>
      <TagButtons modelId={model.id} tagSet={tagSet} pending={pending} onToggle={onToggle} />
    </li>
  );
}

export function ExploreSearch({ initialTags }: { initialTags: InitialTag[] }) {
  const [tagSet, setTagSet] = useState<Set<string>>(
    () => new Set(initialTags.map((t) => `${t.model_id}:${t.tag_type}`))
  );
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CarModel[]>([]);
  const [browseSelected, setBrowseSelected] = useState<CarModel | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const search = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) { setSearchResults([]); return; }
      try {
        const res = await fetch(`/api/car-models?q=${encodeURIComponent(q)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch {}
    }, 300),
    []
  );

  useEffect(() => { search(query); }, [query, search]);

  async function handleToggle(modelId: string, tagType: TagType) {
    const key = `${modelId}:${tagType}`;
    if (pending) return;
    const wasTagged = tagSet.has(key);
    setTagSet((prev) => {
      const next = new Set(prev);
      if (wasTagged) next.delete(key);
      else next.add(key);
      return next;
    });
    setPending(key);
    try {
      const result = await toggleModelTag(modelId, tagType);
      if (result.error) {
        setTagSet((prev) => {
          const next = new Set(prev);
          if (wasTagged) next.add(key);
          else next.delete(key);
          return next;
        });
      }
    } finally {
      setPending(null);
    }
  }

  const showResults = query.length >= 2;

  return (
    <div className="space-y-5">
      {/* Search input */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
        <input
          type="text"
          placeholder="Type chassis code, model name… (E30, Miata, GTI)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-9 py-3 bg-card rounded-xl text-sm placeholder:text-ink/30 outline-none focus:ring-2 focus:ring-orange/40"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSearchResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search results */}
      {showResults && searchResults.length > 0 && (
        <ul className="space-y-1.5">
          {searchResults.map((m) => (
            <ModelRow
              key={m.id}
              model={m}
              tagSet={tagSet}
              pending={pending}
              onToggle={handleToggle}
            />
          ))}
        </ul>
      )}

      {showResults && searchResults.length === 0 && (
        <p className="text-sm text-ink/40 text-center py-6">No models found for &ldquo;{query}&rdquo;</p>
      )}

      {/* Browse by make — shown when search is idle */}
      {!showResults && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-card" />
            <span className="text-xs text-ink/30">or browse by make</span>
            <div className="flex-1 h-px bg-card" />
          </div>

          <BrowsePicker
            onSelect={(m) => setBrowseSelected(m)}
            disabled={false}
          />

          {browseSelected && (
            <ul className="mt-4 space-y-1.5">
              <ModelRow
                model={browseSelected}
                tagSet={tagSet}
                pending={pending}
                onToggle={handleToggle}
              />
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
