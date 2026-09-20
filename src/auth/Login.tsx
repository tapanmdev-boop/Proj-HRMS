import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuthError, login, rememberedTenant, selectAuthError, selectAuthLoading } from './authSlice';


const inputClass =
  'block h-11 w-full rounded-lg border border-ivory-400 bg-white px-3.5 text-[14px] text-ink-900 placeholder:text-gray-400 transition-colors hover:border-gray-400 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-100';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState(rememberedTenant);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectAuthLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resultAction = await dispatch(login({ tenant: organization, email, password }));
    if (login.fulfilled.match(resultAction)) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/auth/login' ? from : '/hrms', { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen bg-ivory-100">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] max-w-[640px] flex-col justify-between items-center overflow-hidden bg-ink-900 p-12 text-ivory-50 lg:flex">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden="true">
          <defs>
            <pattern id="login-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M56 0H0V56" fill="none" stroke="#D9C29A" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
        </svg>

        <div className="relative inline-flex w-fit px-2 py-1">
          <div>
            <img src={`${import.meta.env.BASE_URL}Meridian-HRMS-logo.png`} alt="Meridian HRMS" className="h-25 w-auto object-contain" style={{maxHeight:"150px"}} />
          <div className="my-5 text-center w-full flex flex-col justify-center items-center">
            <div className="mb-6 h-px w-12 bg-gold-500" aria-hidden="true" />
          <h2 className="max-w-md font-display text-[44px] font-normal leading-[1.08] tracking-[-0.025em]">
            Every person, every payroll, <em className="font-normal italic text-gold-300">in order.</em>
          </h2>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ivory-50/55">
            Records, time, pay and performance for your whole organisation — kept in one considered place.
          </p>
          </div>
          </div>
        </div>

        <div className="relative flex flex-wrap gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.12em] text-ivory-50/35 justify-center">
          <span>Any country</span>
          <span>Any currency</span>
          <span>Payroll</span>
          <span>Performance</span>
          <span>Hiring</span>
        </div>
      </aside>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-10 flex items-center lg:hidden">
            <img src={`${import.meta.env.BASE_URL}Meridian-HRMS-logo.png`} alt="Meridian HRMS" className="h-10 w-auto object-contain" />
          </div>

          <h1 className="font-display text-[32px] font-medium leading-tight tracking-[-0.02em] text-ink-900">Welcome back</h1>
          <p className="mt-2 text-[14.5px] text-gray-500">Sign in to continue to your workspace.</p>

          <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border-l-[3px] border-danger-500 bg-white px-3.5 py-2.5 text-[13.5px] text-danger-700 ring-1 ring-inset ring-ivory-300">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="organization" className="mb-1.5 block text-[13px] font-medium text-gray-700">
                Organization
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                autoComplete="organization"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="your-company"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-gray-700">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-ink-900 text-[14px] font-medium text-ivory-50 transition-colors hover:bg-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-10 border-t border-ivory-300 pt-6 text-[13.5px] text-gray-500">
            New to Meridian?{' '}
            <Link to="/auth/signup" onClick={() => dispatch(clearAuthError())} className="font-medium text-ink-900 underline decoration-gold-500 underline-offset-4 hover:text-gold-700">
              Create your organization
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
