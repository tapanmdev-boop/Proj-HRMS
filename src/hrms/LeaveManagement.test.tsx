import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeaveManagement from './LeaveManagement';
import { renderWithProviders, signIn, signOut, tenantFor, userFor } from '../test/helpers';
import { session } from '../api/http';
import type { LeaveBalance, LeaveRequest } from '../api/leave';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const leave = (over: Partial<LeaveRequest> = {}): LeaveRequest => ({
  id: 'l1', employee: { id: 'e1', employeeId: 'EMP-0001', name: 'Ada Lovelace' }, leaveType: 'ANNUAL', startDate: '2099-03-02', endDate: '2099-03-06',
  days: '5', reason: 'Trip', status: 'PENDING', rejectionReason: null, decidedAt: null, createdAt: '2099-01-01T00:00:00Z', ...over,
});

const balances: LeaveBalance[] = [
  { leaveType: 'ANNUAL', entitlement: '20', used: '4', pending: '2', remaining: '14' },
  { leaveType: 'SICK', entitlement: null, used: '0', pending: '0', remaining: null },
  { leaveType: 'MATERNITY', entitlement: null, used: '0', pending: '0', remaining: null },
  { leaveType: 'PATERNITY', entitlement: null, used: '0', pending: '0', remaining: null },
  { leaveType: 'UNPAID', entitlement: null, used: '0', pending: '0', remaining: null },
  { leaveType: 'OTHER', entitlement: null, used: '0', pending: '0', remaining: null },
];

interface State {
  mine: LeaveRequest[];
  team: LeaveRequest[];
  noRecord?: boolean;
  createError?: string;
  holidays?: { id: string; date: string; name: string }[];
}

function mockApi(state: State) {
  const calls: { method: string; path: string; search: URLSearchParams; body: Record<string, unknown> | undefined }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    const path = url.pathname.replace(/^\/api/, '');
    const method = init.method ?? 'GET';
    const body = init.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : undefined;
    calls.push({ method, path, search: url.searchParams, body });

    if (path === '/leave/balances') return state.noRecord ? json(403, { message: 'You do not have an employee record' }) : json(200, { year: 2099, employeeId: 'e1', items: balances });
    if (path === '/leave/policies') return json(200, [{ leaveType: 'ANNUAL', daysPerYear: '20' }]);
    if (path === '/holidays' && method === 'GET') return json(200, state.holidays ?? []);
    if (path === '/leave' && method === 'GET') {
      const scope = url.searchParams.get('scope') ?? 'mine';
      const source = scope === 'mine' ? state.mine : state.team;
      const status = url.searchParams.get('status');
      const items = source.filter((l) => !status || l.status === status);
      return json(200, { items, total: items.length, page: 1, pageSize: 10 });
    }
    if (path === '/leave' && method === 'POST') {
      if (state.createError) return json(400, { message: state.createError });
      const created = leave({ id: 'new', startDate: body!.startDate as string, endDate: body!.endDate as string, days: '3' });
      state.mine = [created, ...state.mine];
      return json(201, created);
    }
    const action = /^\/leave\/([^/]+)\/(approve|reject|cancel)$/.exec(path);
    if (action && method === 'POST') {
      const [, id, verb] = action;
      const next = { approve: 'APPROVED', reject: 'REJECTED', cancel: 'CANCELLED' }[verb] as LeaveRequest['status'];
      const apply = (l: LeaveRequest) => (l.id === id ? { ...l, status: next, rejectionReason: (body?.reason as string) ?? null } : l);
      state.mine = state.mine.map(apply);
      state.team = state.team.map(apply);
      return json(200, leave({ id, status: next }));
    }
    return json(404, { message: 'not found' });
  }));
  return calls;
}

