import * as React from 'react';
import {
  GrowthDiagnosticView,
  type DiagnosticBar,
  type DiagnosticField,
  type DiagnosticRow,
} from '../views/growth-diagnostic.view';

const EXAMPLE: Readonly<Record<DiagnosticField, string>> = {
  seats: '60',
  sales: '44500',
  payroll: '19000',
  food: '17500',
  lift: '11',
  payrollCut: '4',
  foodCut: '9',
};

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function money(n: number): string {
  return (n < 0 ? '-' : '') + '$' + Math.round(Math.abs(n)).toLocaleString('en-US');
}

function pct(before: number, after: number): string {
  if (before <= 0) return 'n/a';
  const p = ((after - before) / before) * 100;
  return (p > 0 ? '+' : '') + p.toFixed(1).replace(/\.0$/, '') + '%';
}

export default function GrowthDiagnosticContainer(): React.ReactElement {
  const [values, setValues] = React.useState<Readonly<Record<DiagnosticField, string>>>(EXAMPLE);
  const onChange = React.useCallback((field: DiagnosticField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
  }, []);
  const onReset = React.useCallback(() => setValues(EXAMPLE), []);

  const model = React.useMemo(() => {
    const sales = num(values.sales);
    const payroll = num(values.payroll);
    const food = num(values.food);
    const salesAfter = sales * (1 + num(values.lift) / 100);
    const payrollAfter = payroll * (1 - Math.min(num(values.payrollCut), 100) / 100);
    const foodAfter = food * (1 - Math.min(num(values.foodCut), 100) / 100);
    const bottomBefore = sales - payroll - food;
    const bottomAfter = salesAfter - payrollAfter - foodAfter;
    const rows: readonly DiagnosticRow[] = [
      { id: 'sales', label: 'Average weekly sales', before: money(sales), after: money(salesAfter), delta: pct(sales, salesAfter) },
      { id: 'payroll', label: 'Average weekly payroll', before: money(payroll), after: money(payrollAfter), delta: pct(payroll, payrollAfter) },
      { id: 'food', label: 'Average weekly food and beverage cost', before: money(food), after: money(foodAfter), delta: pct(food, foodAfter) },
    ];
    const bottom: DiagnosticRow = { id: 'bottom', label: 'Bottom line', before: money(bottomBefore), after: money(bottomAfter), delta: pct(bottomBefore, bottomAfter) };
    const max = Math.max(sales, salesAfter, payroll, food, Math.abs(bottomBefore), Math.abs(bottomAfter), 1);
    const h = (n: number): number => Math.max(2, Math.round((Math.abs(n) / max) * 100));
    const bars: readonly DiagnosticBar[] = [
      { id: 'sales', label: 'Sales', beforePct: h(sales), afterPct: h(salesAfter) },
      { id: 'payroll', label: 'Payroll', beforePct: h(payroll), afterPct: h(payrollAfter) },
      { id: 'food', label: 'Food and beverage', beforePct: h(food), afterPct: h(foodAfter) },
      { id: 'bottom', label: 'Bottom line', beforePct: h(bottomBefore), afterPct: h(bottomAfter) },
    ];
    return { rows, bottom, bars, annualGain: money((bottomAfter - bottomBefore) * 52) };
  }, [values]);

  return (
    <GrowthDiagnosticView data-vid="sppuefo"
      values={values}
      onChange={onChange}
      eligible={num(values.seats) >= 40}
      rows={model.rows}
      bottom={model.bottom}
      annualGain={model.annualGain}
      bars={model.bars}
      onReset={onReset}
    />
  );
}
