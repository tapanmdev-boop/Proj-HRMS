import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { Button } from '../components/ui/Form';
import { ApprovalStepper, type ApprovalStep } from '../components/ui/ApprovalStepper';

// Helper function to determine status class
const getStatusClass = (status: string): string => {
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'approved') return 'bg-green-100 text-green-800';
  return 'bg-red-100 text-red-800';
};

const APPROVAL_STEPS: ApprovalStep[] = [
  { key: 'manager', label: 'Manager' },
  { key: 'hr', label: 'HR' },
  { key: 'done', label: 'Approved' },
];
const STAGE_INDEX: Record<'manager' | 'hr' | 'done', number> = { manager: 0, hr: 1, done: 2 };

// Mock leave data. `stage` drives the manager → HR approval chain
// independently of `status`: `status` stays 'pending' while a request moves
// through stages, and only flips to 'approved'/'denied' once the chain ends.
const MOCK_LEAVE_REQUESTS = [
  {
    id: '1',
    employeeName: 'John Smith',
    employeeEmail: 'john.smith@company.com',
    employeeAvatar: 'JS',
    leaveType: 'Vacation',
    startDate: '2025-06-15',
    endDate: '2025-06-19',
    days: 5,
    reason: 'Annual family trip',
    status: 'pending',
    stage: 'manager' as const,
    applied: '2025-05-20'
  },
  {
    id: '2',
    employeeName: 'Maria Garcia',
    employeeEmail: 'maria.garcia@company.com',
    employeeAvatar: 'MG',
    leaveType: 'Sick Leave',
    startDate: '2025-06-12',
    endDate: '2025-06-13',
    days: 2,
    reason: 'Not feeling well',
    status: 'pending',
    stage: 'hr' as const,
    applied: '2025-06-11'
  },
  {
    id: '3',
    employeeName: 'David Johnson',
    employeeEmail: 'david.johnson@company.com',
    employeeAvatar: 'DJ',
    leaveType: 'Personal Leave',
    startDate: '2025-06-25',
    endDate: '2025-06-25',
    days: 1,
    reason: 'Doctor appointment',
    status: 'approved',
    stage: 'done' as const,
    applied: '2025-06-10'
  },
  {
    id: '4',
    employeeName: 'Linda Chen',
    employeeEmail: 'linda.chen@company.com',
    employeeAvatar: 'LC',
    leaveType: 'Vacation',
    startDate: '2025-07-05',
    endDate: '2025-07-15',
    days: 11,
    reason: 'Summer vacation',
    status: 'approved',
    stage: 'done' as const,
    applied: '2025-05-15'
  },
  {
    id: '5',
    employeeName: 'James Brown',
    employeeEmail: 'james.brown@company.com',
    employeeAvatar: 'JB',
    leaveType: 'Work from Home',
    startDate: '2025-06-20',
    endDate: '2025-06-20',
    days: 1,
    reason: 'Home repairs',
    status: 'denied',
    stage: 'manager' as const,
    applied: '2025-06-18'
  }
];

// Leave balance for current user
const MOCK_LEAVE_BALANCE = {
  vacation: { total: 20, used: 5, pending: 0, available: 15 },
  sick: { total: 10, used: 2, pending: 0, available: 8 },
  personal: { total: 5, used: 1, pending: 0, available: 4 }
};

// Map a leave-request "leaveType" label to its MOCK_LEAVE_BALANCE bucket key.
// "Work from Home" has no entitlement bucket, so it's intentionally omitted.
const LEAVE_TYPE_TO_BALANCE_KEY: Record<string, keyof typeof MOCK_LEAVE_BALANCE> = {
  'Vacation': 'vacation',
  'Sick Leave': 'sick',
  'Personal Leave': 'personal',
};

