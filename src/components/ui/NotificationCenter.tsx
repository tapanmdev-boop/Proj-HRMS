import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../layout/icons';
import { mockData } from '../../mocks/mockData';

interface NotificationItem {
  id: string;
  icon: IconName;
  title: string;
  detail: string;
  to: string;
  time: string;
}

// Built from data already in mockData.ts rather than a separate fabricated
// list, so what shows up here matches what's on the linked pages.
function buildNotifications(): NotificationItem[] {
  const items: NotificationItem[] = [];

  mockData.leave_requests
    .filter((l) => l.status === 'Pending')
    .forEach((l) =>
      items.push({
        id: `leave-${l.id}`,
        icon: 'calendar',
        title: `${l.employeeName} requested leave`,
        detail: `${l.type} · ${l.days} day${l.days === 1 ? '' : 's'}`,
        to: '/hrms/leaves',
        time: l.requestDate,
      })
    );

  mockData.candidates
    .filter((c) => c.status === 'Screening' || c.status === 'Interview')
    .forEach((c) =>
      items.push({
        id: `candidate-${c.id}`,
        icon: 'identification',
        title: `New candidate: ${c.name}`,
        detail: `${c.jobTitle} · ${c.status}`,
        to: '/recruitment/candidates',
        time: c.applied,
      })
    );

  mockData.performance_reviews
    .filter((r) => r.status !== 'Completed')
    .forEach((r) =>
      items.push({
        id: `review-${r.id}`,
        icon: 'clipboardCheck',
        title: `${r.type} due soon`,
        detail: `Due ${new Date(r.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
        to: '/performance/reviews',
        time: r.dueDate,
      })
    );

  return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

function relativeTime(iso: string): string {
  const diffDays = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const items = useMemo(buildNotifications, []);
  const unreadCount = items.filter((i) => !readIds.has(i.id)).length;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 text-gray-500 transition-colors hover:bg-ivory-200 hover:text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="bell" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold-500 ring-2 ring-ivory-50" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-ivory-300 bg-white shadow-premium-lg"
          role="menu"
        >
          <div className="flex items-center justify-between border-b border-ivory-200 px-4 py-3">
            <span className="text-[13px] font-semibold text-ink-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => setReadIds(new Set(items.map((i) => i.id)))}
                className="text-[12px] font-medium text-gray-500 hover:text-ink-900"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="custom-scrollbar max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-[13px] text-gray-500">You're all caught up.</li>
            )}
            {items.map((item) => {
              const isUnread = !readIds.has(item.id);
              return (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    onClick={() => {
                      setReadIds((prev) => new Set(prev).add(item.id));
                      setOpen(false);
                    }}
                    className="flex items-start gap-3 border-b border-ivory-100 px-4 py-3 transition-colors last:border-0 hover:bg-ivory-50"
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isUnread ? 'bg-gold-100 text-gold-700' : 'bg-ivory-100 text-gray-400'
                      }`}
                    >
                      <Icon name={item.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`text-[13px] leading-snug ${isUnread ? 'font-medium text-ink-900' : 'text-gray-600'}`}>
                          {item.title}
                        </span>
                        {isUnread && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-gray-500">{item.detail}</span>
                      <span className="mt-0.5 block text-[11px] text-gray-400 tabular">{relativeTime(item.time)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
