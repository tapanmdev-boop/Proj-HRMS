import { afterEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { renderWithProviders, signIn, signOut, userFor } from '../../test/helpers';
import { store } from '../../store';

const app = (
  <Routes>
    <Route path="/auth/login" element={<div>LOGIN PAGE</div>} />
    <Route path="/unauthorized" element={<div>UNAUTHORIZED PAGE</div>} />
    <Route element={<ProtectedRoute />}>
      <Route path="/hrms/employees" element={<div>DIRECTORY</div>} />
      <Route path="/hrms/payroll" element={<div>PAYROLL</div>} />
      <Route path="/hrms/settings/plans" element={<div>BILLING</div>} />
      <Route path="/recruitment/candidates" element={<div>CANDIDATES</div>} />
    </Route>
  </Routes>
);

describe('ProtectedRoute', () => {
  afterEach(() => signOut());

  it('waits while a stored session is being restored, instead of flashing the login page', () => {
    expect(store.getState().auth.status).toBe('initializing');
    renderWithProviders(app, '/hrms/employees');
    expect(screen.getByRole('status', { name: /loading your session/i })).toBeInTheDocument();
    expect(screen.queryByText('LOGIN PAGE')).not.toBeInTheDocument();
  });

  it('sends anonymous visitors to sign in', () => {
    signOut();
    renderWithProviders(app, '/hrms/employees');
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
  });

  it('lets any signed-in user open the directory', () => {
    signIn(userFor('employee'));
    renderWithProviders(app, '/hrms/employees');
    expect(screen.getByText('DIRECTORY')).toBeInTheDocument();
  });

  it.each([
    ['employee', '/hrms/payroll', false],
    ['manager', '/hrms/payroll', false],
    ['hr', '/hrms/payroll', true],
    ['admin', '/hrms/payroll', true],
    ['employee', '/recruitment/candidates', false],
    ['manager', '/recruitment/candidates', true],
    ['hr', '/hrms/settings/plans', false],
    ['admin', '/hrms/settings/plans', true],
  ] as const)('%s opening %s is allowed: %s', (role, path, allowed) => {
    signIn(userFor(role));
    renderWithProviders(app, path);
    if (allowed) expect(screen.queryByText('UNAUTHORIZED PAGE')).not.toBeInTheDocument();
    else expect(screen.getByText('UNAUTHORIZED PAGE')).toBeInTheDocument();
  });
});
