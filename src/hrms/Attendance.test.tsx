import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Attendance from './Attendance';
import { renderWithProviders, signIn, signOut, tenantFor, userFor } from '../test/helpers';
import { session } from '../api/http';
import type { AttendanceCorrection, AttendanceRecord, AttendanceSummary, TodayStatus } from '../api/attendance';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const employee = { id: 'e1', employeeId: 'EMP-0001', name: 'Ada Lovelace' };

const record = (over: Partial<AttendanceRecord> = {}): AttendanceRecord => ({
  id: 'a1', employee, date: '2026-03-02', clockIn: '2026-03-02T03:30:00.000Z', clockOut: '2026-03-02T12:00:00.000Z',
  workedMinutes: 510, open: false, source: 'WEB', note: null, ...over,
});

const correction = (over: Partial<AttendanceCorrection> = {}): AttendanceCorrection => ({
  id: 'c1', employee, date: '2026-03-01', clockIn: '2026-03-01T03:30:00.000Z', clockOut: '2026-03-01T12:00:00.000Z',
  reason: 'Forgot to clock in', status: 'PENDING', rejectionReason: null, decidedAt: null, createdAt: '2026-03-02T00:00:00Z', ...over,
});

const summary: AttendanceSummary = {
  employeeId: 'e1', from: '2026-03-01', to: '2026-03-31', timezone: 'Asia/Kolkata',
  workingDays: 22, presentDays: 15, leaveDays: 2, absentDays: 3, restDayWork: 0, openSessions: 0, totalMinutes: 7200,
};

interface State {
  today: TodayStatus;
  records: AttendanceRecord[];
  team: AttendanceRecord[];
  mine: AttendanceCorrection[];
  pending: AttendanceCorrection[];
  noRecord?: boolean;
  correctionError?: string;
  failList?: boolean;
}

const baseToday = (over: Partial<TodayStatus> = {}): TodayStatus => ({ date: '2026-03-02', timezone: 'Asia/Kolkata', record: null, clockedIn: false, stale: false, ...over });

function mockApi(state: State) {
  const calls: { method: string; path: string; search: URLSearchParams; body?: Record<string, unknown> }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    const path = url.pathname.replace(/^\/api/, '');
    const method = init.method ?? 'GET';
    const body = init.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : undefined;
    calls.push({ method, path, search: url.searchParams, body });

    if (state.noRecord && (path === '/attendance/today' || path === '/attendance/summary')) return json(403, { message: 'no employee record' });
    if (path === '/attendance/today') return json(200, state.today);
    if (path === '/attendance/summary') return json(200, summary);
    if (path === '/attendance/clock-in' && method === 'POST') {
      state.today = baseToday({ clockedIn: true, record: record({ id: 'new', open: true, clockOut: null, workedMinutes: null, clockIn: new Date(Date.now() - 90 * 60000).toISOString() }) });
      return json(201, state.today.record);
    }
    if (path === '/attendance/clock-out' && method === 'POST') {
      state.today = baseToday({ record: record({ id: 'new' }) });
      return json(200, state.today.record);
    }
    if (path === '/attendance' && method === 'GET') {
      if (state.failList) return json(500, { message: 'Database unavailable' });
      const items = url.searchParams.get('scope') === 'mine' || !url.searchParams.get('scope') ? state.records : state.team;
      return json(200, { items, total: items.length, page: 1, pageSize: 10, from: '2026-02-01', to: '2026-03-02' });
    }
    if (path === '/attendance/corrections' && method === 'GET') {
      const scope = url.searchParams.get('scope') ?? 'mine';
      const source = scope === 'mine' ? state.mine : state.pending;
      const status = url.searchParams.get('status');
      const items = source.filter((c) => !status || c.status === status);
      return json(200, { items, total: items.length, page: 1, pageSize: 25 });
    }
    if (path === '/attendance/corrections' && method === 'POST') {
      if (state.correctionError) return json(409, { message: state.correctionError });
      state.mine = [correction({ id: 'new', date: body!.date as string }), ...state.mine];
      return json(201, state.mine[0]);
    }
    const act = /^\/attendance\/corrections\/([^/]+)\/(approve|reject|cancel)$/.exec(path);
    if (act && method === 'POST') {
      const next = { approve: 'APPROVED', reject: 'REJECTED', cancel: 'CANCELLED' }[act[2]] as AttendanceCorrection['status'];
      const apply = (c: AttendanceCorrection) => (c.id === act[1] ? { ...c, status: next } : c);
      state.mine = state.mine.map(apply);
      state.pending = state.pending.map(apply);
      return json(200, correction({ id: act[1], status: next }));
    }
    return json(404, { message: 'not found' });
  }));
  return calls;
}

