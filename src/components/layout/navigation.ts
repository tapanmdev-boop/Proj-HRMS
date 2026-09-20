import type { User } from '../../auth/authSlice';
import type { IconName } from './icons';

export type Role = User['role'];

export interface NavItem {
  label: string;
  to: string;
  icon: IconName;
  /** Match the path exactly (module landing pages). */
  end?: boolean;
  /** Who sees this link. Omitted = everyone. Hides navigation only; it is not access control. */
  roles?: Role[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const PEOPLE_OPS: Role[] = ['admin', 'hr'];
const LEADERS: Role[] = ['admin', 'hr', 'manager'];

// Grouped by the job people come to do, not by which module a screen was built
// in. Route paths are unchanged.
export const navigation: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Home', to: '/hrms', icon: 'home', end: true }],
  },
  {
    label: 'People',
    items: [
      { label: 'Directory', to: '/hrms/employees', icon: 'users' },
      { label: 'My Profile', to: '/hrms/profile', icon: 'userCircle' },
      { label: 'Org Chart', to: '/hrms/org-chart', icon: 'sitemap' },
      { label: 'Onboarding', to: '/hrms/onboarding', icon: 'userPlus', roles: LEADERS },
      { label: 'Offboarding', to: '/hrms/offboarding', icon: 'userMinus', roles: PEOPLE_OPS },
      { label: 'Documents', to: '/hrms/documents', icon: 'document' },
    ],
  },
  {
    label: 'Time & Attendance',
    items: [
      { label: 'Attendance', to: '/hrms/attendance', icon: 'clock' },
      { label: 'Leave', to: '/hrms/leaves', icon: 'calendar' },
    ],
  },
  {
    label: 'Pay & Compensation',
    items: [
      { label: 'Payroll & WPS', to: '/hrms/payroll', icon: 'banknotes', roles: PEOPLE_OPS },
      { label: 'Expenses', to: '/hrms/expenses', icon: 'receipt' },
    ],
  },
  {
    label: 'Talent Acquisition',
    items: [
      { label: 'Hiring Overview', to: '/recruitment', icon: 'briefcase', end: true, roles: LEADERS },
      { label: 'Open Roles', to: '/recruitment/job-postings', icon: 'megaphone', roles: LEADERS },
      { label: 'Candidates', to: '/recruitment/candidates', icon: 'identification', roles: LEADERS },
      { label: 'Interviews', to: '/recruitment/interviews', icon: 'chats', roles: LEADERS },
      { label: 'Resume Parser', to: '/recruitment/resume-parser', icon: 'docSearch', roles: PEOPLE_OPS },
    ],
  },
  {
    label: 'Performance & Growth',
    items: [
      { label: 'Performance Overview', to: '/performance', icon: 'trendingUp', end: true },
      { label: 'Review Cycles', to: '/performance/reviews', icon: 'clipboardCheck' },
      { label: 'Goals & OKRs', to: '/performance/goals', icon: 'flag' },
      { label: 'Feedback & Recognition', to: '/performance/feedback', icon: 'star' },
      { label: '1:1s', to: '/performance/1on1', icon: 'chat' },
      { label: 'Engagement Surveys', to: '/performance/surveys', icon: 'clipboardList' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'HR Reports', to: '/hrms/reports', icon: 'reportChart', roles: PEOPLE_OPS },
      { label: 'Hiring Analytics', to: '/recruitment/analytics', icon: 'chartBar', roles: LEADERS },
      { label: 'Performance Analytics', to: '/performance/analytics', icon: 'presentation', roles: LEADERS },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Plans & Billing', to: '/hrms/settings/plans', icon: 'creditCard', roles: ['admin'] },
    ],
  },
];

/** Groups and items visible to a role. With no user loaded, everything is shown. */
export function navigationFor(role?: Role): NavGroup[] {
  if (!role) return navigation;
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

/** The nav entry that owns a pathname — exact match first, then the longest prefix. */
export function findNavEntry(pathname: string): { group: NavGroup; item: NavItem } | undefined {
  const path = pathname.replace(/\/+$/, '') || '/';
  let best: { group: NavGroup; item: NavItem } | undefined;

  for (const group of navigation) {
    for (const item of group.items) {
      if (path === item.to) return { group, item };
      if (!item.end && path.startsWith(`${item.to}/`)) {
        if (!best || item.to.length > best.item.to.length) best = { group, item };
      }
    }
  }
  return best;
}
