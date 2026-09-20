import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy-loaded components
const Dashboard = lazy(() => import('./Dashboard'));
const Employees = lazy(() => import('./Employees'));
const LeaveManagement = lazy(() => import('./LeaveManagement'));
const Payroll = lazy(() => import('./Payroll'));
const Attendance = lazy(() => import('./Attendance'));
const Expenses = lazy(() => import('./Expenses'));
const Documents = lazy(() => import('./Documents'));
const Onboarding = lazy(() => import('./Onboarding'));
const Offboarding = lazy(() => import('./Offboarding'));
const Reports = lazy(() => import('./Reports'));
const Profile = lazy(() => import('./Profile'));
const OrgChart = lazy(() => import('./OrgChart'));
const PlansBilling = lazy(() => import('./PlansBilling'));

// GreytHR Features:
// - Employee Database Management
// - Attendance & Leave Management
// - Payroll Processing & Statutory Compliance
// - Expense Claims & Reimbursements
// - Onboarding & Exit Formalities
// - HR Letters & Document Generation
// - HR Reports & Dashboards

export default function HrmsRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="employees" element={<Employees />} />
      <Route path="leaves" element={<LeaveManagement />} />
      <Route path="payroll" element={<Payroll />} />
      <Route path="attendance" element={<Attendance />} />
      <Route path="expenses" element={<Expenses />} />
      <Route path="documents" element={<Documents />} />
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="offboarding" element={<Offboarding />} />
      <Route path="reports" element={<Reports />} />
      <Route path="profile" element={<Profile />} />
      <Route path="org-chart" element={<OrgChart />} />
      <Route path="settings/plans" element={<PlansBilling />} />
    </Routes>
  );
}
