import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Select } from '../components/ui/Form';
import { Modal } from '../components/ui/Modal';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser, selectTenant } from '../auth/authSlice';
import { ApiError } from '../api/http';
import {
  holidaysApi, leaveApi, LEAVE_TYPES,
  type Holiday, type LeaveBalance, type LeavePolicy, type LeaveRequest, type LeaveStatus, type LeaveType,
} from '../api/leave';
import type { Page } from '../api/types';
import { useFormat } from '../i18n/format';
import { countWorkingDays } from '../i18n/workdays';

const TYPE_LABEL: Record<LeaveType, string> = {
  ANNUAL: 'Annual leave', SICK: 'Sick leave', MATERNITY: 'Maternity leave', PATERNITY: 'Paternity leave', UNPAID: 'Unpaid leave', OTHER: 'Other',
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PAGE_SIZE = 10;

const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
const today = () => new Date().toISOString().slice(0, 10);

function StatusBadge({ status }: Readonly<{ status: LeaveStatus }>) {
  const cls: Record<LeaveStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800', APPROVED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800', CANCELLED: 'bg-gray-100 text-gray-700',
  };
  return <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${cls[status]}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

/** Trims a decimal string for display: "5.00" → "5". */
const days = (value: string | null) => (value === null ? '—' : String(Number(value)));

type Tab = 'mine' | 'approvals' | 'settings';

export default function LeaveManagement() {
  const user = useAppSelector(selectCurrentUser);
  const tenant = useAppSelector(selectTenant);
  const fmt = useFormat();
  const isPeopleOps = user?.role === 'admin' || user?.role === 'hr';
  const canApprove = isPeopleOps || user?.role === 'manager';
  // Administrators may have no employee record; they manage leave but do not take it.
  const [hasEmployeeRecord, setHasEmployeeRecord] = useState(true);

  const [tab, setTab] = useState<Tab>('mine');
  const [reload, setReload] = useState(0);
  const refresh = useCallback(() => setReload((n) => n + 1), []);
  const [notice, setNotice] = useState<string | null>(null);
  // Stable identity: MyLeave re-fetches when this changes.
  const handleNoRecord = useCallback(() => {
    setHasEmployeeRecord(false);
    setTab(canApprove ? 'approvals' : 'mine');
  }, [canApprove]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ivory-300 bg-white p-6 shadow-premium-sm">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink-900">Leave</h2>
          <div role="tablist" aria-label="Leave sections" className="flex gap-2">
            {hasEmployeeRecord && <Button role="tab" aria-selected={tab === 'mine'} variant={tab === 'mine' ? 'primary' : 'outline'} onClick={() => setTab('mine')}>My leave</Button>}
            {canApprove && <Button role="tab" aria-selected={tab === 'approvals'} variant={tab === 'approvals' ? 'primary' : 'outline'} onClick={() => setTab('approvals')}>{isPeopleOps ? 'All requests' : 'Team requests'}</Button>}
            {isPeopleOps && <Button role="tab" aria-selected={tab === 'settings'} variant={tab === 'settings' ? 'primary' : 'outline'} onClick={() => setTab('settings')}>Policies & holidays</Button>}
          </div>
        </div>

        {notice && (
          <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-md border border-success-200 bg-success-50 px-4 py-2.5 text-sm text-success-800">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-success-700">✕</button>
          </div>
        )}

        {tab === 'mine' && hasEmployeeRecord && (
          <MyLeave key={reload} weekendDays={tenant?.weekendDays ?? [6, 0]} onNoRecord={handleNoRecord} onChanged={(m) => { setNotice(m); refresh(); }} fmt={fmt} />
        )}
        {tab === 'mine' && !hasEmployeeRecord && (
          <p className="text-sm text-gray-600">Your account has no employee record, so there is no personal leave to show.</p>
        )}
        {tab === 'approvals' && canApprove && <Requests key={reload} scope={isPeopleOps ? 'all' : 'team'} canDecide onChanged={(m) => { setNotice(m); refresh(); }} fmt={fmt} />}
        {tab === 'settings' && isPeopleOps && <Settings key={reload} weekendDays={tenant?.weekendDays ?? [6, 0]} fmt={fmt} onChanged={(m) => setNotice(m)} />}
      </div>
    </div>
  );
}

type Fmt = ReturnType<typeof useFormat>;

// ---------------------------------------------------------------------------------------------------

function MyLeave({ weekendDays, onNoRecord, onChanged, fmt }: Readonly<{ weekendDays: number[]; onNoRecord: () => void; onChanged: (m: string) => void; fmt: Fmt }>) {
  const year = Number(today().slice(0, 4));
  const [balances, setBalances] = useState<LeaveBalance[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    leaveApi.balances(year).then((r) => setBalances(r.items)).catch((e) => {
      if (e instanceof ApiError && e.status === 403) onNoRecord();
      else setError(errorText(e));
    });
  }, [year, onNoRecord]);

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}
      <section aria-label={`Leave balances for ${year}`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink-900">{year} balances</h3>
          <Button variant="success" onClick={() => setShowForm(true)}>Request leave</Button>
        </div>
        {!balances ? (
          <div className="h-20 animate-pulse rounded-lg bg-ivory-200" aria-hidden="true" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {balances.filter((b) => b.entitlement !== null || Number(b.used) + Number(b.pending) > 0 || b.leaveType === 'ANNUAL' || b.leaveType === 'SICK').map((b) => (
              <div key={b.leaveType} className="rounded-lg border border-ivory-300 p-4">
                <div className="text-sm text-gray-500">{TYPE_LABEL[b.leaveType]}</div>
                <div className="mt-1 text-2xl font-semibold text-ink-900">
                  {b.remaining === null ? 'No limit' : `${days(b.remaining)} left`}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {b.entitlement !== null ? `of ${days(b.entitlement)} · ` : ''}{days(b.used)} taken · {days(b.pending)} pending
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-label="My requests">
        <h3 className="mb-3 text-[15px] font-semibold text-ink-900">My requests</h3>
        <Requests scope="mine" canDecide={false} onChanged={onChanged} fmt={fmt} />
      </section>

      {showForm && (
        <RequestForm
          weekendDays={weekendDays}
          onClose={() => setShowForm(false)}
          onCreated={(l) => { setShowForm(false); onChanged(`Requested ${days(l.days)} working day(s) of ${TYPE_LABEL[l.leaveType].toLowerCase()}.`); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------

function RequestForm({ weekendDays, onClose, onCreated }: Readonly<{ weekendDays: number[]; onClose: () => void; onCreated: (l: LeaveRequest) => void }>) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [reason, setReason] = useState('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const year = startDate ? Number(startDate.slice(0, 4)) : undefined;
  useEffect(() => {
    if (year) holidaysApi.list(year).then(setHolidays).catch(() => setHolidays([]));
  }, [year]);

  const estimate = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return null;
    return countWorkingDays(startDate, endDate, { weekendDays, holidays: new Set(holidays.map((h) => h.date)) });
  }, [startDate, endDate, weekendDays, holidays]);

  const problem = (): string | null => {
    if (!startDate || !endDate) return 'Choose the first and last day.';
    if (endDate < startDate) return 'The last day cannot be before the first day.';
    if (startDate.slice(0, 4) !== endDate.slice(0, 4)) return 'A request cannot span two calendar years. Submit one request per year.';
    if (estimate === 0) return 'These dates contain no working days (weekends and holidays are excluded).';
    if (!reason.trim()) return 'Add a short reason.';
    return null;
  };

  const submit = async () => {
    const p = problem();
    if (p) { setError(p); return; }
    setSaving(true);
    setError(null);
    try {
      onCreated(await leaveApi.create({ startDate, endDate, leaveType, reason: reason.trim() }));
    } catch (e) {
      setError(errorText(e));
      setSaving(false);
    }
  };

  return (
    <Modal title="Request leave" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
        <Select id="leaveType" label="Type" value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)} options={LEAVE_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))} />
        <div className="grid grid-cols-2 gap-3">
          <Input id="startDate" type="date" label="First day" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }} required />
          <Input id="endDate" type="date" label="Last day" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
        {estimate !== null && (
          <p className="-mt-2 mb-4 text-sm text-gray-600" aria-live="polite">About {estimate} working day{estimate === 1 ? '' : 's'} (weekends and holidays excluded). The final count is confirmed when you submit.</p>
        )}
        <Input id="reason" label="Reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} required />
        {error && <p role="alert" className="mb-3 text-sm text-danger-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={saving}>Submit request</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------------------------------

function Requests({ scope, canDecide, onChanged, fmt }: Readonly<{ scope: 'mine' | 'team' | 'all'; canDecide: boolean; onChanged: (m: string) => void; fmt: Fmt }>) {
  const [status, setStatus] = useState<'' | LeaveStatus>(canDecide ? 'PENDING' : '');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<LeaveRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    leaveApi
      .list({ scope, status: status || undefined, page, pageSize: PAGE_SIZE }, controller.signal)
      .then(setData)
      .catch((e) => { if ((e as Error).name !== 'AbortError') setError(errorText(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [scope, status, page, tick]);

  const act = async (leave: LeaveRequest, action: 'approve' | 'cancel') => {
    setBusyId(leave.id);
    setActionError(null);
    try {
      if (action === 'approve') { await leaveApi.approve(leave.id); onChanged(`Approved ${leave.employee.name}'s request.`); }
      else { await leaveApi.cancel(leave.id); onChanged('Request cancelled.'); }
      setTick((t) => t + 1);
    } catch (e) {
      setActionError(errorText(e));
      setTick((t) => t + 1); // the request may have changed under us: reload
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    if (!reason.trim()) { setActionError('A reason is required to reject a request.'); return; }
    setBusyId(rejecting.id);
    setActionError(null);
    try {
      await leaveApi.reject(rejecting.id, reason.trim());
      onChanged(`Rejected ${rejecting.employee.name}'s request.`);
      setRejecting(null);
      setReason('');
      setTick((t) => t + 1);
    } catch (e) {
      setActionError(errorText(e));
    } finally {
      setBusyId(null);
    }
  };

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <label htmlFor={`status-${scope}`} className="text-sm text-gray-700">Status</label>
        <select id={`status-${scope}`} className="rounded-md border-gray-300 text-sm shadow-sm focus:border-gold-500 focus:ring-gold-400" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
          <option value="">All</option>
          {(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-3 flex items-center justify-between rounded-md border border-danger-200 bg-danger-50 px-4 py-2 text-sm text-danger-800">
          <span>Could not load requests. {error}</span>
          <Button size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>Retry</Button>
        </div>
      )}
      {actionError && !rejecting && <p role="alert" className="mb-3 text-sm text-danger-700">{actionError}</p>}

      <div className="overflow-x-auto" aria-busy={loading}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[...(scope === 'mine' ? [] : ['Employee']), 'Type', 'Dates', 'Days', 'Status', ''].map((h, i) => (
                <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading && items.length === 0 && <tr aria-hidden="true"><td colSpan={6} className="px-4 py-4"><div className="h-6 animate-pulse rounded bg-ivory-200" /></td></tr>}
            {items.map((l) => {
              return (
                <tr key={l.id} className={loading ? 'opacity-60' : ''}>
                  {scope !== 'mine' && <td className="px-4 py-3 text-sm"><div className="font-medium text-gray-900">{l.employee.name}</div><div className="text-xs text-gray-500">{l.employee.employeeId}</div></td>}
                  <td className="px-4 py-3 text-sm text-gray-700">{TYPE_LABEL[l.leaveType]}<div className="max-w-[16rem] truncate text-xs text-gray-500" title={l.reason}>{l.reason}</div></td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmt.date(l.startDate)}{l.endDate !== l.startDate && ` – ${fmt.date(l.endDate)}`}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{days(l.days)}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={l.status} />
                    {l.rejectionReason && <div className="mt-1 max-w-[14rem] text-xs text-gray-500">Reason: {l.rejectionReason}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-1">
                      {canDecide && l.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="ghost-primary" isLoading={busyId === l.id} onClick={() => act(l, 'approve')}>Approve</Button>
                          <Button size="sm" variant="ghost-danger" disabled={busyId === l.id} onClick={() => { setRejecting(l); setReason(''); setActionError(null); }}>Reject</Button>
                        </>
                      )}
                      {(scope === 'mine' ? (l.status === 'PENDING' || (l.status === 'APPROVED' && l.startDate > today())) : false) && (
                        <Button size="sm" variant="ghost-secondary" isLoading={busyId === l.id} onClick={() => act(l, 'cancel')}>Cancel</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && !error && items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">{scope === 'mine' ? 'You have no leave requests yet.' : status === 'PENDING' ? 'Nothing is waiting for a decision.' : 'No requests match this filter.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
        <span className="text-sm text-gray-700">{data && data.total > 0 ? `${fmt.number(data.total)} request${data.total === 1 ? '' : 's'}` : ''}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="self-center text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </nav>

      {rejecting && (
        <Modal title={`Reject ${rejecting.employee.name}'s request`} onClose={() => setRejecting(null)}>
          <Input id="rejectReason" label="Reason (shared with the employee)" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} required />
          {actionError && <p role="alert" className="mb-3 text-sm text-danger-700">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="danger" isLoading={busyId === rejecting.id} onClick={confirmReject}>Reject request</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------

function Settings({ weekendDays, fmt, onChanged }: Readonly<{ weekendDays: number[]; fmt: Fmt; onChanged: (m: string) => void }>) {
  const year = Number(today().slice(0, 4));
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [drafts, setDrafts] = useState<Partial<Record<LeaveType, string>>>({});
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    Promise.all([leaveApi.policies(), holidaysApi.list(year)])
      .then(([p, h]) => { setPolicies(p); setHolidays(h); })
      .catch((e) => setError(errorText(e)));
  }, [year, tick]);

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setError(null);
    try { await fn(); onChanged(message); setTick((t) => t + 1); } catch (e) { setError(errorText(e)); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {error && <p role="alert" className="text-sm text-danger-700 lg:col-span-2">{error}</p>}
      <section aria-label="Leave policies">
        <h3 className="mb-1 text-[15px] font-semibold text-ink-900">Annual entitlements</h3>
        <p className="mb-3 text-xs text-gray-500">Days per calendar year. A type with no entitlement is not limited.</p>
        <div className="space-y-2">
          {LEAVE_TYPES.map((t) => {
            const current = policies.find((p) => p.leaveType === t)?.daysPerYear;
            const draft = drafts[t] ?? (current === undefined ? '' : String(Number(current)));
            return (
              <div key={t} className="flex items-center gap-2">
                <label htmlFor={`policy-${t}`} className="w-40 text-sm text-gray-700">{TYPE_LABEL[t]}</label>
                <input id={`policy-${t}`} inputMode="decimal" placeholder="No limit" className="w-24 rounded-md border-gray-300 text-sm shadow-sm focus:border-gold-500 focus:ring-gold-400" value={draft} onChange={(e) => setDrafts({ ...drafts, [t]: e.target.value })} />
                <Button size="sm" variant="outline" disabled={draft === '' || draft === (current === undefined ? '' : String(Number(current)))} onClick={() => run(() => leaveApi.setPolicy(t, draft), `${TYPE_LABEL[t]} set to ${draft} days a year.`)}>Save</Button>
                {current !== undefined && <Button size="sm" variant="ghost-danger" onClick={() => run(async () => { await leaveApi.removePolicy(t); setDrafts({ ...drafts, [t]: undefined }); }, `${TYPE_LABEL[t]} is no longer limited.`)}>Remove limit</Button>}
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Holidays">
        <h3 className="mb-1 text-[15px] font-semibold text-ink-900">Holidays {year}</h3>
        <p className="mb-3 text-xs text-gray-500">Weekend: {weekendDays.length ? weekendDays.map((d) => WEEKDAYS[d]).join(', ') : 'none'}. Weekends and holidays are not counted as leave days.</p>
        <form className="mb-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (holidayDate && holidayName.trim()) void run(async () => { await holidaysApi.create({ date: holidayDate, name: holidayName.trim() }); setHolidayDate(''); setHolidayName(''); }, 'Holiday added.'); }}>
          <div><label htmlFor="holidayDate" className="mb-1 block text-xs text-gray-600">Date</label><input id="holidayDate" type="date" className="rounded-md border-gray-300 text-sm shadow-sm" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} /></div>
          <div><label htmlFor="holidayName" className="mb-1 block text-xs text-gray-600">Name</label><input id="holidayName" className="rounded-md border-gray-300 text-sm shadow-sm" maxLength={120} value={holidayName} onChange={(e) => setHolidayName(e.target.value)} /></div>
          <Button type="submit" size="sm" variant="primary" disabled={!holidayDate || !holidayName.trim()}>Add holiday</Button>
        </form>
        {holidays.length === 0 ? <p className="text-sm text-gray-500">No holidays configured for {year}.</p> : (
          <ul className="divide-y divide-ivory-200 rounded-lg border border-ivory-300">
            {holidays.map((h) => (
              <li key={h.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span><span className="font-medium text-ink-900">{fmt.date(h.date)}</span> · {h.name}</span>
                <Button size="sm" variant="ghost-danger" onClick={() => run(() => holidaysApi.remove(h.id), 'Holiday removed.')}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
