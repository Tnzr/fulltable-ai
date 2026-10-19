// Demo build only (vite.config.demo.ts aliases `@archie/react-sdk` here). Re-exports the real SDK
// and swaps the client's identity module for the browser-local demo one, so the SDK's own
// `useAuth`/`AuthGuard` see a working session without an Archie backend.
import * as React from 'react';
import { ArchieProvider as RealArchieProvider, type ArchieProviderProps } from '@archie-real/react-sdk';
import { createDemoAuth } from './demo-auth';
import { DemoSignInPanel } from './demo-sign-in-panel';

export * from '@archie-real/react-sdk';

const demoAuth = createDemoAuth();

export function ArchieProvider(props: ArchieProviderProps): React.ReactElement {
  const { client, ...rest } = props;
  const demoClient = React.useMemo(
    () =>
      new Proxy(client, {
        get: (target, prop) => (prop === 'auth' ? demoAuth : Reflect.get(target, prop, target)),
      }),
    [client],
  );
  return (
    <RealArchieProvider {...rest} client={demoClient}>
      {props.children}
      <DemoSignInPanel auth={demoAuth} />
    </RealArchieProvider>
  );
}
