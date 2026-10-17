import { LoaderCircle } from 'lucide-react';

/**
 * Loading fallback component for Suspense boundaries
 * Displays while lazy-loaded components are being fetched
 * 
 * @example
 * <Suspense fallback={<LoadingFallback />}>
 *   <LazyComponent />
 * </Suspense>
 */
export function LoadingFallback() {
  return (
    <div data-vid="snzbk9d" className="min-h-[60vh] flex items-center justify-center">
      <div data-vid="1xc801n" className="flex flex-col items-center gap-4">
        <LoaderCircle data-vid="n85md0k" className="w-8 h-8 animate-spin text-primary" />
        <p data-vid="aaic7pv" className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

