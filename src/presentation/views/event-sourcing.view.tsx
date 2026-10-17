import * as React from 'react';
import { PageHead, StatusChip, EmptyState } from '@/components';
import { events as sharedEvents, organizers as sharedOrganizers, stageLabel, stageTone } from '@/lib/network-data';

export type EventTab = 'events' | 'organizers' | 'routing' | 'indicators' | 'sources';

export interface EventSourcingViewProps {
  readonly tab: EventTab;
  readonly onTab: (tab: EventTab) => void;
  readonly linkValue: string;
  readonly onLinkChange: (value: string) => void;
  readonly onLinkSubmit: () => void;
  readonly linkNotice: string | null;
  readonly engine: EngineProps;
}

export interface EngineProps {
  readonly sources: readonly { id: string; name: string; committed: boolean; selected: boolean }[];
  readonly maxListings: number;
  readonly radius: number;
  readonly running: boolean;
  readonly lines: readonly { sourceName: string; events: number; organizers: number; note: string | null }[];
  readonly message: string | null;
  readonly onToggle: (id: string) => void;
  readonly onMax: (value: number) => void;
  readonly onRadius: (value: number) => void;
  readonly onRun: () => void;
}

type Tone = 'ok' | 'info' | 'pending' | 'warn' | 'danger' | 'neutral';

function deriveEvents(): readonly { id: string; name: string; date: string; size: string; lead: string; stage: string; tone: Tone; why: string; source: string; verified: string; missing: string }[] {
  return sharedEvents.map((e) => ({
  id: e.id,
  name: e.title,
  date: e.date,
  size: String(e.size),
  lead: e.category,
  stage: stageLabel[e.stage],
  tone: stageTone[e.stage],
  why: e.why,
  source: e.source,
  verified: e.verification === 'VERIFIED' ? 'Verified' : 'Not yet verified',
  missing: e.missing,
  }));
}

function deriveOrganizers(): readonly { id: string; name: string; type: string; events: string; contact: string; status: string; tone: Tone }[] {
  return sharedOrganizers.map((o) => {
  const count = sharedEvents.filter((e) => e.organizerId === o.id).length;
  return {
    id: o.id,
    name: o.name,
    type: o.type + ', ' + o.area,
    events: count + ' upcoming',
    contact: o.contact ?? 'Missing',
    status: o.verification === 'VERIFIED' ? 'Verified' : o.contact === null ? 'Needs contact route' : 'Unverified',
    tone: o.verification === 'VERIFIED' ? 'ok' : o.contact === null ? 'warn' : 'pending',
  };
  });
}

function deriveRouting(): readonly { gap: string; event: string; fit: string; limit: string }[] {
  return sharedEvents
  .filter((e) => e.stage !== 'discovered')
  .map((e) => ({
    gap: e.date,
    event: e.title,
    fit: e.stage === 'needs_review' ? 'Conflict, needs review' : 'Fits ' + e.size + ' seats',
    limit: e.stage === 'needs_review' ? 'Protected period' : e.recurring ? 'Kitchen capacity' : 'Partner seats',
  }));
}

const indicators: readonly { name: string; value: string; note: string }[] = [
  { name: 'Event size', value: '60 to 200 guests', note: 'Assumption: about 40 percent of attendees dine nearby.' },
  { name: 'Lead time', value: '14 to 45 days', note: 'Longer lead time gives room for outreach approval.' },
  { name: 'Recurrence', value: 'Monthly for 1 of 4 events', note: 'Recurring groups matter most for slow periods.' },
  { name: 'Day and time pattern', value: 'Weekday evenings', note: 'Matches the restaurant calendar gaps.' },
  { name: 'Hotel occupancy', value: 'Sample: 78 percent', note: 'For restaurants inside or near hotels. Optional until a permitted source exists.' },
  { name: 'Group blocks', value: 'Sample: 2 this month', note: 'Sample data, labeled as sample.' },
];

