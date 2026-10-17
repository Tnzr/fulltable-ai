import * as React from 'react';

export type DiagnosticField = 'seats' | 'sales' | 'payroll' | 'food' | 'lift' | 'payrollCut' | 'foodCut';

export interface DiagnosticRow {
  readonly id: string;
  readonly label: string;
  readonly before: string;
  readonly after: string;
  readonly delta: string;
}

export interface DiagnosticBar {
  readonly id: string;
  readonly label: string;
  readonly beforePct: number;
  readonly afterPct: number;
}

export interface GrowthDiagnosticViewProps {
  readonly values: Readonly<Record<DiagnosticField, string>>;
  readonly onChange: (field: DiagnosticField, value: string) => void;
  readonly eligible: boolean;
  readonly rows: readonly DiagnosticRow[];
  readonly bottom: DiagnosticRow;
  readonly annualGain: string;
  readonly bars: readonly DiagnosticBar[];
  readonly onReset: () => void;
}

const SOURCES: readonly { href: string; label: string }[] = [
  { href: 'https://www.epa.gov/sustainable-management-food', label: 'U.S. EPA: Sustainable Management of Food' },
  { href: 'https://refed.org', label: 'ReFED: food waste solutions and data' },
  { href: 'https://restaurant.org', label: 'National Restaurant Association: industry research' },
];

interface FieldProps {
  readonly id: DiagnosticField;
  readonly label: string;
  readonly hint?: string;
  readonly slider?: { readonly min: number; readonly max: number; readonly step: number };
  readonly value: string;
  readonly onChange: (field: DiagnosticField, value: string) => void;
}

function Field(props: FieldProps): React.ReactElement {
  const inputId = 'gd-' + props.id;
  return (
    <div data-vid="0za9ndr" className="flex flex-col gap-1">
      <label data-vid="aco3a92" htmlFor={inputId} className="type-body text-foreground">{props.label}</label>
      <input data-vid="5lsjwgj"
        id={inputId}
        type="number"
        inputMode="decimal"
        min={0}
        value={props.value}
        onChange={(e) => props.onChange(props.id, e.target.value)}
        className="min-h-11 rounded-md border border-border bg-background px-3 type-body text-foreground"
      />
      {props.slider !== undefined && (
        <input data-vid="ouib5e5"
          type="range"
          aria-label={props.label + ' slider'}
          min={props.slider.min}
          max={props.slider.max}
          step={props.slider.step}
          value={Number(props.value) || 0}
          onChange={(e) => props.onChange(props.id, e.target.value)}
          className="w-full accent-primary"
        />
      )}
      {props.hint !== undefined && <span data-vid="lefscht" className="type-meta text-text-muted">{props.hint}</span>}
    </div>
  );
}

