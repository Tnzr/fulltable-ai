// Shared Miami sample records used by both Network Map and Event Sourcing.
// They mirror the 25 organizer, 36 upcoming_event and 5 event_source rows saved in the backend,
// in the same order, so both screens always show identical records.

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

const sources: readonly string[] = ['Google Places directory', 'Ticketmaster Discovery', 'Scrape.do official local sites', 'Pasted link', 'Overture Maps directory'];

// name, type, area, lat, lng, verified, hasContact
type OrgRow = readonly [string, string, string, number, number, boolean, boolean];
const orgRows: readonly OrgRow[] = [
  ['Biscayne Bay Sailing Club', 'Sports club', 'Coconut Grove', 25.729, -80.238, true, true],
  ['Brickell Tech Collective', 'Corporate community', 'Brickell', 25.765, -80.193, true, true],
  ['Wynwood Arts District Association', 'Association', 'Wynwood', 25.8015, -80.199, false, false],
  ['Miami Alumni Network', 'Alumni group', 'Downtown Miami', 25.7743, -80.1937, false, true],
  ['Coral Gables Business Council', 'Association', 'Coral Gables', 25.7215, -80.2684, true, true],
  ['Miami Beach Hotel Concierge Alliance', 'Hospitality association', 'South Beach', 25.7826, -80.1341, true, true],
  ['Little Havana Cultural Society', 'Cultural group', 'Little Havana', 25.766, -80.219, true, true],
  ['University of Miami Alumni Chapter', 'Alumni group', 'Coral Gables', 25.7217, -80.279, true, true],
  ['FIU Business Network', 'Education', 'Sweetwater', 25.755, -80.37, false, false],
  ['Design District Merchants', 'Association', 'Design District', 25.813, -80.193, true, true],
  ['Key Biscayne Yacht Club', 'Sports club', 'Key Biscayne', 25.693, -80.162, true, true],
  ['Doral Corporate Forum', 'Corporate community', 'Doral', 25.8195, -80.3553, true, true],
  ['Wynwood Run Club', 'Sports club', 'Wynwood', 25.801, -80.199, true, true],
  ['Miami Medical Society', 'Professional association', 'Health District', 25.7905, -80.211, true, true],
  ['Coconut Grove Arts Guild', 'Cultural group', 'Coconut Grove', 25.728, -80.243, false, false],
  ['Edgewater Neighbors Association', 'Neighborhood group', 'Edgewater', 25.795, -80.19, true, true],
  ['Miami Foodies Meetup', 'Social club', 'Downtown Miami', 25.775, -80.195, true, true],
  ['Port Miami Logistics Council', 'Corporate community', 'PortMiami', 25.778, -80.17, false, false],
  ['Kendall Rotary Club', 'Service club', 'Kendall', 25.687, -80.317, true, true],
  ['Miami Beach Wedding Planners', 'Event organizer', 'Miami Beach', 25.79, -80.13, false, false],
  ['Brickell Young Professionals', 'Corporate community', 'Brickell', 25.76, -80.192, true, true],
  ['Overtown Heritage Foundation', 'Nonprofit', 'Overtown', 25.787, -80.2, true, true],
  ['Coral Gables Garden Club', 'Social club', 'Coral Gables', 25.75, -80.26, true, true],
  ['Miami Startup Collective', 'Corporate community', 'Downtown Miami', 25.777, -80.19, true, true],
  ['Sunny Isles Hospitality Group', 'Hospitality association', 'Sunny Isles Beach', 25.95, -80.123, false, false],
];

export const organizers: readonly NetworkOrganizer[] = orgRows.map((r, i) => ({
  id: 'o' + (i + 1),
  name: r[0],
  type: r[1],
  area: r[2],
  lat: r[3],
  lng: r[4],
  verification: r[5] ? 'VERIFIED' : 'UNVERIFIED',
  contact: r[6] ? 'Business route on file' : null,
}));

