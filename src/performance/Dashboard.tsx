import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8 max-w-7xl mx-auto fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Performance Dashboard
        </h2>
        <div className="text-sm text-gray-500 flex items-center">
          <span className="font-medium text-purple-600 mr-1">Q2 Review Cycle:</span> 15 days remaining
        </div>
      </div>
      
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Performance Metrics
          </h3>
          <Link to="/performance/analytics" className="text-sm text-purple-600 hover:text-purple-800 flex items-center font-medium">
            <span>View Analytics</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            to="/performance/reviews" 
            className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-xl text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg group"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white opacity-80">Reviews in Progress</h3>
                <svg className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold mt-2">8</p>
              <div className="mt-2 text-sm font-medium text-white/70">
                <span>3 due this week</span>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8 group-hover:opacity-20 transition-opacity">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-2 17c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3-7V3.5L18.5 7H15z" />
              </svg>
            </div>
          </Link>
          
          <Link 
            to="/performance/feedback" 
            className="relative overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600 p-6 rounded-xl text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg group"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white opacity-80">Feedback Received</h3>
                <svg className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-3xl font-bold mt-2">23</p>
              <div className="mt-2 text-sm font-medium text-white/70">
                <span className="inline-flex items-center text-blue-200">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +5 this month
                </span>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8 group-hover:opacity-20 transition-opacity">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" />
              </svg>
            </div>
          </Link>
          
          <Link 
            to="/performance/goals" 
            className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 p-6 rounded-xl text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg group"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white opacity-80">Goals Completion</h3>
                <svg className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="flex items-center mt-2">
                <p className="text-3xl font-bold">67%</p>
                <div className="ml-4 w-24 bg-purple-300/30 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
              <div className="mt-2 text-sm font-medium text-white/70">
                <span>5 goals completed</span>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8 group-hover:opacity-20 transition-opacity">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800">Active OKRs</h3>
            </div>
            <Link 
              to="/performance/goals" 
              className="text-sm text-purple-600 hover:text-purple-800 flex items-center font-medium"
            >
              <span>View all</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="group">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="text-sm font-medium text-gray-800">Improve Customer Satisfaction</div>
                </div>
                <div className="text-sm font-semibold text-purple-600">75%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-in-out group-hover:bg-purple-500" style={{ width: '75%' }}></div>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Updated 3 days ago</span>
                <span>Target: 85%</span>
              </div>
            </div>
            
            <div className="group">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <div className="text-sm font-medium text-gray-800">Launch New Product Features</div>
                </div>
                <div className="text-sm font-semibold text-purple-600">45%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-in-out group-hover:bg-purple-500" style={{ width: '45%' }}></div>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Updated 1 week ago</span>
                <span>Target: 100%</span>
              </div>
            </div>
            
            <div className="group">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm font-medium text-gray-800">Reduce Support Response Time</div>
                </div>
                <div className="text-sm font-semibold text-purple-600">90%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-in-out group-hover:bg-purple-500" style={{ width: '90%' }}></div>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Updated yesterday</span>
                <span>Target: 95%</span>
              </div>
            </div>
          </div>
          
          <div className="py-3 px-6 bg-gray-50 border-t border-gray-100">
            <Link 
              to="/performance/goals/new"
              className="w-full flex items-center justify-center text-sm text-purple-600 hover:text-purple-800 py-1"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New OKR
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-teal-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800">Upcoming Reviews</h3>
            </div>
            <Link 
              to="/performance/reviews" 
              className="text-sm text-teal-600 hover:text-teal-800 flex items-center font-medium"
            >
              <span>View all</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="divide-y divide-gray-100">
            <div className="p-5 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 mr-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <h4 className="text-base font-medium text-gray-900">Mid-Year Review</h4>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md font-medium">Due soon</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Self-assessment due in 5 days</p>
                  <Link to="/performance/reviews" className="inline-flex items-center px-3 py-1 bg-teal-100 text-teal-700 text-sm rounded-md hover:bg-teal-200 transition-colors">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Start Review
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="p-5 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <h4 className="text-base font-medium text-gray-900">Peer Feedback</h4>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-md font-medium">Pending</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">3 pending requests</p>
                  <Link to="/performance/feedback" className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 transition-colors">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Review
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-sky-50 to-blue-100 px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Recent Feedback</h3>
          </div>
          <Link 
            to="/performance/feedback" 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center font-medium"
          >
            <span>View all</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1">
            <div className="flex items-start">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg mr-4 shadow-sm">
                JD
              </div>
              <div>
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-gray-900">Jane Doe</p>
                  <div className="flex">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-medium">Praise</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">Great job on the client presentation yesterday. Your preparation really showed!</p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">June 9, 2025</p>
                  <button onClick={() => navigate('/performance/feedback')} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Reply</button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-100 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1">
            <div className="flex items-start">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg mr-4 shadow-sm">
                TS
              </div>
              <div>
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-gray-900">Team Supervisor</p>
                  <div className="flex">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">Feedback</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">I appreciate your initiative in resolving the database issue last week.</p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">June 5, 2025</p>
                  <button onClick={() => navigate('/performance/feedback')} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Reply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="py-3 px-6 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">You have <span className="font-medium text-blue-600">5 new</span> feedback items</span>
            <Link 
              to="/performance/feedback/give"
              className="text-sm font-medium px-3 py-1 rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Give Feedback
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
