// Demo build only. Two screens for the two-sided group-dining market (store: group-store.ts):
//   /coordinator   Organization / Event Coordinator: group profile, matched restaurants, requests and competing offers
//   /group-demand  Restaurant: nearby group demand, themed slow-night calendar, open requests to bid on
import * as React from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { DemoAuth } from './demo-auth';
import {
  CADENCE, COORDINATOR_ROLE_ID, DIETS, RESTAURANTS, THEMES, WEEKDAYS, acceptOffer, allProfiles, getMyRestaurant, matchScore, miles,
  myProfile, offersFor, postRequest, profileById, requests, saveProfile, sendOffer, setMyRestaurant, themedCalendar, topMatches,
  type Cadence, type GroupProfile, type Weekday,
} from './group-store';
import demand from './data/demand.json';

const AREAS = demand.areas.filter((a) => a.lat !== null && a.lng !== null) as { area: string; lat: number; lng: number }[];
const RADIUS_MI = 3;

function usePath(): string {
  const [path, setPath] = React.useState(() => window.location.pathname);
  React.useEffect(() => {
    const t = window.setInterval(() => setPath(window.location.pathname), 400);
    return () => window.clearInterval(t);
  }, []);
  return path;
}

const PUBLIC = new Set(['/login', '/home', '/contact-us', '/growth-diagnostic', '/coordinator']);

export function GroupPortalOverlay(props: { auth: DemoAuth }): React.ReactElement | null {
  const path = usePath();
  const user = props.auth.getUser();
  const isCoordinator = user?.roles.includes(COORDINATOR_ROLE_ID) ?? false;
  React.useEffect(() => {
    // the generated restaurant shell has no screens for this role, so keep coordinators on their portal
    if (isCoordinator && !PUBLIC.has(path)) window.location.replace('/coordinator');
  }, [isCoordinator, path]);
  if (path === '/coordinator') {
    if (user === null) { window.location.replace('/login'); return null; }
    return <Coordinator auth={props.auth} owner={user.id} name={[user.firstName, user.lastName].filter(Boolean).join(' ')} />;
  }
  if (path === '/group-demand' && user !== null && !isCoordinator) return <GroupDemand />;
  return null;
}

function Shell(props: { kicker: string; title: string; actions: React.ReactNode; children: React.ReactNode; testId: string }): React.ReactElement {
  return (
    <div className="fixed inset-0 z-[1000] overflow-auto bg-background" data-testid={props.testId}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="type-meta text-text-muted">{props.kicker}</p>
            <h1 className="text-2xl font-semibold text-foreground">{props.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">{props.actions}</div>
        </header>
        {props.children}
      </div>
    </div>
  );
}

function Panel(props: { title: string; children: React.ReactNode; testId?: string; className?: string }): React.ReactElement {
  return (
    <section className={`flex flex-col gap-3 rounded-card border border-border bg-card p-4 ${props.className ?? ''}`} data-testid={props.testId}>
      <h2 className="type-row-title text-foreground">{props.title}</h2>
      {props.children}
    </section>
  );
}

function Kpi(props: { label: string; value: string; note: string; testId: string }): React.ReactElement {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-card p-3" data-testid={props.testId}>
      <span className="type-meta text-text-muted">{props.label}</span>
      <span className="text-2xl font-semibold text-foreground">{props.value}</span>
      <span className="type-meta text-text-muted">{props.note}</span>
    </div>
  );
}

function Field(props: { id: string; label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={props.id}>{props.label}</Label>
      {props.children}
    </div>
  );
}

const nextWeekday = (d: Weekday): string => {
  const t = new Date();
  const want = WEEKDAYS.indexOf(d);
  const add = ((want - ((t.getDay() + 6) % 7) + 7) % 7) || 7;
  t.setDate(t.getDate() + add);
  return t.toISOString().slice(0, 10);
};

/* ---------------- Coordinator ---------------- */

function blankProfile(owner: string, name: string): GroupProfile {
  const a = AREAS.find((x) => x.area === 'Wynwood') ?? AREAS[0]!;
  return {
    id: `coord-${owner}`, name: name ? `${name}'s group` : 'Wynwood Run Club', orgType: 'Club / association', area: a.area, lat: a.lat, lng: a.lng,
    size: 18, cadence: 'weekly', days: ['Tue'], budget: 35, diets: [], theme: 'Sports & fitness', ageBand: '25–44',
    source: 'Coordinator', members: null, owner,
  };
}

