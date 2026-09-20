import { Link } from 'react-router-dom';
import { Icon } from '../components/layout/icons';

const TIERS = [
  {
    name: 'Starter',
    price: 'AED 349',
    period: '/month',
    blurb: 'For small teams getting core HR in order.',
    features: ['Up to 25 employees', 'Employee directory & documents', 'Leave & attendance', 'Basic reports'],
    highlight: false,
  },
  {
    name: 'Growth',
    price: 'AED 949',
    period: '/month',
    blurb: 'Full HR, hiring and performance in one place.',
    features: [
      'Up to 150 employees',
      'Everything in Starter',
      'Payroll & WPS',
      'Recruitment & ATS',
      'Multi-level approvals',
      'HR Assistant (Beta)',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    blurb: 'Advanced compliance and dedicated support.',
    features: ['Unlimited employees', 'Everything in Growth', 'Custom approval chains', 'Priority support & SLA', 'Dedicated onboarding'],
    highlight: false,
  },
];

const COMPARISON_ROWS: [string, boolean, boolean, boolean][] = [
  ['Employee directory & documents', true, true, true],
  ['Leave & attendance', true, true, true],
  ['Payroll & WPS', false, true, true],
  ['Recruitment & ATS', false, true, true],
  ['Performance reviews & OKRs', false, true, true],
  ['Multi-level approval workflows', false, true, true],
  ['HR Assistant (Beta)', false, true, true],
  ['Custom approval chains', false, false, true],
  ['Priority support & SLA', false, false, true],
];

const FAQ = [
  { q: 'Can I change plans later?', a: 'Yes — upgrade or downgrade at any time from Plans & Billing inside the workspace.' },
  { q: 'Is there a free trial?', a: 'Every plan includes a 14-day trial, no card required.' },
  { q: 'Does pricing include WPS payroll?', a: 'WPS-compliant payroll is included from the Growth plan upward.' },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-ivory-100 text-ink-900">
      <header className="border-b border-ivory-300 bg-ivory-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/pricing" className="flex items-center">
            <img src="/Meridian-HRMS-logo.png" alt="Meridian HRMS" className="h-10 w-auto object-contain" />
          </Link>
          <Link
            to="/auth/login"
            className="inline-flex h-9 items-center rounded-btn bg-ink-900 px-4 text-[13.5px] font-medium text-ivory-50 transition-colors hover:bg-ink-800"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-600">Pricing</p>
          <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.1] tracking-[-0.02em] text-ink-900 sm:text-[48px]">
            Plans built for how HR actually works
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
            One workspace for people, payroll, hiring and performance — pick the plan that matches your headcount.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-xl border bg-white p-7 shadow-premium-sm ${
                tier.highlight ? 'border-gold-400 ring-1 ring-gold-200 md:-translate-y-2' : 'border-ivory-300'
              }`}
            >
              {tier.highlight && (
                <span className="mb-3 w-fit rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-700 ring-1 ring-inset ring-gold-200">
                  Most popular
                </span>
              )}
              <span className="text-[15px] font-semibold text-ink-900">{tier.name}</span>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-[34px] font-medium text-ink-900">{tier.price}</span>
                {tier.period && <span className="text-[13px] text-gray-500">{tier.period}</span>}
              </p>
              <p className="mt-2 text-[13px] text-gray-500">{tier.blurb}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[13px] text-gray-700">
                    <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth/login"
                className={`mt-6 inline-flex h-10 items-center justify-center rounded-btn text-[14px] font-medium transition-colors ${
                  tier.highlight
                    ? 'bg-ink-900 text-ivory-50 hover:bg-ink-800'
                    : 'border border-ivory-400 bg-white text-ink-900 hover:border-gray-400 hover:bg-ivory-50'
                }`}
              >
                {tier.name === 'Enterprise' ? 'Contact sales' : 'Start free trial'}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <h2 className="text-center font-display text-[26px] font-medium text-ink-900">Compare in detail</h2>
          <div className="mt-8 overflow-x-auto rounded-xl border border-ivory-300 bg-white shadow-premium-sm">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-ivory-200 text-left">
                  <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-gray-500">Feature</th>
                  {TIERS.map((t) => (
                    <th key={t.name} className="px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {COMPARISON_ROWS.map(([feature, starter, growth, enterprise]) => (
                  <tr key={feature}>
                    <td className="px-5 py-3 text-[13.5px] text-ink-900">{feature}</td>
                    {[starter, growth, enterprise].map((included, i) => (
                      <td key={i} className="px-5 py-3 text-center">
                        {included ? (
                          <Icon name="check" className="mx-auto h-4 w-4 text-gold-600" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="text-center font-display text-[26px] font-medium text-ink-900">Frequently asked</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-xl border border-ivory-300 bg-white p-5 shadow-premium-sm">
                <summary className="cursor-pointer list-none text-[14px] font-medium text-ink-900 marker:content-none">
                  {item.q}
                </summary>
                <p className="mt-2 text-[13.5px] leading-relaxed text-gray-500">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-ivory-300 py-8 text-center text-[12px] text-gray-400">
        © {new Date().getFullYear()} Meridian People Suite
      </footer>
    </div>
  );
}
