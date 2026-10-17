import { useEffect, useState } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router';
import { TriangleAlert, Home, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { autoReloadIfImportFailure, readSessionStorage } from './error-boundary.policy';

/**
 * Error Boundary component for React Router v7
 * Catches and displays errors that occur during routing or rendering
 * 
 * @example
 * // In router configuration
 * {
 *   path: '/',
 *   element: <Layout />,
 *   errorElement: <ErrorBoundary />,
 * }
 */
export function ErrorBoundary() {
  const error = useRouteError();
  const [reloading, setReloading] = useState(false);

  // A lazy route chunk that failed to load (expired preview session, stale
  // deploy) recovers with one document reload; the policy owns the loop guard.
  useEffect(() => {
    const storage = readSessionStorage();
    const now = Date.now();
    autoReloadIfImportFailure(error, storage, now, () => {
      setReloading(true);
      window.location.reload();
    });
  }, [error]);

  if (reloading) {
    return (
      <div data-vid="bbio4pz" className="min-h-screen flex items-center justify-center bg-background p-4">
        <p data-vid="8jkijqs" className="text-sm text-muted-foreground">Reloading…</p>
      </div>
    );
  }

  let errorMessage: string;
  let errorStatus: number | undefined;

  if (isRouteErrorResponse(error)) {
    // Error from router (404, 500, etc.)
    errorMessage = error.statusText || error.data?.message || 'An error occurred';
    errorStatus = error.status;
  } else if (error instanceof Error) {
    // JavaScript error
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Unknown error occurred';
  }

  return (
    <div data-vid="cq5y3vp" className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card data-vid="645oe6d" className="max-w-lg w-full border-destructive/50">
        <CardHeader data-vid="vytjr38">
          <div data-vid="ivna3aq" className="flex items-center gap-4">
            <div data-vid="5wd10v2" className="p-3 rounded-full bg-destructive/10">
              <TriangleAlert data-vid="8u6xvi3" className="w-6 h-6 text-destructive" />
            </div>
            <div data-vid="69ro1np">
              <CardTitle data-vid="xp7d9vx" className="text-2xl">
                {errorStatus ? `Error ${errorStatus}` : 'Something went wrong'}
              </CardTitle>
              <CardDescription data-vid="xbac0om">
                An unexpected error has occurred
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent data-vid="9ao2tps" className="space-y-4">
          <div data-vid="x21rith" className="bg-muted p-4 rounded-lg">
            <p data-vid="025axqq" className="text-sm font-mono text-muted-foreground break-words">
              {errorMessage}
            </p>
          </div>

          <div data-vid="o1aydsc" className="flex flex-col sm:flex-row gap-2">
            <Button data-vid="u1uy32r" asChild className="flex-1">
              <Link data-vid="ar7j1f6" to="/">
                <Home data-vid="1ek3ajc" className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button data-vid="sv4v9ui" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              <RefreshCw data-vid="ife7sni" className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          </div>

          {import.meta.env.DEV && error instanceof Error && (
            <details data-vid="31q0jw3" className="mt-4">
              <summary data-vid="ubtn4er" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                View stack trace (dev only)
              </summary>
              <pre data-vid="bus5pxx" className="mt-2 text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

