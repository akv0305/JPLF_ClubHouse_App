export function CalendarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between gap-2">
        <div className="h-11 w-40 rounded-xl bg-[#E7E5E4]" />
        <div className="h-11 w-20 rounded-xl bg-[#E7E5E4]" />
      </div>
      <div className="mt-4 hidden grid-cols-7 gap-1 sm:grid">
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-[#E7E5E4]" />
        ))}
      </div>
      <div className="mt-4 space-y-3 sm:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-16 rounded-xl bg-[#E7E5E4]" />
        ))}
      </div>
    </div>
  );
}

export function QueueSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-11 w-24 rounded-full bg-[#E7E5E4]" />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-[#E7E5E4] bg-white p-4">
            <div className="h-4 w-56 max-w-full rounded bg-[#E7E5E4]" />
            <div className="mt-3 h-3 w-40 max-w-full rounded bg-[#E7E5E4]" />
            <div className="mt-2 h-3 w-32 max-w-full rounded bg-[#E7E5E4]" />
            <div className="mt-4 h-11 w-40 rounded-xl bg-[#E7E5E4]" />
          </div>
        ))}
      </div>
    </div>
  );
}
