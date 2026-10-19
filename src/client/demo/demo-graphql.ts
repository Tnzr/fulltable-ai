// Demo build only. Answers the lead-engine and network-map GraphQL operations from a browser-local
// store seeded with public Miami-Dade data (see demo/geo/build_seed.py), so "Run engine" on
// Event Sourcing really populates organizers and events that then show up on the Network Map.
import seed from './data/miami-seed.json';

type Vars = Record<string, unknown> | undefined;
interface Resp<T> {
  data: T | null;
  error: { message: string } | null;
}
interface PoolOrg {
  name: string; type: string; address: string; lat: number; lng: number; area: string; score: number;
  category: string; eventLabel: string; partySize: number; perYear: number; hasContact: boolean;
}
interface Org { id: string; name: string; organizerType: string; address: string; latitude: number; longitude: number; businessContactRoute: string | null; verificationStatus: string }
interface Ev {
  id: string; title: string; startsAt: string | null; latitude: number | null; longitude: number | null; expectedSize: number | null;
  category: string; isRecurring: boolean; funnelStage: string; matchExplanation: string; verificationStatus: string;
  missingFields: string; organizer: { id: string } | null; source: { name: string } | null;
}
interface State { cursor: Record<string, number>; organizers: Org[]; events: Ev[] }

export const LEAD_STORE_KEY = 'fulltable-ai.demo.lead-engine';
const pools = seed.pools as Record<string, PoolOrg[]>;
const DAY = 86_400_000;

function load(): State {
  try {
    const raw = window.localStorage.getItem(LEAD_STORE_KEY);
    if (raw !== null) return JSON.parse(raw) as State;
  } catch { /* fall through */ }
  return { cursor: {}, organizers: [], events: [] };
}
function save(s: State): void {
  window.localStorage.setItem(LEAD_STORE_KEY, JSON.stringify(s));
}
const ok = <T,>(data: T): Resp<T> => ({ data, error: null });

function stage(o: PoolOrg, i: number): string {
  if (!o.hasContact) return 'needs_review';
  if (o.score >= 88) return 'qualified';
  return i % 2 === 0 ? 'deduplicated' : 'discovered';
}

function scrape(sourceId: string, max: number): Resp<unknown> {
  const src = seed.sources.find((s) => s.id === sourceId);
  const pool = pools[sourceId];
  if (src === undefined || pool === undefined) {
    return ok({ leadEngineScrapeEventSourceV2: { eventsExtracted: 0, organizersExtracted: 0, rejectedReason: 'Source needs an API key before it can run.' } });
  }
  const s = load();
  const from = s.cursor[sourceId] ?? 0;
  const batch = pool.slice(from, from + Math.min(max, 30));
  const today = new Date();
  today.setHours(19, 0, 0, 0);
  batch.forEach((o, k) => {
    const i = from + k;
    const orgId = `${sourceId}-org-${i}`;
    s.organizers.push({
      id: orgId, name: o.name, organizerType: o.type, address: `${o.area} · ${o.address}`, latitude: o.lat, longitude: o.lng,
      businessContactRoute: o.hasContact ? 'Public filing address; business line on IRS Form 990' : null,
      verificationStatus: o.hasContact && o.score >= 88 ? 'VERIFIED' : 'UNVERIFIED',
    });
    s.events.push({
      id: `${sourceId}-ev-${i}`, title: `${o.name}: ${o.eventLabel}`,
      startsAt: new Date(today.getTime() + (3 + ((i * 5) % 40)) * DAY).toISOString(),
      latitude: null, longitude: null, expectedSize: o.partySize, category: o.category, isRecurring: true, funnelStage: stage(o, i),
      matchExplanation: `${o.type} in ${o.area} (fit score ${o.score}). About ${o.perYear} group meals a year of ~${o.partySize} guests; recurring ${o.eventLabel} that fits a slow weeknight.`,
      verificationStatus: 'UNVERIFIED', missingFields: o.hasContact ? 'confirmed date' : 'contact route, confirmed date',
      organizer: { id: orgId }, source: { name: src.name },
    });
  });
  s.cursor[sourceId] = from + batch.length;
  save(s);
  return ok({
    leadEngineScrapeEventSourceV2: {
      eventsExtracted: batch.length, organizersExtracted: batch.length,
      rejectedReason: batch.length === 0 ? 'No new listings: every organization in this source is already in the registry.' : null,
    },
  });
}

function netData(): Resp<unknown> {
  const s = load();
  return ok({
    restaurantAccount: {
      items: seed.restaurants.map((r, i) => ({
        id: `rest-${i}`, name: r.name, tier: r.seats >= 120 ? 'Large' : 'Mid', address: `${r.area} · ${r.address} · ${r.seats} seats`,
        latitude: r.lat, longitude: r.lng, nearHotel: false,
      })),
    },
    organizer: { items: s.organizers },
    upcomingEvent: { items: [...s.events].sort((a, b) => (a.startsAt ?? '').localeCompare(b.startsAt ?? '')) },
  });
}

function addLink(vars: Vars): Resp<unknown> {
  const input = (vars?.input ?? {}) as Partial<Ev> & { sourceLink?: string };
  const s = load();
  const id = `pasted-${s.events.length}`;
  s.events.push({
    id, title: input.title ?? 'Pasted event', startsAt: null, latitude: null, longitude: null, expectedSize: null, category: 'Other',
    isRecurring: false, funnelStage: 'discovered', matchExplanation: input.matchExplanation ?? '', verificationStatus: 'UNVERIFIED',
    missingFields: input.missingFields ?? '', organizer: null, source: { name: 'Pasted link' },
  });
  save(s);
  return ok({ createUpcomingEvent: { id } });
}

/** Returns a demo response for the operations it knows, or null to fall through to the real client. */
export function demoGraphql(gql: string, vars: Vars): Resp<unknown> | null {
  if (/query\s+LeadSources/.test(gql)) return ok({ eventSource: { items: seed.sources } });
  if (/query\s+NetData/.test(gql)) return netData();
  if (/mutation\s+Scrape/.test(gql)) return scrape(String(vars?.sourceId ?? ''), Number(vars?.maxListings ?? 25));
  if (/mutation\s+AddLink/.test(gql)) return addLink(vars);
  return null;
}

export function wrapGraphql<G extends { query: (...a: never[]) => unknown; mutate: (...a: never[]) => unknown }>(real: G): G {
  const handle = (method: 'query' | 'mutate') => async (gql: string, vars?: Record<string, unknown>, opts?: unknown) => {
    const hit = demoGraphql(gql, vars);
    if (hit !== null) return hit;
    return (real[method] as unknown as (g: string, v?: unknown, o?: unknown) => Promise<unknown>).call(real, gql, vars, opts);
  };
  return new Proxy(real, {
    get: (t, p) => (p === 'query' ? handle('query') : p === 'mutate' ? handle('mutate') : Reflect.get(t, p, t)),
  });
}
