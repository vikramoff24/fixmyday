import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="flex w-full flex-col gap-5 px-4 pt-8 md:px-8 md:pt-10" aria-busy>
      <span className="sr-only">Loading calendar…</span>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-5 w-44" />
        </div>
        <Skeleton className="h-8 w-56" />
      </div>
      <Skeleton className="h-[calc(100dvh-13rem)] w-full rounded-xl md:h-[calc(100dvh-10.5rem)]" />
    </div>
  );
}
