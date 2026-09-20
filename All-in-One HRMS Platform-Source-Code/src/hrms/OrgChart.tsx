import { useState } from 'react';
import { PageHeader } from '../components/ui/Dashboard';
import { Badge } from '../components/ui/Notifications';

interface OrgPerson {
  id: string;
  name: string;
  title: string;
  department: string;
  reportsTo: string | null;
  avatar: string;
}

// A small illustrative reporting hierarchy — kept local to this page (not
// mockData.ts, which has no `reportsTo` field on its employee records).
const ORG_PEOPLE: OrgPerson[] = [
  { id: '1', name: 'Robert Wilson', title: 'HR Manager', department: 'Human Resources', reportsTo: null, avatar: 'RW' },
  { id: '2', name: 'David Johnson', title: 'Product Manager', department: 'Product', reportsTo: '1', avatar: 'DJ' },
  { id: '3', name: 'John Smith', title: 'Senior Developer', department: 'Engineering', reportsTo: '2', avatar: 'JS' },
  { id: '4', name: 'James Brown', title: 'DevOps Engineer', department: 'Engineering', reportsTo: '2', avatar: 'JB' },
  { id: '5', name: 'Maria Garcia', title: 'UX Designer', department: 'Design', reportsTo: '2', avatar: 'MG' },
  { id: '6', name: 'Linda Chen', title: 'Marketing Specialist', department: 'Marketing', reportsTo: '1', avatar: 'LC' },
  { id: '7', name: 'Sarah Thompson', title: 'Financial Analyst', department: 'Finance', reportsTo: '1', avatar: 'ST' },
  { id: '8', name: 'Emily Davis', title: 'Customer Success Rep', department: 'Customer Support', reportsTo: '6', avatar: 'ED' },
];

function childrenOf(id: string | null) {
  return ORG_PEOPLE.filter(p => p.reportsTo === id);
}

function OrgNode({ person, depth }: { person: OrgPerson; depth: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const kids = childrenOf(person.id);

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-ivory-300 pl-6' : ''}>
      <div className="flex items-center gap-3 rounded-xl border border-ivory-300 bg-white p-4 shadow-premium-sm">
        {kids.length > 0 && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-ivory-100 hover:text-ink-900"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '+' : '–'}
          </button>
        )}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory-200 text-[12.5px] font-semibold text-ink-700 ring-1 ring-inset ring-ivory-400">
          {person.avatar}
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-ink-900">{person.name}</div>
          <div className="text-[12.5px] text-gray-500">{person.title}</div>
        </div>
        <div className="ml-auto">
          <Badge variant="secondary" size="sm">{person.department}</Badge>
        </div>
        {kids.length > 0 && (
          <span className="ml-2 shrink-0 text-[11.5px] text-gray-400 tabular">{kids.length} direct report{kids.length === 1 ? '' : 's'}</span>
        )}
      </div>
      {!collapsed && kids.length > 0 && (
        <div className="mt-3 space-y-3">
          {kids.map(child => <OrgNode key={child.id} person={child} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const roots = childrenOf(null);
  return (
    <div>
      <PageHeader title="Org Chart" subtitle="Reporting lines across the organisation." />
      <div className="space-y-3">
        {roots.map(root => <OrgNode key={root.id} person={root} depth={0} />)}
      </div>
    </div>
  );
}
