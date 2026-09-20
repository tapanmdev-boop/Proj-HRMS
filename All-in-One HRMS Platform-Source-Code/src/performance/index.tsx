// Performance module entry point
import { Suspense } from 'react';
import { NavLink } from 'react-router-dom';
import PerformanceRoutes from './routes';

export default function Performance() {
  return (
    <div className="space-y-6">
      {/* Navigation for Performance module */}
      <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto py-4">
            <ul className="flex space-x-8">
              <li>
                <NavLink 
                  to="/performance"
                  end
                  className={({ isActive }) => isActive 
                    ? "border-b-2 border-blue-500 text-blue-600 pb-4 px-1 font-medium text-sm"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300 pb-4 px-1 font-medium text-sm border-b-2 border-transparent"
                  }
                >
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/performance/reviews"
                  className={({ isActive }) => isActive 
                    ? "border-b-2 border-blue-500 text-blue-600 pb-4 px-1 font-medium text-sm"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300 pb-4 px-1 font-medium text-sm border-b-2 border-transparent"
                  }
                >
                  Reviews
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/performance/goals"
                  className={({ isActive }) => isActive 
                    ? "border-b-2 border-blue-500 text-blue-600 pb-4 px-1 font-medium text-sm"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300 pb-4 px-1 font-medium text-sm border-b-2 border-transparent"
                  }
                >
                  Goals & OKRs
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/performance/feedback"
                  className={({ isActive }) => isActive 
                    ? "border-b-2 border-blue-500 text-blue-600 pb-4 px-1 font-medium text-sm"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300 pb-4 px-1 font-medium text-sm border-b-2 border-transparent"
                  }
                >
                  Feedback
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      
      {/* Content area */}
      <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
        <PerformanceRoutes />
      </Suspense>
    </div>
  );
}
