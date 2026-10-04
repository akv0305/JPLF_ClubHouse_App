import { CalendarSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="h-11 w-full animate-pulse rounded-xl bg-[#E7E5E4] sm:w-56" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-[#E7E5E4]" />
      </div>
      <div className="mt-6">
        <CalendarSkeleton />
      </div>
    </div>
  );
}
