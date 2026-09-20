import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';
import { PageHeader, Panel, StatLink, Avatar } from '../components/ui/Dashboard';

const leaveRequests = [
  { initials: 'JS', name: 'John Smith', type: 'Vacation', variant: 'info' as const, dates: '15 – 19 Jun 2025', days: 5 },
  { initials: 'MG', name: 'Maria Garcia', type: 'Sick leave', variant: 'danger' as const, dates: '12 – 13 Jun 2025', days: 2 },
];

const payrollRuns = [
  { period: 'May 2025', processed: 'Processed 25 May', total: '$243,200.00', headcount: 127 },
  { period: 'April 2025', processed: 'Processed 25 Apr', total: '$240,180.00', headcount: 125 },
];

const retention = [
  { month: 'Jan', value: 97.1 },
  { month: 'Feb', value: 96.4 },
  { month: 'Mar', value: 98.2 },
  { month: 'Apr', value: 97.6 },
  { month: 'May', value: 98.8 },
  { month: 'Jun', value: 98.1 },
];

const events = [
  { month: 'Jun', day: 15, title: 'Team building', time: '09:00 – 17:00' },
  { month: 'Jun', day: 18, title: 'Performance reviews', time: '10:00 – 16:00' },
  { month: 'Jun', day: 22, title: 'Training workshop', time: '13:00 – 15:00' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Scale bars between 95% and 100% so small movements are visible.
  const barHeight = (value: number) => `${Math.max(8, ((value - 95) / 5) * 100)}%`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Organisation at a glance"
        subtitle={today}
        actionButton={
          <>
            <Button variant="outline" onClick={() => navigate('/hrms/reports')}>View reports</Button>
            <Button onClick={() => navigate('/hrms/payroll?tab=run-payroll')}>Run payroll</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatLink label="Headcount" value="127" to="/hrms/employees" note="+5 joined this month" tone="positive" />
        <StatLink label="On leave today" value="7" to="/hrms/leaves" note="3 returning tomorrow" />
        <StatLink label="Awaiting approval" value="12" to="/hrms/leaves" note="5 new today" tone="attention" />
        <StatLink label="Attendance" value="96%" to="/hrms/attendance" note="Target 95%" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Leave requests"
          actionLabel="View all"
          actionTo="/hrms/leaves"
          footer={
            <button
              onClick={() => navigate('/hrms/leaves?action=new')}
              className="text-[13px] font-medium text-ink-900 hover:text-gold-600"
            >
              + New leave request
            </button>
          }
        >
          <ul className="divide-y divide-ivory-200">
            {leaveRequests.map((request) => (
              <li key={request.name} className="flex items-center gap-4 px-6 py-4">
                <Avatar initials={request.initials} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium text-ink-900">{request.name}</span>
                    <Badge variant={request.variant} size="sm">{request.type}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-gray-500 tabular">
                    {request.dates} · {request.days} days
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/hrms/leaves')}>Decline</Button>
                  <Button size="sm" onClick={() => navigate('/hrms/leaves')}>Approve</Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Recent payroll"
          actionLabel="View all"
          actionTo="/hrms/payroll"
          footer={
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-500">
                Next run in <span className="font-medium text-ink-900">5 days</span>
              </span>
              <button
                onClick={() => navigate('/hrms/payroll?tab=run-payroll')}
                className="font-medium text-ink-900 hover:text-gold-600"
              >
                Prepare run →
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-ivory-200 text-left">
                  {['Period', 'Total', 'Status', ''].map((heading) => (
                    <th key={heading} className="h-10 px-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {payrollRuns.map((run) => (
                  <tr key={run.period} className="transition-colors hover:bg-ivory-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-[14px] font-medium text-ink-900">{run.period}</div>
                      <div className="text-[12.5px] text-gray-500">{run.processed}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-[14px] font-medium text-ink-900 tabular">{run.total}</div>
                      <div className="text-[12.5px] text-gray-500 tabular">{run.headcount} employees</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant="success" size="sm" rounded>Processed</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Button variant="ghost-secondary" size="sm" onClick={() => navigate('/hrms/payroll')}>
                        Payslips
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Retention" className="lg:col-span-2" bodyClassName="px-6 pb-6 pt-5">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[30px] font-medium leading-none text-ink-900 tabular">98.1%</span>
            <span className="text-[13px] text-gray-500">12-month rolling, as of June</span>
          </div>
          <div className="mt-8 flex h-44 items-end gap-3 border-b border-ivory-300 sm:gap-6">
            {retention.map((point, index) => {
              const isLatest = index === retention.length - 1;
              return (
                <div key={point.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className={`text-[11.5px] tabular ${isLatest ? 'font-medium text-ink-900' : 'text-gray-400'}`}>
                    {point.value}
                  </span>
                  <div
                    className={`w-full max-w-[44px] rounded-t-[3px] ${isLatest ? 'bg-gold-500' : 'bg-ink-100'}`}
                    style={{ height: barHeight(point.value) }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-3 sm:gap-6">
            {retention.map((point) => (
              <span key={point.month} className="flex-1 text-center text-[11.5px] uppercase tracking-[0.08em] text-gray-400">
                {point.month}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Upcoming" bodyClassName="px-2 py-2">
          <ul>
            {events.map((event) => (
              <li key={event.title} className="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-ivory-50">
                <div className="flex w-11 shrink-0 flex-col items-center border-r border-ivory-300 pr-4">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-600">{event.month}</span>
                  <span className="font-display text-[22px] font-medium leading-tight text-ink-900 tabular">{event.day}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink-900">{event.title}</p>
                  <p className="text-[12.5px] text-gray-500 tabular">{event.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
