"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";

type UserResult = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function PeopleSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);

    if (timerRef.current) clearTimeout(timerRef.current);

    const q = val.trim();
    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        const data: UserResult[] = await res.json();
        setResults(data);
        setHasSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  return (
    <div>
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-hint pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="Search by @username or name"
          autoFocus
          className="w-full bg-white border border-ink/10 rounded-card text-base pl-10 pr-4 py-3 text-ink placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-racing-green/20 focus:border-racing-green/40 transition"
        />
      </div>

      {loading && (
        <p className="text-center py-8 text-hint text-sm">Searching…</p>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-ink-muted text-sm">No users found for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((u) => (
            <li key={u.id}>
              <Link
                href={`/u/${u.username}`}
                className="flex items-center gap-3 p-3 bg-white border border-ink/8 rounded-card hover:border-racing-green/20 transition-colors group"
              >
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.avatar_url}
                    alt={u.display_name ?? u.username}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-racing-green/10 flex items-center justify-center shrink-0">
                    <span className="font-display font-extrabold text-lg text-racing-green">
                      {u.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-ink truncate">
                    {u.display_name ?? `@${u.username}`}
                  </p>
                  <p className="text-xs text-ink-muted">@{u.username}</p>
                </div>
                <span className="text-xs text-hint group-hover:text-racing-green transition-colors">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!hasSearched && !loading && query.trim().length < 2 && (
        <div className="text-center py-12">
          <Users size={32} className="mx-auto mb-3 text-hint" strokeWidth={1.5} />
          <p className="text-ink-muted text-sm">Find people on Garage</p>
          <p className="text-hint text-xs mt-1">Search by name or @username</p>
        </div>
      )}
    </div>
  );
}
