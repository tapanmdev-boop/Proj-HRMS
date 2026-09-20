import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Select } from '../components/ui/Form';
import { Modal } from '../components/ui/Modal';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser, selectTenant } from '../auth/authSlice';
import { ApiError } from '../api/http';
import { departmentsApi, employeesApi } from '../api/endpoints';
import type { Department, Employee, Page } from '../api/types';
import { useFormat } from '../i18n/format';
import { currencyOptions } from '../i18n/regions';
import { identifierWarning, packFor } from '../compliance/packs';
import {
  emptyForm, employeesToCsv, formFromEmployee, toCreateInput, toUpdateInput, validateForm, type EmployeeFormState,
} from './employeeForm';

const PAGE_SIZE = 10;

const errorText = (error: unknown) => (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
const initialsOf = (e: Pick<Employee, 'firstName' | 'lastName'>) => `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase();

function StatusBadge({ status }: Readonly<{ status: Employee['status'] }>) {
  const active = status === 'ACTIVE';
  return (
    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
      {active ? 'Active' : 'Terminated'}
    </span>
  );
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface FormProps {
  mode: 'create' | 'edit';
  value: EmployeeFormState;
  onChange: (next: EmployeeFormState) => void;
  departments: Department[];
  managers: Employee[];
  editingId?: string;
  countryCode: string | null | undefined;
}

/** Shared by the Add and Edit dialogs. Country-specific fields come from the organization's jurisdiction pack. */
function EmployeeFields({ mode, value, onChange, departments, managers, editingId, countryCode }: Readonly<FormProps>) {
  const pack = packFor(countryCode);
  const currencies = useMemo(() => currencyOptions(), []);
  const set = <K extends keyof EmployeeFormState>(key: K, v: EmployeeFormState[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
      <Input id="firstName" label="First name" value={value.firstName} onChange={(e) => set('firstName', e.target.value)} maxLength={100} required />
      <Input id="lastName" label="Last name" value={value.lastName} onChange={(e) => set('lastName', e.target.value)} maxLength={100} required />
      {mode === 'create' && (
        <>
          <Input id="email" type="email" label="Work email" value={value.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" required />
          <Input id="password" type="password" label="Initial password" helperText="At least 8 characters. Share it securely." value={value.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" required />
          <Select
            id="role"
            label="Access level"
            value={value.role}
            onChange={(e) => set('role', e.target.value as EmployeeFormState['role'])}
            options={[{ value: 'EMPLOYEE', label: 'Employee' }, { value: 'MANAGER', label: 'Manager' }, { value: 'HR', label: 'People Ops (HR)' }]}
          />
        </>
      )}
      <Input id="position" label="Position" value={value.position} onChange={(e) => set('position', e.target.value)} maxLength={120} required />
      <Select
        id="departmentId"
        label="Department"
        value={value.departmentId}
        onChange={(e) => set('departmentId', e.target.value)}
        options={[{ value: '', label: 'No department' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
      />
      <Select
        id="managerId"
        label="Manager"
        value={value.managerId}
        onChange={(e) => set('managerId', e.target.value)}
        options={[
          { value: '', label: 'No manager' },
          ...managers.filter((m) => m.id !== editingId).map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName}` })),
        ]}
      />
      <Input id="joinDate" type="date" label="Join date" value={value.joinDate} onChange={(e) => set('joinDate', e.target.value)} required />

      <div className="col-span-full mt-1 border-t border-ivory-300 pt-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Pay</p>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Input id="salary" inputMode="decimal" label="Base pay (per pay period)" placeholder="0.00" value={value.salary} onChange={(e) => set('salary', e.target.value)} required />
          <Select id="currency" label="Currency" value={value.currency} onChange={(e) => set('currency', e.target.value)} options={currencies} />
          {pack.commonAllowances.map((a) => (
            <Input
              key={a.code}
              id={`allowance-${a.code}`}
              inputMode="decimal"
              label={`${a.label} allowance`}
              placeholder="0.00"
              value={value.allowances[a.code] ?? ''}
              onChange={(e) => set('allowances', { ...value.allowances, [a.code]: e.target.value })}
            />
          ))}
        </div>
      </div>

      <div className="col-span-full mt-1 border-t border-ivory-300 pt-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Identity & banking ({pack.name})</p>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          {pack.identifiers.map((field) => {
            const current = value.identifiers[field.key] ?? '';
            return (
              <Input
                key={field.key}
                id={`identifier-${field.key}`}
                label={field.label}
                placeholder={field.placeholder}
                value={current}
                maxLength={64}
                autoComplete="off"
                helperText={identifierWarning(field, current) ? `Check the format: ${identifierWarning(field, current)}` : undefined}
                onChange={(e) => set('identifiers', { ...value.identifiers, [field.key]: e.target.value })}
              />
            );
          })}
          <Input id="bankAccount" label="Bank account / IBAN" value={value.bankAccount} maxLength={64} autoComplete="off" onChange={(e) => set('bankAccount', e.target.value)} />
          <Input id="phoneNumber" type="tel" label="Phone" value={value.phoneNumber} maxLength={40} onChange={(e) => set('phoneNumber', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex justify-between gap-4 border-b border-ivory-200 py-2 text-sm last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{children}</dd>
    </div>
  );
}

