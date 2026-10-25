// Demo build only (vite.config.demo.ts aliases `@archie/react-sdk` here). Re-exports the real SDK
// and swaps the client's identity module for the browser-local demo one, so the SDK's own
// `useAuth`/`AuthGuard` see a working session without an Archie backend.
import * as React from 'react';
import { ArchieProvider as RealArchieProvider, type ArchieProviderProps } from '@archie-real/react-sdk';
import { createDemoAuth } from './demo-auth';
import { DemoSignInPanel } from './demo-sign-in-panel';
import { DemandMapOverlay } from './demand-map';
import { GroupPortalOverlay } from './group-portal';
import { wrapGraphql } from './demo-graphql';

export * from '@archie-real/react-sdk';

const demoAuth = createDemoAuth();

export function ArchieProvider(props: ArchieProviderProps): React.ReactElement {
  const { client, ...rest } = props;
  const demoClient = React.useMemo(() => {
    const graphql = wrapGraphql(client.graphql);
    return new Proxy(client, {
      get: (target, prop) => (prop === 'auth' ? demoAuth : prop === 'graphql' ? graphql : Reflect.get(target, prop, target)),
    });
  }, [client]);
  return (
    <RealArchieProvider {...rest} client={demoClient}>
      {props.children}
      <DemoSignInPanel auth={demoAuth} />
      <DemandMapOverlay />
      <GroupPortalOverlay auth={demoAuth} />
    </RealArchieProvider>
  );
}
