import * as React from 'react';
import { PageHead, StatusChip } from '@/components';

export type MapTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface NetworkMapViewProps {
  readonly tier: MapTier;
  readonly onTier: (tier: MapTier) => void;
  readonly radius: number;
  readonly onRadius: (miles: number) => void;
  readonly showAnalytics: boolean;
}

interface Pin {
  readonly id: string;
  readonly kind: 'restaurant' | 'group' | 'event';
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly miles: number;
  readonly note: string;
}

const pins: readonly Pin[] = [
  { id: 'r', kind: 'restaurant', name: 'Your restaurant', x: 50, y: 50, miles: 0, note: 'Lumen Table (sample)' },
  { id: 'g1', kind: 'group', name: 'Harbor Rowing Club', x: 38, y: 44, miles: 2.4, note: 'Verified group, 120 members' },
  { id: 'g2', kind: 'group', name: 'Riverside Tech Meetup', x: 64, y: 38, miles: 3.8, note: 'Verified group, monthly' },
  { id: 'g3', kind: 'group', name: 'Lakeview Alumni', x: 78, y: 66, miles: 9.5, note: 'Unverified, needs contact route' },
  { id: 'e1', kind: 'event', name: 'Regatta dinner, Mar 14', x: 34, y: 58, miles: 3.1, note: 'Fits Tuesday evening gap' },
  { id: 'e2', kind: 'event', name: 'Downtown Arts Walk, Apr 18', x: 56, y: 70, miles: 4.6, note: 'Major event. Not proof of dining demand.' },
  { id: 'e3', kind: 'event', name: 'Alumni weekend, Apr 4', x: 84, y: 28, miles: 12.2, note: 'Conflicts with protected period' },
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

export function NetworkMapView(props: NetworkMapViewProps): React.ReactElement {
  const { tier } = props;
  const standard = tier !== 'BASIC';
  const premium = tier === 'PREMIUM';
  const visible = pins.filter((p) => {
    if (p.kind === 'restaurant') return true;
    if (p.kind === 'event' && !standard) return false;
    if (p.kind === 'group' && p.miles > 15) return false;
    return standard ? p.miles <= props.radius : p.miles <= 5;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHead
        title="Network Map"
        description="Groups and events around your restaurant. Layers depend on your subscription tier. Sample locations until the geocoded directory is connected."
      />

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
        <span className="self-center type-meta text-text-muted">{tiers.find((t) => t.id === tier)?.blurb}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-border bg-surface-sunken">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-label="Map of nearby groups and events">
              {premium && (
                <g aria-hidden="true">
                  <circle cx="44" cy="52" r="16" fill="var(--primary)" opacity="0.12" />
                  <circle cx="60" cy="62" r="12" fill="var(--primary)" opacity="0.12" />
                </g>
              )}
              {standard && (
                <circle cx="50" cy="50" r={Math.min(48, props.radius * 3.6)} fill="none" stroke="var(--primary)" strokeDasharray="2 2" strokeWidth="0.4" />
              )}
            </svg>
            {visible.map((p) => (
              <div
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: p.x + '%', top: p.y + '%' }}
                title={p.name + '. ' + p.note}
              >
                <span
                  className="block rounded-full border-2 border-background"
                  style={{ width: p.kind === 'restaurant' ? 18 : 12, height: p.kind === 'restaurant' ? 18 : 12, background: colors[p.kind] }}
                />
                <span className="absolute left-3 top-0 whitespace-nowrap type-meta text-foreground">{p.name}</span>
              </div>
            ))}
          </div>
          <p className="type-meta text-text-muted">Schematic sample view. A live basemap needs the geocoded directory and a maps key.</p>

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
              {visible.filter((p) => p.kind !== 'restaurant').map((p) => (
                <li key={p.id} className="flex flex-col gap-1">
                  <span className="type-body text-foreground">{p.name}</span>
                  <span className="type-meta text-text-muted">{p.miles} miles. {p.note}</span>
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
              <li className="flex items-center justify-between">Demand heat by time <StatusChip label={premium ? 'On' : 'Premium'} tone={premium ? 'ok' : 'neutral'} /></li>
              <li className="flex items-center justify-between">Hotel proximity signals <StatusChip label={premium ? 'Sample' : 'Premium'} tone={premium ? 'info' : 'neutral'} /></li>
            </ul>
          </section>

          {props.showAnalytics && (
            <section className="rounded-card border border-border p-4">
              <h2 className="type-row-title text-foreground">Restaurant analytics and projections</h2>
              <ul className="mt-3 flex flex-col gap-2 type-body text-text-body">
                <li>Groups within 5 miles: 2 verified, 1 unverified.</li>
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
