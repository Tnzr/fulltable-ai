// Demo build only. Restaurant CRM for group-dining and event-organizer relationships, kept in localStorage
// per restaurant. Seeded history is simulated from nearby group profiles so the analytics have something
// to show; every monetary figure comes from economics() and the editable assumptions below.
import {
  CADENCE, SLOW_DAYS, WEEKDAYS, acceptedFor, allProfiles, matchScore, miles, priceOf,
  type GroupProfile, type Restaurant, type Weekday,
} from './group-store';

export const STAGES = ['Prospect', 'Contacted', 'Proposal', 'Booked', 'Recurring', 'Lapsed'] as const;
export type Stage = (typeof STAGES)[number];
/** Chance an account at this stage books in the next 90 days (pipeline weighting). */
export const STAGE_WIN: Record<Stage, number> = { Prospect: 0.05, Contacted: 0.15, Proposal: 0.4, Booked: 0.7, Recurring: 0.9, Lapsed: 0.1 };
export const ACTIVITY_KINDS = ['Call', 'Email', 'Visit', 'Offer sent', 'Note', 'Feedback'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface Account {
  id: string; profileId: string; name: string; orgType: string; area: string; source: string; size: number;
  cadence: GroupProfile['cadence']; days: Weekday[]; theme: string; stage: Stage; fit: number; distance: number;
  contactName: string; contactEmail: string; contactPhone: string; nextAction: string; nextDate: string; createdAt: string;
}
export interface Activity { id: string; accountId: string; kind: ActivityKind; text: string; at: string }
export type BookingStatus = 'Completed' | 'Upcoming' | 'Cancelled' | 'No-show';
export interface Booking { id: string; accountId: string; date: string; guests: number; spendPerGuest: number; status: BookingStatus; rating: number | null }
export interface Crm { accounts: Account[]; activities: Activity[]; bookings: Booking[] }

export interface Assumptions {
  foodBevCost: number; variableLabor: number; cardFees: number; slowIncremental: number; peakIncremental: number;
  subscription: number; feePerGuest: number; salesTax: number; laborShare: number; hourlyWage: number;
  emptySeatShare: number; minutesPerOutreach: number;
}
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  foodBevCost: 0.3, variableLabor: 0.1, cardFees: 0.03, slowIncremental: 0.85, peakIncremental: 0.3,
  subscription: 299, feePerGuest: 2, salesTax: 0.07, laborShare: 0.3, hourlyWage: 18, emptySeatShare: 0.35, minutesPerOutreach: 18,
};
export const ASSUMPTION_LABELS: Record<keyof Assumptions, [string, 'pct' | 'usd' | 'num', string]> = {
  foodBevCost: ['Food & beverage cost', 'pct', 'share of group revenue (industry 28–35%)'],
  variableLabor: ['Extra labor for the group', 'pct', 'staff already on shift are not counted'],
  cardFees: ['Card processing', 'pct', 'of revenue'],
  slowIncremental: ['Incremental share, Mon–Thu', 'pct', 'seats that would otherwise be empty'],
  peakIncremental: ['Incremental share, Fri–Sun', 'pct', 'the rest displaces walk-ins'],
  subscription: ['FullTable subscription / month', 'usd', 'Growth plan'],
  feePerGuest: ['FullTable fee / booked guest', 'usd', 'success fee'],
  salesTax: ['Sales tax', 'pct', 'Florida 6% + Miami-Dade 1%'],
  laborShare: ['Wages as share of revenue', 'pct', 'local wage income supported'],
  hourlyWage: ['Average staff wage / hour', 'usd', 'Miami server/cook blend'],
  emptySeatShare: ['Empty seats on slow nights', 'pct', 'Mon–Thu dinner'],
  minutesPerOutreach: ['Manual minutes per outreach touch', 'num', 'research + message by hand'],
};

const DAY = 86_400_000;
const KEY = (r: string): string => `fulltable-ai.demo.crm.${r}`;
const AKEY = 'fulltable-ai.demo.crm.assumptions';
const uid = (p: string): string => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const iso = (t: number): string => new Date(t).toISOString().slice(0, 10);
export const dayOf = (date: string): Weekday => WEEKDAYS[(new Date(date + 'T12:00:00').getDay() + 6) % 7]!;

