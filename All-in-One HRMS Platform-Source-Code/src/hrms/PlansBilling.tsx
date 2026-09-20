import { useState } from 'react';
import { PageHeader, Panel } from '../components/ui/Dashboard';
import { Button } from '../components/ui/Form';
import { Icon } from '../components/layout/icons';

const CURRENT_PLAN = { name: 'Growth', seatsUsed: 127, seatsTotal: 150, renewsOn: '5 January 2026' };

const TIERS = [
  {
    name: 'Starter',
    price: 'AED 349/mo',
    blurb: 'For small teams getting core HR in order.',
    features: ['Up to 25 employees', 'Employee directory & documents', 'Leave & attendance', 'Basic reports'],
    current: false,
  },
  {
    name: 'Growth',
    price: 'AED 949/mo',
    blurb: 'Full HR, hiring and performance in one place.',
    features: ['Up to 150 employees', 'Everything in Starter', 'Payroll & WPS', 'Recruitment & ATS', 'Multi-level approvals', 'HR Assistant (Beta)'],
    current: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    blurb: 'Advanced compliance and dedicated support.',
    features: ['Unlimited employees', 'Everything in Growth', 'Custom approval chains', 'Priority support & SLA', 'Dedicated onboarding'],
    current: false,
  },
];

export default function PlansBilling() {
  const [confirmation, setConfirmation] = useState('');
  const seatPct = Math.round((CURRENT_PLAN.seatsUsed / CURRENT_PLAN.seatsTotal) * 100);

  return (
    <div className="space-y-6">
      <PageHeader title="Plans & Billing" subtitle="Manage your workspace's subscription and seat usage." />

      <Panel title="Current plan" bodyClassName="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-[24px] font-medium text-ink-900">{CURRENT_PLAN.name}</span>
              <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-700 ring-1 ring-inset ring-gold-200">
                Active
              </span>
            </div>
            <p className="mt-1 text-[13px] text-gray-500">Renews on {CURRENT_PLAN.renewsOn}</p>
          </div>
          <div className="w-full sm:w-64">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-gray-500">Seats used</span>
              <span className="font-medium text-ink-900 tabular">{CURRENT_PLAN.seatsUsed} / {CURRENT_PLAN.seatsTotal}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ivory-200">
              <div className="h-full rounded-full bg-gold-500" style={{ width: `${seatPct}%` }} />
            </div>
          </div>
        </div>
      </Panel>

      {confirmation && (
        <div className="rounded-md border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-800">{confirmation}</div>
      )}

      <div>
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-gray-500">Compare plans</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-xl border bg-white p-6 shadow-premium-sm ${
                tier.current ? 'border-gold-400 ring-1 ring-gold-200' : 'border-ivory-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-ink-900">{tier.name}</span>
                {tier.current && <span className="text-[11px] font-semibold uppercase tracking-wide text-gold-600">Current</span>}
              </div>
              <p className="mt-1 font-display text-[26px] font-medium text-ink-900">{tier.price}</p>
              <p className="mt-2 text-[13px] text-gray-500">{tier.blurb}</p>
              <ul className="mt-4 flex-1 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[13px] text-gray-700">
                    <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={tier.current ? 'outline' : 'primary'}
                className="mt-6 w-full justify-center"
                disabled={tier.current}
                onClick={() => setConfirmation(`Thanks — our team will reach out about moving to ${tier.name}.`)}
              >
                {tier.current ? 'Current plan' : tier.name === 'Enterprise' ? 'Contact sales' : 'Upgrade'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
