import { Link } from 'react-router-dom';
import { Button } from '../ui/Form';

export default function Unauthorized() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="h-16 w-16 rounded-full bg-danger-100 text-danger-600 flex items-center justify-center mb-4">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-6 max-w-sm">
        Your account role doesn't have permission to view that page. If you think this is a mistake, contact your HR administrator.
      </p>
      <Link to="/hrms">
        <Button variant="primary">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
