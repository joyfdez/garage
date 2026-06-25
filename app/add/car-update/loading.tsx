export default function CarUpdatePickerLoading() {
  return (
    <div className="bg-paper min-h-dvh pb-24">
      <div className="px-5 pt-safe-page-8 pb-5">
        <div className="skeleton h-3 w-12 rounded mb-5" />
        <div className="skeleton h-7 w-36 rounded mb-2" />
        <div className="skeleton h-3.5 w-52 rounded" />
      </div>
      <div className="px-5">
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-card overflow-hidden border border-ink/8">
              <div className="skeleton aspect-[4/3]" />
              <div className="p-2 space-y-1.5">
                <div className="skeleton h-3 w-4/5 rounded" />
                <div className="skeleton h-2.5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