const sources: readonly { name: string; access: string; method: string; cadence: string; reviewed: string; tone: Tone; status: string }[] = [
  { name: 'Ticketmaster', access: 'Official API', method: 'API', cadence: 'Daily', reviewed: 'Terms and robots check passed', tone: 'ok', status: 'Committed' },
  { name: 'Selected official local sites', access: 'Public pages, terms checked per site', method: 'Page extraction', cadence: 'Weekly', reviewed: 'Review pending for 2 sites', tone: 'pending', status: 'In review' },
  { name: 'Pasted links', access: 'User supplied', method: 'Manual', cadence: 'On submit', reviewed: 'Verified before outreach', tone: 'ok', status: 'Active' },
  { name: 'Hotel occupancy data', access: 'No permitted source yet', method: 'Not collected', cadence: 'None', reviewed: 'Not reviewed', tone: 'neutral', status: 'Optional' },
];

const funnel = ['Discover', 'Standardize', 'Deduplicate', 'Qualify', 'Match', 'Verify', 'Time outreach', 'Track'];

const tabs: readonly { id: EventTab; label: string }[] = [
  { id: 'events', label: 'Events' },
  { id: 'organizers', label: 'Organizers' },
  { id: 'routing', label: 'Demand routing' },
  { id: 'indicators', label: 'Forecast indicators' },
  { id: 'sources', label: 'Source register' },
];

const th = 'px-3 py-2 text-left type-meta text-text-muted';
const td = 'px-3 py-3 type-body text-text-body align-top';

