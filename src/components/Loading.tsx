export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-bg-tertiary rounded w-3/4"></div>
      <div className="h-4 bg-bg-tertiary rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-20 bg-bg-tertiary rounded"></div>
        <div className="h-20 bg-bg-tertiary rounded"></div>
        <div className="h-20 bg-bg-tertiary rounded"></div>
      </div>
    </div>
  );
}