export default function Employees() {
  const currentUser = useAppSelector(selectCurrentUser);
  const tenant = useAppSelector(selectTenant);
  const fmt = useFormat();
  const pack = packFor(tenant?.countryCode);
  // Only Admin/HR can create, edit or end employment; everyone else gets the read-only directory.
  // The API enforces this independently.
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'hr';

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState<'' | 'ACTIVE' | 'TERMINATED'>('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<Page<Employee> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);

  const [dialog, setDialog] = useState<'add' | 'edit' | 'preview' | 'terminate' | 'department' | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyForm(tenant?.baseCurrency ?? 'USD'));
  const [terminationDate, setTerminationDate] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    employeesApi
      .list({ page, pageSize: PAGE_SIZE, search: search || undefined, departmentId: departmentId || undefined, status: status || undefined }, controller.signal)
      .then((result) => {
        setData(result);
        // Requesting a page past the end (e.g. after a deletion elsewhere) falls back to the last page.
        const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
        if (page > lastPage) setPage(lastPage);
      })
      .catch((error) => {
        if ((error as Error).name !== 'AbortError') setLoadError(errorText(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, search, departmentId, status, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  // Departments and potential managers feed the filter and the forms.
  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => setDepartments([]));
    if (canManage) {
      employeesApi.list({ pageSize: 100, status: 'ACTIVE' }).then((r) => setManagers(r.items)).catch(() => setManagers([]));
    }
  }, [canManage, reloadKey]);

  const closeDialog = useCallback(() => {
    setDialog(null);
    setSelected(null);
    setDialogError(null);
    setSaving(false);
  }, []);

  const openAdd = () => {
    setForm(emptyForm(tenant?.baseCurrency ?? 'USD'));
    setDialog('add');
  };

  const openEdit = async (employee: Employee) => {
    // The list omits nothing an Admin/HR needs, but re-read so the form starts from the latest server state.
    try {
      const fresh = await employeesApi.get(employee.id);
      setSelected(fresh);
      setForm(formFromEmployee(fresh, tenant?.baseCurrency ?? 'USD'));
      setDialog('edit');
    } catch (error) {
      setNotice(errorText(error));
    }
  };

  const openPreview = async (employee: Employee) => {
    setSelected(employee);
    setDialog('preview');
    try {
      setSelected(await employeesApi.get(employee.id));
    } catch {
      /* keep the directory view already shown */
    }
  };

  const labels = useMemo(() => Object.fromEntries(pack.commonAllowances.map((a) => [a.code, a.label])), [pack]);

  const submit = async (mode: 'create' | 'edit') => {
    const problem = validateForm(form, mode);
    if (problem) {
      setDialogError(problem);
      return;
    }
    setSaving(true);
    setDialogError(null);
    try {
      if (mode === 'create') {
        const created = await employeesApi.create(toCreateInput(form, labels));
        setNotice(`${created.firstName} ${created.lastName} was added as ${created.employeeId}.`);
        setPage(1);
      } else if (selected) {
        await employeesApi.update(selected.id, toUpdateInput(form, labels));
        setNotice('Employee updated.');
      }
      closeDialog();
      refresh();
    } catch (error) {
      setDialogError(errorText(error));
      setSaving(false);
    }
  };

  const confirmTerminate = async () => {
    if (!selected || !terminationDate) return;
    setSaving(true);
    setDialogError(null);
    try {
      await employeesApi.terminate(selected.id, terminationDate);
      setNotice(`Employment ended for ${selected.firstName} ${selected.lastName}.`);
      closeDialog();
      refresh();
    } catch (error) {
      setDialogError(errorText(error));
      setSaving(false);
    }
  };

  const createDepartment = async () => {
    if (!newDepartment.trim()) return;
    setSaving(true);
    setDialogError(null);
    try {
      await departmentsApi.create({ name: newDepartment.trim() });
      setNewDepartment('');
      setNotice('Department added.');
      closeDialog();
      refresh();
    } catch (error) {
      setDialogError(errorText(error));
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ivory-300 bg-white p-6 shadow-premium-sm">
        <div className="mb-6 flex flex-col justify-between md:flex-row">
          <h2 className="mb-4 font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink-900 md:mb-0">Employee Directory</h2>
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <>
                <Button variant="success" onClick={openAdd}>+ Add Employee</Button>
                <Button variant="outline" onClick={() => setDialog('department')}>New Department</Button>
              </>
            )}
            <Button variant="outline" disabled={items.length === 0} onClick={() => download('employees.csv', employeesToCsv(items), 'text/csv')}>
              Export CSV
            </Button>
          </div>
        </div>

        {notice && (
          <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-md border border-success-200 bg-success-50 px-4 py-2.5 text-sm text-success-800">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-success-700 hover:text-success-900">✕</button>
          </div>
        )}

        {/* Search and filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="search"
              id="search"
              placeholder="Search by name, email, position or ID"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="department" className="mb-1 block text-sm font-medium text-gray-700">Department</label>
            <select id="department" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.employeeCount})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select id="status" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>

        {loadError && (
          <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800">
            <span>Could not load employees. {loadError}</span>
            <Button variant="outline" size="sm" onClick={refresh}>Retry</Button>
          </div>
        )}

        {/* Employee table */}
        <div className="overflow-x-auto" aria-busy={loading}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Position', 'Department', 'Status', 'Join date'].map((h) => (
                  <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
                ))}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && items.length === 0 &&
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} aria-hidden="true">
                    <td colSpan={6} className="px-6 py-4"><div className="h-6 animate-pulse rounded bg-ivory-200" /></td>
                  </tr>
                ))}
              {items.map((employee) => (
                <tr key={employee.id} className={`hover:bg-gray-50 ${loading ? 'opacity-60' : ''}`}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 font-medium text-gold-800" aria-hidden="true">{initialsOf(employee)}</div>
                      <div>
                        <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{employee.position}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{employee.department?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm"><StatusBadge status={employee.status} /></td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{fmt.date(employee.joinDate)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-1">
                      {canManage && employee.status === 'ACTIVE' && (
                        <>
                          <Button variant="ghost-primary" size="sm" onClick={() => openEdit(employee)}>Edit</Button>
                          <Button variant="ghost-danger" size="sm" onClick={() => { setSelected(employee); setTerminationDate(new Date().toISOString().slice(0, 10)); setDialog('terminate'); }}>End employment</Button>
                        </>
                      )}
                      <Button variant="ghost-secondary" size="sm" onClick={() => openPreview(employee)}>Preview</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !loadError && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    {search || departmentId || status ? 'No employees match these filters.' : canManage ? 'No employees yet. Add your first employee to get started.' : 'No employees to show.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <nav className="mt-5 flex items-center justify-between" aria-label="Pagination">
          <div className="text-sm text-gray-700">
            {data && data.total > 0
              ? `Showing ${fmt.number((page - 1) * PAGE_SIZE + 1)}–${fmt.number(Math.min(page * PAGE_SIZE, data.total))} of ${fmt.number(data.total)}`
              : 'Showing 0 of 0'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="self-center text-sm text-gray-600">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </nav>
      </div>

      {(dialog === 'add' || dialog === 'edit') && (
        <Modal title={dialog === 'add' ? 'Add employee' : `Edit ${selected?.firstName ?? 'employee'}`} onClose={closeDialog} wide>
          <form onSubmit={(e) => { e.preventDefault(); void submit(dialog === 'add' ? 'create' : 'edit'); }} noValidate>
            <EmployeeFields mode={dialog === 'add' ? 'create' : 'edit'} value={form} onChange={setForm} departments={departments} managers={managers} editingId={selected?.id} countryCode={tenant?.countryCode} />
            {dialogError && <p role="alert" className="mb-3 text-sm text-danger-700">{dialogError}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={saving}>{dialog === 'add' ? 'Add employee' : 'Save changes'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === 'preview' && selected && (
        <Modal title={`${selected.firstName} ${selected.lastName}`} onClose={closeDialog} wide>
          <dl>
            <Detail label="Employee ID">{selected.employeeId}</Detail>
            <Detail label="Email">{selected.email}</Detail>
            <Detail label="Position">{selected.position}</Detail>
            <Detail label="Department">{selected.department?.name ?? '—'}</Detail>
            <Detail label="Status"><StatusBadge status={selected.status} /></Detail>
            <Detail label="Joined">{fmt.date(selected.joinDate)}</Detail>
            {selected.terminationDate && <Detail label="Employment ended">{fmt.date(selected.terminationDate)}</Detail>}
          </dl>
          {selected.salary !== undefined ? (
            <div className="mt-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Pay & identity ({pack.name})</p>
              <dl>
                <Detail label="Base pay">{fmt.money(selected.salary, selected.currency)}</Detail>
                {(selected.allowances ?? []).map((a) => (
                  <Detail key={a.code} label={a.label ?? a.code}>{fmt.money(a.amount, selected.currency)}</Detail>
                ))}
                {pack.identifiers.map((field) => (
                  <Detail key={field.key} label={field.label}>{selected.identifiers?.[field.key] || '—'}</Detail>
                ))}
                <Detail label="Bank account">{selected.bankAccount || '—'}</Detail>
                <Detail label="Phone">{selected.phoneNumber || '—'}</Detail>
              </dl>
            </div>
          ) : (
            <p className="mt-4 text-xs text-gray-500">Pay and personal details are visible only to HR, administrators and the employee.</p>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={closeDialog}>Close</Button>
          </div>
        </Modal>
      )}

      {dialog === 'terminate' && selected && (
        <Modal title="End employment" onClose={closeDialog}>
          <p className="mb-4 text-sm text-gray-600">
            {selected.firstName} {selected.lastName} will lose access on the last working day. Their record and history are kept.
          </p>
          <Input id="terminationDate" type="date" label="Last working day" value={terminationDate} min={selected.joinDate ?? undefined} onChange={(e) => setTerminationDate(e.target.value)} required />
          {dialogError && <p role="alert" className="mb-3 text-sm text-danger-700">{dialogError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button variant="danger" isLoading={saving} disabled={!terminationDate} onClick={confirmTerminate}>End employment</Button>
          </div>
        </Modal>
      )}

      {dialog === 'department' && (
        <Modal title="New department" onClose={closeDialog}>
          <form onSubmit={(e) => { e.preventDefault(); void createDepartment(); }}>
            <Input id="departmentName" label="Name" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} maxLength={100} required />
            {dialogError && <p role="alert" className="mb-3 text-sm text-danger-700">{dialogError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={saving} disabled={!newDepartment.trim()}>Add department</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
