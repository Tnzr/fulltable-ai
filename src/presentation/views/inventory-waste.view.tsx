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
    <div data-vid="0rf2t7o" className="flex flex-col gap-6 p-6">
      <PageHead data-vid="d22z6as"
        title="Inventory & Waste"
        description="Turn expected guests into purchasing and prep recommendations, and track waste. Sample sales history and recipes are used in this demo; quantities are recommendations the chef approves, never orders placed for you."
      />
      {props.notice !== null && (
        <p data-vid="cdhqe4i" role="status" className="rounded-md border border-border p-3 type-body text-text-body">{props.notice}</p>
      )}
      <section data-vid="ig62edv" aria-labelledby="inv-measures" className="flex flex-col gap-3">
        <h2 data-vid="ff9xc86" id="inv-measures" className="type-row-title text-foreground">Waste measures</h2>
        <div data-vid="awuavxc" className="grid gap-3 sm:grid-cols-3">
          {props.measures.map((m) => (
            <div data-vid="6ix4o9w" key={m.id} className="rounded-lg border border-border p-4">
              <p data-vid="8bb9ffz" className="type-meta text-text-muted">{m.label}</p>
              <p data-vid="v0ws76x" className="type-section-title text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      </section>
      <section data-vid="1ccfiqs" aria-labelledby="inv-needs" className="flex flex-col gap-4">
        <h2 data-vid="d9dexol" id="inv-needs" className="type-row-title text-foreground">Booked occurrences and what they need</h2>
        <div data-vid="f4uye0o" role="tablist" aria-label="Upcoming booked occurrences" className="flex flex-wrap gap-2">
          {props.occurrences.map((o) => (
            <button data-vid="1rv25ci"
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
        <label data-vid="zekc697" className="flex max-w-xs flex-col gap-1 type-body text-text-body">
          Expected guests
          <input data-vid="nt7h35e" type="number" min={0} value={String(props.guests)} onChange={(e) => props.onGuests(e.target.value)} className={input} />
          <span data-vid="1brolg4" className="type-meta text-text-muted">Change it, for example when a group grows by 20 guests, and the quantities update.</span>
        </label>
        <div data-vid="kav9tvv" className="overflow-x-auto">
          <table data-vid="1nkdta4" className="w-full min-w-[44rem]">
            <thead data-vid="xq0oyfr">
              <tr data-vid="3sq0us1">
                <th data-vid="ap7cnyq" className={th}>Item</th>
                <th data-vid="lxoo9m7" className={th}>Portions needed</th>
                <th data-vid="p2fitqk" className={th}>Prep with buffer</th>
                <th data-vid="2mc5mri" className={th}>Usable stock</th>
                <th data-vid="mhmmjaw" className={th}>Recommended to buy</th>
                <th data-vid="b2f2kxn" className={th}>Chef decision</th>
              </tr>
            </thead>
            <tbody data-vid="psa72cv">
              {props.recommendations.map((r) => (
                <tr data-vid="t0d3jr0" key={r.id} className="border-t border-border">
                  <td data-vid="xh718np" className={td}>{r.item}</td>
                  <td data-vid="ozzsgcy" className={td}>{r.portions}</td>
                  <td data-vid="9rve9fg" className={td}>{r.prep}</td>
                  <td data-vid="gbg0kw7" className={td}>{r.usable}</td>
                  <td data-vid="sg8xn0r" className={td}>{r.buy}</td>
                  <td data-vid="wr103tl" className={td}>
                    {r.approved ? (
                      <StatusChip data-vid="gcntxai" label="Approved" tone="ok" />
                    ) : (
                      <button data-vid="1k8mooj" type="button" onClick={() => props.onApprove(r.id)} className="min-h-11 rounded-md border border-border px-3 type-body text-foreground">
                        Approve quantity
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p data-vid="t02higx" className="type-meta text-text-muted">Portions = guests x the share who order the item. Prep adds the chef's 10% buffer. Buy = prep minus usable stock.</p>
      </section>
      <section data-vid="q8cad9i" aria-labelledby="inv-waste" className="flex flex-col gap-4">
        <h2 data-vid="7vjoot7" id="inv-waste" className="type-row-title text-foreground">Log waste</h2>
        <div data-vid="eomladl" className="flex flex-wrap items-end gap-3">
          <label data-vid="empndzb" className="flex flex-col gap-1 type-body text-text-body">
            Item
            <select data-vid="tr1oe0x" value={props.wasteItem} onChange={(e) => props.onWasteItem(e.target.value)} className={input}>
              {props.items.map((i) => (
                <option data-vid="a5udxg9" key={i} value={i}>{i}</option>
              ))}
            </select>
          </label>
          <label data-vid="i3eu4fy" className="flex flex-col gap-1 type-body text-text-body">
            Portions wasted
            <input data-vid="o2pxm6a" type="number" min={0} value={props.wastePortions} onChange={(e) => props.onWastePortions(e.target.value)} className={input} />
          </label>
          <label data-vid="1lcbly7" className="flex flex-col gap-1 type-body text-text-body">
            Reason
            <select data-vid="rmvynj5" value={props.wasteReason} onChange={(e) => props.onWasteReason(e.target.value)} className={input}>
              <option data-vid="bkne6yw" value="Over-prepped">Over-prepped</option>
              <option data-vid="s75a4qj" value="Spoiled">Spoiled</option>
              <option data-vid="sc58tn5" value="Plate waste">Plate waste</option>
              <option data-vid="991jtap" value="Trim">Trim</option>
            </select>
          </label>
          <button data-vid="b18el0g" type="button" onClick={props.onLogWaste} className="min-h-11 rounded-md bg-primary px-4 type-body text-primary-foreground">Log waste</button>
        </div>
        <div data-vid="stttx08" className="overflow-x-auto">
          <table data-vid="goryisa" className="w-full min-w-[32rem]">
            <thead data-vid="l8be2h1">
              <tr data-vid="kvhbige">
                <th data-vid="2fii63m" className={th}>Item</th>
                <th data-vid="qglhppb" className={th}>Portions</th>
                <th data-vid="iead5bk" className={th}>Reason</th>
                <th data-vid="o8z302t" className={th}>Cost</th>
              </tr>
            </thead>
            <tbody data-vid="4um9rey">
              {props.waste.map((w) => (
                <tr data-vid="4ksxc8s" key={w.id} className="border-t border-border">
                  <td data-vid="0d65v3y" className={td}>{w.item}</td>
                  <td data-vid="g7o2g8y" className={td}>{w.portions}</td>
                  <td data-vid="ftd38ab" className={td}>{w.reason}</td>
                  <td data-vid="qae2y6a" className={td}>{w.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p data-vid="22gg2qd" className="type-meta text-text-muted">
          Reference:{' '}
          <a data-vid="nkxk8jc" href="https://www.epa.gov/sustainable-management-food" target="_blank" rel="noreferrer" className="text-primary underline">U.S. EPA food waste guidance</a>
          {' · '}
          <a data-vid="z0nfr1y" href="https://refed.org" target="_blank" rel="noreferrer" className="text-primary underline">ReFED</a>
        </p>
      </section>
    </div>
  );
}
