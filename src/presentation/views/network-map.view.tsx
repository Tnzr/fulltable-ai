import * as React from 'react';
import { PageHead, StatusChip } from '@/components';
import {
  HOME_POINT,
  categories,
  distanceMiles,
  events,
  organizers,
  restaurants,
  stageLabel,
  stageTone,
} from '@/lib/network-data';

export type MapTier = 'BASIC' | 'STANDARD' | 'PREMIUM';
export type MapStyle = 'schematic' | 'satellite';

export interface MapCamera {
  readonly lat: number;
  readonly lng: number;
  readonly zoom: number;
}

export interface MapSelection {
  readonly kind: 'event' | 'organizer';
  readonly id: string;
}

export interface MapProfile {
  readonly categories: readonly string[];
  readonly minSize: number;
  readonly verifiedOnly: boolean;
}

export interface NetworkMapViewProps {
  readonly tier: MapTier;
  readonly onTier: (tier: MapTier) => void;
  readonly radius: number;
  readonly onRadius: (miles: number) => void;
  readonly showAnalytics: boolean;
  readonly mapStyle: MapStyle;
  readonly onMapStyle: (style: MapStyle) => void;
  readonly camera: MapCamera;
  readonly onPan: (fracX: number, fracY: number) => void;
  readonly onZoom: (delta: number) => void;
  readonly onRecenter: () => void;
  readonly selection: MapSelection | null;
  readonly onSelect: (selection: MapSelection | null) => void;
  readonly profile: MapProfile;
  readonly onToggleCategory: (category: string) => void;
  readonly onMinSize: (size: number) => void;
  readonly onVerifiedOnly: (value: boolean) => void;
  readonly mapRef: React.RefCallback<HTMLDivElement>;
}

export const VIEW_W = 1024;
export const VIEW_H = 640;
const TILE = 256;

export function worldX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * TILE * Math.pow(2, zoom);
}

export function worldY(lat: number, zoom: number): number {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * TILE * Math.pow(2, zoom);
}

export function lngFromX(x: number, zoom: number): number {
  return (x / (TILE * Math.pow(2, zoom))) * 360 - 180;
}

