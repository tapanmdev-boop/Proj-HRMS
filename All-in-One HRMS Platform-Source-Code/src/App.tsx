import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import './App.css';

// Components
const MainLayout = lazy(() => import('./components/layout/MainLayout'));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute'));
const Unauthorized = lazy(() => import('./components/auth/Unauthorized'));
const Login = lazy(() => import('./auth/Login'));
const Pricing = lazy(() => import('./marketing/Pricing'));

// Module routes
const RecruitmentRoutes = lazy(() => import('./recruitment/routes'));
const HrmsRoutes = lazy(() => import('./hrms/routes'));
const PerformanceRoutes = lazy(() => import('./performance/routes'));

function App() {
  return (
    <Provider store={store}>
      {/* basename mirrors Vite's `base` (vite.config.ts) so the app works when
          served from a subdirectory, e.g. /__-portfolio/hrms/ */}
      <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center bg-ivory-100" role="status" aria-label="Loading">
              <span className="h-5 w-5 animate-spin rounded-full border-[1.5px] border-ivory-400 border-t-ink-900" />
            </div>
          }
        >
          <Routes>
            {/* Auth routes */}
            <Route path="/auth">
              <Route path="login" element={<Login />} />
            </Route>

            {/* Public marketing page — no auth, no MainLayout chrome. */}
            <Route path="/pricing" element={<Pricing />} />

            {/* Reached whenever ProtectedRoute's allowedRoles rejects the
                current user's role — previously a dead end (no route existed
                for it, so the redirect silently fell through to "*"). */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes. allowedRoles is intentionally the full set
                here — coarse route-level access is "any logged-in employee",
                finer per-action gating (who can Edit/Delete/Approve) happens
                inside each page. Tighten per-module here if a whole module
                should ever become role-restricted at the route level. */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee']} />}>
              <Route element={<MainLayout />}>
                <Route path="/hrms/*" element={<HrmsRoutes />} />
                <Route path="/recruitment/*" element={<RecruitmentRoutes />} />
                <Route path="/performance/*" element={<PerformanceRoutes />} />
              </Route>
            </Route>

            {/* Redirect to login if not authenticated */}
            <Route path="/" element={<Navigate to="/auth/login" replace />} />
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </Provider>
  );
}

export default App;
