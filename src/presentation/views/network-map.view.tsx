import * as React from 'react';
import { PageHead, StatusChip } from '@/components';

export type MapTier = 'BASIC' | 'STANDARD' | 'PREMIUM';
export type MapStyle = 'schematic' | 'satellite';

export interface NetworkMapViewProps {
  readonly tier: MapTier;
  readonly onTier: (tier: MapTier) => void;
  readonly radius: number;
  readonly onRadius: (miles: number) => void;
  readonly showAnalytics: boolean;
  readonly mapStyle: MapStyle;
  readonly onMapStyle: (style: MapStyle) => void;
}

interface Pin {
  readonly id: string;
  readonly kind: 'restaurant' | 'group' | 'event';
  readonly name: string;
  readonly lat: number;
  readonly lng: number;
  readonly note: string;
}

const HOME = { lat: 25.7617, lng: -80.1918 };
const ZOOM = 12;
const VIEW_W = 1024;
const VIEW_H = 768;
const TILE = 256;

const pins: readonly Pin[] = [
  { id: 'r', kind: 'restaurant', name: 'Lumen Table', lat: 25.7617, lng: -80.1918, note: 'Your restaurant (sample), Brickell' },
  { id: 'g1', kind: 'group', name: 'Biscayne Bay Sailing Club', lat: 25.729, lng: -80.238, note: 'Verified group, Coconut Grove' },
  { id: 'g2', kind: 'group', name: 'Brickell Tech Collective', lat: 25.765, lng: -80.193, note: 'Verified group, monthly' },
  { id: 'g3', kind: 'group', name: 'Coral Gables Business Council', lat: 25.7215, lng: -80.2684, note: 'Verified group, recurring breakfast' },
  { id: 'g4', kind: 'group', name: 'Miami Alumni Network', lat: 25.7743, lng: -80.1937, note: 'Unverified, group size missing' },
  { id: 'e1', kind: 'event', name: 'Regatta dinner, Nov 17', lat: 25.729, lng: -80.238, note: 'Fits Tuesday evening gap' },
  { id: 'e2', kind: 'event', name: 'Wynwood gallery night, Dec 4', lat: 25.8015, lng: -80.199, note: 'Major event. Not proof of dining demand.' },
  { id: 'e3', kind: 'event', name: 'Alumni reunion, Dec 12', lat: 25.7743, lng: -80.1937, note: 'Dining demand not confirmed' },
];

const colors: Record<Pin['kind'], string> = {
  restaurant: 'var(--primary)',
  group: 'var(--chart-2, var(--primary))',
  event: 'var(--chart-4, var(--primary))',
};

const tiers: readonly { id: MapTier; label: string; blurb: string }[] = [
  { id: 'BASIC', label: 'Basic', blurb: 'Your location and nearby verified groups.' },
  { id: 'STANDARD', label: 'Standard', blurb: 'Adds events, radius filter and demand routing.' },
  { id: 'PREMIUM', label: 'Premium', blurb: 'Adds demand heat by time and hotel proximity.' },
];

function worldX(lng: number): number {
  return ((lng + 180) / 360) * TILE * Math.pow(2, ZOOM);
}

function worldY(lat: number): number {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * TILE * Math.pow(2, ZOOM);
}

function miles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

const originX = worldX(HOME.lng) - VIEW_W / 2;
const originY = worldY(HOME.lat) - VIEW_H / 2;
const pxPerMile = 1609.34 / ((156543.03392 * Math.cos((HOME.lat * Math.PI) / 180)) / Math.pow(2, ZOOM));
const pxPerMileFixed = 1 / (1609.34 / ((156543.03392 * Math.cos((HOME.lat * Math.PI) / 180)) / Math.pow(2, ZOOM)));

const tileCols: number[] = [];
for (let x = Math.floor(originX / TILE); x <= Math.floor((originX + VIEW_W) / TILE); x += 1) tileCols.push(x);
const tileRows: number[] = [];
for (let y = Math.floor(originY / TILE); y <= Math.floor((originY + VIEW_H) / TILE); y += 1) tileRows.push(y);

function tileUrl(style: MapStyle, x: number, y: number): string {
  if (style === 'satellite') {
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/' + ZOOM + '/' + y + '/' + x;
  }
  return 'https://tile.openstreetmap.org/' + ZOOM + '/' + x + '/' + y + '.png';
}