export function latFromY(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / (TILE * Math.pow(2, zoom));
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

function tileUrl(style: MapStyle, zoom: number, x: number, y: number): string {
  if (style === 'satellite') {
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/' + zoom + '/' + y + '/' + x;
  }
  return 'https://tile.openstreetmap.org/' + zoom + '/' + x + '/' + y + '.png';
}

const tiers: readonly { id: MapTier; label: string; blurb: string }[] = [
  { id: 'BASIC', label: 'Basic', blurb: 'Your location and nearby verified groups.' },
  { id: 'STANDARD', label: 'Standard', blurb: 'Adds events, radius filter and demand routing.' },
  { id: 'PREMIUM', label: 'Premium', blurb: 'Adds demand heat by time and hotel proximity.' },
];

export function NetworkMapView(props: NetworkMapViewProps): React.ReactElement {
  const { tier, mapStyle, camera, selection, profile } = props;
  const standard = tier !== 'BASIC';
  const premium = tier === 'PREMIUM';
  const zoom = Math.round(camera.zoom);
  const originX = worldX(camera.lng, zoom) - VIEW_W / 2;
  const originY = worldY(camera.lat, zoom) - VIEW_H / 2;

  const tileXs: number[] = [];
  for (let x = Math.floor(originX / TILE); x <= Math.floor((originX + VIEW_W) / TILE); x += 1) tileXs.push(x);
  const tileYs: number[] = [];
  for (let y = Math.floor(originY / TILE); y <= Math.floor((originY + VIEW_H) / TILE); y += 1) tileYs.push(y);

  const homeDistance = (lat: number, lng: number): number => distanceMiles(HOME_POINT.lat, HOME_POINT.lng, lat, lng);
  const limit = standard ? props.radius : 5;

  const visibleOrganizers = organizers.filter((o) => homeDistance(o.lat, o.lng) <= limit && (!profile.verifiedOnly || o.verification === 'VERIFIED') && (!standard ? o.verification === 'VERIFIED' : true));
  const visibleEvents = standard
    ? events.filter((e) => homeDistance(e.lat, e.lng) <= limit && profile.categories.includes(e.category) && e.size >= profile.minSize && (!profile.verifiedOnly || e.verification === 'VERIFIED'))
    : [];

  const px = (lng: number): number => ((worldX(lng, zoom) - originX) / VIEW_W) * 100;
  const py = (lat: number): number => ((worldY(lat, zoom) - originY) / VIEW_H) * 100;
  const ringPx = (props.radius * 1609.34) / metersPerPixel(HOME_POINT.lat, zoom);

  const selectedEvent = selection !== null && selection.kind === 'event' ? events.find((e) => e.id === selection.id) : undefined;
  const selectedOrganizer = selection !== null && selection.kind === 'organizer' ? organizers.find((o) => o.id === selection.id) : undefined;
  const organizerOf = (id: string) => organizers.find((o) => o.id === id);

  const btn = 'min-h-11 min-w-11 rounded-md border border-border bg-background px-3 type-body text-foreground';
  const seg = (active: boolean): string => 'min-h-11 rounded-md border px-4 type-body ' + (active ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-text-body');

  return (
    <div data-vid="cxgccno" className="flex flex-col gap-6 p-6">
      <PageHead data-vid="dtmpond"
        title="Network Map"
        description="Groups and events around your restaurant in Miami, FL. Drag to move, zoom with the buttons, wheel or double-click, and select any pin or list entry for details. Records are the same ones shown in Event Sourcing."
      />

      <div data-vid="b2oj3ot" className="flex flex-wrap items-center gap-2">
        <div data-vid="xmee9d0" role="radiogroup" aria-label="Preview subscription tier" className="flex flex-wrap gap-2">
          {tiers.map((t) => (
            <button data-vid="9yu3rkj" key={t.id} type="button" role="radio" aria-checked={tier === t.id} onClick={() => props.onTier(t.id)} className={seg(tier === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <span data-vid="a1mep0d" className="type-meta text-text-muted">{tiers.find((t) => t.id === tier)?.blurb}</span>
        <div data-vid="tr36xy8" role="radiogroup" aria-label="Map style" className="ml-auto flex gap-2">
          {(['schematic', 'satellite'] as const).map((s) => (
            <button data-vid="vifdgx7" key={s} type="button" role="radio" aria-checked={mapStyle === s} onClick={() => props.onMapStyle(s)} className={seg(mapStyle === s)}>
              {s === 'schematic' ? 'Schematic' : 'Satellite'}
            </button>
          ))}
        </div>
      </div>

      <div data-vid="wuvszcc" className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div data-vid="jfbwqix" className="flex flex-col gap-3">
          <div data-vid="vkz7zyo"
            ref={props.mapRef}
            role="application"
            aria-label="Interactive map of Miami. Drag to move."
            className="relative w-full cursor-grab select-none overflow-hidden rounded-card border border-border bg-surface-sunken active:cursor-grabbing"
            style={{ aspectRatio: VIEW_W + ' / ' + VIEW_H, touchAction: 'none' }}
            onPointerMove={(e) => {
              if (e.buttons === 1) {
                const r = e.currentTarget.getBoundingClientRect();
                props.onPan(e.movementX / r.width, e.movementY / r.height);
              }
            }}
            onDoubleClick={() => props.onZoom(1)}
          >
            {tileYs.map((ty) =>
              tileXs.map((tx) => (
                <img data-vid="5pniqcw"
                  key={zoom + '-' + tx + '-' + ty + mapStyle}
                  src={tileUrl(mapStyle, zoom, tx, ty)}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute"
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
              <div data-vid="pxci49g"
                aria-hidden="true"
                className="pointer-events-none absolute rounded-full border-2 border-dashed"
                style={{
                  borderColor: 'var(--primary)',
                  left: px(HOME_POINT.lng) - (ringPx / VIEW_W) * 100 + '%',
                  top: py(HOME_POINT.lat) - (ringPx / VIEW_H) * 100 + '%',
                  width: ((2 * ringPx) / VIEW_W) * 100 + '%',
                  height: ((2 * ringPx) / VIEW_H) * 100 + '%',
                }}
              />
            )}

            {premium &&
              visibleEvents.map((e) => {
                const r = Math.max(14, e.size / 8);
                return (
                  <div data-vid="pmcl6ms"
                    key={'heat-' + e.id}
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded-full"
                    style={{
                      left: px(e.lng) - (r / VIEW_W) * 100 + '%',
                      top: py(e.lat) - (r / VIEW_H) * 100 + '%',
                      width: ((2 * r) / VIEW_W) * 100 + '%',
                      height: ((2 * r) / VIEW_H) * 100 + '%',
                      background: 'var(--primary)',
                      opacity: 0.28,
                      filter: 'blur(10px)',
                    }}
                  />
                );
              })}

            <div data-vid="dzbfki1" className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: px(HOME_POINT.lng) + '%', top: py(HOME_POINT.lat) + '%' }} title={HOME_POINT.name}>
              <span data-vid="9tdt1wv" className="block h-5 w-5 rounded-full border-2 border-white shadow" style={{ background: 'var(--primary)' }} />
            </div>

            {restaurants.map((r) => (
              <div data-vid="rst0001"
                key={'rest-' + r.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: px(r.lng) + '%', top: py(r.lat) + '%' }}
                title={r.name + ' (' + r.tier.toLowerCase() + ' tier)' + (r.nearHotel ? ', near a hotel' : '')}
              >
                <span data-vid="rst0002" className="block h-3.5 w-3.5 rounded-sm border-2 border-white shadow" style={{ background: 'var(--chart-1, var(--primary))' }} />
              </div>
            ))}

            {visibleOrganizers.map((o) => {
              const active = selection !== null && selection.kind === 'organizer' && selection.id === o.id;
              return (
                <button data-vid="vrv90qf"
                  key={o.id}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onClick={() => props.onSelect({ kind: 'organizer', id: o.id })}
                  aria-label={'Organizer: ' + o.name}
                  aria-pressed={active}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: px(o.lng) + '%', top: py(o.lat) + '%' }}
                >
                  <span data-vid="8vu7r3m" className={'block h-4 w-4 rounded-full border-2 border-white shadow ' + (active ? 'ring-2 ring-primary' : '')} style={{ background: 'var(--chart-2, var(--primary))' }} />
                  {active && <span data-vid="4tih00v" className="absolute left-5 top-0 whitespace-nowrap rounded bg-background/95 px-1 type-meta text-foreground">{o.name}</span>}
                </button>
              );
            })}

            {visibleEvents.map((e) => {
              const active = selection !== null && selection.kind === 'event' && selection.id === e.id;
              return (
                <button data-vid="qcljyak"
                  key={e.id}
                  type="button"
                  onPointerDown={(ev) => ev.stopPropagation()}
                  onDoubleClick={(ev) => ev.stopPropagation()}
                  onClick={() => props.onSelect({ kind: 'event', id: e.id })}
                  aria-label={'Event: ' + e.title}
                  aria-pressed={active}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: px(e.lng) + '%', top: py(e.lat) - 1.5 + '%' }}
                >
                  <span data-vid="as5iali" className={'block h-4 w-4 rotate-45 border-2 border-white shadow ' + (active ? 'ring-2 ring-primary' : '')} style={{ background: 'var(--chart-4, var(--primary))' }} />
                  {active && <span data-vid="wavn3xk" className="absolute left-5 top-0 whitespace-nowrap rounded bg-background/95 px-1 type-meta text-foreground">{e.title}</span>}
                </button>
              );
            })}

            <div data-vid="7a86u9i" className="absolute right-2 top-2 flex flex-col gap-1">
              <button data-vid="3hnz099" type="button" aria-label="Zoom in" onPointerDown={(e) => e.stopPropagation()} onClick={() => props.onZoom(1)} className={btn}>+</button>
              <button data-vid="0jc4cl6" type="button" aria-label="Zoom out" onPointerDown={(e) => e.stopPropagation()} onClick={() => props.onZoom(-1)} className={btn}>-</button>
              <button data-vid="ts33yjf" type="button" aria-label="Recenter on your restaurant" onPointerDown={(e) => e.stopPropagation()} onClick={props.onRecenter} className={btn}>Home</button>
            </div>

            <div data-vid="rst0003" className="pointer-events-none absolute bottom-6 left-2 flex flex-col gap-1 rounded bg-background/90 p-2 type-meta text-foreground">
              <span data-vid="rst0004">Large dot: your restaurant</span>
              <span data-vid="rst0005">Square: signed restaurants ({restaurants.length})</span>
              <span data-vid="rst0006">Circle: organizers. Diamond: events</span>
            </div>

            <span data-vid="dzov0qb" className="pointer-events-none absolute bottom-1 right-2 rounded bg-background/80 px-1 type-meta text-text-muted">
              {mapStyle === 'satellite' ? 'Imagery: Esri, Maxar, Earthstar Geographics' : 'Map data: OpenStreetMap contributors'}
            </span>
          </div>

          {standard ? (
            <label data-vid="qi8l0qx" className="flex items-center gap-3 type-body text-text-body">
              Radius: {props.radius} miles
              <input data-vid="sy230jb" type="range" min={3} max={15} step={1} value={props.radius} onChange={(e) => props.onRadius(Number(e.target.value))} aria-label="Radius in miles" className="flex-1" />
            </label>
          ) : (
            <p data-vid="1z0c32i" className="type-body text-text-muted">Events, radius filter and profile filters unlock on Standard.</p>
          )}

          {(selectedEvent !== undefined || selectedOrganizer !== undefined) && (
            <section data-vid="o2iaxm1" className="flex flex-col gap-2 rounded-card border border-border p-4" aria-live="polite">
              {selectedEvent !== undefined && (
                <>
                  <div data-vid="4pfqo92" className="flex flex-wrap items-center gap-2">
                    <h2 data-vid="itc613w" className="type-row-title text-foreground">{selectedEvent.title}</h2>
                    <StatusChip data-vid="fohd4uy" label={stageLabel[selectedEvent.stage]} tone={stageTone[selectedEvent.stage]} />
                  </div>
                  <p data-vid="5cfrvul" className="type-body text-text-body">{selectedEvent.date}. {selectedEvent.category}. About {selectedEvent.size} guests{selectedEvent.recurring ? ', recurring' : ''}. {homeDistance(selectedEvent.lat, selectedEvent.lng).toFixed(1)} miles away.</p>
                  <p data-vid="p5f5g3e" className="type-body text-text-body">Why it matches: {selectedEvent.why}</p>
                  <p data-vid="c1jxfv7" className="type-meta text-text-muted">Organizer: {organizerOf(selectedEvent.organizerId)?.name}. Source: {selectedEvent.source}. Missing: {selectedEvent.missing}.</p>
                </>
              )}
              {selectedOrganizer !== undefined && (
                <>
                  <div data-vid="uc7enq2" className="flex flex-wrap items-center gap-2">
                    <h2 data-vid="p3rfoo7" className="type-row-title text-foreground">{selectedOrganizer.name}</h2>
                    <StatusChip data-vid="8ihw3o2" label={selectedOrganizer.verification === 'VERIFIED' ? 'Verified' : 'Unverified'} tone={selectedOrganizer.verification === 'VERIFIED' ? 'ok' : 'pending'} />
                  </div>
                  <p data-vid="yer4b67" className="type-body text-text-body">{selectedOrganizer.type}, {selectedOrganizer.area}. {homeDistance(selectedOrganizer.lat, selectedOrganizer.lng).toFixed(1)} miles away.</p>
                  <p data-vid="ml9dmdq" className="type-meta text-text-muted">Contact route: {selectedOrganizer.contact ?? 'Missing'}. Upcoming events: {events.filter((e) => e.organizerId === selectedOrganizer.id).length}.</p>
                </>
              )}
              <div data-vid="b1q238q">
                <button data-vid="ftco6c9" type="button" onClick={() => props.onSelect(null)} className={btn}>Clear selection</button>
              </div>
            </section>
          )}
        </div>

        <aside data-vid="jv5y78v" className="flex flex-col gap-4">
          {standard && (
            <section data-vid="d7x8j4g" className="rounded-card border border-border p-4">
              <h2 data-vid="hzkjwc6" className="type-row-title text-foreground">Profile preferences</h2>
              <fieldset data-vid="njkr1j3" className="mt-3 flex flex-col gap-2">
                <legend data-vid="sb6gmi4" className="type-meta text-text-muted">Event types</legend>
                {categories.map((c) => (
                  <label data-vid="koqnlrc" key={c} className="flex min-h-11 items-center gap-2 type-body text-text-body">
                    <input data-vid="uc2hjj1" type="checkbox" checked={profile.categories.includes(c)} onChange={() => props.onToggleCategory(c)} />
                    {c}
                  </label>
                ))}
              </fieldset>
              <label data-vid="hw7aho4" className="mt-3 flex items-center gap-3 type-body text-text-body">
                Minimum group: {profile.minSize}
                <input data-vid="qjdsy2o" type="range" min={0} max={300} step={20} value={profile.minSize} onChange={(e) => props.onMinSize(Number(e.target.value))} aria-label="Minimum group size" className="flex-1" />
              </label>
              <label data-vid="jrkw6rl" className="mt-2 flex min-h-11 items-center gap-2 type-body text-text-body">
                <input data-vid="4wjq1bu" type="checkbox" checked={profile.verifiedOnly} onChange={(e) => props.onVerifiedOnly(e.target.checked)} />
                Verified only
              </label>
            </section>
          )}

          <section data-vid="reqay5w" className="rounded-card border border-border p-4">
            <h2 data-vid="75j1flp" className="type-row-title text-foreground">Events ({visibleEvents.length})</h2>
            {visibleEvents.length === 0 ? (
              <p data-vid="aodjd5w" className="mt-3 type-body text-text-muted">{standard ? 'No events match these preferences.' : 'Events unlock on Standard.'}</p>
            ) : (
              <ul data-vid="7fzy435" className="mt-3 flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
                {visibleEvents.map((e) => (
                  <li data-vid="8jyghsg" key={e.id}>
                    <button data-vid="nhtlihh"
                      type="button"
                      onClick={() => props.onSelect({ kind: 'event', id: e.id })}
                      aria-pressed={selection !== null && selection.kind === 'event' && selection.id === e.id}
                      className={'flex min-h-11 w-full flex-col gap-1 rounded-md border p-3 text-left ' + (selection !== null && selection.kind === 'event' && selection.id === e.id ? 'border-primary' : 'border-border')}
                    >
                      <span data-vid="etvz4vs" className="type-body text-foreground">{e.title}</span>
                      <span data-vid="slwst00" className="type-meta text-text-muted">{e.date}. {e.size} guests. {homeDistance(e.lat, e.lng).toFixed(1)} miles. {stageLabel[e.stage]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section data-vid="dpm86ws" className="rounded-card border border-border p-4">
            <h2 data-vid="nssl3ga" className="type-row-title text-foreground">Organizers ({visibleOrganizers.length})</h2>
            <ul data-vid="3v0kmxz" className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
              {visibleOrganizers.map((o) => (
                <li data-vid="nehjduf" key={o.id}>
                  <button data-vid="720qad5"
                    type="button"
                    onClick={() => props.onSelect({ kind: 'organizer', id: o.id })}
                    aria-pressed={selection !== null && selection.kind === 'organizer' && selection.id === o.id}
                    className={'flex min-h-11 w-full flex-col gap-1 rounded-md border p-3 text-left ' + (selection !== null && selection.kind === 'organizer' && selection.id === o.id ? 'border-primary' : 'border-border')}
                  >
                    <span data-vid="s02ymqk" className="type-body text-foreground">{o.name}</span>
                    <span data-vid="krpjo8c" className="type-meta text-text-muted">{o.type}. {homeDistance(o.lat, o.lng).toFixed(1)} miles. {o.verification === 'VERIFIED' ? 'Verified' : 'Unverified'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {props.showAnalytics && (
            <section data-vid="qjcpx93" className="rounded-card border border-border p-4">
              <h2 data-vid="gzg088j" className="type-row-title text-foreground">Restaurant analytics and projections</h2>
              <ul data-vid="ful1i56" className="mt-3 flex flex-col gap-2 type-body text-text-body">
                <li data-vid="ulu5oe5">Verified groups in view: {visibleOrganizers.filter((o) => o.verification === 'VERIFIED').length}.</li>
                <li data-vid="oaiy2pi">Qualified events in view: {visibleEvents.filter((e) => e.stage === 'qualified').length}.</li>
                <li data-vid="ru4n049">Projected fill of quiet Tuesdays: 18 to 30 seats.</li>
              </ul>
              <p data-vid="qzg5b95" className="mt-2 type-meta text-text-muted">Signals with stated assumptions on sample data, not forecasts. Attendance is not proof of dining demand.</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
