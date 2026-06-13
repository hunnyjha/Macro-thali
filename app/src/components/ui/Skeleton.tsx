// Subtle skeleton placeholders for loading states.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl2 bg-white/[0.06] ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3 p-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}
