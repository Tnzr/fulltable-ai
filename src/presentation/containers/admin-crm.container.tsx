import * as React from 'react';
import {
  AdminCrmView,
  type AccountStatus,
  type CrmAccount,
  type CrmDiagnosticRow,
  type CrmLogEntry,
  type CrmTab,
} from '../views/admin-crm.view';

const SEED: readonly CrmAccount[] = [
  { id: 'r1', name: 'Lumen Table (sample)', area: 'Brickell', tier: 'STANDARD', status: 'ACTIVE', invoice: 'Paid', lastPayment: 'Oct 1', outreachThisMonth: 42, flags: 0 },
  { id: 'r2', name: 'Casa Marea (sample)', area: 'Coconut Grove', tier: 'PREMIUM', status: 'ACTIVE', invoice: 'Paid', lastPayment: 'Oct 3', outreachThisMonth: 118, flags: 2 },
  { id: 'r3', name: 'Cafe Brisa (sample)', area: 'Wynwood', tier: 'BASIC', status: 'ACTIVE', invoice: 'Overdue', lastPayment: 'Aug 28', outreachThisMonth: 9, flags: 0 },
  { id: 'r4', name: 'Sal y Fuego (sample)', area: 'Little Havana', tier: 'STANDARD', status: 'APPLIED', invoice: 'Not invoiced', lastPayment: 'None', outreachThisMonth: 0, flags: 0 },
  { id: 'r5', name: 'Bayfront Grill (sample)', area: 'Downtown Miami', tier: 'PREMIUM', status: 'APPLIED', invoice: 'Not invoiced', lastPayment: 'None', outreachThisMonth: 0, flags: 0 },
];

const DIAGNOSTICS: readonly CrmDiagnosticRow[] = [
  { id: 'd1', restaurant: 'Lumen Table (sample)', stage: 'Subscribed', estimate: '$3,200 per month (estimate)', attributed: '$2,450 per month vs baseline' },
  { id: 'd2', restaurant: 'Casa Marea (sample)', stage: 'Subscribed', estimate: '$5,100 per month (estimate)', attributed: '$3,900 per month vs baseline' },
  { id: 'd3', restaurant: 'Sal y Fuego (sample)', stage: 'Report sent', estimate: '$2,400 per month (estimate)', attributed: 'Not yet measured' },
];

const MODELS: readonly string[] = ['No model connected', 'Model A (placeholder)', 'Model B (placeholder)'];

export default function AdminCrmContainer(): React.ReactElement {
  const [tab, setTab] = React.useState<CrmTab>('vetting');
  const [accounts, setAccounts] = React.useState<readonly CrmAccount[]>(SEED);
  const [log, setLog] = React.useState<readonly CrmLogEntry[]>([]);
  const [model, setModel] = React.useState(MODELS[0]);
  const [notice, setNotice] = React.useState<string | null>(null);

  const record = React.useCallback((text: string) => {
    setLog((l) => [{ id: String(l.length + 1), text }, ...l]);
    setNotice(text + ' Sample only: nothing is saved yet.');
  }, []);

  const onSetStatus = React.useCallback((id: string, status: AccountStatus) => {
    const found = accounts.find((a) => a.id === id);
    setAccounts((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
    record((found?.name ?? 'Account') + ' set to ' + status.toLowerCase() + ' by the System Administrator.');
  }, [accounts, record]);

  const onApprove = React.useCallback((id: string) => {
    const found = accounts.find((a) => a.id === id);
    setAccounts((list) => list.map((a) => (a.id === id ? { ...a, status: 'ACTIVE' } : a)));
    record((found?.name ?? 'Account') + ' approved into the network directory after a person reviewed it.');
  }, [accounts, record]);

  const onInvoice = React.useCallback((id: string, invoice: string) => {
    const found = accounts.find((a) => a.id === id);
    setAccounts((list) => list.map((a) => (a.id === id ? { ...a, invoice } : a)));
    record('Invoice for ' + (found?.name ?? 'account') + ' recorded as ' + invoice.toLowerCase() + '.');
  }, [accounts, record]);

  const queue = accounts.filter((a) => a.status === 'APPLIED' || a.status === 'VETTED');
  const directory = accounts.filter((a) => a.status !== 'APPLIED' && a.status !== 'VETTED');

  return (
    <AdminCrmView
      tab={tab}
      onTab={setTab}
      accounts={accounts}
      queue={queue}
      directory={directory}
      diagnostics={DIAGNOSTICS}
      log={log}
      onApprove={onApprove}
      onSetStatus={onSetStatus}
      onInvoice={onInvoice}
      models={MODELS}
      model={model}
      onModel={setModel}
      notice={notice}
    />
  );
}
