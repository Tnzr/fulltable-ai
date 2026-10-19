// Demo build only. Full-screen "Demand map" at /demand-map: estimates, per Miami-Dade area, how many
// group-dining guests a month FullTable could route into partner restaurants' slow services, from
// public data (IRS exempt orgs, DBPR licensed seats). Assumptions come from demo/geo/build_seed.py.
import * as React from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import demand from './data/demand.json';
import { LEAD_STORE_KEY } from './demo-graphql';

const fmt = (n: number): string => n.toLocaleString('en-US');
const usd = (n: number): string => '$' + fmt(Math.round(n));

function usePath(): string {
  const [path, setPath] = React.useState(() => window.location.pathname);
  React.useEffect(() => {
    const t = window.setInterval(() => setPath(window.location.pathname), 400);
    return () => window.clearInterval(t);
  }, []);
  return path;
}

function acquiredCount(): number {
  try {
    const s = JSON.parse(window.localStorage.getItem(LEAD_STORE_KEY) ?? 'null') as { organizers: unknown[] } | null;
    return s?.organizers.length ?? 0;
  } catch {
    return 0;
  }
}

function Kpi(props: { label: string; value: string; note?: string; testId: string }): React.ReactElement {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-card p-3" data-testid={props.testId}>
      <span className="type-meta text-text-muted">{props.label}</span>
      <span className="text-2xl font-semibold text-foreground">{props.value}</span>
      {props.note !== undefined && <span className="type-meta text-text-muted">{props.note}</span>}
    </div>
  );
}

const SHORTCUT_ON = new Set(['/network-map', '/event-sourcing', '/overview']);

export function DemandMapOverlay(): React.ReactElement | null {
  const path = usePath();
  if (SHORTCUT_ON.has(path)) {
    return (
      <a href="/demand-map" data-testid="open-demand-map"
        className="fixed bottom-4 right-4 z-[1000] rounded-md bg-primary px-4 py-3 type-body text-primary-foreground shadow-lg">
        Open demand map
      </a>
    );
  }
  if (path !== '/demand-map') return null;
  return <DemandMap />;
}

function DemandMap(): React.ReactElement {
  const c = demand.citywide;
  const a = demand.assumptions;
  const areas = demand.areas.filter((x) => x.lat !== null && x.lng !== null && x.directableCoversMonth > 0);
  const max = Math.max(...areas.map((x) => x.directableCoversMonth));
  const [cover, setCover] = React.useState(5);
  const chosen = areas.slice(0, cover);
  const chosenCovers = chosen.reduce((s, x) => s + x.directableCoversMonth, 0);
  const acquired = acquiredCount();
  return (
    <div className="fixed inset-0 z-[1000] overflow-auto bg-background" data-testid="demand-map">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="type-meta text-text-muted">FullTable AI · Performance indicator map · Miami-Dade</p>
            <h1 className="text-2xl font-semibold text-foreground">Where group demand is, and how much we can route</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { window.location.href = '/event-sourcing'; }}>Event Sourcing</Button>
            <Button variant="outline" onClick={() => { window.location.href = '/network-map'; }}>Network Map</Button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Kpi testId="kpi-orgs" label="Organizations mapped" value={fmt(c.orgs)} note={`${fmt(acquired)} already pulled into the registry`} />
          <Kpi testId="kpi-restaurants" label="Restaurants 40+ seats" value={fmt(c.restaurants)} note="FL DBPR licence file" />
          <Kpi testId="kpi-directable" label="Directable guests / month" value={fmt(c.directableCoversMonth)} note={`${Math.round(a.capture_share * 100)}% capture of org group meals`} />
          <Kpi testId="kpi-revenue" label="Restaurant revenue / month" value={usd(c.restaurantRevenueMonthUsd)} note={`at ${usd(a.avg_check_usd)} per guest`} />
          <Kpi testId="kpi-fees" label="FullTable fees / month" value={usd(c.fullTableFeesMonthUsd)} note={`${usd(a.success_fee_usd)} per booked guest`} />
          <Kpi testId="kpi-hours" label="Prospecting hours" value={`${fmt(c.researchHoursAssisted)} vs ${fmt(c.researchHoursManual)}`} note="assisted vs by hand, all orgs" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="overflow-hidden rounded-card border border-border" style={{ height: 520 }}>
            <MapContainer center={[25.77, -80.27]} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              {areas.map((x, i) => (
                <CircleMarker key={x.area} center={[x.lat as number, x.lng as number]} radius={6 + 26 * Math.sqrt(x.directableCoversMonth / max)}
                  pathOptions={{ color: i < cover ? 'var(--primary)' : 'var(--chart-3)', fillOpacity: i < cover ? 0.55 : 0.25, weight: 2 }}>
                  <Tooltip>
                    <strong>{x.area}</strong><br />
                    {fmt(x.directableCoversMonth)} directable guests / month<br />
                    {fmt(x.orgs)} organizations · {fmt(x.restaurants)} restaurants<br />
                    {fmt(x.spareCoversMonth)} spare slow-period seats / month
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div className="flex flex-col gap-3 rounded-card border border-border p-4" data-testid="coverage-plan">
            <h2 className="type-row-title text-foreground">Coverage plan</h2>
            <label className="flex flex-col gap-1 type-meta text-text-muted">Areas covered by the sales team: {cover}
              <input type="range" min={1} max={Math.min(20, areas.length)} value={cover} onChange={(e) => setCover(Number(e.target.value))} data-testid="coverage-slider" />
            </label>
            <p className="type-body text-text-body" data-testid="coverage-summary">
              Covering the top <strong>{cover}</strong> areas reaches <strong>{fmt(chosenCovers)}</strong> guests a month
              ({Math.round((chosenCovers / c.directableCoversMonth) * 100)}% of the county), worth about <strong>{usd(chosenCovers * a.avg_check_usd)}</strong> to
              partner restaurants and <strong>{usd(chosenCovers * a.success_fee_usd)}</strong> in FullTable fees.
            </p>
            <ol className="flex flex-col gap-1">
              {chosen.map((x, i) => (
                <li key={x.area} className="flex justify-between gap-2 type-body text-text-body">
                  <span>{i + 1}. {x.area}</span>
                  <span className="text-text-muted">{fmt(x.directableCoversMonth)} · {fmt(x.orgs)} orgs</span>
                </li>
              ))}
            </ol>
            <p className="type-meta text-text-muted">
              Seats are not the constraint: spare slow-period capacity is about {fmt(Math.round(c.spareCoversMonth / c.demandCoversMonth))}× the organized demand,
              so the job is finding and converting groups.
            </p>
          </div>
        </section>

        <details className="rounded-card border border-border p-4 type-meta text-text-muted">
          <summary className="type-body text-text-body">How these numbers are estimated</summary>
          <p className="mt-2">Organizations: IRS exempt-organization registry geocoded with the Census geocoder; group meals per year and party size by organization type
            (e.g. social club 12 × 24 guests, service club 24 × 16). Capture share {a.capture_share}. Restaurants: Florida DBPR licences with 40+ seats; spare capacity =
            seats × {a.empty_seat_share} empty × {a.slow_services_per_month} slow services a month. Directable = min(demand, spare capacity) per area. Prospecting time:
            {' '}{a.manual_minutes_per_org} min per organization by hand vs {a.assisted_minutes_per_org} min to review an engine-qualified lead. All coefficients are
            assumptions to re-fit with pilot bookings; companies and schools outside the IRS file are not counted, so demand is conservative.</p>
        </details>
      </div>
    </div>
  );
}
