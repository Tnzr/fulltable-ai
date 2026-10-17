import * as React from 'react';
import { PageHead, StatusChip, EmptyState } from '@/components';

export type CrmTab = 'vetting' | 'directory' | 'billing' | 'moderation' | 'diagnostic' | 'ai';
export type AccountStatus = 'APPLIED' | 'VETTED' | 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED';
export type AccountTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface CrmAccount {
  readonly id: string;
  readonly name: string;
  readonly area: string;
  readonly tier: AccountTier;
  readonly status: AccountStatus;
  readonly invoice: string;
  readonly lastPayment: string;
  readonly outreachThisMonth: number;
  readonly flags: number;
}

export interface CrmLogEntry {
  readonly id: string;
  readonly text: string;
}

export interface CrmDiagnosticRow {
  readonly id: string;
  readonly restaurant: string;
  readonly stage: string;
  readonly estimate: string;
  readonly attributed: string;
}

export interface AdminCrmViewProps {
  readonly tab: CrmTab;
  readonly onTab: (tab: CrmTab) => void;
  readonly accounts: readonly CrmAccount[];
  readonly queue: readonly CrmAccount[];
  readonly directory: readonly CrmAccount[];
  readonly diagnostics: readonly CrmDiagnosticRow[];
  readonly log: readonly CrmLogEntry[];
  readonly onApprove: (id: string) => void;
  readonly onSetStatus: (id: string, status: AccountStatus) => void;
  readonly onInvoice: (id: string, invoice: string) => void;
  readonly models: readonly string[];
  readonly model: string;
  readonly onModel: (model: string) => void;
  readonly notice: string | null;
}

type Tone = 'ok' | 'info' | 'pending' | 'warn' | 'danger' | 'neutral';

const statusTone: Record<AccountStatus, Tone> = {
  APPLIED: 'pending',
  VETTED: 'info',
  ACTIVE: 'ok',
  RESTRICTED: 'warn',
  SUSPENDED: 'danger',
};

const statusLabel: Record<AccountStatus, string> = {
  APPLIED: 'Applied',
  VETTED: 'Vetted',
  ACTIVE: 'Active',
  RESTRICTED: 'Restricted',
  SUSPENDED: 'Suspended',
};

const tierLabel: Record<AccountTier, string> = { BASIC: 'Basic', STANDARD: 'Standard', PREMIUM: 'Premium' };

const tabs: readonly { id: CrmTab; label: string }[] = [
  { id: 'vetting', label: 'Vetting queue' },
  { id: 'directory', label: 'Network directory' },
  { id: 'billing', label: 'Billing' },
  { id: 'moderation', label: 'Moderation' },
  { id: 'diagnostic', label: 'Growth Diagnostic' },
  { id: 'ai', label: 'AI model' },
];

const btn = 'min-h-11 rounded-md border border-border bg-background px-3 type-body text-foreground';
const th = 'px-3 py-2 text-left type-meta text-text-muted';
const td = 'px-3 py-3 type-body text-text-body';

