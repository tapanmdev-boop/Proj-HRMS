import { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { PageHeader, Panel, DataTable } from '../components/ui/Dashboard';
import { Button, Input } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';

// Illustrative self-service record, seeded from the logged-in user. There's
// no shared store of full employee records to read a real match from (see
// the separate admin roster in Employees.tsx), so contact/payroll fields are
// representative placeholders in the same style used across this app's mock
// data — editable here, not tied to that admin roster.
const DEFAULT_PROFILE = {
  phone: '+971 50 123 4567',
  address: 'Dubai Marina, Dubai, UAE',
  emergencyContactName: 'Priya Sharma',
  emergencyContactPhone: '+971 55 987 6543',
};

const PAYROLL_INFO = {
  emiratesId: '784-1990-1234567-1',
  laborCardNumber: 'LC-100234',
  iban: 'AE070331234567890123456',
  basicSalary: 12000,
  housingAllowance: 4000,
  transportAllowance: 1000,
  otherAllowances: 500,
};

// Mirrors the illustrative figures in LeaveManagement.tsx.
const LEAVE_BALANCE = [
  { key: 'vacation', label: 'Vacation', total: 20, available: 15 },
  { key: 'sick', label: 'Sick Leave', total: 10, available: 8 },
  { key: 'personal', label: 'Personal', total: 5, available: 4 },
];

const MY_DOCUMENTS = [
  { id: 'offer', name: 'Offer Letter', issued: '2023-01-10' },
  { id: 'contract', name: 'Labour Contract (MOHRE)', issued: '2023-01-15' },
  { id: 'salary-cert', name: 'Salary Certificate', issued: '2025-01-05' },
];

function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  hr: 'People Operations',
  manager: 'Manager',
  employee: 'Employee',
};

export default function Profile() {
  const currentUser = useAppSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState<'overview' | 'payroll' | 'documents' | 'leave'>('overview');
  const [form, setForm] = useState(DEFAULT_PROFILE);
  const [draft, setDraft] = useState(DEFAULT_PROFILE);
  const [saved, setSaved] = useState('');

  const initials = currentUser?.name.split(/\s+/).map(n => n[0]).join('').toUpperCase() ?? '—';
  const totalMonthlyPay =
    PAYROLL_INFO.basicSalary + PAYROLL_INFO.housingAllowance + PAYROLL_INFO.transportAllowance + PAYROLL_INFO.otherAllowances;

  const handleSave = () => {
    setForm(draft);
    setSaved('Contact details updated.');
    window.setTimeout(() => setSaved(''), 3000);
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Your self-service view — update your own contact details and review your records."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Identity card */}
        <div className="shrink-0 lg:w-72">
          <div className="rounded-xl border border-ivory-300 bg-white p-6 text-center shadow-premium-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink-900 text-[20px] font-semibold text-gold-300 ring-1 ring-gold-500/40">
              {initials}
            </div>
            <div className="mt-3 text-[15px] font-semibold text-ink-900">{currentUser?.name}</div>
            <div className="text-[13px] text-gray-500">{currentUser?.email}</div>
            <div className="mt-3">
              <Badge variant="secondary" rounded>{currentUser ? ROLE_LABELS[currentUser.role] ?? currentUser.role : '—'}</Badge>
            </div>
          </div>

          <nav className="mt-4 space-y-1 rounded-xl border border-ivory-300 bg-white p-2 shadow-premium-sm">
            {([
              ['overview', 'Overview'],
              ['payroll', 'Payroll & Bank'],
              ['documents', 'Documents'],
              ['leave', 'Leave Balance'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`block w-full rounded-md px-3 py-2 text-left text-[13.5px] transition-colors ${
                  activeTab === key ? 'bg-ink-900 font-medium text-ivory-50' : 'text-gray-600 hover:bg-ivory-100'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {activeTab === 'overview' && (
            <Panel title="Contact details" bodyClassName="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Phone" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
                <Input label="Address" value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })} />
                <Input
                  label="Emergency contact name"
                  value={draft.emergencyContactName}
                  onChange={e => setDraft({ ...draft, emergencyContactName: e.target.value })}
                />
                <Input
                  label="Emergency contact phone"
                  value={draft.emergencyContactPhone}
                  onChange={e => setDraft({ ...draft, emergencyContactPhone: e.target.value })}
                />
              </div>
              {saved && (
                <div className="mb-4 rounded-md border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-800">
                  {saved}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDraft(form)} disabled={draft === form}>Reset</Button>
                <Button onClick={handleSave}>Save changes</Button>
              </div>
            </Panel>
          )}

          {activeTab === 'payroll' && (
            <Panel title="Payroll & bank" bodyClassName="p-6 space-y-4">
              <p className="text-[12.5px] text-gray-500">
                Read-only — Payroll & Compensation own these fields. Contact People Operations for corrections.
              </p>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ['Emirates ID', PAYROLL_INFO.emiratesId],
                  ['Labour Card No.', PAYROLL_INFO.laborCardNumber],
                  ['IBAN', PAYROLL_INFO.iban],
                  ['Monthly Pay (AED)', totalMonthlyPay.toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-ivory-200 bg-ivory-50 px-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{label}</dt>
                    <dd className="mt-1 text-[14px] font-medium text-ink-900 tabular">{value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          )}

          {activeTab === 'documents' && (
            <Panel title="My documents">
              <DataTable
                columns={[
                  { key: 'name', label: 'Document' },
                  { key: 'issued', label: 'Issued' },
                ]}
                data={MY_DOCUMENTS}
                actions={(row) => (
                  <Button
                    variant="ghost-primary"
                    size="sm"
                    onClick={() => downloadTextFile(`${row.id}.txt`, `${row.name}\nIssued: ${row.issued}\nFor: ${currentUser?.name}`)}
                  >
                    Download
                  </Button>
                )}
              />
            </Panel>
          )}

          {activeTab === 'leave' && (
            <Panel title="Leave balance" bodyClassName="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {LEAVE_BALANCE.map((bucket) => (
                  <div key={bucket.key} className="rounded-lg border border-ivory-200 bg-ivory-50 p-4">
                    <div className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gray-500">{bucket.label}</div>
                    <div className="mt-2 font-display text-[28px] font-medium text-ink-900 tabular">{bucket.available}</div>
                    <div className="text-[12.5px] text-gray-500 tabular">of {bucket.total} days</div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ivory-200">
                      <div className="h-full rounded-full bg-gold-500" style={{ width: `${(bucket.available / bucket.total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
