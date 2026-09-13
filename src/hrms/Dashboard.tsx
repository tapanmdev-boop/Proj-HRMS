import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Form';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-7xl mx-auto fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          HR Dashboard
        </h2>
        <div className="text-sm text-gray-500 flex items-center">
          <span className="font-medium text-indigo-600 mr-1">Today:</span> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Organization Overview</h3>
          <Button variant="ghost-primary" size="sm" onClick={() => navigate('/hrms/reports')}>
            <span>View Reports</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">          <button 
            onClick={() => navigate('/hrms/employees')} 
            className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group w-full text-left"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white opacity-80">Employees</h3>
                <svg className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold mt-2">127</p>
              <div className="mt-2 text-sm font-medium text-white/70">
                <span className="inline-flex items-center text-emerald-300">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +5 this month
                </span>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8 group-hover:opacity-20 transition-opacity">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z" />
              </svg>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/hrms/leaves')}
            className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group w-full text-left"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white opacity-80">On Leave</h3>
                <svg className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold mt-2">7</p>
              <div className="mt-2 text-sm font-medium text-white/70">
                <span>3 returning tomorrow</span>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8 group-hover:opacity-20 transition-opacity">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z" />
              </svg>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/hrms/leaves')}
            className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-yellow-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white opacity-80">Pending Requests</h3>
                <svg className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold mt-2">12</p>
              <div className="mt-2 text-sm font-medium text-white/70">
                <span>5 new today</span>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8 group-hover:opacity-20 transition-opacity">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/hrms/attendance')}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white opacity-80">Attendance Rate</h3>
                <svg className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-3xl font-bold mt-2">96%</p>
              <div className="mt-2 text-sm font-medium text-white/70">
                <span>Target: 95%</span>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8 group-hover:opacity-20 transition-opacity">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
              </svg>
            </div>
          </button>
        </div>
      </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800">Leave Requests</h3>
            </div>
            <Button variant="ghost-primary" size="sm" onClick={() => navigate('/hrms/leaves')}>
              <span>View all</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
          
          <div className="divide-y divide-gray-100 transform transition-all">
            <div className="p-5 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    JS
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between mb-1">
                    <h4 className="text-base font-medium text-gray-900">John Smith</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium">Vacation</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>June 15 - June 19, 2025 <span className="font-medium text-indigo-600 ml-1">• 5 days</span></span>
                  </div>
                  <div className="flex mt-3 space-x-2">
                    <button onClick={() => navigate('/hrms/leaves')} className="px-4 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-md hover:bg-emerald-200 transition-colors flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Approve
                    </button>
                    <button onClick={() => navigate('/hrms/leaves')} className="px-4 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
                    MG
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between mb-1">
                    <h4 className="text-base font-medium text-gray-900">Maria Garcia</h4>
                    <span className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded-md font-medium">Sick Leave</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>June 12 - June 13, 2025 <span className="font-medium text-indigo-600 ml-1">• 2 days</span></span>
                  </div>
                  <div className="flex mt-3 space-x-2">
                    <button onClick={() => navigate('/hrms/leaves')} className="px-4 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-md hover:bg-emerald-200 transition-colors flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Approve
                    </button>
                    <button onClick={() => navigate('/hrms/leaves')} className="px-4 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="py-3 px-5 bg-gray-50">
              <Button
                variant="ghost-primary"
                className="w-full justify-center"
                onClick={() => navigate('/hrms/leaves?action=new')}
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Leave Request
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-emerald-50 to-green-100 px-6 py-4 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800">Recent Payroll</h3>
            </div>
            <Button variant="ghost-primary" size="sm" onClick={() => navigate('/hrms/payroll')}>
              <span>View all</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-emerald-100 rounded-md flex items-center justify-center">
                          <span className="text-xs font-medium text-emerald-800">MAY</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">May 2025</div>
                          <div className="text-xs text-gray-500">Processed on May 25</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">$243,200.00</div>
                      <div className="text-xs text-gray-500">For 127 employees</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Processed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button variant="ghost-primary" size="sm" onClick={() => navigate('/hrms/payroll')}>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Payslips
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-800">APR</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">April 2025</div>
                          <div className="text-xs text-gray-500">Processed on Apr 25</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">$240,180.00</div>
                      <div className="text-xs text-gray-500">For 125 employees</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Processed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button variant="ghost-primary" size="sm" onClick={() => navigate('/hrms/payroll')}>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Payslips
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="py-3 px-6 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Next payroll in: <span className="font-medium text-gray-900">5 days</span></span>
                <button
                  onClick={() => navigate('/hrms/payroll?tab=run-payroll')}
                  className="text-sm font-medium px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                >
                  Run Payroll
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Monthly Turnover Rate
            </h3>
          </div>
          
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500">Chart visualization would appear here</p>
              <p className="text-sm text-gray-400 mt-1">Monthly employee retention trends</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Upcoming Events
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-lg mr-3">
                <span className="text-xs font-semibold">15</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Team Building</h4>
                <p className="text-xs text-gray-500">9:00 AM - 5:00 PM</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-amber-100 text-amber-600 rounded-lg mr-3">
                <span className="text-xs font-semibold">18</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Performance Reviews</h4>
                <p className="text-xs text-gray-500">10:00 AM - 4:00 PM</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-lg mr-3">
                <span className="text-xs font-semibold">22</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Training Workshop</h4>
                <p className="text-xs text-gray-500">1:00 PM - 3:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