describe('Leave page', () => {
  beforeEach(() => session.set({ accessToken: 't', refreshToken: 'r' }));
  afterEach(() => {
    signOut();
    session.clear();
    vi.unstubAllGlobals();
  });

  it('shows balances (entitlement, taken, pending, remaining) and my requests', async () => {
    signIn(userFor('employee'));
    mockApi({ mine: [leave()], team: [] });
    renderWithProviders(<LeaveManagement />);

    expect(await screen.findByText('14 left')).toBeInTheDocument();
    expect(screen.getByText(/of 20 · 4 taken · 2 pending/)).toBeInTheDocument();
    expect(screen.getAllByText('No limit').length).toBeGreaterThan(0); // types without a policy
    expect(await screen.findByText('Trip')).toBeInTheDocument();
    // Employees see neither the approvals nor the settings tabs.
    expect(screen.queryByRole('tab', { name: /team requests|all requests/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /policies/i })).not.toBeInTheDocument();
  });

  it('formats leave dates for the organization locale', async () => {
    signIn(userFor('employee'), tenantFor({ defaultLocale: 'de-DE' }));
    mockApi({ mine: [leave({ startDate: '2099-03-02', endDate: '2099-03-06' })], team: [] });
    renderWithProviders(<LeaveManagement />);
    expect(await screen.findByText(/02\.03\.2099 – 06\.03\.2099/)).toBeInTheDocument();
  });

  it('lets an employee cancel a pending request', async () => {
    signIn(userFor('employee'));
    const calls = mockApi({ mine: [leave()], team: [] });
    const user = userEvent.setup();
    renderWithProviders(<LeaveManagement />);
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(calls.some((c) => c.path === '/leave/l1/cancel' && c.method === 'POST')).toBe(true));
    expect(await screen.findByRole('status')).toHaveTextContent('Request cancelled');
  });

  describe('requesting leave', () => {
    const open = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(await screen.findByRole('button', { name: 'Request leave' }));
      return screen.getByRole('dialog');
    };
    // Date inputs take a value through a change event (the browser's picker does the same); jsdom ignores typed text there.
    const setDate = async (_user: ReturnType<typeof userEvent.setup>, el: HTMLElement, v: string) => { fireEvent.change(el, { target: { value: v } }); };

    it('estimates working days from the organization calendar before submitting', async () => {
      signIn(userFor('employee'), tenantFor({ weekendDays: [5, 6] })); // Friday/Saturday weekend
      mockApi({ mine: [], team: [], holidays: [] });
      const user = userEvent.setup();
      renderWithProviders(<LeaveManagement />);
      const dialog = await open(user);
      // 2099-03-01 is a Sunday: Sun..Sat has 5 working days when Fri/Sat are the weekend.
      await setDate(user, within(dialog).getByLabelText('First day'), '2099-03-01');
      await setDate(user, within(dialog).getByLabelText('Last day'), '2099-03-07');
      expect(await within(dialog).findByText(/About 5 working days/)).toBeInTheDocument();
    });

    it('subtracts holidays from the estimate', async () => {
      signIn(userFor('employee'));
      mockApi({ mine: [], team: [], holidays: [{ id: 'h', date: '2099-03-04', name: 'Local day' }] });
      const user = userEvent.setup();
      renderWithProviders(<LeaveManagement />);
      const dialog = await open(user);
      await setDate(user, within(dialog).getByLabelText('First day'), '2099-03-02'); // Monday
      await setDate(user, within(dialog).getByLabelText('Last day'), '2099-03-06');
      expect(await within(dialog).findByText(/About 4 working days/)).toBeInTheDocument();
    });

    it.each([
      ['no dates', '', '', 'Trip', /choose the first and last day/i],
      ['reversed dates', '2099-03-06', '2099-03-02', 'Trip', /cannot be before/i],
      ['two calendar years', '2099-12-30', '2100-01-02', 'Trip', /two calendar years/i],
      ['a weekend only', '2099-03-07', '2099-03-08', 'Trip', /no working days/i],
      ['a missing reason', '2099-03-02', '2099-03-03', '', /short reason/i],
    ])('blocks %s without calling the API', async (_l, start, end, reason, message) => {
      signIn(userFor('employee'));
      const calls = mockApi({ mine: [], team: [] });
      const user = userEvent.setup();
      renderWithProviders(<LeaveManagement />);
      const dialog = await open(user);
      if (start) await setDate(user, within(dialog).getByLabelText('First day'), start);
      if (end) await setDate(user, within(dialog).getByLabelText('Last day'), end);
      if (reason) await setDate(user, within(dialog).getByLabelText('Reason'), reason);
      await user.click(within(dialog).getByRole('button', { name: 'Submit request' }));
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(message);
      expect(calls.some((c) => c.method === 'POST')).toBe(false);
    });

    it('submits, reports the server-computed days, and refreshes the list', async () => {
      signIn(userFor('employee'));
      const calls = mockApi({ mine: [], team: [] });
      const user = userEvent.setup();
      renderWithProviders(<LeaveManagement />);
      const dialog = await open(user);
      await setDate(user, within(dialog).getByLabelText('First day'), '2099-03-02');
      await setDate(user, within(dialog).getByLabelText('Last day'), '2099-03-04');
      await setDate(user, within(dialog).getByLabelText('Reason'), 'Family visit');
      await user.click(within(dialog).getByRole('button', { name: 'Submit request' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(calls.find((c) => c.method === 'POST')!.body).toEqual({ startDate: '2099-03-02', endDate: '2099-03-04', leaveType: 'ANNUAL', reason: 'Family visit' });
      expect(await screen.findByRole('status')).toHaveTextContent('Requested 3 working day(s)');
    });

    it('shows a server rejection (e.g. insufficient balance) inside the dialog and keeps the input', async () => {
      signIn(userFor('employee'));
      mockApi({ mine: [], team: [], createError: 'Not enough annual leave: 1 day(s) remaining in 2099, 3 requested' });
      const user = userEvent.setup();
      renderWithProviders(<LeaveManagement />);
      const dialog = await open(user);
      await setDate(user, within(dialog).getByLabelText('First day'), '2099-03-02');
      await setDate(user, within(dialog).getByLabelText('Last day'), '2099-03-04');
      await setDate(user, within(dialog).getByLabelText('Reason'), 'Trip');
      await user.click(within(dialog).getByRole('button', { name: 'Submit request' }));
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(/not enough annual leave/i);
      expect(within(dialog).getByLabelText('Reason')).toHaveValue('Trip');
    });
  });

  describe('approvals', () => {
    const teamRequest = leave({ id: 't1', employee: { id: 'e2', employeeId: 'EMP-0002', name: 'Grace Hopper' } });

    it('shows a manager their team\'s pending requests and lets them approve', async () => {
      signIn(userFor('manager'));
      const calls = mockApi({ mine: [], team: [teamRequest] });
      const user = userEvent.setup();
      renderWithProviders(<LeaveManagement />);
      await user.click(await screen.findByRole('tab', { name: 'Team requests' }));
      expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Approve' }));
      await waitFor(() => expect(calls.some((c) => c.path === '/leave/t1/approve')).toBe(true));
      expect(await screen.findByRole('status')).toHaveTextContent(/approved grace hopper/i);
    });

    it('requires a reason to reject, then sends it', async () => {
      signIn(userFor('manager'));
      const calls = mockApi({ mine: [], team: [teamRequest] });
      const user = userEvent.setup();
      renderWithProviders(<LeaveManagement />);
      await user.click(await screen.findByRole('tab', { name: 'Team requests' }));
      await user.click(await screen.findByRole('button', { name: 'Reject' }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Reject request' }));
      expect(within(dialog).getByRole('alert')).toHaveTextContent(/reason is required/i);
      expect(calls.some((c) => c.path.endsWith('/reject'))).toBe(false);

      await user.click(within(dialog).getByLabelText(/reason/i));
      await user.paste('Team deadline');
      await user.click(within(dialog).getByRole('button', { name: 'Reject request' }));
      await waitFor(() => expect(calls.find((c) => c.path.endsWith('/reject'))?.body).toEqual({ reason: 'Team deadline' }));
    });

    it('shows an empty state when nothing awaits a decision', async () => {
      signIn(userFor('manager'));
      mockApi({ mine: [], team: [] });
      const user = userEvent.setup();
      renderWithProviders(<LeaveManagement />);
      await user.click(await screen.findByRole('tab', { name: 'Team requests' }));
      expect(await screen.findByText('Nothing is waiting for a decision.')).toBeInTheDocument();
    });

    it('gives HR the organization view and the settings tab', async () => {
      signIn(userFor('hr'));
      mockApi({ mine: [], team: [teamRequest] });
      const user = userEvent.setup();
      renderWithProviders(<LeaveManagement />);
      expect(await screen.findByRole('tab', { name: 'All requests' })).toBeInTheDocument();
      await user.click(screen.getByRole('tab', { name: 'Policies & holidays' }));
      expect(await screen.findByText('Annual entitlements')).toBeInTheDocument();
      expect(screen.getByText(/Weekend: Sat, Sun/)).toBeInTheDocument();
    });
  });

  it('handles an administrator who has no employee record', async () => {
    signIn(userFor('admin'));
    mockApi({ mine: [], team: [], noRecord: true });
    renderWithProviders(<LeaveManagement />);
    expect(await screen.findByRole('tab', { name: 'All requests' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('tab', { name: 'My leave' })).not.toBeInTheDocument());
  });
});