function countDaysInclusive(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

export default function LeaveManagement() {
  const currentUser = useAppSelector(selectCurrentUser);
  const isHR = currentUser?.role === 'hr' || currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  // Managers action the "manager" stage, HR/admin action the "hr" stage —
  // both need the approvals view, just gated to their own stage's actions.
  const canReviewApprovals = isHR || isManager;
  const [searchParams] = useSearchParams();
  // The Dashboard's "Add Leave Request" button links here with ?action=new to
  // jump straight to the form (there's no separate /hrms/leaves/new route).
  const [activeTab, setActiveTab] = useState(
    searchParams.get('action') === 'new' ? 'apply' : (canReviewApprovals ? 'requests' : 'my-leaves')
  ); // 'requests', 'my-leaves', 'apply'
  // The real, mutable dataset — the filter below derives from this instead of
  // re-reading the MOCK_LEAVE_REQUESTS constant, so approve/deny/submit
  // actions survive a status-filter change.
  const [allLeaveRequests, setAllLeaveRequests] = useState(MOCK_LEAVE_REQUESTS);
  const [leaveBalance, setLeaveBalance] = useState(MOCK_LEAVE_BALANCE);
  const [filterStatus, setFilterStatus] = useState('');

  const [newLeave, setNewLeave] = useState({
    leaveType: 'Vacation',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [submitConfirmation, setSubmitConfirmation] = useState('');

  const leaveRequests = useMemo(
    () => filterStatus ? allLeaveRequests.filter(leave => leave.status === filterStatus) : allLeaveRequests,
    [allLeaveRequests, filterStatus]
  );

  const myLeaveHistory = useMemo(
    () => allLeaveRequests.filter(leave => leave.employeeEmail === currentUser?.email),
    [allLeaveRequests, currentUser]
  );

  // `actorStage` is which stage of the chain the acting user owns — a
  // manager can only move a request out of 'manager', HR only out of 'hr'.
  const handleLeaveAction = (id: string, action: 'approve' | 'deny', actorStage: 'manager' | 'hr') => {
    setAllLeaveRequests(prev =>
      prev.map(leave => {
        if (leave.id !== id || leave.stage !== actorStage) return leave;
        if (action === 'deny') return { ...leave, status: 'denied' as const };
        if (actorStage === 'manager') return { ...leave, stage: 'hr' as const };
        return { ...leave, stage: 'done' as const, status: 'approved' as const };
      })
    );
  };

  const handleNewLeaveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLeave(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const days = countDaysInclusive(newLeave.startDate, newLeave.endDate);

    setAllLeaveRequests(prev => [
      {
        id: `leave-${Date.now()}`,
        employeeName: currentUser.name,
        employeeEmail: currentUser.email,
        employeeAvatar: currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        leaveType: newLeave.leaveType,
        startDate: newLeave.startDate,
        endDate: newLeave.endDate,
        days,
        reason: newLeave.reason,
        status: 'pending',
        stage: 'manager',
        applied: new Date().toISOString().split('T')[0],
      },
      ...prev,
    ]);

    // Hold the requested days against the balance immediately (pending);
    // a real backend would reconcile this against the approval outcome.
    const balanceKey = LEAVE_TYPE_TO_BALANCE_KEY[newLeave.leaveType];
    if (balanceKey) {
      setLeaveBalance(prev => ({
        ...prev,
        [balanceKey]: {
          ...prev[balanceKey],
          used: prev[balanceKey].used + days,
          available: Math.max(0, prev[balanceKey].available - days),
        },
      }));
    }

    setSubmitConfirmation(`Leave request submitted for ${days} day(s). It now enters manager review, then HR — track it under "My Leaves".`);
    setNewLeave({
      leaveType: 'Vacation',
      startDate: '',
      endDate: '',
      reason: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink-900 mb-4 md:mb-0">Leave Management</h2>
          <div className="flex space-x-2">
            {canReviewApprovals && (
              <Button variant={activeTab === 'requests' ? 'primary' : 'outline'} onClick={() => setActiveTab('requests')}>
                Approvals
              </Button>
            )}
            <Button variant={activeTab === 'my-leaves' ? 'primary' : 'outline'} onClick={() => setActiveTab('my-leaves')}>
              My Leaves
            </Button>
            <Button variant={activeTab === 'apply' ? 'primary' : 'outline'} onClick={() => setActiveTab('apply')}>
              Apply for Leave
            </Button>
          </div>
        </div>

        {activeTab === 'requests' && canReviewApprovals && (
          <>
            {/* Filter bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-48">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                <select
                  id="status"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
              </div>
            </div>

            {/* Leave requests table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaveRequests.map((leave) => {
                    // Only the approver who owns the current stage sees action
                    // buttons on a pending request — a manager can't skip
                    // ahead and clear the HR stage, and vice versa.
                    const canAct =
                      leave.status === 'pending' &&
                      ((isManager && leave.stage === 'manager') || (isHR && leave.stage === 'hr'));
                    return (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-ivory-200 flex items-center justify-center text-ink-700 font-medium mr-3">
                            {leave.employeeAvatar}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{leave.employeeName}</div>
                            <div className="text-sm text-gray-500">{leave.employeeEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{leave.leaveType}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{leave.days} day(s)</div>
                      </td>
                      <td className="px-6 py-4">
                        <ApprovalStepper
                          steps={APPROVAL_STEPS}
                          activeIndex={STAGE_INDEX[leave.stage]}
                          declined={leave.status === 'denied'}
                        />
                      </td>
                      <td className="px-6 py-4">                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(leave.status)}`}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {canAct && (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost-success" size="sm" onClick={() => handleLeaveAction(leave.id, 'approve', leave.stage as 'manager' | 'hr')}>
                              Approve
                            </Button>
                            <Button variant="ghost-danger" size="sm" onClick={() => handleLeaveAction(leave.id, 'deny', leave.stage as 'manager' | 'hr')}>
                              Deny
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'my-leaves' && (
          <div className="space-y-6">
            {/* Leave balance cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-info-50 p-4 rounded-lg border border-info-100">
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Vacation Leave</h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-sm text-info-600">Available</span>
                    <span className="text-2xl font-bold text-info-600 tabular">{leaveBalance.vacation.available}</span>
                  </div>
                  <div>
                    <span className="block text-sm text-info-600">Used</span>
                    <span className="text-2xl font-bold text-info-600 tabular">{leaveBalance.vacation.used}</span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-info-200 rounded-full h-2">
                  <div
                    className="bg-info-600 h-2 rounded-full"
                    style={{ width: `${(leaveBalance.vacation.used / leaveBalance.vacation.total) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-success-50 p-4 rounded-lg border border-success-100">
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Sick Leave</h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-sm text-success-600">Available</span>
                    <span className="text-2xl font-bold text-success-600 tabular">{leaveBalance.sick.available}</span>
                  </div>
                  <div>
                    <span className="block text-sm text-success-600">Used</span>
                    <span className="text-2xl font-bold text-success-600 tabular">{leaveBalance.sick.used}</span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-success-200 rounded-full h-2">
                  <div
                    className="bg-success-600 h-2 rounded-full"
                    style={{ width: `${(leaveBalance.sick.used / leaveBalance.sick.total) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gold-50 p-4 rounded-lg border border-gold-100">
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Personal Leave</h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-sm text-gold-700">Available</span>
                    <span className="text-2xl font-bold text-gold-700 tabular">{leaveBalance.personal.available}</span>
                  </div>
                  <div>
                    <span className="block text-sm text-gold-700">Used</span>
                    <span className="text-2xl font-bold text-gold-700 tabular">{leaveBalance.personal.used}</span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gold-200 rounded-full h-2">
                  <div
                    className="bg-gold-600 h-2 rounded-full"
                    style={{ width: `${(leaveBalance.personal.used / leaveBalance.personal.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* My leave history */}
            <div>
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">My Leave History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myLeaveHistory.map(leave => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{leave.leaveType}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {leave.startDate === leave.endDate
                            ? new Date(leave.startDate).toLocaleDateString()
                            : `${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{leave.days}</td>
                        <td className="px-6 py-4">
                          <ApprovalStepper
                            steps={APPROVAL_STEPS}
                            activeIndex={STAGE_INDEX[leave.stage]}
                            declined={leave.status === 'denied'}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(leave.status)}`}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {myLeaveHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No leave history yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apply' && (
          <div>
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Apply for Leave</h3>
            <form onSubmit={handleSubmitLeave} className="space-y-4 max-w-lg">
              <div>
                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  id="leaveType"
                  name="leaveType"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
                  value={newLeave.leaveType}
                  onChange={handleNewLeaveChange}
                  required
                >
                  <option>Vacation</option>
                  <option>Sick Leave</option>
                  <option>Personal Leave</option>
                  <option>Work from Home</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
                    value={newLeave.startDate}
                    onChange={handleNewLeaveChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
                    value={newLeave.endDate}
                    onChange={handleNewLeaveChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
                  value={newLeave.reason}
                  onChange={handleNewLeaveChange}
                  required
                />
              </div>

              {submitConfirmation && (
                <div className="rounded-md bg-success-50 border border-success-200 text-success-800 text-sm px-4 py-3">
                  {submitConfirmation}
                </div>
              )}

              <div className="pt-3">
                <Button type="submit">
                  Submit Leave Request
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
