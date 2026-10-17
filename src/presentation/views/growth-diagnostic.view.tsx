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
  readonly value: string;
  readonly onChange: (field: DiagnosticField, value: string) => void;
}

function Field(props: FieldProps): React.ReactElement {
  const inputId = 'gd-' + props.id;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="type-body text-foreground">{props.label}</label>
      <input
        id={inputId}
        type="number"
        inputMode="decimal"
        min={0}
        value={props.value}
        onChange={(e) => props.onChange(props.id, e.target.value)}
        className="min-h-11 rounded-md border border-border bg-background px-3 type-body text-foreground"
      />
      {props.hint !== undefined && <span className="type-meta text-text-muted">{props.hint}</span>}
    </div>
  );
}

export function GrowthDiagnosticView(props: GrowthDiagnosticViewProps): React.ReactElement {
  const { values, onChange } = props;
  const th = 'px-3 py-2 text-left type-meta text-text-muted';
  const td = 'px-3 py-3 type-body text-text-body';
  const tdb = 'px-3 py-3 type-row-title text-foreground';
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <p className="type-meta text-text-muted">Growth Diagnostic for restaurants with 40 or more seats</p>
        <h1 className="type-page-title text-foreground">What could slow periods be worth to you?</h1>
        <p className="type-body text-text-body">
          Enter your weekly numbers and compare your bottom line with and without FullTable AI. Every formula is shown and every assumption is yours to change. These are illustrative estimates, not guarantees.
        </p>
      </header>

      <section aria-labelledby="gd-inputs" className="grid gap-6 rounded-lg border border-border p-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 id="gd-inputs" className="type-row-title text-foreground">Your restaurant today</h2>
          <Field id="seats" label="Number of seats" value={values.seats} onChange={onChange} />
          <Field id="sales" label="Average weekly sales ($)" value={values.sales} onChange={onChange} />
          <Field id="payroll" label="Average weekly payroll ($)" value={values.payroll} onChange={onChange} />
          <Field id="food" label="Average weekly food and beverage cost ($)" value={values.food} onChange={onChange} />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="type-row-title text-foreground">Assumptions with the service</h2>
          <Field id="lift" label="Sales lift from filled slow periods (%)" hint="Illustrative example: 11" value={values.lift} onChange={onChange} />
          <Field id="payrollCut" label="Payroll reduction from matching staff to demand (%)" hint="Illustrative example: 4" value={values.payrollCut} onChange={onChange} />
          <Field id="foodCut" label="Food and beverage cost reduction from less waste (%)" hint="Illustrative example: 9" value={values.foodCut} onChange={onChange} />
          <button type="button" onClick={props.onReset} className="min-h-11 self-start rounded-md border border-border px-4 type-body text-foreground">
            Reset to the example
          </button>
        </div>
      </section>

      {!props.eligible && (
        <p role="status" className="rounded-md border border-border p-4 type-body text-text-body">
          The diagnostic is built for restaurants with at least 40 seats. You can still see the numbers below. To join the waitlist for smaller restaurants, use Contact us.
        </p>
      )}

      <section aria-labelledby="gd-results" className="flex flex-col gap-4">
        <h2 id="gd-results" className="type-section-title text-foreground">With and without the service</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem]">
            <thead>
              <tr>
                <th className={th}>Per week</th>
                <th className={th}>Without</th>
                <th className={th}>With</th>
                <th className={th}>Change</th>
              </tr>
            </thead>
            <tbody>
              {props.rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className={td}>{r.label}</td>
                  <td className={td}>{r.before}</td>
                  <td className={td}>{r.after}</td>
                  <td className={td}>{r.delta}</td>
                </tr>
              ))}
              <tr className="border-t border-border">
                <td className={tdb}>{props.bottom.label}</td>
                <td className={tdb}>{props.bottom.before}</td>
                <td className={tdb}>{props.bottom.after}</td>
                <td className={tdb}>{props.bottom.delta}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="type-body text-foreground">Estimated gain over 52 weeks: {props.annualGain}</p>
      </section>

      <section aria-labelledby="gd-chart" className="flex flex-col gap-3">
        <h2 id="gd-chart" className="type-section-title text-foreground">Before and after, side by side</h2>
        <div className="flex h-56 items-end gap-6 border-b border-border px-4" role="img" aria-label="Bar chart comparing each weekly line without and with the service">
          {props.bars.map((b) => (
            <div key={b.id} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-44 w-full items-end justify-center gap-2">
                <div className="w-1/3 rounded-t bg-muted" style={{ height: String(b.beforePct) + '%' }} />
                <div className="w-1/3 rounded-t bg-primary" style={{ height: String(b.afterPct) + '%' }} />
              </div>
              <span className="type-meta text-text-muted">{b.label}</span>
            </div>
          ))}
        </div>
        <p className="type-meta text-text-muted">Grey is without the service, colored is with it.</p>
      </section>

      <section aria-labelledby="gd-formulas" className="flex flex-col gap-2 rounded-lg border border-border p-6">
        <h2 id="gd-formulas" className="type-row-title text-foreground">How it is calculated</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 type-body text-text-body">
          <li>Sales with the service = weekly sales x (1 + sales lift).</li>
          <li>Payroll with the service = weekly payroll x (1 - payroll reduction).</li>
          <li>Food and beverage with the service = weekly cost x (1 - cost reduction).</li>
          <li>Bottom line = sales - payroll - food and beverage cost. Rent, utilities and other costs are not included.</li>
        </ul>
        <p className="type-body text-text-muted">
          Event attendance does not prove dining demand, and nothing here guarantees a booking. People approve every offer before it is sent.
        </p>
        <h3 className="mt-2 type-row-title text-foreground">General references</h3>
        <ul className="flex flex-col gap-1">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noreferrer" className="type-body text-primary underline">{s.label}</a>
            </li>
          ))}
        </ul>
      </section>

      <a href="/contact-us" className="inline-flex min-h-11 items-center self-start rounded-md bg-primary px-5 type-body text-primary-foreground">
        Talk to us about your restaurant
      </a>
    </main>
  );
}
