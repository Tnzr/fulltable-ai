// Demo build only. Two-sided group-dining store: Organization / Event Coordinators publish group
// profiles and dining requests; restaurants see nearby group demand, plan themed nights and compete
// with offers. Everything lives in localStorage; profiles are also seeded from the public feeds
// (Meetup groups, Luma calendars, IRS organizations) in miami-seed.json.
import seed from './data/miami-seed.json';

export const COORDINATOR_ROLE_ID = 'demo-org-event-coordinator';
const KEY = 'fulltable-ai.demo.group-market';
const RESTAURANT_KEY = 'fulltable-ai.demo.my-restaurant';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const SLOW_DAYS: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu'];
export const THEMES = ['Networking', 'Sports & fitness', 'Social & singles', 'Family & community', 'Faith & service', 'Arts & music', 'Tech & startups', 'Celebration'] as const;
export const CADENCE = { weekly: 4.3, biweekly: 2.15, monthly: 1, occasional: 0.25 } as const;
export type Cadence = keyof typeof CADENCE;
export const DIETS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'Alcohol-free'] as const;

export interface GroupProfile {
  id: string; name: string; orgType: string; area: string; lat: number; lng: number; size: number;
  cadence: Cadence; days: Weekday[]; budget: number; diets: string[]; theme: string; ageBand: string;
  source: 'Coordinator' | 'Meetup' | 'Luma' | 'IRS registry'; members: number | null; owner: string | null;
}
export interface DiningRequest {
  id: string; profileId: string; date: string; size: number; budget: number; notes: string;
  status: 'open' | 'booked'; acceptedOfferId: string | null; createdAt: string;
}
export interface Offer {
  id: string; requestId: string; restaurant: string; pricePerGuest: number; perk: string; slot: string;
  byYou: boolean; createdAt: string;
}
interface Market { profiles: GroupProfile[]; requests: DiningRequest[]; offers: Offer[] }
export interface Restaurant { name: string; address: string; lat: number; lng: number; seats: number; area: string }

// Fast-food chains and mis-filed licences don't take group bookings.
const NOT_GROUP_VENUE = /mcdonald|wendy|burger king|subway|taco bell|kfc|popeyes|starbucks|dunkin|chick-fil|domino|pizza hut|realty|\binc\b/i;
export const RESTAURANTS: readonly Restaurant[] = (seed.restaurants as Restaurant[]).filter((r) => !NOT_GROUP_VENUE.test(r.name));

const CUISINES: [RegExp, string][] = [
  [/sushi|japan|ramen|sakura|izakaya/i, 'Japanese'], [/ital|pizz|trattoria|pasta|osteria/i, 'Italian'],
  [/mexic|taco|cantina|tex/i, 'Mexican'], [/cuba|havana|latin|colomb|peru|venez|arepa/i, 'Latin'],
  [/steak|grill|bbq|smoke|churrasc/i, 'Grill & steak'], [/sea ?food|fish|oyster|crab|lobster/i, 'Seafood'],
  [/thai|viet|pho|china|chinese|wok|asia|korea|indian|curry/i, 'Asian'], [/cafe|caf[eé]|coffee|bakery|brunch/i, 'Café & brunch'],
  [/bar|pub|tavern|brew|taproom|sports/i, 'Bar & pub'],
];
const CUISINE_THEMES: Record<string, string[]> = {
  'Bar & pub': ['Sports & fitness', 'Social & singles', 'Networking'], 'Grill & steak': ['Networking', 'Celebration', 'Sports & fitness'],
  Italian: ['Family & community', 'Celebration', 'Faith & service'], Latin: ['Arts & music', 'Family & community', 'Celebration'],
  Japanese: ['Tech & startups', 'Networking'], Asian: ['Tech & startups', 'Family & community'], Seafood: ['Celebration', 'Networking'],
  Mexican: ['Social & singles', 'Sports & fitness', 'Family & community'], 'Café & brunch': ['Faith & service', 'Family & community', 'Tech & startups'],
  'American & other': ['Family & community', 'Networking', 'Sports & fitness'],
};
const DIET_FRIENDLY: Record<string, string[]> = {
  Asian: ['Vegetarian', 'Vegan', 'Halal'], Italian: ['Vegetarian'], Mexican: ['Vegetarian', 'Gluten-free'], Japanese: ['Gluten-free'],
  'Café & brunch': ['Vegetarian', 'Vegan', 'Gluten-free', 'Alcohol-free'], Seafood: ['Gluten-free', 'Kosher'], Latin: ['Gluten-free'],
};

export function cuisineOf(r: Restaurant): string {
  return CUISINES.find(([re]) => re.test(r.name))?.[1] ?? 'American & other';
}
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
/** Typical spend per guest, a stand-in until restaurants fill in their own profile. */
export function priceOf(r: Restaurant): number {
  return [22, 32, 45, 60][hash(r.name) % 4]!;
}
export function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

