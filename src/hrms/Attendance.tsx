import { useCallback, useEffect, useState } from 'react';
import { Button, Input } from '../components/ui/Form';
import { Modal } from '../components/ui/Modal';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { ApiError } from '../api/http';
import {
  attendanceApi,
  type AttendanceCorrection, type AttendanceRecord, type AttendanceSummary, type CorrectionStatus, type TodayStatus,
} from '../api/attendance';
import type { Page } from '../api/types';
import { useFormat, type Formatters } from '../i18n/format';

const PAGE_SIZE = 10;
const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const monthRange = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) };
};

type Tab = 'mine' | 'records' | 'corrections';

/** Re-renders periodically so the running timer stays current. */
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function CorrectionBadge({ status }: Readonly<{ status: CorrectionStatus }>) {
  const cls: Record<CorrectionStatus, string> = { PENDING: 'bg-yellow-100 text-yellow-800', APPROVED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800', CANCELLED: 'bg-gray-100 text-gray-700' };
  return <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${cls[status]}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

export default function Attendance() {
  const user = useAppSelector(selectCurrentUser);
  const fmt = useFormat();
  const isPeopleOps = user?.role === 'admin' || user?.role === 'hr';
  const canApprove = isPeopleOps || user?.role === 'manager';
  const [hasRecord, setHasRecord] = useState(true);
  const [tab, setTab] = useState<Tab>('mine');
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const changed = useCallback((message: string) => { setNotice(message); setReload((n) => n + 1); }, []);
  const noRecord = useCallback(() => { setHasRecord(false); setTab(canApprove ? 'records' : 'mine'); }, [canApprove]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ivory-300 bg-white p-6 shadow-premium-sm">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink-900">Attendance</h2>
          <div role="tablist" aria-label="Attendance sections" className="flex flex-wrap gap-2">
            {hasRecord && <Button role="tab" aria-selected={tab === 'mine'} variant={tab === 'mine' ? 'primary' : 'outline'} onClick={() => setTab('mine')}>My attendance</Button>}
            {canApprove && <Button role="tab" aria-selected={tab === 'records'} variant={tab === 'records' ? 'primary' : 'outline'} onClick={() => setTab('records')}>{isPeopleOps ? 'All records' : 'Team records'}</Button>}
            {canApprove && <Button role="tab" aria-selected={tab === 'corrections'} variant={tab === 'corrections' ? 'primary' : 'outline'} onClick={() => setTab('corrections')}>Corrections</Button>}
          </div>
        </div>

        {notice && (
          <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-md border border-success-200 bg-success-50 px-4 py-2.5 text-sm text-success-800">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-success-700">✕</button>
          </div>
        )}

        {tab === 'mine' && hasRecord && <Mine key={reload} fmt={fmt} onNoRecord={noRecord} onChanged={changed} />}
        {tab === 'mine' && !hasRecord && <p className="text-sm text-gray-600">Your account has no employee record, so there is no personal attendance to show.</p>}
        {tab === 'records' && canApprove && <Records key={reload} scope={isPeopleOps ? 'all' : 'team'} fmt={fmt} />}
        {tab === 'corrections' && canApprove && <Corrections key={reload} scope={isPeopleOps ? 'all' : 'team'} canDecide fmt={fmt} onChanged={changed} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function Mine({ fmt, onNoRecord, onChanged }: Readonly<{ fmt: Formatters; onNoRecord: () => void; onChanged: (m: string) => void }>) {
  const [status, setStatus] = useState<TodayStatus | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState<string | undefined>();
  const [tick, setTick] = useState(0);
  const now = useNow(30_000);

  useEffect(() => {
    attendanceApi
      .today()
      .then((s) => {
        setStatus(s);
        const { from, to } = monthRange(s.date);
        return attendanceApi.summary(from, to).then(setSummary);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) onNoRecord();
        else setError(errorText(e));
      });
  }, [tick, onNoRecord]);

  const clock = async (direction: 'in' | 'out') => {
    setBusy(true);
    setError(null);
    try {
      if (direction === 'in') await attendanceApi.clockIn();
      else await attendanceApi.clockOut();
      setTick((t) => t + 1);
    } catch (e) {
      setError(errorText(e));
      setTick((t) => t + 1);
    } finally {
      setBusy(false);
    }
  };

  const elapsed = status?.clockedIn && status.record ? Math.max(0, Math.floor((now - new Date(status.record.clockIn).getTime()) / 60000)) : null;

  return (
    <div className="space-y-6">
      <section aria-label="Clock" className="rounded-lg border border-ivory-300 p-5">
        {!status ? (
          <div className="h-16 animate-pulse rounded bg-ivory-200" aria-hidden="true" />
        ) : (
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm text-gray-500">{fmt.date(status.date)} · {status.timezone.replace(/_/g, ' ')}</div>
              {status.clockedIn && status.record ? (
                <div className="mt-1 text-lg font-semibold text-ink-900">Clocked in at {fmt.time(status.record.clockIn)} <span className="text-sm font-normal text-gray-500">({fmt.duration(elapsed)} so far)</span></div>
              ) : status.record && !status.stale ? (
                <div className="mt-1 text-lg font-semibold text-ink-900">Worked {fmt.duration(status.record.workedMinutes)} today <span className="text-sm font-normal text-gray-500">({fmt.time(status.record.clockIn)} – {fmt.time(status.record.clockOut)})</span></div>
              ) : (
                <div className="mt-1 text-lg font-semibold text-ink-900">Not clocked in</div>
              )}
              {status.stale && status.record && (
                <p role="alert" className="mt-1 text-sm text-danger-700">
                  You have an unfinished session from {fmt.date(status.record.date)}. <button type="button" className="underline" onClick={() => { setFormDate(status.record!.date); setShowForm(true); }}>Submit a correction</button> with the right times.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {status.clockedIn ? (
                <Button variant="danger" isLoading={busy} onClick={() => clock('out')}>Clock out</Button>
              ) : (
                <Button variant="success" isLoading={busy} disabled={!!status.record && !status.stale && !status.record.open} onClick={() => clock('in')}>Clock in</Button>
              )}
              <Button variant="outline" onClick={() => { setFormDate(undefined); setShowForm(true); }}>Request correction</Button>
            </div>
          </div>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-danger-700">{error}</p>}
      </section>

      {summary && (
        <section aria-label="This month">
          <h3 className="mb-3 text-[15px] font-semibold text-ink-900">This month</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ['Working days', summary.workingDays], ['Present', summary.presentDays], ['On leave', summary.leaveDays], ['Absent', summary.absentDays], ['Hours worked', fmt.duration(summary.totalMinutes)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-ivory-300 p-3">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="mt-1 text-xl font-semibold text-ink-900">{value}</div>
              </div>
            ))}
          </div>
          {summary.openSessions > 0 && <p className="mt-2 text-xs text-gray-500">{summary.openSessions} unfinished session(s) are not counted in the hours.</p>}
        </section>
      )}

      <section aria-label="History">
        <h3 className="mb-3 text-[15px] font-semibold text-ink-900">Last 30 days</h3>
        <Records key={tick} scope="mine" fmt={fmt} onCorrect={(date) => { setFormDate(date); setShowForm(true); }} />
      </section>

      <section aria-label="My corrections">
        <h3 className="mb-3 text-[15px] font-semibold text-ink-900">My correction requests</h3>
        <Corrections key={tick} scope="mine" canDecide={false} fmt={fmt} onChanged={(m) => { onChanged(m); setTick((t) => t + 1); }} />
      </section>

      {showForm && (
        <CorrectionForm
          defaultDate={formDate ?? (status ? addDays(status.date, -1) : '')}
          timezone={status?.timezone ?? ''}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); onChanged('Correction requested. It takes effect once it is approved.'); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function CorrectionForm({ defaultDate, timezone, onClose, onCreated }: Readonly<{ defaultDate: string; timezone: string; onClose: () => void; onCreated: () => void }>) {
  const [date, setDate] = useState(defaultDate);
  const [clockInTime, setIn] = useState('09:00');
  const [clockOutTime, setOut] = useState('17:00');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!date) return setError('Choose the day to correct.');
    if (!clockInTime || !clockOutTime) return setError('Enter both times.');
    if (!reason.trim()) return setError('Add a short reason.');
    setSaving(true);
    setError(null);
    try {
      await attendanceApi.createCorrection({ date, clockInTime, clockOutTime, reason: reason.trim() });
      onCreated();
    } catch (e) {
      setError(errorText(e));
      setSaving(false);
    }
  };

  return (
    <Modal title="Request an attendance correction" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
        <Input id="corrDate" type="date" label="Day" value={date} onChange={(e) => setDate(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <Input id="corrIn" type="time" label="Start" value={clockInTime} onChange={(e) => setIn(e.target.value)} required />
          <Input id="corrOut" type="time" label="End" value={clockOutTime} onChange={(e) => setOut(e.target.value)} required />
        </div>
        <p className="-mt-2 mb-4 text-xs text-gray-500">Times are in your organization's timezone{timezone ? ` (${timezone.replace(/_/g, ' ')})` : ''}. An end time earlier than the start means the next day (overnight shift).</p>
        <Input id="corrReason" label="Reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} required />
        {error && <p role="alert" className="mb-3 text-sm text-danger-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={saving}>Submit request</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------------------------

function Records({ scope, fmt, onCorrect }: Readonly<{ scope: 'mine' | 'team' | 'all'; fmt: Formatters; onCorrect?: (date: string) => void }>) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<(Page<AttendanceRecord> & { from: string; to: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    attendanceApi
      .list({ scope, page, pageSize: PAGE_SIZE }, controller.signal)
      .then(setData)
      .catch((e) => { if ((e as Error).name !== 'AbortError') setError(errorText(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [scope, page, tick]);

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  return (
    <div>
      {error && (
        <div role="alert" className="mb-3 flex items-center justify-between rounded-md border border-danger-200 bg-danger-50 px-4 py-2 text-sm text-danger-800">
          <span>Could not load attendance. {error}</span>
          <Button size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>Retry</Button>
        </div>
      )}
      {data && <p className="mb-2 text-xs text-gray-500">{fmt.date(data.from)} – {fmt.date(data.to)}</p>}
      <div className="overflow-x-auto" aria-busy={loading}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[...(scope === 'mine' ? [] : ['Employee']), 'Date', 'In', 'Out', 'Worked', 'Source', ''].map((h, i) => (
                <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading && items.length === 0 && <tr aria-hidden="true"><td colSpan={7} className="px-4 py-4"><div className="h-6 animate-pulse rounded bg-ivory-200" /></td></tr>}
            {items.map((r) => (
              <tr key={r.id} className={loading ? 'opacity-60' : ''}>
                {scope !== 'mine' && <td className="px-4 py-3 text-sm"><div className="font-medium text-gray-900">{r.employee.name}</div><div className="text-xs text-gray-500">{r.employee.employeeId}</div></td>}
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmt.date(r.date)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{fmt.time(r.clockIn)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{r.open ? <span className="text-yellow-700">Open</span> : fmt.time(r.clockOut)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{fmt.duration(r.workedMinutes)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.source === 'CORRECTION' ? 'Corrected' : 'Clock'}</td>
                <td className="px-4 py-3 text-right text-sm">{onCorrect && <Button size="sm" variant="ghost-secondary" onClick={() => onCorrect(r.date)}>Correct</Button>}</td>
              </tr>
            ))}
            {!loading && !error && items.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No attendance recorded in this period.</td></tr>}
          </tbody>
        </table>
      </div>
      <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
        <span className="text-sm text-gray-700">{data && data.total > 0 ? `${fmt.number(data.total)} record${data.total === 1 ? '' : 's'}` : ''}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="self-center text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function Corrections({ scope, canDecide, fmt, onChanged }: Readonly<{ scope: 'mine' | 'team' | 'all'; canDecide: boolean; fmt: Formatters; onChanged: (m: string) => void }>) {
  const [status, setStatus] = useState<'' | CorrectionStatus>(canDecide ? 'PENDING' : '');
  const [data, setData] = useState<Page<AttendanceCorrection> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AttendanceCorrection | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    attendanceApi
      .corrections({ scope, status: status || undefined, pageSize: 25 }, controller.signal)
      .then(setData)
      .catch((e) => { if ((e as Error).name !== 'AbortError') setError(errorText(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [scope, status, tick]);

  const run = async (id: string, fn: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await fn();
      onChanged(message);
      setTick((t) => t + 1);
      return true;
    } catch (e) {
      setActionError(errorText(e));
      setTick((t) => t + 1);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    if (!reason.trim()) { setActionError('A reason is required to reject a correction.'); return; }
    if (await run(rejecting.id, () => attendanceApi.reject(rejecting.id, reason.trim()), `Rejected ${rejecting.employee.name}'s correction.`)) {
      setRejecting(null);
      setReason('');
    }
  };

  const items = data?.items ?? [];
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <label htmlFor={`corr-status-${scope}`} className="text-sm text-gray-700">Status</label>
        <select id={`corr-status-${scope}`} className="rounded-md border-gray-300 text-sm shadow-sm focus:border-gold-500 focus:ring-gold-400" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="">All</option>
          {(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>
      {error && (
        <div role="alert" className="mb-3 flex items-center justify-between rounded-md border border-danger-200 bg-danger-50 px-4 py-2 text-sm text-danger-800">
          <span>Could not load corrections. {error}</span>
          <Button size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>Retry</Button>
        </div>
      )}
      {actionError && !rejecting && <p role="alert" className="mb-3 text-sm text-danger-700">{actionError}</p>}
      <div className="overflow-x-auto" aria-busy={loading}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[...(scope === 'mine' ? [] : ['Employee']), 'Day', 'Requested times', 'Reason', 'Status', ''].map((h, i) => (
                <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((c) => (
              <tr key={c.id}>
                {scope !== 'mine' && <td className="px-4 py-3 text-sm"><div className="font-medium text-gray-900">{c.employee.name}</div><div className="text-xs text-gray-500">{c.employee.employeeId}</div></td>}
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmt.date(c.date)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmt.time(c.clockIn)} – {fmt.time(c.clockOut)} <span className="text-xs text-gray-500">({fmt.duration(Math.round((new Date(c.clockOut).getTime() - new Date(c.clockIn).getTime()) / 60000))})</span></td>
                <td className="max-w-[16rem] truncate px-4 py-3 text-sm text-gray-700" title={c.reason}>{c.reason}</td>
                <td className="px-4 py-3 text-sm"><CorrectionBadge status={c.status} />{c.rejectionReason && <div className="mt-1 text-xs text-gray-500">Reason: {c.rejectionReason}</div>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <div className="flex justify-end gap-1">
                    {canDecide && c.status === 'PENDING' && (
                      <>
                        <Button size="sm" variant="ghost-primary" isLoading={busyId === c.id} onClick={() => run(c.id, () => attendanceApi.approve(c.id), `Approved ${c.employee.name}'s correction.`)}>Approve</Button>
                        <Button size="sm" variant="ghost-danger" disabled={busyId === c.id} onClick={() => { setRejecting(c); setReason(''); setActionError(null); }}>Reject</Button>
                      </>
                    )}
                    {scope === 'mine' && c.status === 'PENDING' && (
                      <Button size="sm" variant="ghost-secondary" isLoading={busyId === c.id} onClick={() => run(c.id, () => attendanceApi.cancel(c.id), 'Correction cancelled.')}>Cancel</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !error && items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">{scope === 'mine' ? 'You have not requested any corrections.' : status === 'PENDING' ? 'Nothing is waiting for a decision.' : 'No corrections match this filter.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {rejecting && (
        <Modal title={`Reject ${rejecting.employee.name}'s correction`} onClose={() => setRejecting(null)}>
          <Input id="corrRejectReason" label="Reason (shared with the employee)" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} required />
          {actionError && <p role="alert" className="mb-3 text-sm text-danger-700">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="danger" isLoading={busyId === rejecting.id} onClick={confirmReject}>Reject correction</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
