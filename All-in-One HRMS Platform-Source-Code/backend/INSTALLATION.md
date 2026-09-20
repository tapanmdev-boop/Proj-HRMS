# HRMS Backend Installation Guide

Follow these steps to set up the HRMS backend:

## Prerequisites

1. Node.js (v16+)
2. Docker and Docker Compose (for containerized setup)
3. PostgreSQL (if running locally)
4. Redis (if running locally)

## Option 1: Local Development Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Set Up Environment Variables**

   Create a `.env` file in the root directory using the provided `.env` template.

3. **Generate Prisma Client**

   ```bash
   npm run prisma:generate
   ```

4. **Create Database and Run Migrations**

   Make sure PostgreSQL is running, then:

   ```bash
   npm run prisma:migrate
   ```

5. **Seed the Database with Initial Data (Optional)**

   ```bash
   npm run prisma:seed
   ```

6. **Start the Development Server**

   ```bash
   npm run start:dev
   ```

   The server will be available at http://localhost:3000.

## Option 2: Docker Setup

1. **Build and Start the Docker Containers**

   ```bash
   docker-compose up -d
   ```

   This will start:
   - NestJS API (port 3000)
   - PostgreSQL (port 5432)
   - Redis (port 6379)
   - MinIO (ports 9000, 9001)

2. **Initialize the Database (First Run Only)**

   ```bash
   docker-compose exec api npm run prisma:migrate
   ```

3. **Seed the Database (Optional)**

   ```bash
   docker-compose exec api npm run prisma:seed
   ```

## Testing the API

1. **Access Swagger Documentation**

   Open http://localhost:3000/api/docs in your browser to view and interact with the API documentation.

2. **Create Initial Admin User**

   ```bash
   curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin123","firstName":"Admin","lastName":"User","role":"ADMIN"}'
   ```

## Common Issues and Solutions

1. **Database Connection Issues**

   Check your PostgreSQL connection settings in the `.env` file and ensure the database is running.

2. **Redis Connection Issues**

   Verify Redis connection settings and ensure Redis is running.

3. **File Storage Issues**

   For S3 or MinIO issues, check your credentials and bucket configuration in the `.env` file.

4. **Permission Denied for Docker Volume Mounts**

   If using Docker and getting permission errors, try:

   ```bash
   sudo chown -R $(whoami):$(whoami) ./
   ```

## Helpful Commands

- **View API logs**:
  ```bash
  docker-compose logs -f api
  ```

- **Access Prisma Studio** (database management UI):
  ```bash
  npm run prisma:studio
  ```
  
- **Run Tests**:
  ```bash
  npm test
  ```

- **Lint Code**:
  ```bash
  npm run lint
  ```

## Next Steps

After installation, you should:

1. Set up proper authentication credentials in `.env`
2. Create necessary roles and permissions
3. Configure proper email settings for notifications
4. Set up S3 bucket or MinIO for document storage
5. Configure frontend application to connect to this API

For more detailed information, refer to the main README.md file.
