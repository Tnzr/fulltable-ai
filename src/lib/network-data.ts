// Shared Miami sample records used by both Network Map and Event Sourcing.
// They mirror the organizer, upcoming_event and event_source rows in the backend.
// Until these screens read the tables directly, this module keeps the two screens identical.

export type Verification = 'VERIFIED' | 'UNVERIFIED';
export type FunnelStage = 'discovered' | 'deduplicated' | 'qualified' | 'needs_review';

export interface NetworkOrganizer {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly lat: number;
  readonly lng: number;
  readonly area: string;
  readonly contact: string | null;
  readonly verification: Verification;
}

export interface NetworkEvent {
  readonly id: string;
  readonly title: string;
  readonly organizerId: string;
  readonly date: string;
  readonly category: string;
  readonly size: number;
  readonly recurring: boolean;
  readonly stage: FunnelStage;
  readonly why: string;
  readonly source: string;
  readonly verification: Verification;
  readonly missing: string;
  readonly lat: number;
  readonly lng: number;
}

export const HOME_POINT = { lat: 25.7617, lng: -80.1918, name: 'Lumen Table (sample), Brickell' } as const;

export const organizers: readonly NetworkOrganizer[] = [
  { id: 'o1', name: 'Biscayne Bay Sailing Club', type: 'Sports club', lat: 25.729, lng: -80.238, area: 'Coconut Grove', contact: 'Business route on file', verification: 'VERIFIED' },
  { id: 'o2', name: 'Brickell Tech Collective', type: 'Corporate community', lat: 25.765, lng: -80.193, area: 'Brickell', contact: 'Business route on file', verification: 'VERIFIED' },
  { id: 'o3', name: 'Wynwood Arts District Association', type: 'Association', lat: 25.8015, lng: -80.199, area: 'Wynwood', contact: null, verification: 'UNVERIFIED' },
  { id: 'o4', name: 'Miami Alumni Network', type: 'Alumni group', lat: 25.7743, lng: -80.1937, area: 'Downtown Miami', contact: 'Business route on file', verification: 'UNVERIFIED' },
  { id: 'o5', name: 'Coral Gables Business Council', type: 'Association', lat: 25.7215, lng: -80.2684, area: 'Coral Gables', contact: 'Business route on file', verification: 'VERIFIED' },
];

export const events: readonly NetworkEvent[] = [
  { id: 'e1', title: 'Sailing club regatta dinner', organizerId: 'o1', date: 'Nov 17', category: 'Sports club', size: 120, recurring: false, stage: 'qualified', why: 'Falls on a quiet Tuesday evening, inside the radius.', source: 'Pasted link', verification: 'VERIFIED', missing: 'None', lat: 25.729, lng: -80.238 },
  { id: 'e2', title: 'Brickell tech meetup, monthly', organizerId: 'o2', date: 'Nov 19', category: 'Corporate community', size: 60, recurring: true, stage: 'deduplicated', why: 'Recurs monthly and fits the weekday lunch gap.', source: 'Ticketmaster Discovery', verification: 'VERIFIED', missing: 'None', lat: 25.765, lng: -80.193 },
  { id: 'e3', title: 'Wynwood gallery night', organizerId: 'o3', date: 'Dec 4', category: 'Public festival', size: 400, recurring: true, stage: 'needs_review', why: 'Major event. Attendance is not proof of dining demand and no discount is triggered.', source: 'Scrape.do official local sites', verification: 'UNVERIFIED', missing: 'Sponsorship check, contact route', lat: 25.8015, lng: -80.199 },
  { id: 'e4', title: 'Alumni reunion weekend', organizerId: 'o4', date: 'Dec 12', category: 'Alumni group', size: 200, recurring: false, stage: 'discovered', why: 'Large group, dining demand not confirmed.', source: 'Pasted link', verification: 'UNVERIFIED', missing: 'Group size', lat: 25.7743, lng: -80.1937 },
  { id: 'e5', title: 'Business council breakfast', organizerId: 'o5', date: 'Jan 14', category: 'Association', size: 80, recurring: true, stage: 'qualified', why: 'Recurring weekday group, outside peak hours.', source: 'Ticketmaster Discovery', verification: 'VERIFIED', missing: 'None', lat: 25.7215, lng: -80.2684 },
];

export const stageLabel: Record<FunnelStage, string> = {
  discovered: 'Discovered',
  deduplicated: 'Deduplicated',
  qualified: 'Qualified',
  needs_review: 'Needs review',
};

export const stageTone: Record<FunnelStage, 'ok' | 'info' | 'pending' | 'warn'> = {
  discovered: 'pending',
  deduplicated: 'info',
  qualified: 'ok',
  needs_review: 'warn',
};

export const categories: readonly string[] = Array.from(new Set(events.map((e) => e.category)));

export function distanceMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}