// title, organizer index, date label, category, size, recurring, stage, source index, verified, missing
type EvRow = readonly [string, number, string, string, number, boolean, FunnelStage, number, boolean, string];
const evRows: readonly EvRow[] = [
  ['Sailing club regatta dinner', 0, 'Nov 17', 'Sports club', 120, false, 'qualified', 3, true, 'None'],
  ['Brickell tech meetup, monthly', 1, 'Nov 19', 'Corporate community', 60, true, 'deduplicated', 1, true, 'None'],
  ['Wynwood gallery night', 2, 'Dec 4', 'Public festival', 400, true, 'needs_review', 2, false, 'Sponsorship check, contact route'],
  ['Alumni reunion weekend', 3, 'Dec 12', 'Alumni group', 200, false, 'discovered', 3, false, 'Group size'],
  ['Business council breakfast', 4, 'Jan 14', 'Association', 80, true, 'qualified', 1, true, 'None'],
  ['Hotel concierge networking breakfast', 5, 'Nov 12', 'Hospitality association', 45, true, 'qualified', 1, true, 'None'],
  ['Little Havana cultural supper', 6, 'Nov 21', 'Cultural group', 70, false, 'qualified', 3, true, 'None'],
  ['UM alumni homecoming dinner', 7, 'Nov 14', 'Alumni group', 150, false, 'qualified', 2, true, 'None'],
  ['FIU business mixer', 8, 'Nov 25', 'Education', 90, false, 'discovered', 2, false, 'Contact route'],
  ['Design District merchants lunch', 9, 'Nov 18', 'Association', 55, true, 'deduplicated', 1, true, 'None'],
  ['Key Biscayne yacht club awards night', 10, 'Dec 6', 'Sports club', 110, false, 'qualified', 3, true, 'None'],
  ['Doral corporate forum luncheon', 11, 'Dec 2', 'Corporate community', 130, false, 'deduplicated', 4, true, 'None'],
  ['Wynwood run club social', 12, 'Nov 20', 'Sports club', 85, true, 'qualified', 2, true, 'None'],
  ['Medical society dinner', 13, 'Dec 9', 'Professional association', 100, false, 'qualified', 3, true, 'None'],
  ['Coconut Grove art walk after-party', 14, 'Dec 13', 'Cultural group', 140, false, 'needs_review', 2, false, 'Contact route, sponsorship check'],
  ['Edgewater neighbors potluck', 15, 'Nov 16', 'Neighborhood group', 40, true, 'qualified', 4, true, 'None'],
  ['Miami foodies tasting night', 16, 'Nov 24', 'Social club', 35, true, 'qualified', 3, true, 'None'],
  ['Port logistics council summit dinner', 17, 'Dec 10', 'Corporate community', 180, false, 'discovered', 4, false, 'Contact route'],
  ['Kendall Rotary weekly lunch', 18, 'Nov 19', 'Service club', 50, true, 'qualified', 1, true, 'None'],
  ['Wedding planners showcase', 19, 'Dec 15', 'Event organizer', 120, false, 'needs_review', 2, false, 'Contact route'],
  ['Brickell young professionals happy hour', 20, 'Nov 13', 'Corporate community', 75, true, 'qualified', 4, true, 'None'],
  ['Overtown heritage gala', 21, 'Jan 23', 'Nonprofit', 220, false, 'deduplicated', 1, true, 'None'],
  ['Garden club holiday luncheon', 22, 'Dec 11', 'Social club', 65, false, 'qualified', 3, true, 'None'],
  ['Startup collective demo day dinner', 23, 'Dec 3', 'Corporate community', 95, false, 'deduplicated', 4, true, 'None'],
  ['Sunny Isles hospitality owners forum', 24, 'Jan 20', 'Hospitality association', 60, false, 'discovered', 2, false, 'Contact route'],
  ['Concierge alliance holiday party', 5, 'Dec 17', 'Hospitality association', 90, false, 'qualified', 3, true, 'None'],
  ['Tech collective hack night', 1, 'Dec 10', 'Corporate community', 50, true, 'qualified', 4, true, 'None'],
  ['Sailing club winter regatta', 0, 'Jan 9', 'Sports club', 100, false, 'deduplicated', 1, true, 'None'],
  ['Young alumni mixer', 3, 'Jan 28', 'Alumni group', 80, false, 'discovered', 3, false, 'Group size'],
  ['Business council breakfast, February', 4, 'Feb 11', 'Association', 80, true, 'qualified', 1, true, 'None'],
  ['Wynwood gallery night, January', 2, 'Jan 8', 'Public festival', 380, true, 'needs_review', 2, false, 'Sponsorship check, contact route'],
  ['UM alumni spring reunion', 7, 'Mar 6', 'Alumni group', 160, false, 'discovered', 2, true, 'None'],
  ['Run club half marathon dinner', 12, 'Feb 13', 'Sports club', 140, false, 'qualified', 3, true, 'None'],
  ['Design District holiday market lunch', 9, 'Dec 16', 'Association', 70, false, 'qualified', 4, true, 'None'],
  ['Medical society CME lunch', 13, 'Jan 13', 'Professional association', 60, true, 'qualified', 1, true, 'None'],
  ['Startup March demo night', 23, 'Mar 4', 'Corporate community', 100, false, 'discovered', 4, false, 'Contact route'],
];

const whyByStage: Record<FunnelStage, string> = {
  qualified: 'Fits a quiet service window and matches profile preferences.',
  deduplicated: 'Merged across sources; awaiting qualification against calendar gaps.',
  discovered: 'Newly discovered; dining demand not confirmed.',
  needs_review: 'Needs review. Attendance is not proof of dining demand and no discount is triggered.',
};

export const events: readonly NetworkEvent[] = evRows.map((r, i) => {
  const org = organizers[r[1]];
  return {
    id: 'e' + (i + 1),
    title: r[0],
    organizerId: org.id,
    date: r[2],
    category: r[3],
    size: r[4],
    recurring: r[5],
    stage: r[6],
    why: whyByStage[r[6]],
    source: sources[r[7]],
    verification: r[8] ? 'VERIFIED' : 'UNVERIFIED',
    missing: r[9],
    lat: org.lat + (i % 3) * 0.0007,
    lng: org.lng + (i % 2) * 0.0007,
  };
});

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