export function GrowthDiagnosticView(props: GrowthDiagnosticViewProps): React.ReactElement {
  const { values, onChange } = props;
  const th = 'px-3 py-2 text-left type-meta text-text-muted';
  const td = 'px-3 py-3 type-body text-text-body';
  const tdb = 'px-3 py-3 type-row-title text-foreground';
  return (
    <main data-vid="heeput4" className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header data-vid="cinwctd" className="flex flex-col gap-3">
        <p data-vid="ryidl1u" className="type-meta text-text-muted">Growth Diagnostic for restaurants with 40 or more seats</p>
        <h1 data-vid="tfo5ov6" className="type-page-title text-foreground">What could slow periods be worth to you?</h1>
        <p data-vid="9y2jbck" className="type-body text-text-body">
          Enter your weekly numbers and compare your bottom line with and without FullTable AI. Every formula is shown and every assumption is yours to change. These are illustrative estimates, not guarantees.
        </p>
      </header>

      <section data-vid="x6h7rlx" aria-labelledby="gd-inputs" className="grid gap-6 rounded-lg border border-border p-6 md:grid-cols-2">
        <div data-vid="v2debv7" className="flex flex-col gap-4">
          <h2 data-vid="84j99ch" id="gd-inputs" className="type-row-title text-foreground">Your restaurant today</h2>
          <Field data-vid="vqwp13b" id="seats" label="Number of seats" value={values.seats} onChange={onChange} />
          <Field data-vid="vdefpiz" id="sales" label="Average weekly sales ($)" slider={{ min: 5000, max: 200000, step: 500 }} value={values.sales} onChange={onChange} />
          <Field data-vid="sxt8k6w" id="payroll" label="Average weekly payroll ($)" value={values.payroll} onChange={onChange} />
          <Field data-vid="sp16kxs" id="food" label="Average weekly food and beverage cost ($)" value={values.food} onChange={onChange} />
        </div>
        <div data-vid="b3ze529" className="flex flex-col gap-4">
          <h2 data-vid="evqyajt" className="type-row-title text-foreground">Assumptions with the service</h2>
          <Field data-vid="1kiormy" id="lift" label="Sales lift from filled slow periods (%)" hint="Illustrative example: 11" slider={{ min: 0, max: 30, step: 0.5 }} value={values.lift} onChange={onChange} />
          <Field data-vid="ccmubdu" id="payrollCut" label="Payroll reduction from matching staff to demand (%)" hint="Illustrative example: 4" slider={{ min: 0, max: 20, step: 0.5 }} value={values.payrollCut} onChange={onChange} />
          <Field data-vid="y51ucur" id="foodCut" label="Food and beverage cost reduction from less waste (%)" hint="Illustrative example: 9" slider={{ min: 0, max: 30, step: 0.5 }} value={values.foodCut} onChange={onChange} />
          <button data-vid="d7g7i3e" type="button" onClick={props.onReset} className="min-h-11 self-start rounded-md border border-border px-4 type-body text-foreground">
            Reset to the example
          </button>
        </div>
      </section>

      {!props.eligible && (
        <p data-vid="1sgefim" role="status" className="rounded-md border border-border p-4 type-body text-text-body">
          The diagnostic is built for restaurants with at least 40 seats. You can still see the numbers below. To join the waitlist for smaller restaurants, use Contact us.
        </p>
      )}

      <section data-vid="swhtyo6" aria-labelledby="gd-results" className="flex flex-col gap-4">
        <h2 data-vid="amnhk1k" id="gd-results" className="type-section-title text-foreground">With and without the service</h2>
        <div data-vid="y8rl5fb" className="overflow-x-auto">
          <table data-vid="v8kzest" className="w-full min-w-[32rem]">
            <thead data-vid="wvnvqyl">
              <tr data-vid="25q2z76">
                <th data-vid="wgxm5r3" className={th}>Per week</th>
                <th data-vid="pig5dcb" className={th}>Without</th>
                <th data-vid="5rjm1hj" className={th}>With</th>
                <th data-vid="lbrmq99" className={th}>Change</th>
              </tr>
            </thead>
            <tbody data-vid="i4snfep">
              {props.rows.map((r) => (
                <tr data-vid="c7k13j9" key={r.id} className="border-t border-border">
                  <td data-vid="eb718z7" className={td}>{r.label}</td>
                  <td data-vid="tobtic1" className={td}>{r.before}</td>
                  <td data-vid="wy5ituq" className={td}>{r.after}</td>
                  <td data-vid="eqc6yce" className={td}>{r.delta}</td>
                </tr>
              ))}
              <tr data-vid="eg4lsc9" className="border-t border-border">
                <td data-vid="ahiww0v" className={tdb}>{props.bottom.label}</td>
                <td data-vid="7u6t7d0" className={tdb}>{props.bottom.before}</td>
                <td data-vid="w9di8he" className={tdb}>{props.bottom.after}</td>
                <td data-vid="ki72oyi" className={tdb}>{props.bottom.delta}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p data-vid="yuqcan9" className="type-body text-foreground">Estimated gain over 52 weeks: {props.annualGain}</p>
      </section>

      <section data-vid="jnjocar" aria-labelledby="gd-chart" className="flex flex-col gap-3">
        <h2 data-vid="07ogz0d" id="gd-chart" className="type-section-title text-foreground">Before and after, side by side</h2>
        <div data-vid="m39ouvh" className="flex h-56 items-end gap-6 border-b border-border px-4" role="img" aria-label="Bar chart comparing each weekly line without and with the service">
          {props.bars.map((b) => (
            <div data-vid="t0izgky" key={b.id} className="flex flex-1 flex-col items-center gap-2">
              <div data-vid="bh7zq8u" className="flex h-44 w-full items-end justify-center gap-2">
                <div data-vid="5hnadx1" className="w-1/3 rounded-t bg-muted" style={{ height: String(b.beforePct) + '%' }} />
                <div data-vid="amav6a2" className="w-1/3 rounded-t bg-primary" style={{ height: String(b.afterPct) + '%' }} />
              </div>
              <span data-vid="6xj89t8" className="type-meta text-text-muted">{b.label}</span>
            </div>
          ))}
        </div>
        <p data-vid="fsdk9ro" className="type-meta text-text-muted">Grey is without the service, colored is with it.</p>
      </section>

      <section data-vid="p1yia0w" aria-labelledby="gd-formulas" className="flex flex-col gap-2 rounded-lg border border-border p-6">
        <h2 data-vid="lk199nu" id="gd-formulas" className="type-row-title text-foreground">How it is calculated</h2>
        <ul data-vid="uynncn2" className="flex list-disc flex-col gap-1 pl-5 type-body text-text-body">
          <li data-vid="6p3audl">Sales with the service = weekly sales x (1 + sales lift).</li>
          <li data-vid="o4nsgq8">Payroll with the service = weekly payroll x (1 - payroll reduction).</li>
          <li data-vid="xx6ybpd">Food and beverage with the service = weekly cost x (1 - cost reduction).</li>
          <li data-vid="h0rp0be">Bottom line = sales - payroll - food and beverage cost. Rent, utilities and other costs are not included.</li>
        </ul>
        <p data-vid="5qdfeyz" className="type-body text-text-muted">
          Event attendance does not prove dining demand, and nothing here guarantees a booking. People approve every offer before it is sent.
        </p>
        <h3 data-vid="jnvddaj" className="mt-2 type-row-title text-foreground">General references</h3>
        <ul data-vid="jdy2zst" className="flex flex-col gap-1">
          {SOURCES.map((s) => (
            <li data-vid="lqf3cg1" key={s.href}>
              <a data-vid="4r3g6dj" href={s.href} target="_blank" rel="noreferrer" className="type-body text-primary underline">{s.label}</a>
            </li>
          ))}
        </ul>
      </section>

      <a data-vid="982azas" href="/contact-us" className="inline-flex min-h-11 items-center self-start rounded-md bg-primary px-5 type-body text-primary-foreground">
        Talk to us about your restaurant
      </a>
    </main>
  );
}
