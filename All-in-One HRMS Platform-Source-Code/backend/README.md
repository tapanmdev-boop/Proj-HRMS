# HRMS Backend

A modern, scalable, and secure backend for a Human Resource Management System (HRMS) built with NestJS, Prisma, PostgreSQL, and more.

## Tech Stack

- **Backend**: Node.js (TypeScript)
- **Framework**: NestJS
- **ORM**: Prisma (PostgreSQL database)
- **API**: REST with Swagger documentation (GraphQL-ready)
- **Database**: PostgreSQL
- **Caching**: Redis (for performance and sessions)
- **File Storage**: AWS S3 / MinIO (for employee documents, payslips)
- **Authentication**: JWT for user auth, OAuth 2.0 for SSO (Google/Microsoft)
- **Job Queue**: BullMQ with Redis for background tasks

## Features

- Role-based access control (Admin, HR, Manager, Employee)
- Multi-tenancy support for SaaS architecture
- Complete employee management system
- Attendance tracking and leave management
- Payroll processing and document storage
- Notifications system with SendGrid integration
- Analytics dashboards for management
- Swagger API documentation

## Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- PostgreSQL
- Redis

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd hrms-backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Run database migrations:

```bash
npm run prisma:migrate
```

## Development

Start the development server:

```bash
npm run start:dev
```

## Docker Deployment

1. Build and run using Docker Compose:

```bash
docker-compose up -d
```

2. Access the application:
   - API: http://localhost:3000
   - Swagger Documentation: http://localhost:3000/api/docs
   - Prisma Studio: http://localhost:5555 (when running `npm run prisma:studio`)

## Project Structure

```
src/
├── app.module.ts           # Main application module
├── main.ts                 # Application entry point
├── config/                 # Configuration files
├── prisma/                 # Prisma ORM setup
├── common/                 # Shared code (guards, decorators, etc.)
├── auth/                   # Authentication module
├── users/                  # User management module
├── employees/              # Employee management module
├── attendance/             # Attendance tracking module
├── leave/                  # Leave management module
├── payroll/                # Payroll processing module
├── documents/              # Document management module
├── notifications/          # Notification system module
└── admin/                  # Admin dashboard module
```

## API Documentation

Access Swagger documentation at: http://localhost:3000/api/docs

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## License

[MIT Licensed](LICENSE)
