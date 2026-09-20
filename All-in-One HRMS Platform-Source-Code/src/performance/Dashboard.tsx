import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Notifications';
import { PageHeader, Panel, StatLink, Avatar } from '../components/ui/Dashboard';

const okrs = [
  { title: 'Improve customer satisfaction', progress: 75, target: 85, updated: 'Updated 3 days ago' },
  { title: 'Launch new product features', progress: 45, target: 100, updated: 'Updated 1 week ago' },
  { title: 'Reduce support response time', progress: 90, target: 95, updated: 'Updated yesterday' },
];

const upcoming = [
  {
    title: 'Mid-year review',
    detail: 'Self-assessment due in 5 days',
    status: 'Due soon',
    variant: 'warning' as const,
    cta: 'Start review',
    to: '/performance/reviews',
  },
  {
    title: 'Peer feedback',
    detail: '3 requests waiting for you',
    status: 'Pending',
    variant: 'danger' as const,
    cta: 'Respond',
    to: '/performance/feedback',
  },
];

const feedback = [
  {
    initials: 'JD',
    from: 'Jane Doe',
    kind: 'Praise',
    variant: 'success' as const,
    message: 'Great job on the client presentation yesterday. Your preparation really showed.',
    date: '9 June 2025',
  },
  {
    initials: 'TS',
    from: 'Team Supervisor',
    kind: 'Feedback',
    variant: 'info' as const,
    message: 'I appreciate your initiative in resolving the database issue last week.',
    date: '5 June 2025',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Performance & Growth"
        title="Performance overview"
        subtitle="Q2 review cycle closes in 15 days."
        actionButton={
          <Link
            to="/performance/analytics"
            className="inline-flex h-9 items-center rounded-btn border border-ivory-400 bg-white px-4 text-[13.5px] font-medium text-ink-900 shadow-premium-sm transition-colors hover:border-gray-400 hover:bg-ivory-50"
          >
            View analytics
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatLink label="Reviews in progress" value="8" to="/performance/reviews" note="3 due this week" tone="attention" />
        <StatLink label="Feedback received" value="23" to="/performance/feedback" note="+5 this month" tone="positive" />
        <StatLink label="Goal completion" value="67%" to="/performance/goals" note="5 goals completed">
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-ivory-200">
            <div className="h-full rounded-full bg-gold-500" style={{ width: '67%' }} />
          </div>
        </StatLink>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Active OKRs"
          actionLabel="View all"
          actionTo="/performance/goals"
          bodyClassName="px-6 py-5 space-y-6"
          footer={
            <Link to="/performance/goals/new" className="text-[13px] font-medium text-ink-900 hover:text-gold-600">
              + Add OKR
            </Link>
          }
        >
          {okrs.map((okr) => (
            <div key={okr.title}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[14px] font-medium text-ink-900">{okr.title}</span>
                <span className="font-display text-[18px] font-medium text-ink-900 tabular">{okr.progress}%</span>
              </div>
              <div className="relative mt-2.5 h-1 w-full rounded-full bg-ivory-200">
                <div className="h-full rounded-full bg-ink-900" style={{ width: `${okr.progress}%` }} />
                <span
                  className="absolute -top-1 h-3 w-px bg-gold-500"
                  style={{ left: `${okr.target}%` }}
                  title={`Target ${okr.target}%`}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-2 flex justify-between text-[12px] text-gray-500">
                <span>{okr.updated}</span>
                <span className="tabular">Target {okr.target}%</span>
              </div>
            </div>
          ))}
        </Panel>

        <Panel title="Needs your attention" actionLabel="All reviews" actionTo="/performance/reviews">
          <ul className="divide-y divide-ivory-200">
            {upcoming.map((item) => (
              <li key={item.title} className="flex items-center gap-4 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium text-ink-900">{item.title}</span>
                    <Badge variant={item.variant} size="sm">{item.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-gray-500">{item.detail}</p>
                </div>
                <Link
                  to={item.to}
                  className="inline-flex h-8 shrink-0 items-center rounded-btn bg-ink-900 px-3 text-[12.5px] font-medium text-ivory-50 transition-colors hover:bg-ink-800"
                >
                  {item.cta}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Recent feedback"
        actionLabel="View all"
        actionTo="/performance/feedback"
        bodyClassName="grid grid-cols-1 gap-px bg-ivory-200 md:grid-cols-2"
        footer={
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-gray-500">
              <span className="font-medium text-ink-900">5 new</span> items since your last visit
            </span>
            <Link to="/performance/feedback/give" className="font-medium text-ink-900 hover:text-gold-600">
              Give feedback →
            </Link>
          </div>
        }
      >
        {feedback.map((item) => (
          <figure key={item.from} className="bg-white px-6 py-5">
            <blockquote className="border-l-2 border-gold-400 pl-4 font-display text-[17px] leading-relaxed text-ink-900">
              {item.message}
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <Avatar initials={item.initials} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-ink-900">{item.from}</div>
                <div className="text-[12px] text-gray-500">{item.date}</div>
              </div>
              <Badge variant={item.variant} size="sm">{item.kind}</Badge>
              <Link to="/performance/feedback" className="text-[12.5px] font-medium text-gray-500 hover:text-ink-900">
                Reply
              </Link>
            </figcaption>
          </figure>
        ))}
      </Panel>
    </div>
  );
}
