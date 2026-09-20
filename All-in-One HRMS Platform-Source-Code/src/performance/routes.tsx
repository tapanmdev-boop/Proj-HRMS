import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy-loaded components
const Dashboard = lazy(() => import('./Dashboard'));
const Reviews = lazy(() => import('./Reviews'));
const Goals = lazy(() => import('./Goals'));
const Feedback = lazy(() => import('./Feedback'));
const OneOnOne = lazy(() => import('./OneOnOne'));
const Surveys = lazy(() => import('./Surveys'));
const Analytics = lazy(() => import('./Analytics'));

// Lattice Features:
// - Performance Reviews & 360 Feedback
// - Goal & OKR Tracking
// - Continuous Feedback & Praise
// - 1:1 Meeting Agendas
// - Employee Engagement Surveys
// - Performance Analytics & Reporting
// - Customizable Review Cycles

export default function PerformanceRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="reviews" element={<Reviews />} />
      <Route path="goals" element={<Goals />} />
      <Route path="feedback" element={<Feedback />} />
      <Route path="1on1" element={<OneOnOne />} />
      <Route path="surveys" element={<Surveys />} />
      <Route path="analytics" element={<Analytics />} />
    </Routes>
  );
}
