# HRMS (Human Resource Management System)

A modern, modular React JS HRMS web application inspired by Lattice, GreytHR, and Breezy HR. This application combines recruitment, core HR, and performance management features in a single platform.

## Features

### 1. Recruitment Module (Breezy HR-like)
- Multi-stage applicant tracking system (ATS)
- Job posting dashboard
- Candidate profile with notes, ratings, and resume uploads
- Interview scheduling with calendar sync
- Team collaboration and feedback

### 2. Core HR Module (GreytHR-like)
- Employee self-service portal with profile editing
- Leave and attendance management (calendar view, request/approval)
- Payroll processing system with payslip generation
- Onboarding workflow with checklist and document upload
- Expense claim submission and tracking

### 3. Engagement & Performance Module (Lattice-like)
- Performance review system (self, manager, peer reviews)
- Real-time feedback and public praise system
- Goal and OKR tracking dashboard (with alignment tree)
- 1-on-1 meeting agenda builder
- Pulse survey creation and analytics

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **UI Framework**: Tailwind CSS
- **Authentication**: JWT-based with role-based access control
- **API Mock**: MSW (Mock Service Worker) & JSON Server
- **Build Tool**: Vite

## Project Structure

- `src/auth/` - Authentication components and logic
- `src/recruitment/` - Recruitment module features
- `src/hrms/` - Core HR module features
- `src/performance/` - Performance management module features
- `src/components/` - Shared components
- `src/store/` - Redux store configuration and hooks
- `src/mocks/` - Mock API implementation

## Getting Started

### Prerequisites

- Node.js 18.x or newer
- npm 10.x or newer

### Installation

```bash
# Clone this repository (or download the zip)
git clone https://github.com/yourusername/hrms-platform.git

# Navigate to the project directory
cd hrms-platform

# Install dependencies
npm install
```

### Running the development server

```bash
npm run dev
```

### Building for production

```bash
npm run build
```

## Demo Accounts

The application comes with pre-configured mock users:

| Role     | Email               | Password    |
|----------|---------------------|-------------|
| Admin    | admin@hrms.com      | admin123    |
| HR       | hr@hrms.com         | hr123       |
| Employee | employee@hrms.com   | employee123 |

## License

MIT
