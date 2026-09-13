import { useState, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { Button } from '../components/ui/Form';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: string;
  workHours: string;
}

// Mock attendance data
const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: '1',
    employeeId: '3',
    employeeName: 'John Employee',
    date: '2025-06-10',
    timeIn: '09:05:23',
    timeOut: '17:30:45',
    status: 'present',
    workHours: '8:25'
  },
  {
    id: '2',
    employeeId: '3',
    employeeName: 'John Employee',
    date: '2025-06-09',
    timeIn: '08:58:10',
    timeOut: '17:15:30',
    status: 'present',
    workHours: '8:17'
  },
  {
    id: '3',
    employeeId: '3',
    employeeName: 'John Employee',
    date: '2025-06-06',
    timeIn: '09:10:05',
    timeOut: '17:05:12',
    status: 'present',
    workHours: '7:55'
  },
  {
    id: '4',
    employeeId: '3',
    employeeName: 'John Employee',
    date: '2025-06-05',
    timeIn: '08:45:33',
    timeOut: '17:30:20',
    status: 'present',
    workHours: '8:45'
  },
  {
    id: '5',
    employeeId: '3',
    employeeName: 'John Employee',
    date: '2025-06-04',
    timeIn: null,
    timeOut: null,
    status: 'absent',
    workHours: '0:00'
  },
  {
    id: '6',
    employeeId: '2',
    employeeName: 'HR Manager',
    date: '2025-06-10',
    timeIn: '08:30:00',
    timeOut: '17:00:00',
    status: 'present',
    workHours: '8:30'
  }
];

// Mock team attendance for managers/HR
const MOCK_TEAM_ATTENDANCE = [
  {
    id: '1',
    employeeId: '3',
    employeeName: 'John Employee',
    employeeAvatar: 'JE',
    department: 'Engineering',
    date: '2025-06-10',
    timeIn: '09:05:23',
    timeOut: '17:30:45',
    status: 'present',
    workHours: '8:25'
  },
  {
    id: '2',
    employeeId: '4',
    employeeName: 'Sarah Wilson',
    employeeAvatar: 'SW',
    department: 'Marketing',
    date: '2025-06-10',
    timeIn: '08:55:10',
    timeOut: '17:15:30',
    status: 'present',
    workHours: '8:20'
  },
  {
    id: '3',
    employeeId: '5',
    employeeName: 'Michael Roberts',
    employeeAvatar: 'MR',
    department: 'Engineering',
    date: '2025-06-10',
    timeIn: null,
    timeOut: null,
    status: 'absent',
    workHours: '0:00'
  },
  {
    id: '4',
    employeeId: '6',
    employeeName: 'Emily Johnson',
    employeeAvatar: 'EJ',
    department: 'Design',
    date: '2025-06-10',
    timeIn: '09:30:33',
    timeOut: '17:45:20',
    status: 'present',
    workHours: '8:15'
  },
  {
    id: '5',
    employeeId: '7',
    employeeName: 'David Brown',
    employeeAvatar: 'DB',
    department: 'Finance',
    date: '2025-06-10',
    timeIn: '08:10:45',
    timeOut: '17:05:12',
    status: 'present',
    workHours: '8:55'
  }
];

