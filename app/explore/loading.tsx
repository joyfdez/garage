export default function ExploreLoading() {
  return (
    <div className="bg-paper min-h-dvh pb-24">
      {/* Header */}
      <div className="px-5 pb-6 pt-safe-page-8">
        <div className="skeleton h-9 w-32 rounded mb-2" />
        <div className="skeleton h-3 w-52 rounded" />
      </div>

      {/* Search bar */}
      <div className="px-5 mb-6">
        <div className="skeleton h-11 w-full rounded-input" />
      </div>

      {/* Section label */}
      <div className="px-5 mb-3">
        <div className="skeleton h-3 w-24 rounded" />
      </div>

      {/* Model chips — varied widths mimic real labels */}
      <div className="px-5 flex flex-wrap gap-2">
        {[88, 64, 104, 72, 80, 96, 68, 112, 76, 60, 92, 84].map((w, i) => (
          <div
            key={i}
            className="skeleton h-8 rounded-full"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
    </div>
  );
}
