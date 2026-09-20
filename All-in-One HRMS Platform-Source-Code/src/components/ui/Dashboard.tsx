import { Link, useLocation } from 'react-router-dom';
import { findNavEntry } from '../layout/navigation';

interface DashboardCardProps {
  title: string;
  value: string | number;
  /** Legacy fill class (e.g. "bg-blue-100"). Now only tints the small marker dot. */
  bgColor?: string;
  icon?: React.ReactNode;
  change?: {
    value: string;
    positive: boolean;
  };
}

// Literal class names so Tailwind's JIT can see them.
const MARKER_BY_HUE: Record<string, string> = {
  blue: 'bg-info-500',
  sky: 'bg-info-500',
  indigo: 'bg-ink-600',
  purple: 'bg-gold-500',
  violet: 'bg-gold-500',
  green: 'bg-success-500',
  emerald: 'bg-success-500',
  teal: 'bg-success-500',
  yellow: 'bg-warning-500',
  amber: 'bg-warning-500',
  orange: 'bg-warning-500',
  red: 'bg-danger-500',
  rose: 'bg-danger-500',
};

const markerFor = (bgColor?: string) => {
  const hue = bgColor?.match(/bg-([a-z]+)-\d+/)?.[1];
  return (hue && MARKER_BY_HUE[hue]) || 'bg-gold-500';
};

export const DashboardCard = ({ title, value, bgColor, icon, change }: DashboardCardProps) => {
  return (
    <div className="rounded-xl border border-ivory-300 bg-white p-5 shadow-premium-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          <span className={`h-1.5 w-1.5 rounded-full ${markerFor(bgColor)}`} aria-hidden="true" />
          {title}
        </h3>
        {icon && <div className="text-gray-400 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>}
      </div>
      <p className="mt-4 font-display text-[34px] font-medium leading-none tracking-[-0.02em] text-ink-900 tabular">
        {value}
      </p>
      {change && (
        <p className="mt-3 text-[12.5px] text-gray-500">
          <span className={`font-medium tabular ${change.positive ? 'text-success-600' : 'text-danger-600'}`}>
            {change.positive ? '↑' : '↓'} {change.value}
          </span>{' '}
          vs last month
        </p>
      )}
    </div>
  );
};

/** A clickable KPI tile — same look as DashboardCard, but navigates. */
export const StatLink = ({
  label,
  value,
  to,
  note,
  tone = 'muted',
  children,
}: {
  label: string;
  value: string | number;
  to: string;
  note?: string;
  tone?: 'muted' | 'positive' | 'negative' | 'attention';
  children?: React.ReactNode;
}) => {
  const toneClass = {
    muted: 'text-gray-500',
    positive: 'text-success-600',
    negative: 'text-danger-600',
    attention: 'text-warning-700',
  }[tone];

  return (
    <Link
      to={to}
      className="group block rounded-xl border border-ivory-300 bg-white p-5 shadow-premium-sm transition-colors duration-150 hover:border-gold-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gray-500">{label}</span>
        <span className="text-gray-300 transition-colors group-hover:text-gold-500" aria-hidden="true">→</span>
      </div>
      <p className="mt-4 font-display text-[34px] font-medium leading-none tracking-[-0.02em] text-ink-900 tabular">{value}</p>
      {children}
      {note && <p className={`mt-3 text-[12.5px] ${toneClass}`}>{note}</p>}
    </Link>
  );
};

/** Standard white surface with a titled header row. */
export const Panel = ({
  title,
  actionLabel,
  actionTo,
  footer,
  className = '',
  bodyClassName = '',
  children,
}: {
  title: string;
  actionLabel?: string;
  actionTo?: string;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) => (
  <section className={`flex flex-col overflow-hidden rounded-xl border border-ivory-300 bg-white shadow-premium-sm ${className}`}>
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ivory-200 px-6">
      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">{title}</h3>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="text-[13px] font-medium text-gray-500 transition-colors hover:text-ink-900">
          {actionLabel} <span aria-hidden="true">→</span>
        </Link>
      )}
    </header>
    <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    {footer && <footer className="border-t border-ivory-200 bg-ivory-50 px-6 py-3">{footer}</footer>}
  </section>
);

/** Initials avatar in the house style. */
export const Avatar = ({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' }) => (
  <div
    className={`flex shrink-0 items-center justify-center rounded-full bg-ivory-200 font-semibold text-ink-700 ring-1 ring-inset ring-ivory-400 ${
      size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-[12.5px]'
    }`}
  >
    {initials}
  </div>
);

export const DataTable = ({
  columns,
  data,
  actions
}: {
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
  actions?: (row: Record<string, any>) => React.ReactNode;
}) => {
  const headClass = 'h-10 px-5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 whitespace-nowrap';

  return (
    <div className="overflow-x-auto rounded-xl border border-ivory-300 bg-white shadow-premium-sm">
      <table className="min-w-full">
        <thead className="border-b border-ivory-300 bg-ivory-50">
          <tr>
            {columns.map(column => (
              <th key={column.key} className={headClass}>
                {column.label}
              </th>
            ))}
            {actions && <th className={`${headClass} text-right`}>Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-ivory-200">
          {data.map((row, index) => {
            // Generate a more unique key using column values if possible
            const rowKey = row.id || `row-${Object.values(row).join('-')}-${index}`;

            return (
              <tr key={rowKey} className="transition-colors duration-100 hover:bg-ivory-50">
                {columns.map(column => (
                  <td key={column.key} className="px-5 py-3.5 whitespace-nowrap text-[13.5px] text-ink-900 tabular">
                    {row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-5 py-3.5 whitespace-nowrap text-right text-[13.5px]">
                    {actions(row)}
                  </td>
                )}
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-5 py-12 text-center text-[13.5px] text-gray-500"
              >
                Nothing here yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export const PageHeader = ({
  title,
  subtitle,
  eyebrow,
  actionButton
}: {
  title: string;
  subtitle?: string;
  /** Small caps label above the title, e.g. the nav group. */
  eyebrow?: string;
  actionButton?: React.ReactNode;
}) => {
  // Default the eyebrow to the sidebar group that owns this route, so every
  // page carries the same "where am I" label without each page passing it.
  const { pathname } = useLocation();
  const label = eyebrow ?? findNavEntry(pathname)?.group.label;

  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-ivory-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {label && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-600">{label}</p>
        )}
        <h1 className="font-display text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-ink-900 sm:text-[32px]">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[14px] text-gray-500">{subtitle}</p>}
      </div>
      {actionButton && <div className="flex shrink-0 items-center gap-2">{actionButton}</div>}
    </div>
  );
};

export const Breadcrumbs = ({ items }: { items: { label: string; path?: string }[] }) => {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-gray-500">
        <li>
          <Link to="/" className="font-normal text-gray-500 hover:text-ink-900">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`breadcrumb-${item.label}`} className="flex items-center gap-1.5">
            <span className="text-gray-300" aria-hidden="true">/</span>
            {item.path && index < items.length - 1 ? (
              <Link to={item.path} className="font-normal text-gray-500 hover:text-ink-900">{item.label}</Link>
            ) : (
              <span className="font-medium text-ink-900" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