function Coordinator(props: { auth: DemoAuth; owner: string; name: string }): React.ReactElement {
  const [saved, setSaved] = React.useState<GroupProfile | null>(() => myProfile(props.owner));
  const [draft, setDraft] = React.useState<GroupProfile>(() => saved ?? blankProfile(props.owner, props.name));
  const [tick, setTick] = React.useState(0);
  const set = <K extends keyof GroupProfile>(k: K, v: GroupProfile[K]): void => setDraft((d) => ({ ...d, [k]: v }));
  const profile = saved ?? draft;
  const matches = React.useMemo(() => topMatches(profile, 8), [profile]);
  const mine = requests().filter((r) => r.profileId === profile.id);
  const [req, setReq] = React.useState({ date: nextWeekday(profile.days[0] ?? 'Tue'), size: profile.size, budget: profile.budget, notes: '' });
  void tick;

  const onSave = (e: React.FormEvent): void => {
    e.preventDefault();
    const a = AREAS.find((x) => x.area === draft.area) ?? AREAS[0]!;
    const p = { ...draft, lat: a.lat, lng: a.lng };
    saveProfile(p); setSaved(p); setDraft(p);
  };
  const signOut = (): void => { void props.auth.signOut().then(() => window.location.assign('/login')); };

  return (
    <Shell testId="coordinator-portal" kicker="FullTable AI · Organization / Event Coordinator"
      title="Find restaurants for your group, and let them compete for it"
      actions={<Button variant="outline" onClick={signOut}>Sign out</Button>}>
      <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Panel title={saved ? 'Your group profile' : 'Step 1 · Tell restaurants about your group'} testId="group-profile">
          <form className="grid grid-cols-2 gap-3" onSubmit={onSave}>
            <div className="col-span-2"><Field id="g-name" label="Group name"><Input id="g-name" value={draft.name} onChange={(e) => set('name', e.target.value)} required /></Field></div>
            <Field id="g-type" label="Type">
              <NativeSelect id="g-type" value={draft.orgType} onChange={(e) => set('orgType', e.target.value)}>
                {['Club / association', 'Sports team / league', 'Company / team', 'School / PTA', 'Nonprofit / service club', 'Faith group', 'Meetup group', 'Event organizer'].map((x) => <NativeSelectOption key={x} value={x}>{x}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
            <Field id="g-area" label="Area">
              <NativeSelect id="g-area" value={draft.area} onChange={(e) => set('area', e.target.value)}>
                {[...AREAS].sort((a, b) => a.area.localeCompare(b.area)).map((a) => <NativeSelectOption key={a.area} value={a.area}>{a.area}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
            <Field id="g-size" label="Usual party size"><Input id="g-size" type="number" min={4} max={200} value={draft.size} onChange={(e) => set('size', Number(e.target.value))} /></Field>
            <Field id="g-budget" label="Budget per guest ($)"><Input id="g-budget" type="number" min={10} max={200} value={draft.budget} onChange={(e) => set('budget', Number(e.target.value))} /></Field>
            <Field id="g-cadence" label="How often">
              <NativeSelect id="g-cadence" value={draft.cadence} onChange={(e) => set('cadence', e.target.value as Cadence)}>
                {Object.keys(CADENCE).map((c) => <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
            <Field id="g-theme" label="Kind of gathering">
              <NativeSelect id="g-theme" value={draft.theme} onChange={(e) => set('theme', e.target.value)}>
                {THEMES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
            <Field id="g-age" label="Typical age">
              <NativeSelect id="g-age" value={draft.ageBand} onChange={(e) => set('ageBand', e.target.value)}>
                {['18–24', '21–34', '25–44', '35–54', '45+', 'Mixed / families'].map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
            <fieldset className="col-span-2 flex flex-col gap-1">
              <legend className="type-meta text-text-muted">Preferred nights</legend>
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map((d) => (
                  <label key={d} className="flex items-center gap-1 type-body text-text-body">
                    <input type="checkbox" checked={draft.days.includes(d)} onChange={(e) => set('days', e.target.checked ? [...draft.days, d] : draft.days.filter((x) => x !== d))} />{d}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="col-span-2 flex flex-col gap-1">
              <legend className="type-meta text-text-muted">Dietary needs</legend>
              <div className="flex flex-wrap gap-3">
                {DIETS.map((d) => (
                  <label key={d} className="flex items-center gap-1 type-body text-text-body">
                    <input type="checkbox" checked={draft.diets.includes(d)} onChange={(e) => set('diets', e.target.checked ? [...draft.diets, d] : draft.diets.filter((x) => x !== d))} />{d}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="col-span-2 flex items-center gap-3">
              <Button type="submit" data-testid="save-profile">{saved ? 'Update profile' : 'Save profile and see matches'}</Button>
              {saved && <span className="type-meta text-text-muted">Visible to restaurants near {saved.area}</span>}
            </div>
          </form>
        </Panel>

        <Panel title={`Best-matched restaurants${saved ? '' : ' (preview)'}`} testId="restaurant-matches">
          <div className="overflow-hidden rounded-card border border-border" style={{ height: 240 }}>
            <MapContainer key={`${profile.lat},${profile.lng}`} center={[profile.lat, profile.lng]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <CircleMarker center={[profile.lat, profile.lng]} radius={10} pathOptions={{ color: 'var(--primary)', fillOpacity: 0.6 }}><Tooltip>Your group · {profile.area}</Tooltip></CircleMarker>
              {matches.map((m) => (
                <CircleMarker key={m.restaurant.name} center={[m.restaurant.lat, m.restaurant.lng]} radius={5 + m.score / 12} pathOptions={{ color: 'var(--chart-2)', fillOpacity: 0.5 }}>
                  <Tooltip>{m.restaurant.name} · fit {m.score}</Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <ol className="flex flex-col divide-y divide-border">
            {matches.map((m, i) => (
              <li key={m.restaurant.name} className="flex flex-col gap-1 py-2" data-testid="match-row">
                <div className="flex items-center justify-between gap-2">
                  <span className="type-body font-medium text-foreground">{i + 1}. {m.restaurant.name}</span>
                  <Badge variant={m.score >= 75 ? 'default' : 'secondary'}>fit {m.score}</Badge>
                </div>
                <span className="type-meta text-text-muted">{m.cuisine} · {m.restaurant.seats} seats · {m.restaurant.area} · {m.distance.toFixed(1)} mi · ~${m.price}/guest</span>
                <span className="type-meta text-text-body">{m.reasons.join(' · ')}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </section>

      {saved && (
        <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <Panel title="Step 2 · Ask for offers" testId="new-request">
            <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); postRequest(saved, req); setTick((t) => t + 1); }}>
              <Field id="r-date" label="Date"><Input id="r-date" type="date" value={req.date} onChange={(e) => setReq({ ...req, date: e.target.value })} required /></Field>
              <Field id="r-size" label="Guests"><Input id="r-size" type="number" min={4} value={req.size} onChange={(e) => setReq({ ...req, size: Number(e.target.value) })} /></Field>
              <Field id="r-budget" label="Budget per guest ($)"><Input id="r-budget" type="number" min={10} value={req.budget} onChange={(e) => setReq({ ...req, budget: Number(e.target.value) })} /></Field>
              <Field id="r-notes" label="Notes"><Input id="r-notes" value={req.notes} placeholder="e.g. need a screen" onChange={(e) => setReq({ ...req, notes: e.target.value })} /></Field>
              <div className="col-span-2"><Button type="submit" data-testid="post-request">Send to matched restaurants</Button></div>
              <p className="col-span-2 type-meta text-text-muted">Your top matches are notified. In the demo, the three best reply automatically; restaurants on the Group demand screen can also bid.</p>
            </form>
          </Panel>
          <Panel title="Your requests and offers" testId="my-requests">
            {mine.length === 0 && <p className="type-body text-text-muted">No requests yet.</p>}
            {mine.map((r) => {
              const offers = offersFor(r.id);
              return (
                <div key={r.id} className="flex flex-col gap-2 rounded-card border border-border p-3" data-testid="request-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="type-body font-medium text-foreground">{r.date} · {r.size} guests · up to ${r.budget}/guest</span>
                    <Badge variant={r.status === 'booked' ? 'default' : 'outline'}>{r.status === 'booked' ? 'Booked' : `${offers.length} competing offers`}</Badge>
                  </div>
                  <table className="w-full type-meta">
                    <thead><tr className="text-left text-text-muted"><th className="py-1">Restaurant</th><th>Price</th><th>Perk</th><th /></tr></thead>
                    <tbody>
                      {offers.map((o) => (
                        <tr key={o.id} className="border-t border-border text-text-body" data-testid="offer-row">
                          <td className="py-1">{o.restaurant}{o.byYou ? '' : ' (auto)'}</td>
                          <td>${o.pricePerGuest}</td>
                          <td>{o.perk}</td>
                          <td className="text-right">
                            {r.status === 'open' ? <Button size="sm" onClick={() => { acceptOffer(r.id, o.id); setTick((t) => t + 1); }}>Accept</Button>
                              : r.acceptedOfferId === o.id ? <Badge>Accepted</Badge> : <span className="text-text-muted">Declined</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </Panel>
        </section>
      )}
    </Shell>
  );
}

/* ---------------- Restaurant: group demand ---------------- */

function GroupDemand(): React.ReactElement {
  const [me, setMe] = React.useState(getMyRestaurant);
  const [tick, setTick] = React.useState(0);
  void tick;
  const profiles = allProfiles();
  const nearby = profiles.filter((p) => miles(p, me) <= RADIUS_MI);
  const competitors = RESTAURANTS.filter((r) => r.name !== me.name && miles(r, me) <= 1 && r.seats >= 40);
  const guestsMonth = Math.round(nearby.reduce((s, g) => s + g.size * CADENCE[g.cadence], 0));
  const contested = nearby.filter((g) => topMatches(g, 5).some((m) => competitors.some((c) => c.name === m.restaurant.name))).length;
  const cal = themedCalendar(nearby);
  const dayCounts = WEEKDAYS.map((d) => nearby.filter((g) => g.days.includes(d)).length);
  const maxDay = Math.max(1, ...dayCounts);
  const themeCounts = THEMES.map((t) => ({ t, n: nearby.filter((g) => g.theme === t).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const open = requests().filter((r) => r.status === 'open').map((r) => ({ r, p: profileById(r.profileId) })).filter((x) => x.p !== undefined && miles(x.p, me) <= 6);
  const booked = requests().filter((r) => r.status === 'booked');
  const won = booked.filter((r) => offersFor(r.id).some((o) => o.id === r.acceptedOfferId && o.restaurant === me.name)).length;
  const topGroups = [...nearby].map((g) => ({ g, m: matchScore(g, me) })).sort((a, b) => b.m.score - a.m.score).slice(0, 8);

  return (
    <Shell testId="group-demand" kicker={`FullTable AI · Group demand around ${me.name}`} title="Who dines in groups near you, and what to offer them"
      actions={<>
        <NativeSelect aria-label="Your restaurant" value={me.name} onChange={(e) => { setMyRestaurant(e.target.value); setMe(getMyRestaurant()); }}>
          {[...RESTAURANTS].sort((a, b) => a.name.localeCompare(b.name)).map((r) => <NativeSelectOption key={r.name} value={r.name}>{r.name} · {r.area}</NativeSelectOption>)}
        </NativeSelect>
        <Button variant="outline" onClick={() => { window.location.href = '/overview'; }}>Overview</Button>
        <Button variant="outline" onClick={() => { window.location.href = '/demand-map'; }}>Demand map</Button>
      </>}>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi testId="gd-groups" label={`Groups within ${RADIUS_MI} mi`} value={String(nearby.length)} note="coordinators + Meetup, Luma, IRS" />
        <Kpi testId="gd-guests" label="Group guests / month" value={guestsMonth.toLocaleString('en-US')} note="size × how often they meet" />
        <Kpi testId="gd-competitors" label="Competing restaurants" value={String(competitors.length)} note="40+ seats within 1 mi" />
        <Kpi testId="gd-contested" label="Contested groups" value={String(contested)} note="also a top-5 match for a neighbour" />
        <Kpi testId="gd-won" label="Requests won" value={`${won} / ${booked.length}`} note="booked requests you won" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Themed slow-night calendar (suggested)" testId="themed-calendar">
          <div className="grid gap-3 sm:grid-cols-2">
            {cal.map((n) => (
              <div key={n.day} className="flex flex-col gap-1 rounded-card border border-border bg-background p-3" data-testid="themed-night">
                <div className="flex items-center justify-between"><span className="type-row-title text-foreground">{n.day} · {n.theme}</span><Badge variant="secondary">{n.groups} groups</Badge></div>
                <span className="type-body text-text-body">{n.special}</span>
                <span className="type-meta text-text-muted">~{n.guestsMonth} guests/month · mostly {n.ageBand} · avg budget ${n.avgBudget}</span>
              </div>
            ))}
          </div>
          <p className="type-meta text-text-muted">Each Mon–Thu night takes the theme most nearby groups that prefer that night share. Publish it as a weekly special and matched coordinators see it on their screen.</p>
        </Panel>
        <Panel title="When and what nearby groups want" testId="demand-mix">
          <div className="flex h-28 items-end gap-2">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-1">
                <span className="type-meta text-text-muted">{dayCounts[i]}</span>
                <div className="w-full rounded-t bg-primary" style={{ height: `${(dayCounts[i]! / maxDay) * 80}px` }} />
                <span className="type-meta text-text-muted">{d}</span>
              </div>
            ))}
          </div>
          <ul className="flex flex-col gap-1">
            {themeCounts.map((x) => (
              <li key={x.t} className="flex items-center gap-2 type-meta text-text-body">
                <span className="w-36 shrink-0">{x.t}</span>
                <span className="h-2 rounded bg-chart-2" style={{ width: `${(x.n / themeCounts[0]!.n) * 100}%` }} />
                <span className="text-text-muted">{x.n}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Open requests near you: send an offer" testId="open-requests">
          {open.length === 0 && <p className="type-body text-text-muted">No open requests within 6 mi. Coordinators post them from their portal.</p>}
          {open.map(({ r, p }) => <OfferForm key={r.id} r={r} p={p!} me={me.name} onSent={() => setTick((t) => t + 1)} />)}
        </Panel>
        <Panel title="Best-fit groups to invite" testId="best-groups">
          <ol className="flex flex-col divide-y divide-border">
            {topGroups.map(({ g, m }) => (
              <li key={g.id} className="flex flex-col gap-1 py-2">
                <div className="flex items-center justify-between gap-2"><span className="type-body font-medium text-foreground">{g.name}</span><Badge variant="outline">fit {m.score}</Badge></div>
                <span className="type-meta text-text-muted">{g.source} · {g.theme} · ~{g.size} guests {g.cadence} · {g.days.join('/')} · {g.ageBand}{g.members ? ` · ${g.members} members` : ''}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </section>
      <p className="type-meta text-text-muted">Demo data: group sizes, budgets, nights and ages for seeded groups are estimated from their source listing; coordinator-created profiles are exact. Restaurant cuisine and price are inferred from the licence name until owners complete their profile.</p>
    </Shell>
  );
}

function OfferForm(props: { r: ReturnType<typeof requests>[number]; p: GroupProfile; me: string; onSent: () => void }): React.ReactElement {
  const offers = offersFor(props.r.id);
  const mine = offers.find((o) => o.restaurant === props.me);
  const best = offers[0];
  const [price, setPrice] = React.useState(mine?.pricePerGuest ?? Math.max(10, props.r.budget - 3));
  const [perk, setPerk] = React.useState(mine?.perk ?? 'Private corner and a set menu');
  return (
    <form className="flex flex-col gap-2 rounded-card border border-border p-3" data-testid="offer-form"
      onSubmit={(e) => { e.preventDefault(); sendOffer({ requestId: props.r.id, restaurant: props.me, pricePerGuest: price, perk, slot: '7:00 pm' }); props.onSent(); }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="type-body font-medium text-foreground">{props.p.name} · {props.r.date} · {props.r.size} guests</span>
        <Badge variant="outline">{offers.length} offers · best ${best?.pricePerGuest ?? '–'}</Badge>
      </div>
      <span className="type-meta text-text-muted">{props.p.theme} · {props.p.area} · budget ${props.r.budget}/guest{props.p.diets.length ? ` · ${props.p.diets.join(', ')}` : ''}{props.r.notes ? ` · “${props.r.notes}”` : ''}</span>
      <div className="flex flex-wrap items-end gap-2">
        <Field id={`p-${props.r.id}`} label="$/guest"><Input id={`p-${props.r.id}`} className="w-24" type="number" min={5} value={price} onChange={(e) => setPrice(Number(e.target.value))} /></Field>
        <div className="flex-1"><Field id={`k-${props.r.id}`} label="Perk"><Input id={`k-${props.r.id}`} value={perk} onChange={(e) => setPerk(e.target.value)} /></Field></div>
        <Button type="submit" size="sm" data-testid="send-offer">{mine ? 'Update offer' : 'Send offer'}</Button>
      </div>
    </form>
  );
}
