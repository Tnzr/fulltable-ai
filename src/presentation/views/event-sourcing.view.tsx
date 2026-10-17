import * as React from 'react';
import { PageHead, StatusChip, EmptyState } from '@/components';

export type EventTab = 'events' | 'organizers' | 'routing' | 'indicators' | 'sources';

export interface EventSourcingViewProps {
  readonly tab: EventTab;
  readonly onTab: (tab: EventTab) => void;
  readonly linkValue: string;
  readonly onLinkChange: (value: string) => void;
  readonly onLinkSubmit: () => void;
  readonly linkNotice: string | null;
}

type Tone = 'ok' | 'info' | 'pending' | 'warn' | 'danger' | 'neutral';

const events: readonly { id: string; name: string; date: string; size: string; lead: string; stage: string; tone: Tone; why: string; source: string; verified: string; missing: string }[] = [
  { id: 'e1', name: 'Harbor Rowing Club regatta dinner', date: 'Mar 14', size: '120', lead: 'Sports club', stage: 'Qualified', tone: 'ok', why: 'Falls on a quiet Tuesday evening and the group is 3 miles away.', source: 'Official club site (permitted page)', verified: 'Verified 2 days ago', missing: 'None' },
  { id: 'e2', name: 'Riverside Tech Meetup, monthly', date: 'Mar 20', size: '60', lead: 'Corporate team', stage: 'Deduplicated', tone: 'info', why: 'Recurs monthly and fits the weekday lunch gap.', source: 'Ticketmaster listing', verified: 'Verified 6 days ago', missing: 'Organizer contact route' },
  { id: 'e3', name: 'Lakeview Alumni Reunion weekend', date: 'Apr 4', size: '200', lead: 'Alumni group', stage: 'Discovered', tone: 'pending', why: 'Large visiting group, but dining demand is not confirmed.', source: 'Pasted link', verified: 'Not yet verified', missing: 'Group size, sponsorship check' },
  { id: 'e4', name: 'Downtown Arts Walk', date: 'Apr 18', size: '800', lead: 'Public festival', stage: 'Needs review', tone: 'warn', why: 'Major event. Attendance is not proof of dining demand and no discount is triggered.', source: 'City events calendar', verified: 'Verified 9 days ago', missing: 'Existing dining sponsorships' },
];

const organizers: readonly { id: string; name: string; type: string; events: string; contact: string; status: string; tone: Tone }[] = [
  { id: 'o1', name: 'Harbor Rowing Club', type: 'Sports club', events: '3 upcoming', contact: 'Business contact route on file', status: 'Qualified', tone: 'ok' },
  { id: 'o2', name: 'Riverside Tech Meetup', type: 'Corporate community', events: '12 recurring', contact: 'Missing', status: 'Needs contact route', tone: 'warn' },
  { id: 'o3', name: 'Lakeview Alumni Association', type: 'Alumni group', events: '1 upcoming', contact: 'Business contact route on file', status: 'Discovered', tone: 'pending' },
];

