import * as React from 'react';
import { PageHead, StatusChip } from '@/components';

export interface InvOccurrence {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly guests: number;
}

export interface InvRecommendation {
  readonly id: string;
  readonly item: string;
  readonly portions: number;
  readonly prep: number;
  readonly usable: number;
  readonly buy: number;
  readonly approved: boolean;
}

export interface InvWasteEntry {
  readonly id: string;
  readonly item: string;
  readonly portions: number;
  readonly reason: string;
  readonly cost: string;
}

export interface InvMeasure {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export interface InventoryWasteViewProps {
  readonly occurrences: readonly InvOccurrence[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly guests: number;
  readonly onGuests: (value: string) => void;
  readonly recommendations: readonly InvRecommendation[];
  readonly onApprove: (id: string) => void;
  readonly items: readonly string[];
  readonly wasteItem: string;
  readonly wastePortions: string;
  readonly wasteReason: string;
  readonly onWasteItem: (value: string) => void;
  readonly onWastePortions: (value: string) => void;
  readonly onWasteReason: (value: string) => void;
  readonly onLogWaste: () => void;
  readonly waste: readonly InvWasteEntry[];
  readonly measures: readonly InvMeasure[];
  readonly notice: string | null;
}

const th = 'px-3 py-2 text-left type-meta text-text-muted';
const td = 'px-3 py-3 type-body text-text-body';
const input = 'min-h-11 rounded-md border border-border bg-background px-3 type-body text-foreground';

export function InventoryWasteView(props: InventoryWasteViewProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHead
        title="Inventory & Waste"
        description="Turn expected guests into purchasing and prep recommendations, and track waste. Sample sales history and recipes are used in this demo; quantities are recommendations the chef approves, never orders placed for you."
      />
      {props.notice !== null && (
        <p role="status" className="rounded-md border border-border p-3 type-body text-text-body">{props.notice}</p>
      )}
      <section aria-labelledby="inv-measures" className="flex flex-col gap-3">
        <h2 id="inv-measures" className="type-row-title text-foreground">Waste measures</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {props.measures.map((m) => (
            <div key={m.id} className="rounded-lg border border-border p-4">
              <p className="type-meta text-text-muted">{m.label}</p>
              <p className="type-section-title text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="inv-needs" className="flex flex-col gap-4">
        <h2 id="inv-needs" className="type-row-title text-foreground">Booked occurrences and what they need</h2>
        <div role="tablist" aria-label="Upcoming booked occurrences" className="flex flex-wrap gap-2">
          {props.occurrences.map((o) => (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={props.selectedId === o.id}
              onClick={() => props.onSelect(o.id)}
              className={'min-h-11 rounded-md border px-4 type-body ' + (props.selectedId === o.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-text-body')}
            >
              {o.title} ({o.date})
            </button>
          ))}
        </div>
        <label className="flex max-w-xs flex-col gap-1 type-body text-text-body">
          Expected guests
          <input type="number" min={0} value={String(props.guests)} onChange={(e) => props.onGuests(e.target.value)} className={input} />
          <span className="type-meta text-text-muted">Change it, for example when a group grows by 20 guests, and the quantities update.</span>
        </label>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem]">
            <thead>
              <tr>
                <th className={th}>Item</th>
                <th className={th}>Portions needed</th>
                <th className={th}>Prep with buffer</th>
                <th className={th}>Usable stock</th>
                <th className={th}>Recommended to buy</th>
                <th className={th}>Chef decision</th>
              </tr>
            </thead>
            <tbody>
              {props.recommendations.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className={td}>{r.item}</td>
                  <td className={td}>{r.portions}</td>
                  <td className={td}>{r.prep}</td>
                  <td className={td}>{r.usable}</td>
                  <td className={td}>{r.buy}</td>
                  <td className={td}>
                    {r.approved ? (
                      <StatusChip label="Approved" tone="ok" />
                    ) : (
                      <button type="button" onClick={() => props.onApprove(r.id)} className="min-h-11 rounded-md border border-border px-3 type-body text-foreground">
                        Approve quantity
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="type-meta text-text-muted">Portions = guests x the share who order the item. Prep adds the chef's 10% buffer. Buy = prep minus usable stock.</p>
      </section>
      <section aria-labelledby="inv-waste" className="flex flex-col gap-4">
        <h2 id="inv-waste" className="type-row-title text-foreground">Log waste</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 type-body text-text-body">
            Item
            <select value={props.wasteItem} onChange={(e) => props.onWasteItem(e.target.value)} className={input}>
              {props.items.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 type-body text-text-body">
            Portions wasted
            <input type="number" min={0} value={props.wastePortions} onChange={(e) => props.onWastePortions(e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-1 type-body text-text-body">
            Reason
            <select value={props.wasteReason} onChange={(e) => props.onWasteReason(e.target.value)} className={input}>
              <option value="Over-prepped">Over-prepped</option>
              <option value="Spoiled">Spoiled</option>
              <option value="Plate waste">Plate waste</option>
              <option value="Trim">Trim</option>
            </select>
          </label>
          <button type="button" onClick={props.onLogWaste} className="min-h-11 rounded-md bg-primary px-4 type-body text-primary-foreground">Log waste</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem]">
            <thead>
              <tr>
                <th className={th}>Item</th>
                <th className={th}>Portions</th>
                <th className={th}>Reason</th>
                <th className={th}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {props.waste.map((w) => (
                <tr key={w.id} className="border-t border-border">
                  <td className={td}>{w.item}</td>
                  <td className={td}>{w.portions}</td>
                  <td className={td}>{w.reason}</td>
                  <td className={td}>{w.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="type-meta text-text-muted">
          Reference:{' '}
          <a href="https://www.epa.gov/sustainable-management-food" target="_blank" rel="noreferrer" className="text-primary underline">U.S. EPA food waste guidance</a>
          {' · '}
          <a href="https://refed.org" target="_blank" rel="noreferrer" className="text-primary underline">ReFED</a>
        </p>
      </section>
    </div>
  );
}
