import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { store } from '../store';
import type { Tenant } from '../api/types';
import type { User } from '../auth/authSlice';

export const tenantFor = (over: Partial<Tenant> = {}): Tenant => ({
  id: 't1', name: 'acme', displayName: 'Acme', countryCode: 'DE', defaultLocale: 'de-DE',
  defaultTimezone: 'Europe/Berlin', baseCurrency: 'EUR', weekStartsOn: 1, weekendDays: [6, 0], fiscalYearStartMonth: 1, ...over,
});

export const userFor = (role: User['role'], over: Partial<User> = {}): User => ({
  id: 'u1', email: `${role}@acme.test`, name: `Test ${role}`, role, tenantId: 't1', ...over,
});

/** Puts the shared store into a signed-in state without going through the network. */
export function signIn(user: User, tenant: Tenant = tenantFor()) {
  store.dispatch({ type: 'auth/login/fulfilled', payload: { user, tenant } });
}

export function signOut() {
  store.dispatch({ type: 'auth/logout/fulfilled' });
}

export function renderWithProviders(ui: React.ReactElement, route = '/') {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  );
}