export interface Match { restaurant: Restaurant; score: number; distance: number; reasons: string[]; cuisine: string; price: number }

/** Profile-based fit, 0-100. Distance, room for the party, budget, theme and dietary fit, slow-night overlap. */
export function matchScore(p: GroupProfile, r: Restaurant): Match {
  const distance = miles(p, r);
  const cuisine = cuisineOf(r);
  const price = priceOf(r);
  const reasons: string[] = [];
  let s = 0;
  s += Math.max(0, 30 - distance * 5);
  if (distance <= 3) reasons.push(`${distance.toFixed(1)} mi away`);
  if (r.seats >= p.size * 2) { s += 20; reasons.push(`${r.seats} seats: room for ${p.size}`); } else if (r.seats >= p.size) s += 8;
  if (price <= p.budget) { s += 20; reasons.push(`~$${price}/guest within $${p.budget} budget`); } else if (price <= p.budget * 1.2) s += 8;
  if ((CUISINE_THEMES[cuisine] ?? []).includes(p.theme)) { s += 15; reasons.push(`${cuisine} suits ${p.theme.toLowerCase()} groups`); }
  const diets = DIET_FRIENDLY[cuisine] ?? [];
  if (p.diets.length > 0 && p.diets.every((d) => diets.includes(d))) { s += 5; reasons.push(`handles ${p.diets.join(', ').toLowerCase()}`); }
  const slow = p.days.filter((d) => SLOW_DAYS.includes(d));
  if (slow.length > 0) { s += 10; reasons.push(`${slow.join('/')} is a slow night, so better terms`); }
  return { restaurant: r, score: Math.round(Math.min(s, 100)), distance, reasons, cuisine, price };
}

export function topMatches(p: GroupProfile, n = 8): Match[] {
  return RESTAURANTS.map((r) => matchScore(p, r)).sort((a, b) => b.score - a.score || a.distance - b.distance).slice(0, n);
}

const THEME_BY_CATEGORY: [RegExp, string][] = [
  [/career|business|network|chamber|professional|association/i, 'Networking'], [/sport|fitness|team|league|athlet|run|yacht/i, 'Sports & fitness'],
  [/social|singles|dancing|club dinner|social club/i, 'Social & singles'], [/relig|spirit|church|faith|service club|rotary|lions|fratern/i, 'Faith & service'],
  [/art|music|culture|film|writing/i, 'Arts & music'], [/tech|science|startup|founder|ai/i, 'Tech & startups'],
  [/parent|family|school|pta|community|identity|language|health/i, 'Family & community'],
];
const themeFor = (text: string): string => THEME_BY_CATEGORY.find(([re]) => re.test(text))?.[1] ?? 'Family & community';

interface PoolRow { name: string; type: string; lat: number; lng: number; area: string; category: string; partySize: number; perYear: number; isRecurring?: boolean; members?: number | null; startsAt?: string | null }

function seededProfiles(): GroupProfile[] {
  const pools = seed.pools as Record<string, PoolRow[]>;
  const out = new Map<string, GroupProfile>();
  const add = (o: PoolRow, source: GroupProfile['source']): void => {
    if (out.has(o.name) || o.type === 'Venue') return;
    const h = hash(o.name);
    const day = o.startsAt ? WEEKDAYS[(new Date(o.startsAt).getDay() + 6) % 7]! : WEEKDAYS[h % 5]!;
    const cadence: Cadence = source === 'IRS registry' ? (o.perYear >= 24 ? 'biweekly' : o.perYear >= 12 ? 'monthly' : 'occasional') : o.isRecurring ? 'weekly' : 'occasional';
    out.set(o.name, {
      id: `seed-${h.toString(36)}`, name: o.name, orgType: o.type, area: o.area, lat: o.lat, lng: o.lng,
      size: Math.max(8, Math.min(o.partySize || 12, 60)), cadence, days: [day], budget: [25, 35, 45][h % 3]!,
      diets: h % 5 === 0 ? ['Vegetarian'] : [], theme: themeFor(`${o.category} ${o.type} ${o.name}`),
      ageBand: ['21–34', '25–44', '35–54', '45+'][h % 4]!, source, members: o.members ?? null, owner: null,
    });
  };
  (pools['src-feed-meetup'] ?? []).forEach((o) => add(o, 'Meetup'));
  (pools['src-feed-luma'] ?? []).filter((o) => 'startsAt' in o).forEach((o) => add(o, 'Luma'));
  [...(pools['src-irs-assoc'] ?? []), ...(pools['src-irs-teams'] ?? [])].forEach((o) => add(o, 'IRS registry'));
  return [...out.values()];
}

const SEEDED = seededProfiles();