const routing: readonly { gap: string; event: string; fit: string; limit: string }[] = [
  { gap: 'Tue Mar 14, 6:00 pm', event: 'Harbor Rowing Club regatta dinner', fit: 'Fits 120 seats', limit: 'Partner seats' },
  { gap: 'Wed Mar 20, 12:00 pm', event: 'Riverside Tech Meetup', fit: 'Fits 60 seats', limit: 'Kitchen capacity' },
  { gap: 'Fri Apr 4, 7:00 pm', event: 'Lakeview Alumni Reunion', fit: 'Conflict', limit: 'Protected period' },
];

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
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHead
        title="Event Sourcing"
        description="A running registry of upcoming events and organizers for the next 12 months, routed to your quiet hours. Sample data, shown as signals with stated assumptions."
      />

      <ol className="flex flex-wrap gap-2" aria-label="Sourcing funnel">
        {funnel.map((step, i) => (
          <li key={step} className="rounded-full border border-border bg-surface-sunken px-3 py-1 type-meta text-text-body">
            {i + 1}. {step}
          </li>
        ))}
      </ol>

      <form
        className="flex flex-col gap-2 rounded-card border border-border p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          props.onLinkSubmit();
        }}
      >
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="event-link" className="type-row-title text-foreground">Paste an event or organizer link</label>
          <input
            id="event-link"
            type="url"
            value={props.linkValue}
            onChange={(e) => props.onLinkChange(e.target.value)}
            placeholder="https://"
            className="min-h-11 rounded-md border border-border-strong bg-background px-3 type-body"
          />
        </div>
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 type-body text-primary-foreground">Add to registry</button>
      </form>
      {props.linkNotice !== null && (
        <p role="status" className="type-body text-text-body">{props.linkNotice}</p>
      )}

      <div role="tablist" aria-label="Event Sourcing sections" className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem]">
            <thead>
              <tr>
                <th className={th}>Event</th><th className={th}>Date</th><th className={th}>Size</th>
                <th className={th}>Stage</th><th className={th}>Why it matches</th><th className={th}>Source</th><th className={th}>Missing</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className={td}><span className="type-row-title text-foreground">{e.name}</span><br />{e.lead}</td>
                  <td className={td}>{e.date}</td>
                  <td className={td}>{e.size}</td>
                  <td className={td}><StatusChip label={e.stage} tone={e.tone} /></td>
                  <td className={td}>{e.why}</td>
                  <td className={td}>{e.source}<br /><span className="text-text-muted">{e.verified}</span></td>
                  <td className={td}>{e.missing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'organizers' && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem]">
            <thead>
              <tr><th className={th}>Organizer</th><th className={th}>Type</th><th className={th}>Events</th><th className={th}>Contact route</th><th className={th}>Status</th></tr>
            </thead>
            <tbody>
              {organizers.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className={td}><span className="type-row-title text-foreground">{o.name}</span></td>
                  <td className={td}>{o.type}</td>
                  <td className={td}>{o.events}</td>
                  <td className={td}>{o.contact}</td>
                  <td className={td}><StatusChip label={o.status} tone={o.tone} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'routing' && (
        <div className="flex flex-col gap-3">
          <p className="type-body text-text-body">Qualified entries matched to your calendar gaps. The limit shown is the one that governs each date. Routing never sends anything: outreach needs approval.</p>
          <ul className="flex flex-col gap-2">
            {routing.map((r) => (
              <li key={r.gap} className="flex flex-col gap-1 rounded-card border border-border p-4">
                <span className="type-row-title text-foreground">{r.gap}</span>
                <span className="type-body text-text-body">{r.event}</span>
                <span className="type-meta text-text-muted">{r.fit}. Binding limit: {r.limit}.</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'indicators' && (
        <div className="flex flex-col gap-3">
          <ul className="grid gap-3 sm:grid-cols-2">
            {indicators.map((i) => (
              <li key={i.name} className="flex flex-col gap-1 rounded-card border border-border p-4">
                <span className="type-meta text-text-muted">{i.name}</span>
                <span className="type-row-title text-foreground">{i.value}</span>
                <span className="type-body text-text-body">{i.note}</span>
              </li>
            ))}
          </ul>
          <p className="type-meta text-text-muted">Signals, not guaranteed forecasts. Event attendance is not proof of dining demand, and a major event never triggers a discount on its own.</p>
        </div>
      )}

      {tab === 'sources' && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem]">
            <thead>
              <tr><th className={th}>Source</th><th className={th}>Permitted access</th><th className={th}>Method</th><th className={th}>Refresh</th><th className={th}>Last review</th><th className={th}>Status</th></tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.name} className="border-t border-border">
                  <td className={td}><span className="type-row-title text-foreground">{s.name}</span></td>
                  <td className={td}>{s.access}</td>
                  <td className={td}>{s.method}</td>
                  <td className={td}>{s.cadence}</td>
                  <td className={td}>{s.reviewed}</td>
                  <td className={td}><StatusChip label={s.status} tone={s.tone} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {events.length === 0 && <EmptyState title="No events yet" description="Paste a link to add the first one." />}
    </div>
  );
}
