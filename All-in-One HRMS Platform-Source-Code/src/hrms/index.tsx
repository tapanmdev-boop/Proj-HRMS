// Core HR module entry point - Renamed to Hrms for Pascal Case compliance
import { Suspense } from 'react';
import { NavLink } from 'react-router-dom';
import HrmsRoutes from './routes';

export default function Hrms() {
  return (
    <div className="space-y-6">
      {/* HR Module Navigation */}
      <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm">
        <div className="flex overflow-x-auto py-3 px-4 border-b">
          <NavLink
            to="/hrms"
            end
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap mr-2 ${
                isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/hrms/employees"
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap mr-2 ${
                isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Employees
          </NavLink>
          <NavLink
            to="/hrms/leaves"
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap mr-2 ${
                isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Leave Management
          </NavLink>
          <NavLink
            to="/hrms/attendance"
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap mr-2 ${
                isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Attendance
          </NavLink>
          <NavLink
            to="/hrms/payroll"
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap mr-2 ${
                isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            Payroll
          </NavLink>
        </div>
      </div>
      
      {/* HR Module Content */}
      <div>
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
          <HrmsRoutes />
        </Suspense>
      </div>
    </div>
  );
}
