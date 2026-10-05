import { Skeleton } from "@/components/ui/skeleton";

export default function InsightsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pt-8 md:px-8 md:pt-14" aria-busy>
      <span className="sr-only">Loading insights…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Skeleton className="h-14 w-56" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}
