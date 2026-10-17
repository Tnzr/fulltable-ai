import * as React from 'react';
import { HOME_POINT, categories, events, organizers } from '@/lib/network-data';
import {
  NetworkMapView,
  VIEW_H,
  VIEW_W,
  latFromY,
  lngFromX,
  worldX,
  worldY,
  type MapCamera,
  type MapProfile,
  type MapSelection,
  type MapStyle,
  type MapTier,
} from '../views/network-map.view';

const MIN_ZOOM = 10;
const MAX_ZOOM = 17;
const HOME_CAMERA: MapCamera = { lat: HOME_POINT.lat, lng: HOME_POINT.lng, zoom: 12 };

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

export default function NetworkMapContainer(): React.ReactElement {
  const [tier, setTier] = React.useState<MapTier>('STANDARD');
  const [radius, setRadius] = React.useState(10);
  const [mapStyle, setMapStyle] = React.useState<MapStyle>('schematic');
  const [camera, setCamera] = React.useState<MapCamera>(HOME_CAMERA);
  const [selection, setSelection] = React.useState<MapSelection | null>(null);
  const [profile, setProfile] = React.useState<MapProfile>({ categories: categories, minSize: 0, verifiedOnly: false });

  const onPan = React.useCallback((fx: number, fy: number) => {
    setCamera((c) => {
      const z = Math.round(c.zoom);
      const cx = worldX(c.lng, z) - fx * VIEW_W;
      const cy = worldY(c.lat, z) - fy * VIEW_H;
      return { lat: latFromY(cy, z), lng: lngFromX(cx, z), zoom: c.zoom };
    });
  }, []);

  const onZoom = React.useCallback((delta: number) => {
    setCamera((c) => ({ ...c, zoom: clampZoom(Math.round(c.zoom) + delta) }));
  }, []);

  const wheelHandler = React.useRef<((e: WheelEvent) => void) | null>(null);
  const lastWheel = React.useRef(0);
  const mapRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node === null) return;
    const handler = (e: WheelEvent): void => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel.current < 180) return;
      lastWheel.current = now;
      onZoom(e.deltaY < 0 ? 1 : -1);
    };
    wheelHandler.current = handler;
    node.addEventListener('wheel', handler, { passive: false });
  }, [onZoom]);

  const onSelect = React.useCallback((s: MapSelection | null) => {
    setSelection(s);
    if (s === null) return;
    const target = s.kind === 'event' ? events.find((e) => e.id === s.id) : organizers.find((o) => o.id === s.id);
    if (target !== undefined) setCamera((c) => ({ ...c, lat: target.lat, lng: target.lng }));
  }, []);

  const onToggleCategory = React.useCallback((category: string) => {
    setProfile((p) => ({
      ...p,
      categories: p.categories.includes(category) ? p.categories.filter((c) => c !== category) : [...p.categories, category],
    }));
  }, []);

  return (
    <NetworkMapView data-vid="x53phlg"
      tier={tier}
      onTier={setTier}
      radius={radius}
      onRadius={setRadius}
      showAnalytics={true}
      mapStyle={mapStyle}
      onMapStyle={setMapStyle}
      camera={camera}
      onPan={onPan}
      onZoom={onZoom}
      onRecenter={() => setCamera(HOME_CAMERA)}
      selection={selection}
      onSelect={onSelect}
      profile={profile}
      onToggleCategory={onToggleCategory}
      onMinSize={(minSize) => setProfile((p) => ({ ...p, minSize }))}
      onVerifiedOnly={(verifiedOnly) => setProfile((p) => ({ ...p, verifiedOnly }))}
      mapRef={mapRef}
    />
  );
}
