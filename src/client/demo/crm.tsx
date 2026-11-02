// Demo build only. /crm: restaurant CRM for group-dining and event-organizer relationships, with an
// economic-impact dashboard. Store and formulas: crm-store.ts.
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { DemoAuth } from './demo-auth';
import { COORDINATOR_ROLE_ID, RESTAURANTS, getMyRestaurant, setMyRestaurant } from './group-store';
import { Field, Kpi, Panel, Shell, usePath } from './group-portal';
import {
  ACTIVITY_KINDS, ASSUMPTION_LABELS, DEFAULT_ASSUMPTIONS, STAGES, STAGE_WIN, dayOf, economics, loadAssumptions, loadCrm, newId,
  resetCrm, saveAssumptions, saveCrm, type Account, type ActivityKind, type Assumptions, type BookingStatus, type Crm, type Stage,
} from './crm-store';

const usd = (n: number): string => '$' + Math.round(n).toLocaleString('en-US');
const pct = (n: number): string => Math.round(n * 100) + '%';
const num = (n: number): string => Math.round(n).toLocaleString('en-US');
const STAGE_TONE: Record<Stage, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Prospect: 'outline', Contacted: 'outline', Proposal: 'secondary', Booked: 'default', Recurring: 'default', Lapsed: 'destructive',
};

export function CrmOverlay(props: { auth: DemoAuth }): React.ReactElement | null {
  const path = usePath();
  const user = props.auth.getUser();
  if (path !== '/crm' || user === null || user.roles.includes(COORDINATOR_ROLE_ID)) return null;
  return <CrmScreen />;
}

type Tab = 'impact' | 'pipeline' | 'accounts';

function CrmScreen(): React.ReactElement {
  const [me, setMe] = React.useState(getMyRestaurant);
  const [crm, setCrm] = React.useState<Crm>(() => loadCrm(getMyRestaurant()));
  const [x, setX] = React.useState<Assumptions>(loadAssumptions);
  const [tab, setTab] = React.useState<Tab>('impact');
  const [windowDays, setWindowDays] = React.useState(90);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const update = (f: (c: Crm) => void): void => { const c = structuredClone(crm); f(c); saveCrm(me, c); setCrm(c); };
  const switchTo = (name: string): void => { setMyRestaurant(name); const r = getMyRestaurant(); setMe(r); setCrm(loadCrm(r)); setOpenId(null); };
  const e = economics(crm, me, x, windowDays);
  const open = crm.accounts.find((a) => a.id === openId);

  return (
    <Shell testId="crm" kicker={`FullTable AI · Group CRM · ${me.name} · ${me.seats} seats · ${me.area}`} title="Group relationships and economic impact"
      actions={<>
        <NativeSelect aria-label="Your restaurant" value={me.name} onChange={(ev) => switchTo(ev.target.value)}>
          {[...RESTAURANTS].sort((a, b) => a.name.localeCompare(b.name)).map((r) => <NativeSelectOption key={r.name + r.address} value={r.name}>{r.name} · {r.area}</NativeSelectOption>)}
        </NativeSelect>
        <Button variant="outline" onClick={() => { window.location.href = '/group-demand'; }}>Group demand</Button>
        <Button variant="outline" onClick={() => { window.location.href = '/overview'; }}>Overview</Button>
      </>}>
      <div role="tablist" aria-label="CRM sections" className="flex flex-wrap items-center gap-2">
        {([['impact', 'Economic impact'], ['pipeline', 'Pipeline'], ['accounts', `Accounts (${crm.accounts.length})`]] as [Tab, string][]).map(([id, label]) => (
          <Button key={id} role="tab" aria-selected={tab === id} variant={tab === id ? 'default' : 'outline'} onClick={() => setTab(id)} data-testid={`crm-tab-${id}`}>{label}</Button>
        ))}
        <span className="ml-auto type-meta text-text-muted">Seeded history is simulated for the demo; log real bookings to replace it.</span>
        <Button variant="ghost" onClick={() => { resetCrm(me); setCrm(loadCrm(me)); }}>Reset demo data</Button>
      </div>

      {tab === 'impact' && <Impact e={e} x={x} windowDays={windowDays} setWindowDays={setWindowDays} setX={(v) => { saveAssumptions(v); setX(v); }} seats={me.seats} onOpen={(id) => { setOpenId(id); setTab('accounts'); }} />}
      {tab === 'pipeline' && <Pipeline crm={crm} avgCheck={e.avgCheck} onOpen={(id) => { setOpenId(id); setTab('accounts'); }} onStage={(id, s) => update((c) => { const a = c.accounts.find((q) => q.id === id); if (a) a.stage = s; })} />}
      {tab === 'accounts' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Accounts crm={crm} openId={openId} onOpen={setOpenId} onAdd={(a) => update((c) => { c.accounts.unshift(a); })} />
          {open ? <Detail a={open} crm={crm} update={update} /> : <Panel title="Select an account"><p className="type-body text-text-muted">Pick a group on the left to see contacts, history and bookings.</p></Panel>}
        </div>
      )}
    </Shell>
  );
}

