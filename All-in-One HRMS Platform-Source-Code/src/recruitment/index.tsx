import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Notifications';
import { PageHeader, Panel, StatLink, Avatar } from '../components/ui/Dashboard';

const FILTERS = [
  { id: 'all', label: 'All roles' },
  { id: 'tech', label: 'Technical' },
  { id: 'nontech', label: 'Non-technical' },
];

const applications = [
  {
    initials: 'EJ',
    name: 'Emily Johnson',
    email: 'emily.j@example.com',
    role: 'UI/UX Designer',
    team: 'Design',
    stage: 'Interview',
    variant: 'success' as const,
    applied: '8 Jun 2025',
    ago: '2 days ago',
  },
  {
    initials: 'MR',
    name: 'Michael Roberts',
    email: 'm.roberts@example.com',
    role: 'Full-Stack Developer',
    team: 'Engineering',
    stage: 'Screening',
    variant: 'info' as const,
    applied: '7 Jun 2025',
    ago: '3 days ago',
  },
  {
    initials: 'SW',
    name: 'Sarah Wilson',
    email: 'sarahw@example.com',
    role: 'Product Manager',
    team: 'Product',
    stage: 'Assessment',
    variant: 'warning' as const,
    applied: '5 Jun 2025',
    ago: '5 days ago',
  },
];

const fillRates = [
  { team: 'Engineering', value: 75 },
  { team: 'Marketing', value: 90 },
  { team: 'Design', value: 60 },
  { team: 'Finance', value: 40 },
];

const interviewDays = [
  { when: 'Today', count: 3, detail: '1 final, 2 technical' },
  { when: 'Tomorrow', count: 5, detail: '2 final, 3 screening' },
];

// Recruitment module entry point
export default function Recruitment() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Talent Acquisition"
        title="Hiring overview"
        subtitle="Q2 hiring plan is 68% complete."
        actionButton={
          <div className="inline-flex rounded-lg border border-ivory-400 bg-white p-0.5 shadow-premium-sm" role="tablist">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                role="tab"
                aria-selected={filter === option.id}
                onClick={() => setFilter(option.id)}
                className={`h-8 rounded-md px-3 text-[12.5px] font-medium transition-colors ${
                  filter === option.id ? 'bg-ink-900 text-ivory-50' : 'text-gray-600 hover:text-ink-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatLink label="Open positions" value="12" to="/recruitment/job-postings" note="3 marked urgent" tone="attention" />
        <StatLink label="Applications" value="48" to="/recruitment/candidates" note="+12 this week" tone="positive" />
        <StatLink label="Interviews" value="15" to="/recruitment/interviews" note="5 scheduled today" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          title="Recent applications"
          actionLabel="All candidates"
          actionTo="/recruitment/candidates"
          className="lg:col-span-2"
          footer={
            <div className="flex items-center justify-between text-[13px] text-gray-500">
              <span className="tabular">
                Showing <span className="font-medium text-ink-900">3</span> of <span className="font-medium text-ink-900">48</span>
              </span>
              <div className="flex items-center gap-1">
                {['‹', '1', '2', '3', '›'].map((page) => (
                  <button
                    key={page}
                    className={`h-7 min-w-[28px] rounded-md px-2 text-[12.5px] tabular transition-colors ${
                      page === '1' ? 'bg-ink-900 font-medium text-ivory-50' : 'text-gray-600 hover:bg-ivory-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-ivory-200 text-left">
                  {['Candidate', 'Position', 'Stage', 'Applied', ''].map((heading) => (
                    <th key={heading} className="h-10 whitespace-nowrap px-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {applications.map((candidate) => (
                  <tr key={candidate.email} className="transition-colors hover:bg-ivory-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={candidate.initials} size="sm" />
                        <div>
                          <div className="text-[14px] font-medium text-ink-900">{candidate.name}</div>
                          <div className="text-[12.5px] text-gray-500">{candidate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-[14px] text-ink-900">{candidate.role}</div>
                      <div className="text-[12.5px] text-gray-500">{candidate.team}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={candidate.variant} size="sm" rounded>{candidate.stage}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-[13.5px] text-ink-900 tabular">{candidate.applied}</div>
                      <div className="text-[12px] text-gray-400">{candidate.ago}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link to="/recruitment/candidates" className="text-[13px] font-medium text-gray-500 hover:text-ink-900">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Hiring progress" bodyClassName="px-6 py-5">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-gray-500">Interview pipeline</span>
              <span className="font-display text-[22px] font-medium text-ink-900 tabular">65%</span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ivory-200">
              <div className="h-full rounded-full bg-gold-500" style={{ width: '65%' }} />
            </div>
          </div>

          <div className="section-divider" />

          <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">Fill rate by team</h4>
          <ul className="mt-4 space-y-3.5">
            {fillRates.map((rate) => (
              <li key={rate.team} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[13px] text-gray-600">{rate.team}</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-ivory-200">
                  <div className="h-full rounded-full bg-ink-900" style={{ width: `${rate.value}%` }} />
                </div>
                <span className="w-9 text-right text-[12.5px] font-medium text-ink-900 tabular">{rate.value}%</span>
              </li>
            ))}
          </ul>

          <div className="section-divider" />

          <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">Upcoming interviews</h4>
          <ul className="mt-3 divide-y divide-ivory-200">
            {interviewDays.map((day) => (
              <li key={day.when} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-[14px] font-medium text-ink-900">{day.when}</div>
                  <div className="text-[12.5px] text-gray-500">{day.detail}</div>
                </div>
                <span className="font-display text-[22px] font-medium text-ink-900 tabular">{day.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
