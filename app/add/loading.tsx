export default function AddLoading() {
  return (
    <div className="bg-paper min-h-dvh pb-24">
      <div className="px-5 pt-safe-page-8 pb-8">
        <div className="skeleton h-9 w-16 rounded mb-2" />
        <div className="skeleton h-3 w-44 rounded" />
      </div>
      <div className="px-5 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-5 bg-white border border-ink/8 rounded-card"
          >
            <div className="skeleton w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/5 rounded" />
              <div className="skeleton h-3 w-4/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
