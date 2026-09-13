import { useState } from 'react';
import { mockData } from '../mocks/mockData';

// Types for performance module
export interface PerformanceReview {
  id: number;
  type: string;
  status: string;
  dueDate: string;
  completionPercentage: number;
  reviewers: string[];
  description: string;
}

export interface KeyResult {
  id: number;
  title: string;
  progress: number;
}

export interface Goal {
  id: number;
  title: string;
  category: string;
  progress: number;
  dueDate: string;
  status: string;
  description: string;
  keyResults: KeyResult[];
}

export interface Feedback {
  id: number;
  from: string;
  avatar: string;
  avatarColor: string;
  message: string;
  date: string;
  type: string;
}

export interface FeedbackRequest {
  id: number;
  for: string;
  avatar: string;
  avatarColor: string;
  dueDate: string;
  project: string;
  status: string;
}

// These hooks used to call fetch('/api/...'). That only ever worked in `npm
// run dev`, where MSW (src/mocks/browser.ts) intercepts those exact paths —
// in the production build MSW never starts (see src/main.tsx), so the fetch
// hit the real network, 404'd, and these pages permanently showed an error/
// empty state. There's no real backend yet for this module (deferred per the
// GreytHR-replacement plan), so read the same mock dataset MSW was using
// directly, as genuinely mutable local state instead of network calls.

// Hook for performance reviews
export function usePerformanceReviews() {
  const [reviews, setReviews] = useState<PerformanceReview[]>(mockData.performance_reviews);
  return { reviews, setReviews, loading: false, error: null as Error | null };
}

// Hook for goals
export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>(mockData.goals);
  return { goals, setGoals, loading: false, error: null as Error | null };
}

// Hook for feedback
export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>(mockData.feedback);
  return { feedback, setFeedback, loading: false, error: null as Error | null };
}

// Hook for feedback requests
export function useFeedbackRequests() {
  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>(mockData.feedback_requests);
  return { feedbackRequests, setFeedbackRequests, loading: false, error: null as Error | null };
}
