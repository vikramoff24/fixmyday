import { Skeleton } from "@/components/ui/skeleton";

export default function TodayLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pt-8 md:px-8 md:pt-14" aria-busy>
      <span className="sr-only">Loading your day…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <Skeleton className="hidden h-[60px] w-full rounded-xl md:block" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-1.5 w-full" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-4 w-11" />
            <Skeleton className="size-[18px] rounded-full" />
            <Skeleton className="h-4 flex-1" style={{ maxWidth: `${60 - index * 6}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