function load(): Market {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw !== null) return JSON.parse(raw) as Market;
  } catch { /* fall through */ }
  return { profiles: [], requests: [], offers: [] };
}
function save(m: Market): void {
  window.localStorage.setItem(KEY, JSON.stringify(m));
}
const uid = (p: string): string => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function allProfiles(): GroupProfile[] {
  return [...load().profiles, ...SEEDED];
}
export function myProfile(owner: string): GroupProfile | null {
  return load().profiles.find((p) => p.owner === owner) ?? null;
}
export function saveProfile(p: GroupProfile): void {
  const m = load();
  m.profiles = [p, ...m.profiles.filter((x) => x.id !== p.id)];
  save(m);
}
export function requests(): DiningRequest[] {
  return load().requests;
}
export function offersFor(requestId: string): Offer[] {
  return load().offers.filter((o) => o.requestId === requestId).sort((a, b) => a.pricePerGuest - b.pricePerGuest);
}
export function profileById(id: string): GroupProfile | undefined {
  return allProfiles().find((p) => p.id === id);
}

const PERKS = ['Private room and a set menu', 'Free welcome drink per guest', 'Long table reserved, no room fee', 'Free dessert platter', '10% off for a standing monthly booking'];

/** Posts a request; the best-matching restaurants answer with competing offers (simulated in the demo). */
export function postRequest(p: GroupProfile, r: Omit<DiningRequest, 'id' | 'profileId' | 'status' | 'acceptedOfferId' | 'createdAt'>): DiningRequest {
  const m = load();
  const req: DiningRequest = { ...r, id: uid('req'), profileId: p.id, status: 'open', acceptedOfferId: null, createdAt: new Date().toISOString() };
  m.requests.unshift(req);
  topMatches({ ...p, size: r.size, budget: r.budget }, 3).forEach((x, i) => {
    m.offers.push({
      id: uid('off'), requestId: req.id, restaurant: x.restaurant.name, pricePerGuest: Math.min(x.price, r.budget) - i * 2,
      perk: PERKS[hash(x.restaurant.name) % PERKS.length]!, slot: '7:00 pm', byYou: false, createdAt: new Date().toISOString(),
    });
  });
  save(m);
  return req;
}
export function sendOffer(o: Omit<Offer, 'id' | 'createdAt' | 'byYou'>): void {
  const m = load();
  m.offers = m.offers.filter((x) => !(x.requestId === o.requestId && x.restaurant === o.restaurant));
  m.offers.push({ ...o, id: uid('off'), byYou: true, createdAt: new Date().toISOString() });
  save(m);
}
export function acceptOffer(requestId: string, offerId: string): void {
  const m = load();
  m.requests = m.requests.map((r) => (r.id === requestId ? { ...r, status: 'booked', acceptedOfferId: offerId } : r));
  save(m);
}

export function getMyRestaurant(): Restaurant {
  const name = window.localStorage.getItem(RESTAURANT_KEY);
  return RESTAURANTS.find((r) => r.name === name) ?? RESTAURANTS.find((r) => r.area === 'Wynwood') ?? RESTAURANTS[0]!;
}
export function setMyRestaurant(name: string): void {
  window.localStorage.setItem(RESTAURANT_KEY, name);
}

export interface ThemedNight { day: Weekday; theme: string; groups: number; guestsMonth: number; special: string; ageBand: string; avgBudget: number }

const SPECIALS: Record<string, string> = {
  Networking: 'After-work networking table: shared plates + one drink, fixed price per head',
  'Sports & fitness': 'Post-game / run-club recovery night: protein bowls and team pitchers',
  'Social & singles': 'Mixer night: long communal tables, happy-hour pricing to 9 pm',
  'Family & community': 'Community table: family-style platters, kids eat free under 10',
  'Faith & service': 'Service-club dinner: 3-course set menu with a private corner and A/V',
  'Arts & music': 'Live-music supper: local act, prix fixe for groups of 10+',
  'Tech & startups': 'Founders’ table: quiet room, Wi-Fi and a screen, set menu',
  Celebration: 'Group celebration package: cake, toast and a set menu',
};

/** For each slow night, the theme that most nearby groups who prefer that night share, with a matching weekly special. */
export function themedCalendar(nearby: GroupProfile[]): ThemedNight[] {
  return SLOW_DAYS.map((day) => {
    const on = nearby.filter((g) => g.days.includes(day));
    const byTheme = new Map<string, GroupProfile[]>();
    on.forEach((g) => byTheme.set(g.theme, [...(byTheme.get(g.theme) ?? []), g]));
    const [theme, gs] = [...byTheme.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? ['Family & community', []];
    const ages = new Map<string, number>();
    gs.forEach((g) => ages.set(g.ageBand, (ages.get(g.ageBand) ?? 0) + 1));
    return {
      day, theme, groups: gs.length,
      guestsMonth: Math.round(gs.reduce((s, g) => s + g.size * CADENCE[g.cadence], 0)),
      special: SPECIALS[theme] ?? SPECIALS['Family & community']!,
      ageBand: [...ages.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '25–44',
      avgBudget: gs.length ? Math.round(gs.reduce((s, g) => s + g.budget, 0) / gs.length) : 35,
    };
  });
}