export function EventSourcingView(props: EventSourcingViewProps): React.ReactElement {
  const { tab } = props;
  const events = deriveEvents();
  const organizers = deriveOrganizers();
  const routing = deriveRouting();
  return (
    <div data-vid="t4zp9xc" className="flex flex-col gap-6 p-6">
      <PageHead data-vid="og0tm7e"
        title="Event Sourcing"
        description="A running registry of upcoming events and organizers for the next 12 months, routed to your quiet hours. Sample data, shown as signals with stated assumptions."
      />

      <ol data-vid="0o3yk0t" className="flex flex-wrap gap-2" aria-label="Sourcing funnel">
        {funnel.map((step, i) => (
          <li data-vid="gpwqrqv" key={step} className="rounded-full border border-border bg-surface-sunken px-3 py-1 type-meta text-text-body">
            {i + 1}. {step}
          </li>
        ))}
      </ol>

      <section data-vid="eng0001" aria-label="Run lead engine" className="flex flex-col gap-3 rounded-card border border-border p-4">
        <h2 data-vid="eng0002" className="type-row-title text-foreground">Run lead engine</h2>
        <p data-vid="eng0003" className="type-body text-text-muted">Pulls upcoming Miami events and organizers from the sources you tick. Only sources marked committed will run.</p>
        <div data-vid="eng0004" className="flex flex-wrap gap-4">
          {props.engine.sources.map((s) => (
            <label data-vid="eng0005" key={s.id} className="flex min-h-11 items-center gap-2 type-body text-text-body">
              <input data-vid="eng0006" type="checkbox" checked={s.selected} disabled={!s.committed || props.engine.running} onChange={() => props.engine.onToggle(s.id)} />
              {s.name}{s.committed ? '' : ' (not cleared)'}
            </label>
          ))}
        </div>
        <div data-vid="eng0007" className="flex flex-wrap items-end gap-4">
          <label data-vid="eng0008" className="flex flex-col gap-1 type-meta text-text-muted">Radius from downtown: {props.engine.radius} miles
            <input data-vid="eng0009" type="range" min={3} max={10} value={props.engine.radius} onChange={(e) => props.engine.onRadius(Number(e.target.value))} />
          </label>
          <label data-vid="eng0010" className="flex flex-col gap-1 type-meta text-text-muted">Max listings
            <input data-vid="eng0011" type="number" min={1} max={200} value={props.engine.maxListings} onChange={(e) => props.engine.onMax(Number(e.target.value))} className="min-h-11 w-28 rounded-md border border-border-strong bg-background px-3 type-body" />
          </label>
          <button data-vid="eng0012" type="button" disabled={props.engine.running} onClick={props.engine.onRun} className="min-h-11 rounded-md bg-primary px-4 type-body text-primary-foreground">{props.engine.running ? 'Running...' : 'Run engine'}</button>
        </div>
        {props.engine.message !== null && <p data-vid="eng0013" role="status" className="type-body text-text-body">{props.engine.message}</p>}
        {props.engine.lines.length > 0 && (
          <ul data-vid="eng0014" className="flex flex-col gap-1">
            {props.engine.lines.map((l) => (
              <li data-vid="eng0015" key={l.sourceName} className="type-body text-text-body">{l.sourceName}: {l.events} events, {l.organizers} organizers{l.note !== null ? ' - ' + l.note : ''}</li>
            ))}
          </ul>
        )}
      </section>

      <form data-vid="2nmbtbk"
        className="flex flex-col gap-2 rounded-card border border-border p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          props.onLinkSubmit();
        }}
      >
        <div data-vid="11llo3d" className="flex flex-1 flex-col gap-1">
          <label data-vid="2j8jllj" htmlFor="event-link" className="type-row-title text-foreground">Paste an event or organizer link</label>
          <input data-vid="yv8a4pe"
            id="event-link"
            type="url"
            value={props.linkValue}
            onChange={(e) => props.onLinkChange(e.target.value)}
            placeholder="https://"
            className="min-h-11 rounded-md border border-border-strong bg-background px-3 type-body"
          />
        </div>
        <button data-vid="8aqt581" type="submit" className="min-h-11 rounded-md bg-primary px-4 type-body text-primary-foreground">Add to registry</button>
      </form>
      {props.linkNotice !== null && (
        <p data-vid="j13fxby" role="status" className="type-body text-text-body">{props.linkNotice}</p>
      )}

      <div data-vid="wv2lp1d" role="tablist" aria-label="Event Sourcing sections" className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button data-vid="l66y9eh"
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => props.onTab(t.id)}
            className={'min-h-11 px-3 type-body ' + (tab === t.id ? 'border-b-2 border-primary text-foreground' : 'text-text-muted')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'events' && (
        <div data-vid="mgww7np" className="max-h-[28rem] overflow-auto rounded-card border border-border">
          <table data-vid="vjljz1l" className="w-full min-w-[56rem]">
            <thead data-vid="ddtvb45" className="sticky top-0 z-10 bg-background">
              <tr data-vid="28dzehj">
                <th data-vid="up6qzgl" className={th}>Event</th><th data-vid="7oce644" className={th}>Date</th><th data-vid="cv104mj" className={th}>Size</th>
                <th data-vid="yg88txs" className={th}>Stage</th><th data-vid="naum63s" className={th}>Why it matches</th><th data-vid="k4iep0i" className={th}>Source</th><th data-vid="ahv8dfh" className={th}>Missing</th>
              </tr>
            </thead>
            <tbody data-vid="6ca449v">
              {events.map((e) => (
                <tr data-vid="yxmbsyd" key={e.id} className="border-t border-border">
                  <td data-vid="kp4ww8s" className={td}><span data-vid="jbin7zk" className="type-row-title text-foreground">{e.name}</span><br data-vid="5shxluk" />{e.lead}</td>
                  <td data-vid="makgkiq" className={td}>{e.date}</td>
                  <td data-vid="5yilygk" className={td}>{e.size}</td>
                  <td data-vid="1w8w038" className={td}><StatusChip data-vid="0ixylal" label={e.stage} tone={e.tone} /></td>
                  <td data-vid="4lcv9w7" className={td}>{e.why}</td>
                  <td data-vid="d17uoss" className={td}>{e.source}<br data-vid="s7rca37" /><span data-vid="a2zxsck" className="text-text-muted">{e.verified}</span></td>
                  <td data-vid="xc1tvqx" className={td}>{e.missing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'organizers' && (
        <div data-vid="46e5uyw" className="max-h-[28rem] overflow-auto rounded-card border border-border">
          <table data-vid="e7ctyhl" className="w-full min-w-[40rem]">
            <thead data-vid="wbkmoie" className="sticky top-0 z-10 bg-background">
              <tr data-vid="m41hudh"><th data-vid="czt7bl2" className={th}>Organizer</th><th data-vid="0q0y7mi" className={th}>Type</th><th data-vid="6l7lted" className={th}>Events</th><th data-vid="dv4084c" className={th}>Contact route</th><th data-vid="rvlva7l" className={th}>Status</th></tr>
            </thead>
            <tbody data-vid="xfcmr3e">
              {organizers.map((o) => (
                <tr data-vid="zpi9t5r" key={o.id} className="border-t border-border">
                  <td data-vid="srh6lvt" className={td}><span data-vid="7kd657r" className="type-row-title text-foreground">{o.name}</span></td>
                  <td data-vid="g11hlvs" className={td}>{o.type}</td>
                  <td data-vid="ifzbyt0" className={td}>{o.events}</td>
                  <td data-vid="49ncdcy" className={td}>{o.contact}</td>
                  <td data-vid="zi2722k" className={td}><StatusChip data-vid="cfp37lh" label={o.status} tone={o.tone} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'routing' && (
        <div data-vid="6j7jafp" className="flex flex-col gap-3">
          <p data-vid="bva6b3b" className="type-body text-text-body">Qualified entries matched to your calendar gaps. The limit shown is the one that governs each date. Routing never sends anything: outreach needs approval.</p>
          <ul data-vid="wgv4xkm" className="flex flex-col gap-2">
            {routing.map((r) => (
              <li data-vid="scyw9vh" key={r.gap} className="flex flex-col gap-1 rounded-card border border-border p-4">
                <span data-vid="hr7ow43" className="type-row-title text-foreground">{r.gap}</span>
                <span data-vid="lq5nv9a" className="type-body text-text-body">{r.event}</span>
                <span data-vid="rei59iu" className="type-meta text-text-muted">{r.fit}. Binding limit: {r.limit}.</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'indicators' && (
        <div data-vid="l3z3qmb" className="flex flex-col gap-3">
          <ul data-vid="fgevm9n" className="grid gap-3 sm:grid-cols-2">
            {indicators.map((i) => (
              <li data-vid="7bh1l2p" key={i.name} className="flex flex-col gap-1 rounded-card border border-border p-4">
                <span data-vid="ammpnww" className="type-meta text-text-muted">{i.name}</span>
                <span data-vid="62713ke" className="type-row-title text-foreground">{i.value}</span>
                <span data-vid="qixrnyn" className="type-body text-text-body">{i.note}</span>
              </li>
            ))}
          </ul>
          <p data-vid="kdrcqsu" className="type-meta text-text-muted">Signals, not guaranteed forecasts. Event attendance is not proof of dining demand, and a major event never triggers a discount on its own.</p>
        </div>
      )}

      {tab === 'sources' && (
        <div data-vid="sq8vuxo" className="overflow-x-auto">
          <table data-vid="sun5u4m" className="w-full min-w-[48rem]">
            <thead data-vid="1zqnejc">
              <tr data-vid="4u2iwvv"><th data-vid="88d89no" className={th}>Source</th><th data-vid="j5tb3sb" className={th}>Permitted access</th><th data-vid="08lr6ox" className={th}>Method</th><th data-vid="rm7jxaz" className={th}>Refresh</th><th data-vid="1cara9c" className={th}>Last review</th><th data-vid="4dwxgzu" className={th}>Status</th></tr>
            </thead>
            <tbody data-vid="41d8nc1">
              {sources.map((s) => (
                <tr data-vid="r59btsu" key={s.name} className="border-t border-border">
                  <td data-vid="psfamo5" className={td}><span data-vid="w32svos" className="type-row-title text-foreground">{s.name}</span></td>
                  <td data-vid="m1ssdci" className={td}>{s.access}</td>
                  <td data-vid="x629zsn" className={td}>{s.method}</td>
                  <td data-vid="pcy701w" className={td}>{s.cadence}</td>
                  <td data-vid="pkndr2j" className={td}>{s.reviewed}</td>
                  <td data-vid="0r4lv13" className={td}><StatusChip data-vid="g594s9t" label={s.status} tone={s.tone} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {events.length === 0 && <EmptyState data-vid="im1pbh7" title="No events yet" description="Paste a link to add the first one." />}
    </div>
  );
}
