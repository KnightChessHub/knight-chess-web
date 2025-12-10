export default function Skeleton({ className = '', width, height }: { className?: string; width?: string | number; height?: string | number }) {
  return (
    <div
      className={`bg-bg-tertiary rounded-lg animate-shimmer ${className}`}
      style={{ width: width || '100%', height: height || '1rem' }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <Skeleton height="1.5rem" width="60%" />
      <Skeleton height="1rem" width="80%" />
      <Skeleton height="1rem" width="40%" />
    </div>
  );
}

export function SkeletonRatingCard() {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton height="0.75rem" width="40%" />
          <Skeleton height="2rem" width="60%" />
          <Skeleton height="0.75rem" width="50%" />
        </div>
        <Skeleton height="3rem" width="3rem" className="rounded-xl" />
      </div>
    </div>
  );
}

