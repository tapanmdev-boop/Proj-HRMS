import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy-loaded components
const Dashboard = lazy(() => import('./index'));
const JobPostings = lazy(() => import('./JobPostings'));
const CandidateTracking = lazy(() => import('./CandidateTracking'));
const InterviewScheduler = lazy(() => import('./InterviewScheduler'));
const ResumeParser = lazy(() => import('./ResumeParser'));
const Analytics = lazy(() => import('./Analytics'));

// Breezy HR Features:
// - Job Posting & Career Site
// - Customizable Hiring Pipelines
// - Candidate Management
// - Collaborative Review & Scoring
// - Automated Emails & Communication
// - Video Interviews
// - Resume Parsing & Candidate Profiles
// - Recruitment Analytics

export default function RecruitmentRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="job-postings" element={<JobPostings />} />
      <Route path="candidates" element={<CandidateTracking />} />
      <Route path="interviews" element={<InterviewScheduler />} />
      <Route path="resume-parser" element={<ResumeParser />} />
      <Route path="analytics" element={<Analytics />} />
    </Routes>
  );
}
