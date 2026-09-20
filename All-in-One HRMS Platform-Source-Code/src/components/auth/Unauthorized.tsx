import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory-100 px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-600">Error 403</p>
      <div className="mx-auto my-6 h-px w-12 bg-gold-500" aria-hidden="true" />
      <h1 className="font-display text-[36px] font-medium leading-tight tracking-[-0.02em] text-ink-900">
        This page isn't available to you
      </h1>
      <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-gray-500">
        Your role doesn't include access to this area. If you believe that's a mistake, ask your People Operations administrator.
      </p>
      <Link
        to="/hrms"
        className="mt-8 inline-flex h-10 items-center rounded-btn bg-ink-900 px-5 text-[14px] font-medium text-ivory-50 transition-colors hover:bg-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100"
      >
        Return home
      </Link>
    </div>
  );
}
