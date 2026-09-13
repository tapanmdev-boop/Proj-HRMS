import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, selectCurrentUser } from '../../auth/authSlice';

const getPageTitle = (pathname: string): string => {
  if (pathname.includes('hrms')) return 'Core HR & Payroll';
  if (pathname.includes('recruitment')) return 'Recruitment & ATS';
  if (pathname.includes('performance')) return 'Performance Management';
  return 'HRMS Dashboard';
};

export default function MainLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();
  
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };
  
  const toggleMenu = (menu: string) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 mobile-overlay z-20 md:hidden"
          onClick={toggleMobileMenu}
          style={{backdropFilter: 'blur(2px)'}}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`fixed md:relative w-72 md:w-72 bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white overflow-y-auto shadow-xl h-full z-30 sidebar-transition custom-scrollbar ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <svg className="h-8 w-8 mr-2 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white">HRMS</span>
          </h1>
        </div>
        
        {user && (
          <div className="mx-4 p-4 rounded-xl bg-gradient-to-br from-indigo-950/70 to-indigo-900/40 border border-indigo-700/50 mb-4 shadow-inner hover:shadow-md hover:from-indigo-900/70 hover:to-indigo-800/40 transition-all duration-300">
            <div className="font-medium flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 text-sm font-bold shadow-md">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-white">{user.name}</div>
                <div className="text-xs text-indigo-300 capitalize flex items-center">
                  <span className="status-dot status-dot-online"></span>
                  {user.role}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-indigo-800/50 flex justify-between items-center">
              <button className="text-xs text-indigo-300 hover:text-white transition-colors flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                My Profile
              </button>
              <div className="bg-indigo-600/30 text-xs px-2 py-0.5 rounded-full text-indigo-200 font-medium">
                Online
              </div>
            </div>
          </div>
        )}
        
        <nav className="mt-4">
          {/* Core HR Module - GreytHR Features */}
          <div className="relative">            <button
              onClick={() => toggleMenu('hrms')}
              className={`flex items-center justify-between w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                isActive('/hrms') ? 'bg-indigo-700/50 text-white font-medium shadow-inner' : 'text-indigo-200 hover:bg-indigo-800/50'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Core HR & Payroll
              </span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${expandedMenu === 'hrms' ? 'transform rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
              {expandedMenu === 'hrms' && (
              <div className="mx-3 mt-2 mb-3 pl-3 py-2 bg-indigo-950/50 rounded-lg border-l-2 border-indigo-500/30 space-y-1">
                <NavLink to="/hrms" end className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Dashboard</NavLink>                <NavLink to="/hrms/employees" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Employees</NavLink>
                <NavLink to="/hrms/attendance" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Attendance</NavLink>
                <NavLink to="/hrms/leaves" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Leave Management</NavLink>
                <NavLink to="/hrms/payroll" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Payroll</NavLink>
                <NavLink to="/hrms/expenses" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Expenses</NavLink>
                <NavLink to="/hrms/documents" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Documents</NavLink>
                <NavLink to="/hrms/onboarding" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Onboarding</NavLink>
                <NavLink to="/hrms/offboarding" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Offboarding</NavLink>
                <NavLink to="/hrms/reports" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Reports</NavLink>
              </div>
            )}
          </div>
          
          {/* Recruitment Module - Breezy HR Features */}
          <div className="relative">            <button
              onClick={() => toggleMenu('recruitment')}
              className={`flex items-center justify-between w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                isActive('/recruitment') ? 'bg-indigo-700/50 text-white font-medium shadow-inner' : 'text-indigo-200 hover:bg-indigo-800/50'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Recruitment & ATS
              </span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${expandedMenu === 'recruitment' ? 'transform rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>              {expandedMenu === 'recruitment' && (
              <div className="mx-3 mt-2 mb-3 pl-3 py-2 bg-indigo-950/50 rounded-lg border-l-2 border-indigo-500/30 space-y-1">
                <NavLink to="/recruitment" end className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Dashboard</NavLink>                <NavLink to="/recruitment/job-postings" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Job Postings</NavLink>
                <NavLink to="/recruitment/candidates" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Candidates</NavLink>
                <NavLink to="/recruitment/interviews" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Interviews</NavLink>
                <NavLink to="/recruitment/resume-parser" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Resume Parser</NavLink>
                <NavLink to="/recruitment/analytics" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Analytics</NavLink>
              </div>
            )}
          </div>
          
          {/* Performance Module - Lattice Features */}
          <div className="relative">            <button
              onClick={() => toggleMenu('performance')}
              className={`flex items-center justify-between w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                isActive('/performance') ? 'bg-indigo-700/50 text-white font-medium shadow-inner' : 'text-indigo-200 hover:bg-indigo-800/50'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Performance Management
              </span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${expandedMenu === 'performance' ? 'transform rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
              {expandedMenu === 'performance' && (
              <div className="mx-3 mt-2 mb-3 pl-3 py-2 bg-indigo-950/50 rounded-lg border-l-2 border-indigo-500/30 space-y-1">
                <NavLink to="/performance" end className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Dashboard</NavLink>                <NavLink to="/performance/reviews" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Reviews</NavLink>
                <NavLink to="/performance/goals" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Goals & OKRs</NavLink>
                <NavLink to="/performance/feedback" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Feedback & Praise</NavLink>
                <NavLink to="/performance/1on1" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>1:1 Meetings</NavLink>
                <NavLink to="/performance/surveys" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Engagement Surveys</NavLink>
                <NavLink to="/performance/analytics" className={({isActive}) => 
                  `block px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${isActive ? 'text-white bg-indigo-700/40' : 'text-indigo-200 hover:bg-indigo-800/30 hover:text-white'}`
                }>Analytics</NavLink>
              </div>
            )}
          </div>
            <div className="px-4 py-6 mt-4">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2.5 text-center text-indigo-100 bg-indigo-700/30 hover:bg-indigo-700/50 rounded-lg transition-colors duration-200 border border-indigo-600/30"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </div>      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 md:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center">
              {/* Mobile menu toggle */}
              <button 
                onClick={toggleMobileMenu} 
                className="mr-4 md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center">
                {location.pathname.includes('hrms') && (
                  <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
                {location.pathname.includes('recruitment') && (
                  <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {location.pathname.includes('performance') && (
                  <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
                {getPageTitle(location.pathname)}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* These were `text-white` icons sitting on this white header —
                  invisible until hovered. Same root-cause bug class as the
                  Employees "Edit" button: an explicit color meant for a dark
                  surface, applied on a light one. */}
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Notifications">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Settings">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </header>
          {/* Main content area */}        <main className="flex-1 overflow-auto p-6 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 custom-scrollbar">
          <div className="w-full pb-8">
            {/* Page breadcrumbs */}
            <div className="mb-6 flex flex-wrap items-center text-sm text-gray-500 mobile-hidden">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hover:text-indigo-600 cursor-pointer">Dashboard</span>
              </div>
              {location.pathname !== '/' && location.pathname.split('/').filter(Boolean).map((path, index, array) => (
                <div className="flex items-center" key={path}>
                  <svg className="w-4 h-4 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className={index === array.length - 1 ? "text-indigo-600 font-medium" : "hover:text-indigo-600 cursor-pointer"}>
                    {path.charAt(0).toUpperCase() + path.slice(1)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Mobile breadcrumb - simpler version for small screens */}
            <div className="mb-4 hidden mobile-block">
              <div className="flex items-center text-sm font-medium text-indigo-600">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>
                  {location.pathname.split('/').filter(Boolean).length > 0 
                    ? location.pathname.split('/').filter(Boolean).slice(-1)[0].charAt(0).toUpperCase() + 
                      location.pathname.split('/').filter(Boolean).slice(-1)[0].slice(1)
                    : 'Dashboard'}
                </span>
              </div>
            </div>
              {/* Quick actions */}
            {(location.pathname.includes('hrms') || location.pathname.includes('recruitment') || location.pathname.includes('performance')) && (
              <div className="mb-6 flex flex-wrap gap-2">
                <button className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all duration-200 shadow-sm group">
                  <svg className="w-4 h-4 mr-1.5 text-indigo-500 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="md:inline hidden">Quick Add</span>
                  <span className="md:hidden inline">Add</span>
                </button>
                <button className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all duration-200 shadow-sm group">
                  <svg className="w-4 h-4 mr-1.5 text-indigo-500 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filter</span>
                </button>
                <button className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all duration-200 shadow-sm group">
                  <svg className="w-4 h-4 mr-1.5 text-indigo-500 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="md:inline hidden">Export</span>
                  <span className="md:hidden inline">Exp</span>
                </button>
                <button className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all duration-200 shadow-sm group">
                  <svg className="w-4 h-4 mr-1.5 text-indigo-500 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="md:inline hidden">Calendar</span>
                  <span className="md:hidden inline">Cal</span>
                </button>
              </div>
            )}
            
            {/* Animation wrapper for page content */}
            <div className="fade-in slide-up">
              <Outlet />
            </div>
              {/* Footer */}
            <footer className="mt-12 pt-6 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <svg className="h-6 w-6 mr-2 text-indigo-500 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm text-gray-500">© 2025 <span className="text-indigo-600 font-medium">HRMS</span> System. All rights reserved.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-2 md:mt-0">
                  <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Privacy Policy</a>
                  <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Terms of Service</a>
                  <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Help Center</a>
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-gray-400 md:text-right">
                <span>Version 1.2.0</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