function rng(seed: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
const FIRST = ['Ana', 'Carlos', 'Maria', 'Jorge', 'Sofia', 'Luis', 'Valeria', 'Daniel', 'Camila', 'Andre', 'Nicole', 'Marcus', 'Priya', 'Kevin', 'Gabriela', 'Sam'];
const LAST = ['Garcia', 'Rodriguez', 'Perez', 'Johnson', 'Hernandez', 'Lopez', 'Martinez', 'Smith', 'Diaz', 'Brown', 'Alvarez', 'Nguyen'];

/** Simulated six months of relationship history so the dashboard is populated on first open. */
function seed(me: Restaurant): Crm {
  const r = rng(me.name);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
  const now = Date.now();
  const nearby = allProfiles().filter((p) => miles(p, me) <= 3)
    .map((p) => ({ p, m: matchScore(p, me) })).sort((a, b) => b.m.score - a.m.score).slice(0, Math.max(10, Math.min(36, Math.round(me.seats / 2.5))));
  const spend = priceOf(me) * 1.15;
  const out: Crm = { accounts: [], activities: [], bookings: [] };
  const STAGE_MIX: Stage[] = ['Recurring', 'Recurring', 'Recurring', 'Booked', 'Booked', 'Booked', 'Proposal', 'Proposal', 'Contacted', 'Contacted', 'Contacted', 'Prospect', 'Prospect', 'Prospect', 'Lapsed'];
  nearby.forEach(({ p, m }, i) => {
    const stage: Stage = i < 4 ? 'Recurring' : pick(STAGE_MIX);
    const first = pick(FIRST); const last = pick(LAST);
    const created = now - (20 + Math.floor(r() * 160)) * DAY;
    const a: Account = {
      id: `acc-${i}`, profileId: p.id, name: p.name, orgType: p.orgType, area: p.area, source: p.source, size: p.size,
      cadence: p.cadence, days: p.days, theme: p.theme, stage, fit: m.score, distance: m.distance,
      contactName: `${first} ${last}`, contactEmail: `${first.toLowerCase()}@${p.name.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 14) || 'group'}.org`,
      contactPhone: `(305) 555-${String(1000 + Math.floor(r() * 8999))}`,
      nextAction: stage === 'Prospect' ? 'Send intro offer' : stage === 'Contacted' ? 'Follow up on intro' : stage === 'Proposal' ? 'Confirm date and menu' : stage === 'Lapsed' ? 'Win-back offer' : 'Confirm next booking',
      nextDate: iso(now + Math.floor(r() * 14 - 3) * DAY), createdAt: iso(created),
    };
    out.accounts.push(a);
    const touches = stage === 'Prospect' ? 0 : 1 + Math.floor(r() * 4);
    for (let k = 0; k < touches; k++) {
      const kind = pick(ACTIVITY_KINDS);
      out.activities.push({ id: `act-${i}-${k}`, accountId: a.id, kind, at: new Date(created + (k + 1) * 9 * DAY).toISOString(),
        text: { Call: 'Called the organizer about their next meetup', Email: 'Sent menu options and group pricing', Visit: 'Organizer toured the private room',
          'Offer sent': `Offered $${Math.round(spend)} / guest with a welcome drink`, Note: `Prefers ${p.days[0] ?? 'Tue'} evenings, ~${p.size} guests`, Feedback: 'Group asked for faster split checks' }[kind] });
    }
    if (stage === 'Booked') {
      const guests = Math.max(6, Math.round(p.size * (0.7 + r() * 0.3))); const sp = Math.round(spend * (0.9 + r() * 0.3));
      out.bookings.push({ id: `bk-${i}-a`, accountId: a.id, date: iso(now - (7 + Math.floor(r() * 60)) * DAY), guests, spendPerGuest: sp, status: 'Completed', rating: r() < 0.7 ? 5 : 4 });
      if (r() < 0.6) out.bookings.push({ id: `bk-${i}-b`, accountId: a.id, date: iso(now + (3 + Math.floor(r() * 25)) * DAY), guests, spendPerGuest: sp, status: 'Upcoming', rating: null });
    }
    if (stage === 'Recurring' || stage === 'Lapsed') {
      const perMonth = stage === 'Recurring' ? Math.min(2, Math.max(1, CADENCE[p.cadence])) : 0.5;
      const gap = 30 / perMonth;
      const end = stage === 'Lapsed' ? now - 60 * DAY : now + 30 * DAY;
      for (let t = created + gap * DAY * r(); t < end; t += gap * DAY * (0.8 + r() * 0.4)) {
        const d = new Date(t);
        const want = p.days.length ? WEEKDAYS.indexOf(pick(p.days)) : 1;
        d.setDate(d.getDate() + ((want - ((d.getDay() + 6) % 7) + 7) % 7));
        const future = d.getTime() > now;
        const roll = r();
        const status: BookingStatus = future ? 'Upcoming' : roll < 0.03 ? 'No-show' : roll < 0.08 ? 'Cancelled' : 'Completed';
        out.bookings.push({ id: `bk-${i}-${out.bookings.length}`, accountId: a.id, date: iso(d.getTime()),
          guests: Math.max(6, Math.round(p.size * (0.65 + r() * 0.4))), spendPerGuest: Math.round(spend * (0.85 + r() * 0.35)),
          status, rating: status === 'Completed' ? (r() < 0.7 ? 5 : r() < 0.8 ? 4 : 3) : null });
      }
    }
  });
  return out;
}

/** Marketplace offers this restaurant won become CRM accounts and bookings automatically. */
function syncMarketplace(me: Restaurant, c: Crm): Crm {
  for (const { request, offer, profile } of acceptedFor(me.name)) {
    let a = c.accounts.find((x) => x.profileId === profile.id);
    if (a === undefined) {
      a = { id: uid('acc'), profileId: profile.id, name: profile.name, orgType: profile.orgType, area: profile.area, source: profile.source,
        size: profile.size, cadence: profile.cadence, days: profile.days, theme: profile.theme, stage: 'Booked', fit: matchScore(profile, me).score,
        distance: miles(profile, me), contactName: profile.name, contactEmail: '', contactPhone: '', nextAction: 'Confirm menu and headcount',
        nextDate: request.date, createdAt: iso(Date.now()) };
      c.accounts.unshift(a);
    }
    if (!c.bookings.some((b) => b.id === `mk-${request.id}`)) {
      c.bookings.push({ id: `mk-${request.id}`, accountId: a.id, date: request.date, guests: request.size, spendPerGuest: offer.pricePerGuest,
        status: request.date > iso(Date.now()) ? 'Upcoming' : 'Completed', rating: null });
      c.activities.push({ id: uid('act'), accountId: a.id, kind: 'Offer sent', at: new Date().toISOString(), text: `Won marketplace request: ${offer.perk} at $${offer.pricePerGuest}/guest` });
      if (a.stage !== 'Recurring') a.stage = 'Booked';
    }
  }
  return c;
}

export function loadCrm(me: Restaurant): Crm {
  const raw = window.localStorage.getItem(KEY(me.name));
  const c = raw ? (JSON.parse(raw) as Crm) : seed(me);
  const synced = syncMarketplace(me, c);
  saveCrm(me, synced);
  return synced;
}
export function saveCrm(me: Restaurant, c: Crm): void { window.localStorage.setItem(KEY(me.name), JSON.stringify(c)); }
export function resetCrm(me: Restaurant): void { window.localStorage.removeItem(KEY(me.name)); }
export function loadAssumptions(): Assumptions {
  const raw = window.localStorage.getItem(AKEY);
  return { ...DEFAULT_ASSUMPTIONS, ...(raw ? (JSON.parse(raw) as Partial<Assumptions>) : {}) };
}
export function saveAssumptions(a: Assumptions): void { window.localStorage.setItem(AKEY, JSON.stringify(a)); }
export const newId = uid;

export interface MonthRow { month: string; revenue: number; incremental: number; guests: number }
export interface Economics {
  windowDays: number; bookings: number; guests: number; revenue: number; incrementalRevenue: number; contribution: number;
  fullTableCost: number; netGain: number; roi: number; avgParty: number; avgCheck: number; slowShare: number;
  seatLift: number; repeatRate: number; annualValuePerAccount: number; cancelRate: number; avgRating: number | null;
  pipelineValue: number; upcomingRevenue: number; salesTax: number; wages: number; staffHours: number; hoursSaved: number;
  months: MonthRow[]; byDay: { day: Weekday; guests: number }[]; topAccounts: { a: Account; revenue: number; bookings: number }[];
}

/** All monetary KPIs for the trailing window. Incremental revenue counts only seats that would otherwise sit empty. */
export function economics(c: Crm, me: Restaurant, x: Assumptions, windowDays = 90): Economics {
  const now = Date.now(); const from = iso(now - windowDays * DAY); const today = iso(now);
  const done = c.bookings.filter((b) => b.status === 'Completed' && b.date >= from && b.date <= today);
  const past = c.bookings.filter((b) => b.date >= from && b.date <= today);
  const rev = (b: Booking): number => b.guests * b.spendPerGuest;
  const incr = (b: Booking): number => rev(b) * (SLOW_DAYS.includes(dayOf(b.date)) ? x.slowIncremental : x.peakIncremental);
  const revenue = done.reduce((s, b) => s + rev(b), 0);
  const incrementalRevenue = done.reduce((s, b) => s + incr(b), 0);
  const margin = 1 - x.foodBevCost - x.variableLabor - x.cardFees;
  const guests = done.reduce((s, b) => s + b.guests, 0);
  const contribution = incrementalRevenue * margin;
  const fullTableCost = x.subscription * (windowDays / 30) + x.feePerGuest * guests;
  const slowGuests = done.filter((b) => SLOW_DAYS.includes(dayOf(b.date))).reduce((s, b) => s + b.guests, 0);
  const emptySlowSeats = me.seats * x.emptySeatShare * (windowDays / 7) * SLOW_DAYS.length;
  const counts = new Map<string, number>();
  for (const b of c.bookings.filter((b) => b.status === 'Completed')) counts.set(b.accountId, (counts.get(b.accountId) ?? 0) + 1);
  const booked = [...counts.values()];
  const ratings = done.map((b) => b.rating).filter((v): v is number => v !== null);
  const months: MonthRow[] = [];
  for (let k = 5; k >= 0; k--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - k);
    const key = d.toISOString().slice(0, 7);
    const bs = c.bookings.filter((b) => b.status === 'Completed' && b.date.startsWith(key));
    months.push({ month: d.toLocaleString('en-US', { month: 'short' }), revenue: bs.reduce((s, b) => s + rev(b), 0), incremental: bs.reduce((s, b) => s + incr(b), 0), guests: bs.reduce((s, b) => s + b.guests, 0) });
  }
  const perAcc = c.accounts.map((a) => {
    const bs = done.filter((b) => b.accountId === a.id);
    return { a, revenue: bs.reduce((s, b) => s + rev(b), 0), bookings: bs.length };
  }).filter((r) => r.bookings > 0).sort((p, q) => q.revenue - p.revenue);
  const avgCheck = guests ? revenue / guests : priceOf(me);
  const open = c.accounts.filter((a) => a.stage !== 'Recurring' && a.stage !== 'Booked');
  const pipelineValue = open.reduce((s, a) => s + STAGE_WIN[a.stage] * a.size * avgCheck * Math.max(1, CADENCE[a.cadence] * 3), 0);
  const upcoming = c.bookings.filter((b) => b.status === 'Upcoming');
  const touches = c.activities.filter((a) => a.at.slice(0, 10) >= from).length;
  return {
    windowDays, bookings: done.length, guests, revenue, incrementalRevenue, contribution, fullTableCost,
    netGain: contribution - fullTableCost, roi: fullTableCost ? contribution / fullTableCost : 0,
    avgParty: done.length ? guests / done.length : 0, avgCheck, slowShare: guests ? slowGuests / guests : 0,
    seatLift: emptySlowSeats ? slowGuests / emptySlowSeats : 0,
    repeatRate: booked.length ? booked.filter((n) => n >= 2).length / booked.length : 0,
    annualValuePerAccount: perAcc.length ? (revenue / perAcc.length) * (365 / windowDays) : 0,
    cancelRate: past.length ? past.filter((b) => b.status === 'Cancelled' || b.status === 'No-show').length / past.length : 0,
    avgRating: ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : null,
    pipelineValue, upcomingRevenue: upcoming.reduce((s, b) => s + rev(b), 0),
    salesTax: incrementalRevenue * x.salesTax, wages: incrementalRevenue * x.laborShare,
    staffHours: (incrementalRevenue * x.laborShare) / x.hourlyWage,
    hoursSaved: (touches * (x.minutesPerOutreach - 2)) / 60,
    months, byDay: WEEKDAYS.map((d) => ({ day: d, guests: done.filter((b) => dayOf(b.date) === d).reduce((s, b) => s + b.guests, 0) })),
    topAccounts: perAcc.slice(0, 6),
  };
}
