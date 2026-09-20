import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, selectCurrentUser } from '../../auth/authSlice';
import { Icon } from './icons';
import { navigationFor, findNavEntry } from './navigation';
import NotificationCenter from '../ui/NotificationCenter';
import AIAssistant from '../ai/AIAssistant';

const COLLAPSE_KEY = 'hrms.sidebarCollapsed';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  hr: 'People Operations',
  manager: 'Manager',
  employee: 'Employee',
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

export default function MainLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(readCollapsed);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Collapsing only applies on desktop; the mobile drawer is always full width.
  const collapsed = isCollapsed && !isMobileMenuOpen;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsUserMenuOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isUserMenuOpen]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable — keep in-memory state */
      }
      return next;
    });
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  const groups = navigationFor(user?.role);
  const current = findNavEntry(location.pathname);
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex h-screen bg-ivory-100 text-ink-900">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 mobile-overlay md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-ink-900 text-ivory-50 sidebar-transition md:relative md:translate-x-0 ${
          collapsed ? 'md:w-[72px]' : 'md:w-[264px]'
        } w-[280px] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Primary"
      >
        {/* Wordmark */}
        <div className={`flex h-25 shrink-0 items-center border-b border-ink-800 px-0`}>
          <div className={`overflow-hidden w-full ${collapsed ? 'h-8 w-8' : 'px-2 py-0'}`}>
            <img
              src="/Meridian-HRMS-logo.png"
              alt="Meridian HRMS"
              className={collapsed ? 'h-8 w-[105px] max-w-none object-cover object-left' : 'h-20 w-[195px] object-contain mx-auto'}
            />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="ml-auto rounded-md p-1.5 text-ivory-50/50 hover:bg-ink-800 hover:text-ivory-50 md:hidden"
            aria-label="Close menu"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Groups */}
        <nav className={`sidebar-scroll flex-1 overflow-y-auto py-4 ${collapsed ? 'px-3' : 'px-3'}`}>
          {groups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex === 0 ? '' : 'mt-5'}>
              {collapsed ? (
                groupIndex > 0 && <div className="mx-2 mb-3 h-px bg-ink-800" aria-hidden="true" />
              ) : (
                <div className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ivory-50/35">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `group relative flex h-9 items-center rounded-md text-[13.5px] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 ${
                          collapsed ? 'justify-center' : 'px-3'
                        } ${
                          isActive
                            ? 'bg-ink-800 font-medium text-ivory-50'
                            : 'font-normal text-ivory-50/60 hover:bg-ink-800/60 hover:text-ivory-50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-gold-500" aria-hidden="true" />
                          )}
                          <Icon
                            name={item.icon}
                            className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-gold-400' : 'text-ivory-50/45 group-hover:text-ivory-50/80'}`}
                          />
                          {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className={`hidden shrink-0 border-t border-ink-800 px-3 py-2 md:block`}>
          <button
            onClick={toggleCollapsed}
            className={`flex h-8 w-full items-center rounded-md text-[12.5px] text-ivory-50/45 transition-colors hover:bg-ink-800/60 hover:text-ivory-50 ${
              collapsed ? 'justify-center' : 'px-3'
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={collapsed ? 'expand' : 'collapse'} className="h-4 w-4" />
            {!collapsed && <span className="ml-3">Collapse</span>}
          </button>
        </div>

        {/* Account */}
        {user && (
          <div ref={userMenuRef} className="relative shrink-0 border-t border-ink-800 p-3">
            {isUserMenuOpen && (
              <div
                className={`absolute bottom-full z-40 mb-2 overflow-hidden rounded-lg border border-ink-700 bg-ink-800 py-1 shadow-premium-lg ${
                  collapsed ? 'left-3 w-56' : 'inset-x-3'
                }`}
                role="menu"
              >
                <div className="border-b border-ink-700 px-3 py-2.5">
                  <div className="truncate text-[13px] font-medium text-ivory-50">{user.name}</div>
                  <div className="truncate text-[12px] text-ivory-50/50">{user.email}</div>
                </div>
                <button
                  className="flex w-full items-center px-3 py-2 text-left text-[13px] text-ivory-50/75 hover:bg-ink-700 hover:text-ivory-50"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Icon name="userCircle" className="mr-2.5 h-4 w-4" />
                  My profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-3 py-2 text-left text-[13px] text-ivory-50/75 hover:bg-ink-700 hover:text-ivory-50"
                  role="menuitem"
                >
                  <Icon name="logout" className="mr-2.5 h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
            <button
              onClick={() => setIsUserMenuOpen((open) => !open)}
              className={`flex w-full items-center rounded-md p-1.5 text-left transition-colors hover:bg-ink-800/60 ${
                collapsed ? 'justify-center' : ''
              }`}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              title={collapsed ? user.name : undefined}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-[12px] font-semibold text-gold-300 ring-1 ring-gold-500/40">
                {initialsOf(user.name)}
              </div>
              {!collapsed && (
                <>
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ivory-50">{user.name}</div>
                    <div className="truncate text-[11.5px] text-ivory-50/45">{ROLE_LABELS[user.role] ?? user.role}</div>
                  </div>
                  <Icon name="chevronUpDown" className="h-4 w-4 shrink-0 text-ivory-50/35" />
                </>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* ── Workspace ───────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-ivory-300 bg-ivory-50/90 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="-ml-1 mr-3 rounded-md p-2 text-gray-600 hover:bg-ivory-200 hover:text-ink-900 md:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-2 text-[13.5px]">
                {current ? (
                  <>
                    <li className="hidden truncate text-gray-500 sm:block">{current.group.label}</li>
                    <li className="hidden text-gray-300 sm:block" aria-hidden="true">/</li>
                    <li className="truncate font-medium text-ink-900" aria-current="page">{current.item.label}</li>
                  </>
                ) : (
                  <li className="font-medium text-ink-900">Home</li>
                )}
              </ol>
            </nav>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <span className="hidden text-[13px] text-gray-500 lg:block">{today}</span>
            <div className="hidden h-5 w-px bg-ivory-300 lg:block" aria-hidden="true" />
            <NotificationCenter />
          </div>
        </header>

        <main className="custom-scrollbar flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
            <div key={location.pathname} className="fade-in slide-up">
              <Outlet />
            </div>

            <footer className="mt-16 flex flex-col gap-2 border-t border-ivory-300 pt-5 text-[12px] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} Meridian People Suite</span>
              <span className="tabular">v1.2.0</span>
            </footer>
          </div>
        </main>
      </div>

      <AIAssistant />
    </div>
  );
}
