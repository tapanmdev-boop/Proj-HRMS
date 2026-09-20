import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Employees from './Employees';
import { renderWithProviders, signIn, signOut, tenantFor, userFor } from '../test/helpers';
import { session } from '../api/http';
import type { Employee } from '../api/types';

const employee = (over: Partial<Employee> = {}): Employee => ({
  id: 'e1', employeeId: 'EMP-0001', userId: 'u1', email: 'ada@acme.test', firstName: 'Ada', lastName: 'Lovelace', role: 'EMPLOYEE',
  position: 'Engineer', department: { id: 'd1', name: 'Research' }, departmentId: 'd1', managerId: null,
  joinDate: '2026-03-05', terminationDate: null, status: 'ACTIVE', ...over,
});

const departments = [{ id: 'd1', name: 'Research', description: null, employeeCount: 2 }];
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

interface ApiState {
  employees: Employee[];
  failList?: boolean;
  createError?: { status: number; message: string };
}

function mockApi(state: ApiState) {
  const requests: { method: string; path: string; search: URLSearchParams; body: unknown }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    const path = url.pathname.replace(/^\/api/, '');
    const method = init.method ?? 'GET';
    requests.push({ method, path, search: url.searchParams, body: init.body ? JSON.parse(init.body as string) : undefined });

    if (path === '/departments') return json(200, departments);
    if (path === '/employees' && method === 'GET') {
      if (state.failList) return json(500, { message: 'Database unavailable' });
      const search = url.searchParams.get('search')?.toLowerCase();
      const items = state.employees.filter((e) => !search || `${e.firstName} ${e.lastName} ${e.position}`.toLowerCase().includes(search));
      return json(200, { items, total: items.length, page: 1, pageSize: 10 });
    }
    if (path === '/employees' && method === 'POST') {
      if (state.createError) return json(state.createError.status, { message: state.createError.message });
      const body = JSON.parse(init.body as string);
      const created = employee({ id: 'new', employeeId: 'EMP-0009', firstName: body.firstName, lastName: body.lastName, email: body.email, position: body.position });
      state.employees = [created, ...state.employees];
      return json(201, created);
    }
    return json(404, { message: 'not found' });
  }));
  return requests;
}

/** Fills a field by pasting; typing ~100 characters key-by-key made these tests slow enough to time out under load. */
const fill = async (user: ReturnType<typeof userEvent.setup>, field: HTMLElement, text: string) => {
  await user.click(field);
  await user.paste(text);
};

