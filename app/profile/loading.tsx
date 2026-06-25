export default function ProfileLoading() {
  return (
    <div className="bg-paper min-h-dvh pb-24">
      {/* Cover */}
      <div className="skeleton w-full aspect-[3/1]" />

      <div className="px-5">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className="skeleton w-16 h-16 rounded-full ring-4 ring-paper shrink-0" />
          <div className="flex gap-1.5">
            <div className="skeleton h-8 w-24 rounded-card" />
            <div className="skeleton h-8 w-24 rounded-card" />
          </div>
        </div>

        {/* Display name */}
        <div className="skeleton h-6 w-40 rounded mb-1.5" />
        {/* @username */}
        <div className="skeleton h-3.5 w-28 rounded mb-2" />
        {/* Followers / following */}
        <div className="flex gap-3 mb-4">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
        {/* Bio */}
        <div className="skeleton h-3 w-full rounded mb-1.5" />
        <div className="skeleton h-3 w-3/5 rounded mb-5" />
      </div>

      {/* Counter / tab block */}
      <div className="px-5 mb-6">
        <div className="bg-white rounded-card border border-ink/8 overflow-hidden">
          <div className="h-[3px] skeleton" />
          <div className="grid grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-3.5 px-1">
                <div className="skeleton h-3 w-3 rounded" />
                <div className="skeleton h-7 w-6 rounded" />
                <div className="skeleton h-2.5 w-10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Car cards */}
      <div className="px-5 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="skeleton rounded-card w-24 h-16 shrink-0" />
            <div className="flex-1 pt-0.5 space-y-2">
              <div className="skeleton h-4 w-4/5 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