// Compute "H:MM" worked between two "HH:MM:SS" strings.
function computeWorkHours(timeIn: string, timeOut: string): string {
  const [inH, inM] = timeIn.split(':').map(Number);
  const [outH, outM] = timeOut.split(':').map(Number);
  const minutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'my-attendance', 'team'
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  // The real, mutable dataset — Check In/Check Out write here instead of only
  // firing a window.alert(), so a check-in now actually shows up in the
  // "Recent Attendance"/"Attendance History" tables below.
  const [attendanceRecords, setAttendanceRecords] = useState(MOCK_ATTENDANCE);

  const currentUser = useAppSelector(selectCurrentUser);
  const isHRorManager = currentUser?.role === 'hr' || currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const today = new Date().toISOString().split('T')[0];

  const myAttendance = useMemo(
    () => attendanceRecords
      .filter(record => record.employeeId === currentUser?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [attendanceRecords, currentUser]
  );

  const todayRecord = useMemo(
    () => attendanceRecords.find(record => record.employeeId === currentUser?.id && record.date === today),
    [attendanceRecords, currentUser, today]
  );
  const checkInTime = todayRecord?.timeIn ?? null;
  const checkOutTime = todayRecord?.timeOut ?? null;

  const teamAttendance = useMemo(
    () => isHRorManager ? MOCK_TEAM_ATTENDANCE.filter(record => record.date === attendanceDate) : [],
    [isHRorManager, attendanceDate]
  );

  const handleCheckIn = () => {
    if (!currentUser) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    setAttendanceRecords(prev => {
      const existing = prev.find(r => r.employeeId === currentUser.id && r.date === today);
      if (existing) {
        return prev.map(r => r === existing ? { ...r, timeIn: timeString, status: 'present' } : r);
      }
      return [
        {
          id: `attendance-${Date.now()}`,
          employeeId: currentUser.id,
          employeeName: currentUser.name,
          date: today,
          timeIn: timeString,
          timeOut: null,
          status: 'present',
          workHours: '0:00',
        },
        ...prev,
      ];
    });
  };

  const handleCheckOut = () => {
    if (!currentUser || !checkInTime) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    setAttendanceRecords(prev => prev.map(r =>
      r.employeeId === currentUser.id && r.date === today
        ? { ...r, timeOut: timeString, workHours: computeWorkHours(checkInTime, timeString) }
        : r
    ));
  };

  const getAttendanceStats = () => {
    const total = myAttendance.length;
    const present = myAttendance.filter(record => record.status === 'present').length;
    const absent = myAttendance.filter(record => record.status === 'absent').length;
    const late = myAttendance.filter(
      record => record.status === 'present' && record.timeIn && 
      record.timeIn > '09:00:00'
    ).length;
    
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, absent, late, presentPercentage };
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4 md:mb-0">Attendance Management</h2>
          <div className="flex space-x-2">
            <Button variant={activeTab === 'overview' ? 'primary' : 'outline'} onClick={() => setActiveTab('overview')}>
              Overview
            </Button>
            <Button variant={activeTab === 'my-attendance' ? 'primary' : 'outline'} onClick={() => setActiveTab('my-attendance')}>
              My Attendance
            </Button>
            {isHRorManager && (
              <Button variant={activeTab === 'team' ? 'primary' : 'outline'} onClick={() => setActiveTab('team')}>
                Team Attendance
              </Button>
            )}
          </div>
        </div>
        
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Today's check-in section */}
            <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-100">
              <h3 className="text-lg font-medium text-indigo-800 mb-4">Today's Attendance</h3>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <p className="text-gray-700 mb-2">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {checkInTime ? (
                    <p className="text-green-700">
                      You checked in at <span className="font-semibold">{checkInTime}</span>
                      {checkOutTime && (
                        <> · checked out at <span className="font-semibold">{checkOutTime}</span></>
                      )}
                    </p>
                  ) : (
                    <p className="text-gray-500">You haven't checked in today</p>
                  )}
                </div>
                
                <div className="flex space-x-3 mt-4 md:mt-0">
                  <Button variant="success" onClick={handleCheckIn} disabled={!!checkInTime}>
                    Check In
                  </Button>
                  <Button variant="danger" onClick={handleCheckOut} disabled={!checkInTime || !!checkOutTime}>
                    Check Out
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Attendance stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Attendance Rate</h3>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.presentPercentage}%</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${stats.presentPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Days Present</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.present}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Days Absent</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.absent}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Late Check-ins</h3>
                <p className="text-3xl font-bold text-amber-600 mt-2">{stats.late}</p>
              </div>
            </div>
            
            {/* Recent attendance records */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Attendance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myAttendance.slice(0, 5).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.timeIn ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.timeOut ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.workHours}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status === 'present' ? 'Present' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'my-attendance' && (
          <div className="space-y-6">
            {/* Simple month calendar — days with a recorded check-in are
                highlighted, colored by status. */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = now.getMonth();
                  const firstWeekday = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const cells = [
                    ...Array.from({ length: firstWeekday }, () => null),
                    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                  ];
                  return cells.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const record = myAttendance.find(r => r.date === dateStr);
                    const isToday = dateStr === today;
                    let cellClass = 'bg-gray-50 text-gray-400';
                    if (record?.status === 'present') cellClass = 'bg-green-100 text-green-800 font-medium';
                    else if (record?.status === 'absent') cellClass = 'bg-red-100 text-red-800 font-medium';
                    return (
                      <div
                        key={dateStr}
                        className={`h-10 flex items-center justify-center rounded-md text-sm ${cellClass} ${isToday ? 'ring-2 ring-brand-500' : ''}`}
                        title={record ? `${record.status} — in ${record.timeIn ?? '-'} / out ${record.timeOut ?? '-'}` : 'No record'}
                      >
                        {day}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Full attendance history */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Attendance History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myAttendance.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.timeIn ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.timeOut ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.workHours}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status === 'present' ? 'Present' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'team' && isHRorManager && (
          <div className="space-y-6">
            {/* Date selector */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-48">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  id="date"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>
            </div>
            
            {/* Team attendance summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Team Size</h3>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{teamAttendance.length}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Present</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {teamAttendance.filter(record => record.status === 'present').length}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Absent</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {teamAttendance.filter(record => record.status === 'absent').length}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Late</h3>
                <p className="text-3xl font-bold text-amber-600 mt-2">
                  {teamAttendance.filter(record => 
                    record.status === 'present' && record.timeIn && record.timeIn > '09:00:00'
                  ).length}
                </p>
              </div>
            </div>
            
            {/* Team attendance table */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Team Attendance for {new Date(attendanceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamAttendance.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium mr-3">
                              {record.employeeAvatar}
                            </div>
                            <div className="font-medium text-gray-900">{record.employeeName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.timeIn ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.timeOut ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.workHours}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status === 'present' ? 'Present' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