describe('Employees page', () => {
  beforeEach(() => {
    session.set({ accessToken: 'token', refreshToken: 'refresh' });
  });
  afterEach(() => {
    signOut();
    session.clear();
    vi.unstubAllGlobals();
  });

  it('loads the directory from the API and formats dates for the organization locale', async () => {
    signIn(userFor('hr'), tenantFor({ defaultLocale: 'de-DE' }));
    mockApi({ employees: [employee()] });
    renderWithProviders(<Employees />);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('05.03.2026')).toBeInTheDocument(); // German date format
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–1 of 1')).toBeInTheDocument();
  });

  it('shows an empty state distinct from a filtered-empty state', async () => {
    signIn(userFor('hr'));
    mockApi({ employees: [] });
    renderWithProviders(<Employees />);
    expect(await screen.findByText(/No employees yet\. Add your first employee/i)).toBeInTheDocument();
  });

  it('shows the error and retries', async () => {
    signIn(userFor('hr'));
    const state: ApiState = { employees: [employee()], failList: true };
    mockApi(state);
    const user = userEvent.setup();
    renderWithProviders(<Employees />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load employees.*database unavailable/i);
    state.failList = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('searches on the server after a short pause', async () => {
    signIn(userFor('hr'));
    const requests = mockApi({ employees: [employee(), employee({ id: 'e2', firstName: 'Grace', lastName: 'Hopper', email: 'g@acme.test' })] });
    const user = userEvent.setup();
    renderWithProviders(<Employees />);
    await screen.findByText('Grace Hopper');

    await user.type(screen.getByLabelText('Search'), 'hopper');
    await waitFor(() => expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument());
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    const searches = requests.filter((r) => r.path === '/employees' && r.search.get('search'));
    expect(searches).toHaveLength(1); // one request for the whole word, not one per keystroke
    expect(searches[0].search.get('search')).toBe('hopper');
  });

  describe('permissions', () => {
    it('offers management actions to HR', async () => {
      signIn(userFor('hr'));
      mockApi({ employees: [employee()] });
      renderWithProviders(<Employees />);
      await screen.findByText('Ada Lovelace');
      expect(screen.getByRole('button', { name: '+ Add Employee' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'End employment' })).toBeInTheDocument();
    });

    it.each(['employee', 'manager'] as const)('gives a %s a read-only directory', async (role) => {
      signIn(userFor(role));
      const requests = mockApi({ employees: [employee()] });
      renderWithProviders(<Employees />);
      await screen.findByText('Ada Lovelace');
      expect(screen.queryByRole('button', { name: '+ Add Employee' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'End employment' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
      // Nor does it fetch the manager picker data used only by the edit forms.
      expect(requests.filter((r) => r.path === '/employees')).toHaveLength(1);
    });

    it('does not offer Edit for terminated employees', async () => {
      signIn(userFor('hr'));
      mockApi({ employees: [employee({ status: 'TERMINATED', terminationDate: '2026-02-01' })] });
      renderWithProviders(<Employees />);
      await screen.findByText('Ada Lovelace');
      expect(within(screen.getByRole('table')).getByText('Terminated')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    });
  });

  describe('adding an employee', () => {
    const fillRequired = async (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) => {
      await fill(user, within(dialog).getByLabelText('First name'), 'Grace');
      await fill(user, within(dialog).getByLabelText('Last name'), 'Hopper');
      await fill(user, within(dialog).getByLabelText('Work email'), 'grace@acme.test');
      await fill(user, within(dialog).getByLabelText('Initial password'), 'long-enough-1');
      await fill(user, within(dialog).getByLabelText('Position'), 'Rear Admiral');
      await fill(user, within(dialog).getByLabelText('Join date'), '2026-04-01');
      await fill(user, within(dialog).getByLabelText('Base pay (per pay period)'), '7500.25');
    };

    it('validates before calling the API', async () => {
      signIn(userFor('hr'));
      const requests = mockApi({ employees: [] });
      const user = userEvent.setup();
      renderWithProviders(<Employees />);
      await user.click(await screen.findByRole('button', { name: '+ Add Employee' }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));
      expect(within(dialog).getByRole('alert')).toHaveTextContent(/first and last name/i);
      expect(requests.some((r) => r.method === 'POST')).toBe(false);
    });

    it('sends exact decimal pay and jurisdiction-specific identifiers, then refreshes the list', async () => {
      signIn(userFor('hr'), tenantFor({ countryCode: 'AE', baseCurrency: 'AED', defaultLocale: 'en-AE' }));
      const requests = mockApi({ employees: [] });
      const user = userEvent.setup();
      renderWithProviders(<Employees />);
      await user.click(await screen.findByRole('button', { name: '+ Add Employee' }));
      const dialog = screen.getByRole('dialog');

      // The UAE pack supplies its own identifier fields; a US organization would see different ones.
      expect(within(dialog).getByLabelText('Emirates ID')).toBeInTheDocument();
      expect(within(dialog).queryByLabelText('Social Security number')).not.toBeInTheDocument();

      await fillRequired(user, dialog);
      await fill(user, within(dialog).getByLabelText('Emirates ID'), '784-1990-1234567-1');
      await fill(user, within(dialog).getByLabelText('Housing allowance'), '2000');
      await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      const post = requests.find((r) => r.method === 'POST')!;
      expect(post.body).toMatchObject({
        firstName: 'Grace', lastName: 'Hopper', email: 'grace@acme.test', role: 'EMPLOYEE',
        salary: '7500.25', currency: 'AED', identifiers: { emirates_id: '784-1990-1234567-1' },
        allowances: [{ code: 'housing', label: 'Housing', amount: '2000' }],
      });
      expect(typeof (post.body as { salary: unknown }).salary).toBe('string');
      expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Grace Hopper was added as EMP-0009');
    });

    it('shows country-appropriate identifier fields for other jurisdictions', async () => {
      signIn(userFor('hr'), tenantFor({ countryCode: 'IN', baseCurrency: 'INR', defaultLocale: 'en-IN' }));
      mockApi({ employees: [] });
      const user = userEvent.setup();
      renderWithProviders(<Employees />);
      await user.click(await screen.findByRole('button', { name: '+ Add Employee' }));
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByLabelText('PAN')).toBeInTheDocument();
      expect(within(dialog).getByLabelText('Aadhaar')).toBeInTheDocument();
      expect(within(dialog).queryByLabelText('Emirates ID')).not.toBeInTheDocument();
    });

    it('falls back to neutral identifier fields for a country without a pack', async () => {
      signIn(userFor('hr'), tenantFor({ countryCode: 'NP', baseCurrency: 'NPR', defaultLocale: 'ne' }));
      mockApi({ employees: [] });
      const user = userEvent.setup();
      renderWithProviders(<Employees />);
      await user.click(await screen.findByRole('button', { name: '+ Add Employee' }));
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByLabelText('National ID')).toBeInTheDocument();
      expect(within(dialog).getByLabelText('Tax ID')).toBeInTheDocument();
    });

    it('warns about a suspicious identifier format without blocking the save', async () => {
      signIn(userFor('hr'), tenantFor({ countryCode: 'GB', baseCurrency: 'GBP', defaultLocale: 'en-GB' }));
      mockApi({ employees: [] });
      const user = userEvent.setup();
      renderWithProviders(<Employees />);
      await user.click(await screen.findByRole('button', { name: '+ Add Employee' }));
      const dialog = screen.getByRole('dialog');
      await user.type(within(dialog).getByLabelText('National Insurance number'), 'bad');
      expect(within(dialog).getByText(/check the format/i)).toBeInTheDocument();
    });

    it('shows the server error inside the dialog and keeps the entered data', async () => {
      signIn(userFor('hr'));
      mockApi({ employees: [], createError: { status: 409, message: 'A user with this email already exists' } });
      const user = userEvent.setup();
      renderWithProviders(<Employees />);
      await user.click(await screen.findByRole('button', { name: '+ Add Employee' }));
      const dialog = screen.getByRole('dialog');
      await fillRequired(user, dialog);
      await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent('A user with this email already exists');
      expect(within(dialog).getByLabelText('First name')).toHaveValue('Grace');
    });

    it('closes the dialog with Escape', async () => {
      signIn(userFor('hr'));
      mockApi({ employees: [] });
      const user = userEvent.setup();
      renderWithProviders(<Employees />);
      await user.click(await screen.findByRole('button', { name: '+ Add Employee' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
