import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuthError, selectAuthError, selectAuthLoading, signup } from './authSlice';
import { browserDefaults, countryOptions, currencyOptions, localeOptions, suggestedCurrency, timezoneOptions } from '../i18n/regions';

const inputClass =
  'block h-11 w-full rounded-lg border border-ivory-400 bg-white px-3.5 text-[14px] text-ink-900 placeholder:text-gray-400 transition-colors hover:border-gray-400 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-100';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

function Field({ id, label, hint, children }: Readonly<{ id: string; label: string; hint?: string; children: React.ReactNode }>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-gray-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[12px] text-gray-500">{hint}</p>}
    </div>
  );
}

export default function SignUp() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectAuthLoading);

  const defaults = useMemo(() => browserDefaults(), []);
  const countries = useMemo(() => countryOptions(), []);
  const currencies = useMemo(() => currencyOptions(), []);
  const timezones = useMemo(() => timezoneOptions(), []);
  const locales = useMemo(() => localeOptions(), []);

  const [organizationName, setOrganizationName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [countryCode, setCountryCode] = useState(countries.some((c) => c.value === defaults.countryCode) ? defaults.countryCode : '');
  const [baseCurrency, setBaseCurrency] = useState(suggestedCurrency(defaults.countryCode) ?? 'USD');
  const [defaultTimezone, setDefaultTimezone] = useState(defaults.timezone);
  const [defaultLocale, setDefaultLocale] = useState(locales.some((l) => l.value === defaults.locale) ? defaults.locale : 'en');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onCountry = (code: string) => {
    setCountryCode(code);
    const hint = suggestedCurrency(code);
    if (hint) setBaseCurrency(hint);
  };

  const onName = (value: string) => {
    setOrganizationName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(
      signup({
        organizationName,
        organizationSlug: slug,
        email,
        password,
        firstName,
        lastName,
        countryCode: countryCode || undefined,
        baseCurrency,
        defaultTimezone,
        defaultLocale,
      }),
    );
    if (signup.fulfilled.match(result)) navigate('/hrms', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-ivory-100 px-6 py-12">
      <main className="w-full max-w-[520px]">
        <img src={`${import.meta.env.BASE_URL}Meridian-HRMS-logo.png`} alt="Meridian HRMS" className="mb-8 h-10 w-auto object-contain" />
        <h1 className="font-display text-[30px] font-medium leading-tight tracking-[-0.02em] text-ink-900">Create your organization</h1>
        <p className="mt-2 text-[14.5px] text-gray-500">Choose where you operate. Currency, language, dates and timezone adapt automatically.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div role="alert" className="rounded-lg border-l-[3px] border-danger-500 bg-white px-3.5 py-2.5 text-[13.5px] text-danger-700 ring-1 ring-inset ring-ivory-300">
              {error}
            </div>
          )}

          <fieldset className="space-y-4">
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Organization</legend>
            <Field id="orgName" label="Organization name">
              <input id="orgName" required maxLength={120} value={organizationName} onChange={(e) => onName(e.target.value)} className={inputClass} placeholder="Acme Corporation" />
            </Field>
            <Field id="orgSlug" label="Sign-in name" hint="Your team enters this on the sign-in page. Lowercase letters, digits and hyphens.">
              <input
                id="orgSlug"
                required
                minLength={3}
                maxLength={40}
                pattern="[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
                className={inputClass}
                placeholder="acme"
                autoCapitalize="none"
                spellCheck={false}
              />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Region</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="country" label="Country">
                <select id="country" value={countryCode} onChange={(e) => onCountry(e.target.value)} className={inputClass}>
                  <option value="">Select a country…</option>
                  {countries.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field id="currency" label="Currency">
                <select id="currency" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} className={inputClass}>
                  {currencies.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field id="timezone" label="Timezone">
                <select id="timezone" value={defaultTimezone} onChange={(e) => setDefaultTimezone(e.target.value)} className={inputClass}>
                  {!timezones.some((z) => z.value === defaultTimezone) && <option value={defaultTimezone}>{defaultTimezone}</option>}
                  {timezones.map((z) => (
                    <option key={z.value} value={z.value}>{z.label}</option>
                  ))}
                </select>
              </Field>
              <Field id="locale" label="Language & formats">
                <select id="locale" value={defaultLocale} onChange={(e) => setDefaultLocale(e.target.value)} className={inputClass}>
                  {locales.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Administrator</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="firstName" label="First name">
                <input id="firstName" required maxLength={100} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
              </Field>
              <Field id="lastName" label="Last name">
                <input id="lastName" required maxLength={100} autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field id="email" label="Work email">
              <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="name@company.com" />
            </Field>
            <Field id="password" label="Password" hint="At least 8 characters.">
              <input id="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            </Field>
          </fieldset>

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-ink-900 text-[14px] font-medium text-ivory-50 transition-colors hover:bg-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Creating…' : 'Create organization'}
          </button>
        </form>

        <p className="mt-8 text-[13.5px] text-gray-500">
          Already have an account?{' '}
          <Link to="/auth/login" onClick={() => dispatch(clearAuthError())} className="font-medium text-ink-900 underline decoration-gold-500 underline-offset-4">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