export function AdminCrmView(props: AdminCrmViewProps): React.ReactElement {
  const { tab } = props;
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHead
        title="Admin CRM"
        description="Operate the FullTable AI network. Restaurants are B2B accounts: a person vets each one before it appears in the directory, billing is recorded by hand, and every action is logged. All records here are sample data."
      />

      {props.notice !== null && (
        <p role="status" className="rounded-md border border-border p-3 type-body text-text-body">
          {props.notice}
        </p>
      )}

      <div role="tablist" aria-label="Admin CRM sections" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => props.onTab(t.id)}
            className={'min-h-11 rounded-md border px-4 type-body ' + (tab === t.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-text-body')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'vetting' && (
        <section className="flex flex-col gap-3">
          <p className="type-body text-text-muted">Nothing is listed automatically. Approve an account only after a person has checked it.</p>
          {props.queue.length === 0 ? (
            <EmptyState title="The vetting queue is empty" description="New applications and subscriptions appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem]">
                <thead>
                  <tr>
                    <th className={th}>Restaurant</th>
                    <th className={th}>Area</th>
                    <th className={th}>Requested tier</th>
                    <th className={th}>Status</th>
                    <th className={th}>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {props.queue.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className={td}>{a.name}</td>
                      <td className={td}>{a.area}</td>
                      <td className={td}>{tierLabel[a.tier]}</td>
                      <td className={td}><StatusChip label={statusLabel[a.status]} tone={statusTone[a.status]} /></td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className={btn} onClick={() => props.onApprove(a.id)}>Approve into directory</button>
                          <button type="button" className={btn} onClick={() => props.onSetStatus(a.id, 'SUSPENDED')}>Decline</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'directory' && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem]">
            <thead>
              <tr>
                <th className={th}>Restaurant</th>
                <th className={th}>Area</th>
                <th className={th}>Tier</th>
                <th className={th}>Listing</th>
              </tr>
            </thead>
            <tbody>
              {props.directory.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className={td}>{a.name}</td>
                  <td className={td}>{a.area}</td>
                  <td className={td}>{tierLabel[a.tier]}</td>
                  <td className={td}><StatusChip label={statusLabel[a.status]} tone={statusTone[a.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'billing' && (
        <section className="flex flex-col gap-3">
          <p className="type-body text-text-muted">Billing is manual for now. Record the invoice status by hand; the account status controls access.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem]">
              <thead>
                <tr>
                  <th className={th}>Restaurant</th>
                  <th className={th}>Plan</th>
                  <th className={th}>Invoice</th>
                  <th className={th}>Last payment</th>
                  <th className={th}>Record</th>
                </tr>
              </thead>
              <tbody>
                {props.accounts.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className={td}>{a.name}</td>
                    <td className={td}>{tierLabel[a.tier]}</td>
                    <td className={td}>{a.invoice}</td>
                    <td className={td}>{a.lastPayment}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={btn} onClick={() => props.onInvoice(a.id, 'Paid')}>Mark paid</button>
                        <button type="button" className={btn} onClick={() => props.onInvoice(a.id, 'Overdue')}>Mark overdue</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'moderation' && (
        <section className="flex flex-col gap-4">
          <p className="type-body text-text-muted">Review usage per restaurant. Warn, restrict or suspend; each action is recorded with who did it.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem]">
              <thead>
                <tr>
                  <th className={th}>Restaurant</th>
                  <th className={th}>Outreach this month</th>
                  <th className={th}>Flags</th>
                  <th className={th}>Status</th>
                  <th className={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {props.directory.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className={td}>{a.name}</td>
                    <td className={td}>{a.outreachThisMonth}</td>
                    <td className={td}>{a.flags}</td>
                    <td className={td}><StatusChip label={statusLabel[a.status]} tone={statusTone[a.status]} /></td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={btn} onClick={() => props.onSetStatus(a.id, 'ACTIVE')}>Reinstate</button>
                        <button type="button" className={btn} onClick={() => props.onSetStatus(a.id, 'RESTRICTED')}>Restrict</button>
                        <button type="button" className={btn} onClick={() => props.onSetStatus(a.id, 'SUSPENDED')}>Suspend</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="type-row-title text-foreground">Action log</h2>
            {props.log.length === 0 ? (
              <p className="mt-2 type-body text-text-muted">No actions yet.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1">
                {props.log.map((l) => (
                  <li key={l.id} className="type-body text-text-body">{l.text}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {tab === 'diagnostic' && (
        <section className="flex flex-col gap-3">
          <p className="type-body text-text-muted">
            Growth Diagnostic pipeline and service effectiveness. Attribution compares bookings sourced through demand routing and relationship building against a pre-service baseline and the diagnostic estimate. Credit for unrelated sales is excluded. Figures are samples with stated assumptions.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem]">
              <thead>
                <tr>
                  <th className={th}>Restaurant</th>
                  <th className={th}>Pipeline stage</th>
                  <th className={th}>Diagnostic estimate</th>
                  <th className={th}>Attributed to service</th>
                </tr>
              </thead>
              <tbody>
                {props.diagnostics.map((d) => (
                  <tr key={d.id} className="border-t border-border">
                    <td className={td}>{d.restaurant}</td>
                    <td className={td}>{d.stage}</td>
                    <td className={td}>{d.estimate}</td>
                    <td className={td}>{d.attributed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'ai' && (
        <section className="flex max-w-xl flex-col gap-3">
          <p className="type-body text-text-muted">Choose which enabled model powers the AI Assistant. Only the System Administrator can change this. No model provider is connected yet, so the list is a placeholder.</p>
          <label className="flex flex-col gap-1 type-body text-text-body">
            AI model
            <select value={props.model} onChange={(e) => props.onModel(e.target.value)} className="min-h-11 rounded-md border border-border bg-background px-3 type-body text-foreground">
              {props.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </section>
      )}
    </div>
  );
}
