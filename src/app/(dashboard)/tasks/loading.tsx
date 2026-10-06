import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-8 md:px-8 md:pt-14" aria-busy>
      <span className="sr-only">Loading tasks…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-4 w-11" />
            <Skeleton className="size-[18px] rounded-full" />
            <Skeleton className="h-4 flex-1" style={{ maxWidth: `${70 - (index % 3) * 12}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
