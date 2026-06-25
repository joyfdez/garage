export default function CarLoading() {
  return (
    <div className="bg-paper min-h-dvh">
      {/* Hero — matches 70svh CarHero */}
      <div
        className="relative overflow-hidden skeleton"
        style={{ height: "70svh", minHeight: "340px" }}
      >
        {/* Glass bar ghost */}
        <div
          className="absolute inset-x-0 bottom-0 px-5 pt-12 pb-6"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(14,13,10,0.55) 100%)",
          }}
        >
          {/* Title placeholder */}
          <div className="skeleton h-10 w-4/5 rounded mb-2 opacity-20" />
          {/* Generation / chassis */}
          <div className="skeleton h-2.5 w-1/3 rounded mb-1 opacity-15" />
          {/* Meta row */}
          <div className="skeleton h-2.5 w-1/2 rounded opacity-15" />
        </div>
      </div>

      {/* Below hero */}
      <div className="px-5 pt-4 pb-2">
        {/* Spec chips */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {[72, 88, 76, 60].map((w, i) => (
            <div key={i} className="skeleton h-7 rounded-full" style={{ width: `${w}px` }} />
          ))}
        </div>

        {/* Mileage */}
        <div className="skeleton h-3.5 w-28 rounded mb-3" />

        {/* Ownership dates */}
        <div className="skeleton h-2.5 w-40 rounded mb-4" />

        {/* Action buttons */}
        <div className="flex gap-2">
          <div className="skeleton h-9 w-20 rounded-input" />
          <div className="skeleton h-9 w-28 rounded-input" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="mt-3 border-b border-ink/8">
        <div className="flex gap-0 px-5">
          {[72, 52, 44, 60].map((w, i) => (
            <div
              key={i}
              className="skeleton h-3.5 rounded my-3.5 mr-6"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
      </div>

      {/* Timeline cards */}
      <div className="px-5 mt-5 space-y-8">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className="skeleton rounded-card w-full aspect-[4/3] mb-3" />
            <div className="skeleton h-4 w-3/4 rounded mb-2" />
            <div className="skeleton h-3 w-1/2 rounded mb-1.5" />
            <div className="skeleton h-3 w-full rounded mb-1" />
            <div className="skeleton h-3 w-4/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
