import * as React from 'react';
import { NetworkMapView, type MapTier } from '../views/network-map.view';

export default function NetworkMapContainer(): React.ReactElement {
  const [tier, setTier] = React.useState<MapTier>('STANDARD');
  const [radius, setRadius] = React.useState(10);
  return (
    <NetworkMapView
      tier={tier}
      onTier={setTier}
      radius={radius}
      onRadius={setRadius}
      showAnalytics={true}
    />
  );
}