export function NetworkMapView(props: NetworkMapViewProps): React.ReactElement {
  const { tier, mapStyle } = props;
  const standard = tier !== 'BASIC';
  const premium = tier === 'PREMIUM';
  const mileSpan = pxPerMile > 0 ? pxPerMileFixed : 1;
  const withDistance = pins.map((p) => ({ pin: p, miles: miles(HOME.lat, HOME.lng, p.lat, p.lng) }));
  const visible = withDistance.filter(({ pin, miles: m }) => {
    if (pin.kind === 'restaurant') return true;
    if (pin.kind === 'event' && !standard) return false;
    return standard ? m <= props.radius : m <= 5;
  });
  const radiusPx = props.radius / mileSpan / 1 > 0 ? (props.radius / (1 / (1609.34 / ((156543.03392 * Math.cos((HOME.lat * Math.PI) / 180)) / Math.pow(2, ZOOM))))) : 0;
  const circleR = props.radius * (1 / (1609.34 / ((156543.03392 * Math.cos((HOME.lat * Math.PI) / 180)) / Math.pow(2, ZOOM))));
  void radiusPx;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHead
        title="Network Map"
        description="Groups and events around your restaurant in Miami, FL. Layers depend on your subscription tier. Pins are sample records until the directory is connected."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Preview subscription tier" className="flex flex-wrap gap-2">
          {tiers.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={tier === t.id}
              onClick={() => props.onTier(t.id)}
              className={'min-h-11 rounded-md border px-4 type-body ' + (tier === t.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-text-body')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="type-meta text-text-muted">{tiers.find((t) => t.id === tier)?.blurb}</span>
        <div role="radiogroup" aria-label="Map style" className="ml-auto flex gap-2">
          {(['schematic', 'satellite'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={mapStyle === s}
              onClick={() => props.onMapStyle(s)}
              className={'min-h-11 rounded-md border px-4 type-body ' + (mapStyle === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-text-body')}
            >
              {s === 'schematic' ? 'Schematic' : 'Satellite'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="relative w-full overflow-hidden rounded-card border border-border bg-surface-sunken" style={{ aspectRatio: VIEW_W + ' / ' + VIEW_H }}>
            {tileRows.map((ty) =>
              tileCols.map((tx) => (
                <img
                  key={tx + '-' + ty + mapStyle}
                  src={tileUrl(mapStyle, tx, ty)}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="absolute select-none"
                  style={{
                    left: ((tx * TILE - originX) / VIEW_W) * 100 + '%',
                    top: ((ty * TILE - originY) / VIEW_H) * 100 + '%',
                    width: (TILE / VIEW_W) * 100 + '%',
                    height: (TILE / VIEW_H) * 100 + '%',
                  }}
                />
              )),
            )}

            {standard && (
              <div
                aria-hidden="true"
                className="absolute rounded-full border-2 border-dashed"
                style={{
                  borderColor: 'var(--primary)',
                  left: (0.5 - circleR / VIEW_W) * 100 + '%',
                  top: (0.5 - circleR / VIEW_H) * 100 + '%',
                  width: ((2 * circleR) / VIEW_W) * 100 + '%',
                  height: ((2 * circleR) / VIEW_H) * 100 + '%',
                }}
              />
            )}

            {premium && (
              <>
                <div aria-hidden="true" className="absolute rounded-full" style={{ left: '30%', top: '52%', width: '18%', height: '24%', background: 'var(--primary)', opacity: 0.25, filter: 'blur(14px)' }} />
                <div aria-hidden="true" className="absolute rounded-full" style={{ left: '44%', top: '38%', width: '14%', height: '18%', background: 'var(--primary)', opacity: 0.25, filter: 'blur(14px)' }} />
              </>
            )}

            {visible.map(({ pin }) => (
              <div
                key={pin.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: ((worldX(pin.lng) - originX) / VIEW_W) * 100 + '%', top: ((worldY(pin.lat) - originY) / VIEW_H) * 100 + '%' }}
                title={pin.name + '. ' + pin.note}
              >
                <span
                  className="block rounded-full border-2 border-white shadow"
                  style={{ width: pin.kind === 'restaurant' ? 20 : 14, height: pin.kind === 'restaurant' ? 20 : 14, background: colors[pin.kind] }}
                />
                <span className="absolute left-4 top-0 whitespace-nowrap rounded bg-background/90 px-1 type-meta text-foreground">{pin.name}</span>
              </div>
            ))}

            <span className="absolute bottom-1 right-2 rounded bg-background/80 px-1 type-meta text-text-muted">
              {mapStyle === 'satellite' ? 'Imagery: Esri, Maxar, Earthstar Geographics' : 'Map data: OpenStreetMap contributors'}
            </span>
          </div>

          {standard ? (
            <label className="flex items-center gap-3 type-body text-text-body">
              Radius: {props.radius} miles
              <input type="range" min={3} max={15} step={1} value={props.radius} onChange={(e) => props.onRadius(Number(e.target.value))} aria-label="Radius in miles" className="flex-1" />
            </label>
          ) : (
            <p className="type-body text-text-muted">Radius filter and events unlock on Standard.</p>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-card border border-border p-4">
            <h2 className="type-row-title text-foreground">Nearby</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {visible.filter(({ pin }) => pin.kind !== 'restaurant').map(({ pin, miles: m }) => (
                <li key={pin.id} className="flex flex-col gap-1">
                  <span className="type-body text-foreground">{pin.name}</span>
                  <span className="type-meta text-text-muted">{m.toFixed(1)} miles. {pin.note}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-card border border-border p-4">
            <h2 className="type-row-title text-foreground">Layers</h2>
            <ul className="mt-3 flex flex-col gap-2 type-body text-text-body">
              <li className="flex items-center justify-between">Own location and verified groups <StatusChip label="On" tone="ok" /></li>
              <li className="flex items-center justify-between">Events and radius filter <StatusChip label={standard ? 'On' : 'Standard'} tone={standard ? 'ok' : 'neutral'} /></li>
              <li className="flex items-center justify-between">Demand routing overlay <StatusChip label={standard ? 'On' : 'Standard'} tone={standard ? 'ok' : 'neutral'} /></li>
              <li className="flex items-center justify-between">Demand heat by time <StatusChip label={premium ? 'Sample' : 'Premium'} tone={premium ? 'info' : 'neutral'} /></li>
              <li className="flex items-center justify-between">Hotel proximity signals <StatusChip label={premium ? 'Sample' : 'Premium'} tone={premium ? 'info' : 'neutral'} /></li>
            </ul>
          </section>

          {props.showAnalytics && (
            <section className="rounded-card border border-border p-4">
              <h2 className="type-row-title text-foreground">Restaurant analytics and projections</h2>
              <ul className="mt-3 flex flex-col gap-2 type-body text-text-body">
                <li>Verified groups within 5 miles: 2.</li>
                <li>Projected fill of quiet Tuesdays: 18 to 30 seats.</li>
                <li>Conversion from qualified group to booking: 12 to 20 percent.</li>
              </ul>
              <p className="mt-2 type-meta text-text-muted">Signals with stated assumptions on sample data, not forecasts. Attendance is not proof of dining demand.</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
