# Performance Module Documentation

## Overview

The Performance module is a key component of the HRMS application that focuses on tracking and managing employee performance, goals, and feedback. It provides a comprehensive suite of tools for performance reviews, goal setting, and feedback collection.

## Components

### Dashboard
The Dashboard provides an overview of all performance metrics including:
- Summary cards showing reviews in progress, feedback received, and goals completion rates
- Active OKRs with progress tracking
- Upcoming reviews with due dates
- Recent feedback received

### Reviews
The Reviews component offers a complete performance review management system:
- Filter reviews by status (All, In Progress, Not Started, Completed)
- View review details including reviewers, description, and timeline
- Track completion percentage for each review
- Action buttons to start or continue reviews

### Goals & OKRs
This component implements goal management functionality:
- Filter goals by category and status
- Add and track key results for each goal
- Visual progress indicators
- Detailed view with key results breakdown
- Support for adding new goals and key results

### Feedback
The Feedback component enables a 360-degree feedback system:
- Tab interface for received feedback, pending requests, and giving feedback
- Filter feedback by type (praise, constructive)
- View and respond to feedback requests
- Give feedback to team members with structured input

## Technical Implementation

### API Integration
All components use React hooks to fetch data from the API:
- `usePerformanceReviews` - Fetches performance review data
- `useGoals` - Fetches goals and OKRs data
- `useFeedback` - Fetches received feedback
- `useFeedbackRequests` - Fetches pending feedback requests

### Routing
The module uses React Router v6 for nested routing:
- `/performance` - Dashboard overview
- `/performance/reviews` - Performance review management
- `/performance/goals` - Goals and OKRs tracking
- `/performance/feedback` - Feedback system

### Mock Data
The module uses MSW (Mock Service Worker) to simulate API interactions with endpoints:
- `/api/performance-reviews` - For review data
- `/api/goals` - For goals data
- `/api/feedback` - For feedback data
- `/api/feedback-requests` - For feedback requests data

## Future Enhancements

1. **Form Validation**: Add robust validation for all input forms
2. **Notifications**: Implement notifications for approaching review deadlines
3. **Report Generation**: Add capability to export performance data as reports
4. **Mobile Optimization**: Further enhance responsive design for mobile devices
5. **Charts & Analytics**: Add data visualizations for performance trends
6. **Integration with Calendar**: Allow users to schedule review meetings