const fresh = (over: Partial<State> = {}): State => ({ today: baseToday(), records: [], team: [], mine: [], pending: [], ...over });
const asTenant = () => tenantFor({ defaultTimezone: 'Asia/Kolkata', defaultLocale: 'en-GB' });

describe('Attendance page', () => {
  beforeEach(() => session.set({ accessToken: 't', refreshToken: 'r' }));
  afterEach(() => {
    signOut();
    session.clear();
    vi.unstubAllGlobals();
  });

  describe('clocking', () => {
    it('clocks in, then shows the running status with the time in the organization timezone', async () => {
      signIn(userFor('employee'), asTenant());
      const calls = mockApi(fresh());
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);

      expect(await screen.findByText('Not clocked in')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Clock in' }));
      await waitFor(() => expect(calls.some((c) => c.path === '/attendance/clock-in' && c.method === 'POST')).toBe(true));
      expect(await screen.findByText(/Clocked in at/)).toBeInTheDocument();
      expect(screen.getByText(/so far/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clock out' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Clock in' })).not.toBeInTheDocument();
    });

    it('clocks out and shows the day\'s worked time', async () => {
      signIn(userFor('employee'), asTenant());
      mockApi(fresh({ today: baseToday({ clockedIn: true, record: record({ open: true, clockOut: null, workedMinutes: null }) }) }));
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);
      await user.click(await screen.findByRole('button', { name: 'Clock out' }));
      expect(await screen.findByText(/Worked 8h 30m today/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clock in' })).toBeDisabled(); // one session per day
    });

    it('formats times in the organization timezone and language', async () => {
      signIn(userFor('employee'), asTenant());
      mockApi(fresh({ today: baseToday({ record: record() }), records: [record()] }));
      renderWithProviders(<Attendance />);
      // 03:30Z is 09:00 in Asia/Kolkata; 12:00Z is 17:30.
      const row = (await screen.findAllByText('09:00')).find((el) => el.closest('tr'))!.closest('tr')!;
      expect(within(row).getByText('17:30')).toBeInTheDocument();
      expect(within(row).getByText('8h 30m')).toBeInTheDocument();
      expect(within(row).getByText('2 Mar 2026')).toBeInTheDocument();
    });

    it('warns about an unfinished session from an earlier day and opens the correction form for it', async () => {
      signIn(userFor('employee'), asTenant());
      mockApi(fresh({ today: baseToday({ stale: true, record: record({ date: '2026-03-01', open: true, clockOut: null, workedMinutes: null }) }) }));
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);
      expect(await screen.findByRole('alert')).toHaveTextContent(/unfinished session from 1 Mar 2026/);
      await user.click(screen.getByRole('button', { name: 'Submit a correction' }));
      expect(within(screen.getByRole('dialog')).getByLabelText('Day')).toHaveValue('2026-03-01');
    });

    it('shows the server error when clocking fails and keeps the page usable', async () => {
      signIn(userFor('employee'), asTenant());
      const state = fresh();
      const calls = mockApi(state);
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);
      await screen.findByText('Not clocked in');
      // Simulate someone else having clocked us in from another device.
      vi.stubGlobal('fetch', vi.fn(async (input: string, init: RequestInit = {}) => {
        const path = new URL(input).pathname.replace(/^\/api/, '');
        if (path === '/attendance/clock-in' && init.method === 'POST') return json(409, { message: 'You are already clocked in. Clock out first.' });
        if (path === '/attendance/today') return json(200, baseToday({ clockedIn: true, record: record({ open: true, clockOut: null, workedMinutes: null }) }));
        // Shape-compatible with both the list and summary endpoints.
        return json(200, { ...summary, items: [], total: 0, page: 1, pageSize: 10 });
      }));
      await user.click(screen.getByRole('button', { name: 'Clock in' }));
      expect(await screen.findByText('Clock out', { selector: 'button' })).toBeInTheDocument(); // refreshed to the true state
      expect(screen.getByRole('alert')).toHaveTextContent('You are already clocked in. Clock out first.');
      expect(calls.some((c) => c.path === '/attendance/today')).toBe(true);
    });
  });

  it('shows the monthly summary', async () => {
    signIn(userFor('employee'), asTenant());
    const calls = mockApi(fresh());
    renderWithProviders(<Attendance />);
    const cards = await screen.findByRole('region', { name: 'This month' });
    expect(within(cards).getByText('22')).toBeInTheDocument(); // working days
    expect(within(cards).getByText('15')).toBeInTheDocument(); // present
    expect(within(cards).getByText('120h 00m')).toBeInTheDocument(); // 7200 minutes
    const summaryCall = calls.find((c) => c.path === '/attendance/summary')!;
    expect(summaryCall.search.get('from')).toBe('2026-03-01');
    expect(summaryCall.search.get('to')).toBe('2026-03-31');
  });

  it('flags open sessions, corrected records, and shows an empty state', async () => {
    signIn(userFor('employee'), asTenant());
    mockApi(fresh({ records: [record({ id: 'a', open: true, clockOut: null, workedMinutes: null }), record({ id: 'b', source: 'CORRECTION', date: '2026-03-01' })] }));
    renderWithProviders(<Attendance />);
    expect(await screen.findByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Corrected')).toBeInTheDocument();
  });

  it('shows an empty history, and an error with retry', async () => {
    signIn(userFor('employee'), asTenant());
    const state = fresh({ failList: true });
    mockApi(state);
    const user = userEvent.setup();
    renderWithProviders(<Attendance />);
    const alert = await screen.findByText(/Could not load attendance\. Database unavailable/);
    expect(alert).toBeInTheDocument();
    state.failList = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No attendance recorded in this period.')).toBeInTheDocument();
  });

  describe('requesting a correction', () => {
    const open = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(await screen.findByRole('button', { name: 'Request correction' }));
      return screen.getByRole('dialog');
    };

    it('defaults to yesterday and explains the timezone and overnight rule', async () => {
      signIn(userFor('employee'), asTenant());
      mockApi(fresh());
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);
      const dialog = await open(user);
      expect(within(dialog).getByLabelText('Day')).toHaveValue('2026-03-01');
      expect(dialog).toHaveTextContent(/Asia\/Kolkata/);
      expect(dialog).toHaveTextContent(/next day \(overnight shift\)/i);
    });

    it('validates before calling the API', async () => {
      signIn(userFor('employee'), asTenant());
      const calls = mockApi(fresh());
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);
      const dialog = await open(user);
      await user.click(within(dialog).getByRole('button', { name: 'Submit request' }));
      expect(within(dialog).getByRole('alert')).toHaveTextContent(/short reason/i);
      expect(calls.some((c) => c.method === 'POST' && c.path === '/attendance/corrections')).toBe(false);
    });

    it('submits local times and confirms that approval is needed', async () => {
      signIn(userFor('employee'), asTenant());
      const calls = mockApi(fresh());
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);
      const dialog = await open(user);
      fireEvent.change(within(dialog).getByLabelText('Start'), { target: { value: '08:45' } });
      fireEvent.change(within(dialog).getByLabelText('End'), { target: { value: '17:15' } });
      await user.click(within(dialog).getByLabelText('Reason'));
      await user.paste('Badge reader offline');
      await user.click(within(dialog).getByRole('button', { name: 'Submit request' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(calls.find((c) => c.method === 'POST' && c.path === '/attendance/corrections')!.body).toEqual({
        date: '2026-03-01', clockInTime: '08:45', clockOutTime: '17:15', reason: 'Badge reader offline',
      });
      expect(await screen.findByRole('status')).toHaveTextContent(/takes effect once it is approved/i);
    });

    it('shows a server rejection inside the dialog and keeps the entered data', async () => {
      signIn(userFor('employee'), asTenant());
      mockApi(fresh({ correctionError: 'You already have a pending correction for this day' }));
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);
      const dialog = await open(user);
      await user.click(within(dialog).getByLabelText('Reason'));
      await user.paste('Again');
      await user.click(within(dialog).getByRole('button', { name: 'Submit request' }));
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(/already have a pending correction/i);
      expect(within(dialog).getByLabelText('Reason')).toHaveValue('Again');
    });

    it('lets the employee cancel a pending request', async () => {
      signIn(userFor('employee'), asTenant());
      const calls = mockApi(fresh({ mine: [correction()] }));
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);
      const section = await screen.findByRole('region', { name: 'My corrections' });
      await user.click(await within(section).findByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(calls.some((c) => c.path === '/attendance/corrections/c1/cancel')).toBe(true));
      expect(await screen.findByRole('status')).toHaveTextContent('Correction cancelled');
    });
  });

  describe('roles', () => {
    it('gives an employee neither the team nor the corrections-approval tabs', async () => {
      signIn(userFor('employee'), asTenant());
      mockApi(fresh());
      renderWithProviders(<Attendance />);
      await screen.findByText('Not clocked in');
      expect(screen.queryByRole('tab', { name: /team records|all records/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: 'Corrections' })).not.toBeInTheDocument();
    });

    it('lets a manager see the team and approve a correction', async () => {
      signIn(userFor('manager'), asTenant());
      const calls = mockApi(fresh({ pending: [correction({ id: 'p1', employee: { id: 'e2', employeeId: 'EMP-0002', name: 'Grace Hopper' } })], team: [record({ employee: { id: 'e2', employeeId: 'EMP-0002', name: 'Grace Hopper' } })] }));
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);

      await user.click(await screen.findByRole('tab', { name: 'Team records' }));
      expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
      expect(calls.some((c) => c.path === '/attendance' && c.search.get('scope') === 'team')).toBe(true);

      await user.click(screen.getByRole('tab', { name: 'Corrections' }));
      await user.click(await screen.findByRole('button', { name: 'Approve' }));
      await waitFor(() => expect(calls.some((c) => c.path === '/attendance/corrections/p1/approve')).toBe(true));
      expect(await screen.findByRole('status')).toHaveTextContent(/approved grace hopper/i);
    });

    it('requires a reason to reject a correction', async () => {
      signIn(userFor('hr'), asTenant());
      const calls = mockApi(fresh({ pending: [correction({ id: 'p1', employee: { id: 'e2', employeeId: 'EMP-0002', name: 'Grace Hopper' } })] }));
      const user = userEvent.setup();
      renderWithProviders(<Attendance />);
      await user.click(await screen.findByRole('tab', { name: 'Corrections' }));
      await user.click(await screen.findByRole('button', { name: 'Reject' }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Reject correction' }));
      expect(within(dialog).getByRole('alert')).toHaveTextContent(/reason is required/i);
      expect(calls.some((c) => c.path.endsWith('/reject'))).toBe(false);
      await user.click(within(dialog).getByLabelText(/reason/i));
      await user.paste('No evidence');
      await user.click(within(dialog).getByRole('button', { name: 'Reject correction' }));
      await waitFor(() => expect(calls.find((c) => c.path.endsWith('/reject'))?.body).toEqual({ reason: 'No evidence' }));
    });

    it('handles an administrator without an employee record', async () => {
      signIn(userFor('admin'), asTenant());
      mockApi(fresh({ noRecord: true }));
      renderWithProviders(<Attendance />);
      expect(await screen.findByRole('tab', { name: 'All records' })).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole('tab', { name: 'My attendance' })).not.toBeInTheDocument());
    });
  });
});
