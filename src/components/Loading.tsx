import ChessLoader from './ChessLoader';

export default function Loading() {
  return <ChessLoader />;
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

