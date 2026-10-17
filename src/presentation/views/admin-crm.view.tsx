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
    <div data-vid="l8nvf2j" className="flex flex-col gap-6 p-6">
      <PageHead data-vid="jb6tfat"
        title="Admin CRM"
        description="Operate the FullTable AI network. Restaurants are B2B accounts: a person vets each one before it appears in the directory, billing is recorded by hand, and every action is logged. All records here are sample data."
      />

      {props.notice !== null && (
        <p data-vid="e18k0qb" role="status" className="rounded-md border border-border p-3 type-body text-text-body">
          {props.notice}
        </p>
      )}

      <div data-vid="7zsyvsz" role="tablist" aria-label="Admin CRM sections" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button data-vid="qb9muoy"
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
        <section data-vid="zq08o6z" className="flex flex-col gap-3">
          <p data-vid="q1ds25y" className="type-body text-text-muted">Nothing is listed automatically. Approve an account only after a person has checked it.</p>
          {props.queue.length === 0 ? (
            <EmptyState data-vid="zzr6ytu" title="The vetting queue is empty" description="New applications and subscriptions appear here." />
          ) : (
            <div data-vid="6tjjwq0" className="overflow-x-auto">
              <table data-vid="40sh3qy" className="w-full min-w-[40rem]">
                <thead data-vid="mzcnamt">
                  <tr data-vid="rx328ex">
                    <th data-vid="qlh6n2i" className={th}>Restaurant</th>
                    <th data-vid="mpwk6f6" className={th}>Area</th>
                    <th data-vid="mhjsb6g" className={th}>Requested tier</th>
                    <th data-vid="2h32jaz" className={th}>Status</th>
                    <th data-vid="vwihq2g" className={th}>Decision</th>
                  </tr>
                </thead>
                <tbody data-vid="4vyt9d7">
                  {props.queue.map((a) => (
                    <tr data-vid="e0fdc9b" key={a.id} className="border-t border-border">
                      <td data-vid="l62qh6a" className={td}>{a.name}</td>
                      <td data-vid="fynxmmv" className={td}>{a.area}</td>
                      <td data-vid="s0kp7hl" className={td}>{tierLabel[a.tier]}</td>
                      <td data-vid="b6idcv1" className={td}><StatusChip data-vid="8estvks" label={statusLabel[a.status]} tone={statusTone[a.status]} /></td>
                      <td data-vid="5rowuk2" className={td}>
                        <div data-vid="ib2r099" className="flex flex-wrap gap-2">
                          <button data-vid="hi7me8n" type="button" className={btn} onClick={() => props.onApprove(a.id)}>Approve into directory</button>
                          <button data-vid="nzj4xqg" type="button" className={btn} onClick={() => props.onSetStatus(a.id, 'SUSPENDED')}>Decline</button>
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
        <div data-vid="th8fj19" className="overflow-x-auto">
          <table data-vid="d0xsk87" className="w-full min-w-[40rem]">
            <thead data-vid="nmcv9cu">
              <tr data-vid="w9saseg">
                <th data-vid="ccuw26r" className={th}>Restaurant</th>
                <th data-vid="vk8u9ad" className={th}>Area</th>
                <th data-vid="564mcdj" className={th}>Tier</th>
                <th data-vid="62uktje" className={th}>Listing</th>
              </tr>
            </thead>
            <tbody data-vid="5novfdl">
              {props.directory.map((a) => (
                <tr data-vid="91xpdzy" key={a.id} className="border-t border-border">
                  <td data-vid="o1lxy6u" className={td}>{a.name}</td>
                  <td data-vid="68bvqns" className={td}>{a.area}</td>
                  <td data-vid="stwtj3m" className={td}>{tierLabel[a.tier]}</td>
                  <td data-vid="tabdo3u" className={td}><StatusChip data-vid="oary39l" label={statusLabel[a.status]} tone={statusTone[a.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'billing' && (
        <section data-vid="wjnbye0" className="flex flex-col gap-3">
          <p data-vid="eu8xgoj" className="type-body text-text-muted">Billing is manual for now. Record the invoice status by hand; the account status controls access.</p>
          <div data-vid="0moroim" className="overflow-x-auto">
            <table data-vid="kb71509" className="w-full min-w-[44rem]">
              <thead data-vid="mmcc03u">
                <tr data-vid="w63hqd3">
                  <th data-vid="muzu4oz" className={th}>Restaurant</th>
                  <th data-vid="jenu0ye" className={th}>Plan</th>
                  <th data-vid="cb7quiu" className={th}>Invoice</th>
                  <th data-vid="sshd6mb" className={th}>Last payment</th>
                  <th data-vid="mqlckwg" className={th}>Record</th>
                </tr>
              </thead>
              <tbody data-vid="lytml79">
                {props.accounts.map((a) => (
                  <tr data-vid="bbgz7y3" key={a.id} className="border-t border-border">
                    <td data-vid="ht9a121" className={td}>{a.name}</td>
                    <td data-vid="m1wvbb5" className={td}>{tierLabel[a.tier]}</td>
                    <td data-vid="4u0tqke" className={td}>{a.invoice}</td>
                    <td data-vid="dxz2sod" className={td}>{a.lastPayment}</td>
                    <td data-vid="goumb74" className={td}>
                      <div data-vid="gmy415y" className="flex flex-wrap gap-2">
                        <button data-vid="cc6dso0" type="button" className={btn} onClick={() => props.onInvoice(a.id, 'Paid')}>Mark paid</button>
                        <button data-vid="8ux5djr" type="button" className={btn} onClick={() => props.onInvoice(a.id, 'Overdue')}>Mark overdue</button>
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
        <section data-vid="dvrs8nr" className="flex flex-col gap-4">
          <p data-vid="ueclx5z" className="type-body text-text-muted">Review usage per restaurant. Warn, restrict or suspend; each action is recorded with who did it.</p>
          <div data-vid="a07qy7x" className="overflow-x-auto">
            <table data-vid="4qgubap" className="w-full min-w-[48rem]">
              <thead data-vid="uyfe63t">
                <tr data-vid="uqx9ojv">
                  <th data-vid="lpc1hhd" className={th}>Restaurant</th>
                  <th data-vid="dancew3" className={th}>Outreach this month</th>
                  <th data-vid="xksfqj2" className={th}>Flags</th>
                  <th data-vid="4lmu67w" className={th}>Status</th>
                  <th data-vid="gk8mk63" className={th}>Action</th>
                </tr>
              </thead>
              <tbody data-vid="26akx0i">
                {props.directory.map((a) => (
                  <tr data-vid="o69hxzy" key={a.id} className="border-t border-border">
                    <td data-vid="3jkex4i" className={td}>{a.name}</td>
                    <td data-vid="z0377g1" className={td}>{a.outreachThisMonth}</td>
                    <td data-vid="ndfavyz" className={td}>{a.flags}</td>
                    <td data-vid="zu826dm" className={td}><StatusChip data-vid="5hhp71j" label={statusLabel[a.status]} tone={statusTone[a.status]} /></td>
                    <td data-vid="rp1842x" className={td}>
                      <div data-vid="jd9ddq4" className="flex flex-wrap gap-2">
                        <button data-vid="e8nhrob" type="button" className={btn} onClick={() => props.onSetStatus(a.id, 'ACTIVE')}>Reinstate</button>
                        <button data-vid="elg5q88" type="button" className={btn} onClick={() => props.onSetStatus(a.id, 'RESTRICTED')}>Restrict</button>
                        <button data-vid="iazh8wu" type="button" className={btn} onClick={() => props.onSetStatus(a.id, 'SUSPENDED')}>Suspend</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div data-vid="a7no77o">
            <h2 data-vid="sh0yz2s" className="type-row-title text-foreground">Action log</h2>
            {props.log.length === 0 ? (
              <p data-vid="0t27qrj" className="mt-2 type-body text-text-muted">No actions yet.</p>
            ) : (
              <ul data-vid="9sdhi0l" className="mt-2 flex flex-col gap-1">
                {props.log.map((l) => (
                  <li data-vid="9xamhg4" key={l.id} className="type-body text-text-body">{l.text}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {tab === 'diagnostic' && (
        <section data-vid="mllftnj" className="flex flex-col gap-3">
          <p data-vid="2zig6bm" className="type-body text-text-muted">
            Growth Diagnostic pipeline and service effectiveness. Attribution compares bookings sourced through demand routing and relationship building against a pre-service baseline and the diagnostic estimate. Credit for unrelated sales is excluded. Figures are samples with stated assumptions.
          </p>
          <div data-vid="woxn00i" className="overflow-x-auto">
            <table data-vid="6lv947d" className="w-full min-w-[44rem]">
              <thead data-vid="1kszzbx">
                <tr data-vid="55ozorp">
                  <th data-vid="sw6jck2" className={th}>Restaurant</th>
                  <th data-vid="aty6u4a" className={th}>Pipeline stage</th>
                  <th data-vid="wetoaww" className={th}>Diagnostic estimate</th>
                  <th data-vid="5x99tcf" className={th}>Attributed to service</th>
                </tr>
              </thead>
              <tbody data-vid="7p8pu5d">
                {props.diagnostics.map((d) => (
                  <tr data-vid="20z6xh2" key={d.id} className="border-t border-border">
                    <td data-vid="umhn76d" className={td}>{d.restaurant}</td>
                    <td data-vid="162k5t9" className={td}>{d.stage}</td>
                    <td data-vid="xz0zi5y" className={td}>{d.estimate}</td>
                    <td data-vid="lcglywi" className={td}>{d.attributed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'ai' && (
        <section data-vid="lkbarvk" className="flex max-w-xl flex-col gap-3">
          <p data-vid="de6imdk" className="type-body text-text-muted">Choose which enabled model powers the AI Assistant. Only the System Administrator can change this. No model provider is connected yet, so the list is a placeholder.</p>
          <label data-vid="n0ilz1c" className="flex flex-col gap-1 type-body text-text-body">
            AI model
            <select data-vid="j5uuoxg" value={props.model} onChange={(e) => props.onModel(e.target.value)} className="min-h-11 rounded-md border border-border bg-background px-3 type-body text-foreground">
              {props.models.map((m) => (
                <option data-vid="idvw61w" key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </section>
      )}
    </div>
  );
}
