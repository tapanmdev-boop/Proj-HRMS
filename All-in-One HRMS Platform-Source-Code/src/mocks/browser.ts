import { http, HttpResponse, delay } from 'msw'
import { setupWorker } from 'msw/browser'
import { mockData } from './mockData'

// Mock data for users
const mockUsers = [
  {
    id: '1',
    email: 'admin@hrms.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: '2',
    email: 'hr@hrms.com',
    password: 'hr123',
    name: 'HR Manager',
    role: 'hr',
  },
  {
    id: '3',
    email: 'employee@hrms.com',
    password: 'employee123',
    name: 'John Employee',
    role: 'employee',
  }
]

// Mock authentication endpoints
export const handlers = [
  // Login endpoint
  http.post('/api/auth/login', async ({ request }) => {
    // Use proper TypeScript typing for the request body
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    // Find user in our mock data
    const user = mockUsers.find(
      u => u.email === email && u.password === password
    )

    if (user) {
      // Create a mock JWT token (in a real app, this would be a proper JWT)
      const token = `mock-jwt-token-for-${user.role}`
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user
      
      await delay(300);
      return HttpResponse.json({
        user: userWithoutPassword,
        token
      }, { status: 200 })
    }
    
    // Return error for invalid credentials
    await delay(400);
    return HttpResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 }
    )
  }),
  
  // Get employees endpoint
  http.get('/api/employees', async () => {
    await delay(300);
    return HttpResponse.json(mockData.employees, { status: 200 })
  }),
  
  // Get jobs endpoint
  http.get('/api/jobs', async () => {
    await delay(300);
    return HttpResponse.json(mockData.jobs, { status: 200 })
  }),
  
  // Get candidates endpoint
  http.get('/api/candidates', async () => {
    await delay(300);
    return HttpResponse.json(mockData.candidates, { status: 200 })
  }),
  
  // Get leave requests endpoint
  http.get('/api/leave-requests', async () => {
    await delay(300);
    return HttpResponse.json(mockData.leave_requests, { status: 200 })
  }),
  
  // Get performance reviews endpoint
  http.get('/api/performance-reviews', async () => {
    await delay(300);
    return HttpResponse.json(mockData.performance_reviews, { status: 200 })
  }),
  
  // Get feedback endpoint
  http.get('/api/feedback', async () => {
    await delay(300);
    return HttpResponse.json(mockData.feedback, { status: 200 })
  }),
  
  // Get goals endpoint
  http.get('/api/goals', async () => {
    await delay(300);
    return HttpResponse.json(mockData.goals, { status: 200 })
  }),
    // Get feedback requests endpoint
  http.get('/api/feedback-requests', async () => {
    await delay(300);
    return HttpResponse.json(mockData.feedback_requests, { status: 200 })
  })
]

// Explicitly type the worker for TypeScript
export const worker = setupWorker(...handlers)
