export function SkeletonCard() {
  return (
    <div className="border border-line rounded overflow-hidden" aria-hidden="true">
      <div className="skeleton aspect-square" />
      <div className="grid gap-3 p-4">
        <div className="skeleton h-3 w-2/5" />
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-3 w-2/5" />
      </div>
    </div>
  );
}

/** @param {{ count?: number }} */
export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-6 gap-y-8">
      {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