function Bars(props: { rows: { label: string; a: number; b?: number }[]; fmt: (n: number) => string; aLabel: string; bLabel?: string; testId: string }): React.ReactElement {
  const max = Math.max(1, ...props.rows.map((r) => r.a));
  return (
    <div className="flex flex-col gap-2" data-testid={props.testId}>
      <div className="flex h-40 items-end gap-2">
        {props.rows.map((r) => (
          <div key={r.label} className="flex flex-1 flex-col items-center gap-1" title={`${r.label}: ${props.fmt(r.a)}${r.b !== undefined ? ` · ${props.bLabel}: ${props.fmt(r.b)}` : ''}`}>
            <span className="type-meta text-text-muted">{props.fmt(r.a)}</span>
            <div className="relative w-full rounded-t-sm" style={{ height: `${(r.a / max) * 120}px`, background: 'var(--chart-2, var(--muted))' }}>
              {r.b !== undefined && <div className="absolute bottom-0 w-full rounded-t-sm" style={{ height: `${(r.b / Math.max(1, r.a)) * 100}%`, background: 'var(--chart-1, var(--primary))' }} />}
            </div>
            <span className="type-meta text-text-muted">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 type-meta text-text-muted">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'var(--chart-2, var(--muted))' }} />{props.aLabel}</span>
        {props.bLabel && <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'var(--chart-1, var(--primary))' }} />{props.bLabel}</span>}
      </div>
    </div>
  );
}

function Impact(props: { e: ReturnType<typeof economics>; x: Assumptions; windowDays: number; setWindowDays: (n: number) => void; setX: (x: Assumptions) => void; seats: number; onOpen: (id: string) => void }): React.ReactElement {
  const { e, x } = props;
  const per = `last ${e.windowDays} days`;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="type-body text-text-body">Window:</span>
        {[30, 90, 180].map((d) => <Button key={d} size="sm" variant={props.windowDays === d ? 'default' : 'outline'} onClick={() => props.setWindowDays(d)}>{d} days</Button>)}
      </div>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="crm-money">
        <Kpi testId="crm-revenue" label="Group revenue" value={usd(e.revenue)} note={`${e.bookings} completed bookings · ${per}`} />
        <Kpi testId="crm-incremental" label="Incremental revenue" value={usd(e.incrementalRevenue)} note={`${pct(e.revenue ? e.incrementalRevenue / e.revenue : 0)} would not have happened otherwise`} />
        <Kpi testId="crm-contribution" label="Profit contribution" value={usd(e.contribution)} note={`after food, extra labor, card fees (${pct(1 - x.foodBevCost - x.variableLabor - x.cardFees)} margin)`} />
        <Kpi testId="crm-roi" label="Return on FullTable" value={`${e.roi.toFixed(1)}×`} note={`${usd(e.netGain)} net after ${usd(e.fullTableCost)} in fees`} />
      </section>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-6" data-testid="crm-kpis">
        <Kpi testId="crm-guests" label="Group guests" value={num(e.guests)} note={`avg party ${e.avgParty.toFixed(0)}`} />
        <Kpi testId="crm-check" label="Spend / guest" value={usd(e.avgCheck)} note="food + drinks" />
        <Kpi testId="crm-seatlift" label="Slow-night seats filled" value={pct(e.seatLift)} note={`of empty Mon–Thu seats (${props.seats} seats)`} />
        <Kpi testId="crm-repeat" label="Repeat-group rate" value={pct(e.repeatRate)} note="groups with 2+ visits" />
        <Kpi testId="crm-ltv" label="Value / group / year" value={usd(e.annualValuePerAccount)} note="revenue run-rate" />
        <Kpi testId="crm-cancel" label="Cancel + no-show" value={pct(e.cancelRate)} note={e.avgRating ? `avg rating ${e.avgRating.toFixed(1)} / 5` : 'no ratings yet'} />
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Monthly group revenue" className="lg:col-span-2">
          <Bars testId="crm-monthly" rows={e.months.map((m) => ({ label: m.month, a: m.revenue, b: m.incremental }))} fmt={(n) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : usd(n))} aLabel="All group revenue" bLabel="Incremental (seats otherwise empty)" />
        </Panel>
        <Panel title="Forward look">
          <ul className="flex flex-col gap-2 type-body text-text-body">
            <li><strong className="text-foreground">{usd(e.upcomingRevenue)}</strong> in confirmed upcoming bookings</li>
            <li><strong className="text-foreground">{usd(e.pipelineValue)}</strong> weighted pipeline (next 90 days)</li>
            <li><strong className="text-foreground">{num(e.hoursSaved)} h</strong> outreach time saved vs. by hand</li>
          </ul>
          <h3 className="mt-2 type-row-title text-foreground">Local economy ({per})</h3>
          <ul className="flex flex-col gap-2 type-body text-text-body">
            <li><strong className="text-foreground">{usd(e.wages)}</strong> wage income supported · ≈{num(e.staffHours)} staff hours</li>
            <li><strong className="text-foreground">{usd(e.salesTax)}</strong> sales tax generated</li>
          </ul>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Group guests by night">
          <Bars testId="crm-byday" rows={e.byDay.map((d) => ({ label: d.day, a: d.guests }))} fmt={num} aLabel="Guests" />
          <p className="type-meta text-text-muted">{pct(e.slowShare)} of group guests came Mon–Thu, when seats are otherwise empty.</p>
        </Panel>
        <Panel title="Top groups by revenue">
          <ul className="flex flex-col gap-2" data-testid="crm-top">
            {e.topAccounts.map((t) => (
              <li key={t.a.id}><button type="button" className="flex w-full justify-between gap-2 rounded-md border border-border p-2 text-left type-body text-foreground" onClick={() => props.onOpen(t.a.id)}>
                <span className="truncate">{t.a.name}</span><span className="shrink-0 text-text-muted">{usd(t.revenue)} · {t.bookings}×</span>
              </button></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Assumptions (edit to match your books)" testId="crm-assumptions">
          <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1">
            {(Object.keys(ASSUMPTION_LABELS) as (keyof Assumptions)[]).map((k) => {
              const [label, kind, note] = ASSUMPTION_LABELS[k];
              const shown = kind === 'pct' ? Math.round(x[k] * 100) : x[k];
              return (
                <label key={k} className="flex items-center justify-between gap-2 type-meta text-text-body" title={note}>
                  <span>{label}{kind === 'pct' ? ' (%)' : kind === 'usd' ? ' ($)' : ''}</span>
                  <Input className="h-8 w-20" type="number" value={shown} onChange={(ev) => { const v = Number(ev.target.value); props.setX({ ...x, [k]: kind === 'pct' ? v / 100 : v }); }} />
                </label>
              );
            })}
          </div>
          <Button size="sm" variant="ghost" onClick={() => props.setX(DEFAULT_ASSUMPTIONS)}>Restore defaults</Button>
        </Panel>
      </div>
      <p className="type-meta text-text-muted">
        How it is calculated: revenue = completed bookings × guests × spend per guest. Incremental revenue counts {pct(x.slowIncremental)} of Mon–Thu and {pct(x.peakIncremental)} of Fri–Sun group revenue, since busy nights partly displace walk-ins.
        Contribution subtracts food & beverage, extra labor and card fees; return compares it with the FullTable subscription plus per-guest fees. Local-economy figures apply wage share and sales tax to incremental revenue only.
      </p>
    </div>
  );
}

function Pipeline(props: { crm: Crm; avgCheck: number; onOpen: (id: string) => void; onStage: (id: string, s: Stage) => void }): React.ReactElement {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6" data-testid="crm-pipeline">
      {STAGES.map((s) => {
        const as = props.crm.accounts.filter((a) => a.stage === s);
        const value = as.reduce((t, a) => t + a.size * props.avgCheck, 0);
        return (
          <section key={s} className="flex flex-col gap-2 rounded-card border border-border bg-card p-3" data-testid={`crm-col-${s}`}>
            <header className="flex items-center justify-between"><h2 className="type-row-title text-foreground">{s}</h2><Badge variant="outline">{as.length}</Badge></header>
            <p className="type-meta text-text-muted">{usd(value)} per visit · {pct(STAGE_WIN[s])} win</p>
            <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
              {as.map((a) => (
                <li key={a.id} className="flex flex-col gap-1 rounded-md border border-border p-2">
                  <button type="button" className="text-left type-body text-foreground" onClick={() => props.onOpen(a.id)}>{a.name}</button>
                  <span className="type-meta text-text-muted">{a.size} guests · {a.cadence} · {a.days.join('/') || 'any night'}</span>
                  <NativeSelect aria-label={`Stage for ${a.name}`} value={a.stage} onChange={(ev) => props.onStage(a.id, ev.target.value as Stage)}>
                    {STAGES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
                  </NativeSelect>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Accounts(props: { crm: Crm; openId: string | null; onOpen: (id: string) => void; onAdd: (a: Account) => void }): React.ReactElement {
  const [q, setQ] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const rows = props.crm.accounts.filter((a) => (a.name + a.orgType + a.area + a.contactName).toLowerCase().includes(q.toLowerCase()));
  const lastVisit = (id: string): string => props.crm.bookings.filter((b) => b.accountId === id && b.status === 'Completed').map((b) => b.date).sort().at(-1) ?? '—';
  return (
    <Panel title="Accounts" testId="crm-accounts">
      <Input placeholder="Search groups, contacts, areas" value={q} onChange={(ev) => setQ(ev.target.value)} aria-label="Search accounts" />
      <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
        {rows.map((a) => (
          <li key={a.id}>
            <button type="button" onClick={() => props.onOpen(a.id)} aria-pressed={props.openId === a.id}
              className={'flex w-full flex-col gap-1 rounded-md border p-2 text-left ' + (props.openId === a.id ? 'border-primary' : 'border-border')}>
              <span className="flex items-center justify-between gap-2"><span className="truncate type-body text-foreground">{a.name}</span><Badge variant={STAGE_TONE[a.stage]}>{a.stage}</Badge></span>
              <span className="type-meta text-text-muted">{a.orgType} · {a.area} · {a.size} guests · last visit {lastVisit(a.id)} · next: {a.nextAction} ({a.nextDate})</span>
            </button>
          </li>
        ))}
      </ul>
      <form className="flex gap-2" onSubmit={(ev) => {
        ev.preventDefault(); if (!newName.trim()) return;
        const id = newId('acc');
        props.onAdd({ id, profileId: id, name: newName.trim(), orgType: 'Organization', area: '', source: 'Added by you', size: 12, cadence: 'monthly', days: ['Tue'],
          theme: 'Networking', stage: 'Prospect', fit: 0, distance: 0, contactName: '', contactEmail: '', contactPhone: '', nextAction: 'Send intro offer',
          nextDate: new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString().slice(0, 10) });
        setNewName(''); props.onOpen(id);
      }}>
        <Input placeholder="Add a group or organizer" value={newName} onChange={(ev) => setNewName(ev.target.value)} aria-label="New account name" />
        <Button type="submit">Add</Button>
      </form>
    </Panel>
  );
}

function Detail(props: { a: Account; crm: Crm; update: (f: (c: Crm) => void) => void }): React.ReactElement {
  const { a } = props;
  const bookings = props.crm.bookings.filter((b) => b.accountId === a.id).sort((p, q) => q.date.localeCompare(p.date));
  const acts = props.crm.activities.filter((t) => t.accountId === a.id).sort((p, q) => q.at.localeCompare(p.at));
  const done = bookings.filter((b) => b.status === 'Completed');
  const lifetime = done.reduce((s, b) => s + b.guests * b.spendPerGuest, 0);
  const [kind, setKind] = React.useState<ActivityKind>('Call');
  const [text, setText] = React.useState('');
  const [bk, setBk] = React.useState({ date: new Date().toISOString().slice(0, 10), guests: a.size, spend: 45, status: 'Completed' as BookingStatus });
  const set = (k: keyof Account, v: string): void => props.update((c) => { const t = c.accounts.find((q) => q.id === a.id); if (t) (t as unknown as Record<string, string>)[k] = v; });
  return (
    <Panel title={a.name} testId="crm-detail">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={STAGE_TONE[a.stage]}>{a.stage}</Badge>
        <span className="type-meta text-text-muted">{a.orgType} · {a.area || 'area not set'} · source {a.source} · fit {a.fit} · {a.distance.toFixed(1)} mi · {a.theme}</span>
      </div>
      <section className="grid grid-cols-3 gap-2">
        <Kpi testId="crm-d-lifetime" label="Lifetime revenue" value={usd(lifetime)} note={`${done.length} visits`} />
        <Kpi testId="crm-d-guests" label="Guests served" value={num(done.reduce((s, b) => s + b.guests, 0))} note={`usual party ${a.size}`} />
        <Kpi testId="crm-d-next" label="Next action" value={a.nextDate} note={a.nextAction} />
      </section>
      <div className="grid grid-cols-2 gap-2">
        <Field id="crm-c-name" label="Contact"><Input id="crm-c-name" value={a.contactName} onChange={(ev) => set('contactName', ev.target.value)} /></Field>
        <Field id="crm-c-email" label="Email"><Input id="crm-c-email" value={a.contactEmail} onChange={(ev) => set('contactEmail', ev.target.value)} /></Field>
        <Field id="crm-c-phone" label="Phone"><Input id="crm-c-phone" value={a.contactPhone} onChange={(ev) => set('contactPhone', ev.target.value)} /></Field>
        <Field id="crm-c-stage" label="Stage">
          <NativeSelect id="crm-c-stage" value={a.stage} onChange={(ev) => set('stage', ev.target.value)}>{STAGES.map((s) => <NativeSelectOption key={s} value={s}>{s}</NativeSelectOption>)}</NativeSelect>
        </Field>
        <Field id="crm-c-next" label="Next action"><Input id="crm-c-next" value={a.nextAction} onChange={(ev) => set('nextAction', ev.target.value)} /></Field>
        <Field id="crm-c-date" label="Due"><Input id="crm-c-date" type="date" value={a.nextDate} onChange={(ev) => set('nextDate', ev.target.value)} /></Field>
      </div>
      <h3 className="type-row-title text-foreground">Log a booking</h3>
      <form className="flex flex-wrap items-end gap-2" data-testid="crm-log-booking" onSubmit={(ev) => {
        ev.preventDefault();
        props.update((c) => {
          c.bookings.push({ id: newId('bk'), accountId: a.id, date: bk.date, guests: bk.guests, spendPerGuest: bk.spend, status: bk.status, rating: null });
          const t = c.accounts.find((q) => q.id === a.id);
          if (t && bk.status === 'Completed') t.stage = c.bookings.filter((b) => b.accountId === a.id && b.status === 'Completed').length >= 2 ? 'Recurring' : 'Booked';
        });
      }}>
        <Field id="crm-b-date" label="Date"><Input id="crm-b-date" type="date" value={bk.date} onChange={(ev) => setBk({ ...bk, date: ev.target.value })} /></Field>
        <Field id="crm-b-guests" label="Guests"><Input id="crm-b-guests" className="w-20" type="number" value={bk.guests} onChange={(ev) => setBk({ ...bk, guests: Number(ev.target.value) })} /></Field>
        <Field id="crm-b-spend" label="$ / guest"><Input id="crm-b-spend" className="w-20" type="number" value={bk.spend} onChange={(ev) => setBk({ ...bk, spend: Number(ev.target.value) })} /></Field>
        <Field id="crm-b-status" label="Status">
          <NativeSelect id="crm-b-status" value={bk.status} onChange={(ev) => setBk({ ...bk, status: ev.target.value as BookingStatus })}>
            {(['Completed', 'Upcoming', 'Cancelled', 'No-show'] as BookingStatus[]).map((s) => <NativeSelectOption key={s} value={s}>{s}</NativeSelectOption>)}
          </NativeSelect>
        </Field>
        <Button type="submit">Save booking</Button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="type-row-title text-foreground">Bookings ({bookings.length})</h3>
          <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto pr-1 type-meta text-text-body" data-testid="crm-bookings">
            {bookings.map((b) => <li key={b.id} className="flex justify-between gap-2 rounded border border-border px-2 py-1">
              <span>{b.date} {dayOf(b.date)} · {b.guests} guests · {usd(b.guests * b.spendPerGuest)}</span><span className="text-text-muted">{b.status}{b.rating ? ` · ${b.rating}★` : ''}</span>
            </li>)}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="type-row-title text-foreground">Activity</h3>
          <form className="flex gap-2" data-testid="crm-log-activity" onSubmit={(ev) => {
            ev.preventDefault(); if (!text.trim()) return;
            props.update((c) => { c.activities.push({ id: newId('act'), accountId: a.id, kind, text: text.trim(), at: new Date().toISOString() }); });
            setText('');
          }}>
            <NativeSelect aria-label="Activity type" value={kind} onChange={(ev) => setKind(ev.target.value as ActivityKind)}>{ACTIVITY_KINDS.map((k) => <NativeSelectOption key={k} value={k}>{k}</NativeSelectOption>)}</NativeSelect>
            <Input placeholder="What happened?" value={text} onChange={(ev) => setText(ev.target.value)} aria-label="Activity note" />
            <Button type="submit">Log</Button>
          </form>
          <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-1 type-meta text-text-body" data-testid="crm-activities">
            {acts.map((t) => <li key={t.id} className="rounded border border-border px-2 py-1"><span className="text-text-muted">{t.at.slice(0, 10)} · {t.kind}:</span> {t.text}</li>)}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
