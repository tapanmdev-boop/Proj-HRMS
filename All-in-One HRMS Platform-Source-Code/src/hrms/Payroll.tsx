import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { Button } from '../components/ui/Form';
import { generateWpsSif } from '../utils/wpsFile';

// Demo employer WPS identifiers. A real deployment would pull these from the
// tenant's own settings (MOHRE establishment registration + bank onboarding
// pack), not hardcode them.
const MOCK_EMPLOYER = {
  establishmentId: 'EST-778899',
  wpsAgentId: 'AGENT-4521',
  employerIban: 'AE070331000000001234567',
};

// Mock payroll data
const MOCK_PAYROLL_HISTORY = [
  {
    id: '1',
    period: 'May 2025',
    startDate: '2025-05-01',
    endDate: '2025-05-31',
    payDate: '2025-06-05',
    grossPay: 17500,
    netPay: 17000,
    status: 'processed',
    currency: 'AED'
  },
  {
    id: '2',
    period: 'April 2025',
    startDate: '2025-04-01',
    endDate: '2025-04-30',
    payDate: '2025-05-05',
    grossPay: 17500,
    netPay: 17000,
    status: 'processed',
    currency: 'AED'
  },
  {
    id: '3',
    period: 'March 2025',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    payDate: '2025-04-05',
    grossPay: 17500,
    netPay: 17000,
    status: 'processed',
    currency: 'AED'
  },
  {
    id: '4',
    period: 'February 2025',
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    payDate: '2025-03-05',
    grossPay: 16800,
    netPay: 16300,
    status: 'processed',
    currency: 'AED'
  },
  {
    id: '5',
    period: 'January 2025',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    payDate: '2025-02-05',
    grossPay: 16800,
    netPay: 16300,
    status: 'processed',
    currency: 'AED'
  }
];

// Mock payslip details. UAE has no personal income tax, so — unlike the
// India/US-style payslip this used to model — there's no "Income Tax" or
// 401(k)-style "Retirement Fund" line; deductions here are limited to
// things that actually apply (salary advances, unpaid leave, etc.).
const MOCK_PAYSLIP_DETAILS = {
  employeeName: 'John Employee',
  employeeId: '3',
  department: 'Engineering',
  designation: 'Senior Developer',
  iban: 'AE070331234567890123458',
  period: 'May 2025',
  payDate: '2025-06-05',

  earnings: [
    { label: 'Basic Salary', amount: 12000 },
    { label: 'Housing Allowance', amount: 4000 },
    { label: 'Transport Allowance', amount: 1000 },
    { label: 'Other Allowances', amount: 500 }
  ],

  deductions: [
    { label: 'Other Deductions', amount: 500 }
  ],

  totalEarnings: 17500,
  totalDeductions: 500,
  netPay: 17000
};

// Mock company employees for HR/Admin, with the UAE fields WPS needs.
const MOCK_EMPLOYEES_PAYROLL = [
  {
    id: '1',
    name: 'John Smith',
    position: 'Senior Developer',
    department: 'Engineering',
    basicSalary: 12000,
    housingAllowance: 4000,
    transportAllowance: 1000,
    otherAllowances: 500,
    laborCardNumber: 'LC-100234',
    iban: 'AE070331234567890123456',
    bankRoutingCode: 'ADCBAEAAXXX',
    paymentStatus: 'Paid',
    lastPaymentDate: '2025-06-05'
  },
  {
    id: '2',
    name: 'Maria Garcia',
    position: 'UX Designer',
    department: 'Design',
    basicSalary: 10000,
    housingAllowance: 3500,
    transportAllowance: 1000,
    otherAllowances: 300,
    laborCardNumber: 'LC-100235',
    iban: 'AE070331234567890123457',
    bankRoutingCode: 'ADCBAEAAXXX',
    paymentStatus: 'Paid',
    lastPaymentDate: '2025-06-05'
  },
  {
    id: '3',
    name: 'David Johnson',
    position: 'Product Manager',
    department: 'Product',
    basicSalary: 16000,
    housingAllowance: 5000,
    transportAllowance: 1200,
    otherAllowances: 800,
    laborCardNumber: 'LC-100236',
    iban: 'AE070331234567890123458',
    bankRoutingCode: 'ENBDAEAAXXX',
    paymentStatus: 'Paid',
    lastPaymentDate: '2025-06-05'
  },
  {
    id: '4',
    name: 'Linda Chen',
    position: 'Marketing Specialist',
    department: 'Marketing',
    basicSalary: 9000,
    housingAllowance: 3000,
    transportAllowance: 800,
    otherAllowances: 200,
    laborCardNumber: 'LC-100237',
    iban: 'AE070331234567890123459',
    bankRoutingCode: 'ENBDAEAAXXX',
    paymentStatus: 'Paid',
    lastPaymentDate: '2025-06-05'
  },
  {
    id: '5',
    name: 'Robert Wilson',
    position: 'HR Manager',
    department: 'Human Resources',
    basicSalary: 14000,
    housingAllowance: 4500,
    transportAllowance: 1000,
    otherAllowances: 600,
    laborCardNumber: 'LC-100238',
    iban: 'AE070331234567890123460',
    bankRoutingCode: 'FGBMAEADXXX',
    paymentStatus: 'Pending',
    lastPaymentDate: '2025-05-05'
  }
];

const totalMonthlyPay = (e: typeof MOCK_EMPLOYEES_PAYROLL[number]) =>
  e.basicSalary + e.housingAllowance + e.transportAllowance + e.otherAllowances;

function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}

// A plain-text payslip download — this is a minimal, real client-side
// action so the button isn't a dead stub. Phase 1c (real backend) replaces
// this with a proper PDF generated server-side from actual payroll data.
function downloadPayslipText(payslip: typeof MOCK_PAYSLIP_DETAILS) {
  const lines = [
    `Payslip — ${payslip.period}`,
    `Employee: ${payslip.employeeName} (${payslip.employeeId})`,
    `${payslip.department} · ${payslip.designation}`,
    `Pay Date: ${payslip.payDate}`,
    '',
    'Earnings:',
    ...payslip.earnings.map(e => `  ${e.label}: AED ${e.amount.toLocaleString()}`),
    `  Total Earnings: AED ${payslip.totalEarnings.toLocaleString()}`,
    '',
    'Deductions:',
    ...payslip.deductions.map(d => `  ${d.label}: AED ${d.amount.toLocaleString()}`),
    `  Total Deductions: AED ${payslip.totalDeductions.toLocaleString()}`,
    '',
    `Net Pay: AED ${payslip.netPay.toLocaleString()}`,
  ];
  downloadTextFile(`payslip-${payslip.period.replace(/\s+/g, '-').toLowerCase()}.txt`, lines.join('\n'));
}

export default function Payroll() {
  const [searchParams] = useSearchParams();
  const currentUser = useAppSelector(selectCurrentUser);
  const isHRorAdmin = currentUser?.role === 'hr' || currentUser?.role === 'admin';
  // The Dashboard's "Run Payroll" button links here with ?tab=run-payroll
  // (there's no separate /hrms/payroll/run route — it never existed).
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'run-payroll' && isHRorAdmin ? 'run-payroll' : 'history'
  );  // 'history', 'payslip', 'run-payroll'
  const [selectedPayslip, setSelectedPayslip] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(MOCK_PAYROLL_HISTORY[0].period);
  const [detailsEmployee, setDetailsEmployee] = useState<typeof MOCK_EMPLOYEES_PAYROLL[number] | null>(null);
  const [runPayrollResult, setRunPayrollResult] = useState<string | null>(null);

  const viewPayslip = (payrollId: string) => {
    setSelectedPayslip(payrollId);
    setActiveTab('payslip');
  };

  const selectedPayrollRecord = MOCK_PAYROLL_HISTORY.find(p => p.id === selectedPayslip);
  // Interim, local-only view: the mock payslip line-items always come from
  // MOCK_PAYSLIP_DETAILS regardless of which history row was clicked; Phase
  // 1c's real backend returns the actual payslip per period/employee. We at
  // least reflect the clicked row's real period/pay date/totals here so the
  // header isn't silently wrong.
  const payslipForView = selectedPayrollRecord
    ? {
        ...MOCK_PAYSLIP_DETAILS,
        period: selectedPayrollRecord.period,
        payDate: selectedPayrollRecord.payDate,
        totalEarnings: selectedPayrollRecord.grossPay,
        netPay: selectedPayrollRecord.netPay,
      }
    : MOCK_PAYSLIP_DETAILS;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink-900 mb-4 md:mb-0">Payroll Management</h2>
          <div className="flex space-x-2">
            <Button variant={activeTab === 'history' ? 'primary' : 'outline'} onClick={() => setActiveTab('history')}>
              {isHRorAdmin ? 'Payroll History' : 'My Paychecks'}
            </Button>
            {selectedPayslip && (
              <Button variant={activeTab === 'payslip' ? 'primary' : 'outline'} onClick={() => setActiveTab('payslip')}>
                View Payslip
              </Button>
            )}
            {isHRorAdmin && (
              <Button variant={activeTab === 'run-payroll' ? 'primary' : 'outline'} onClick={() => setActiveTab('run-payroll')}>
                Run Payroll
              </Button>
            )}
          </div>
        </div>
        
        {/* Payroll history / My paychecks */}
        {activeTab === 'history' && !isHRorAdmin && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {MOCK_PAYROLL_HISTORY.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payroll.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payroll.payDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        AED {payroll.grossPay.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        AED {payroll.netPay.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button variant="ghost-primary" size="sm" onClick={() => viewPayslip(payroll.id)}>
                          View Payslip
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HR/Admin payroll history view */}
        {activeTab === 'history' && isHRorAdmin && (
          <div className="space-y-6">
            {/* Payroll periods */}
            <div className="mb-6">
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">Select Period</label>
              <select
                id="period"
                className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {MOCK_PAYROLL_HISTORY.map(p => <option key={p.id} value={p.period}>{p.period}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Showing current employee roster for {selectedPeriod}. Per-period payroll snapshots will land with the real backend.
              </p>
            </div>
            
            {/* Employee payroll table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {MOCK_EMPLOYEES_PAYROLL.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        AED {totalMonthlyPay(employee).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {employee.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(employee.lastPaymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button variant="ghost-primary" size="sm" onClick={() => setDetailsEmployee(employee)}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {detailsEmployee && (
              <div className="fixed inset-0 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px] z-50">
                <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-md">
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Payroll Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Name:</span> {detailsEmployee.name}</p>
                    <p><span className="font-semibold">Position:</span> {detailsEmployee.position}</p>
                    <p><span className="font-semibold">Department:</span> {detailsEmployee.department}</p>
                    <p><span className="font-semibold">Basic Salary:</span> AED {detailsEmployee.basicSalary.toLocaleString()}</p>
                    <p><span className="font-semibold">Housing Allowance:</span> AED {detailsEmployee.housingAllowance.toLocaleString()}</p>
                    <p><span className="font-semibold">Transport Allowance:</span> AED {detailsEmployee.transportAllowance.toLocaleString()}</p>
                    <p><span className="font-semibold">Other Allowances:</span> AED {detailsEmployee.otherAllowances.toLocaleString()}</p>
                    <p><span className="font-semibold">Total Monthly Pay:</span> AED {totalMonthlyPay(detailsEmployee).toLocaleString()}</p>
                    <p><span className="font-semibold">Labour Card:</span> {detailsEmployee.laborCardNumber}</p>
                    <p><span className="font-semibold">IBAN:</span> {detailsEmployee.iban}</p>
                    <p><span className="font-semibold">Payment Status:</span> {detailsEmployee.paymentStatus}</p>
                    <p><span className="font-semibold">Last Payment:</span> {new Date(detailsEmployee.lastPaymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={() => setDetailsEmployee(null)}>Close</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payslip view */}
        {activeTab === 'payslip' && selectedPayslip && (
          <div className="space-y-6">
            <div className="text-right mb-4">
              <Button variant="outline" onClick={() => downloadPayslipText(payslipForView)}>
                Download PDF
              </Button>
            </div>

            {/* Payslip header */}
            <div className="flex flex-col md:flex-row justify-between border-b pb-6">
              <div>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Payslip for {payslipForView.period}</h3>
                <p className="text-gray-500">Pay Date: {new Date(payslipForView.payDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <p className="text-gray-900 font-medium">{payslipForView.employeeName}</p>
                <p className="text-gray-500">{payslipForView.department} • {payslipForView.designation}</p>
                <p className="text-gray-500">Employee ID: {payslipForView.employeeId}</p>
              </div>
            </div>
            
            {/* Earnings and deductions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Earnings</h4>
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">                    {payslipForView.earnings.map((item) => (
                      <tr key={`earning-${item.label}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{item.label}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">AED {item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-4 py-2 text-sm text-gray-900">Total Earnings</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">AED {payslipForView.totalEarnings.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Deductions</h4>
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">                    {payslipForView.deductions.map((item) => (
                      <tr key={`deduction-${item.label}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{item.label}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">AED {item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-4 py-2 text-sm text-gray-900">Total Deductions</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">AED {payslipForView.totalDeductions.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Net pay */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Net Pay</h3>
                <p className="text-2xl font-bold text-indigo-600">AED {payslipForView.netPay.toLocaleString()}</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">Paid via WPS to {payslipForView.iban}</p>
            </div>
          </div>
        )}
        
        {/* Run payroll view - for HR/Admin */}
        {activeTab === 'run-payroll' && isHRorAdmin && (
          <div className="space-y-6">
            <form className="space-y-6">
              {/* Payroll period selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="payrollName" className="block text-sm font-medium text-gray-700 mb-1">Payroll Name</label>
                  <input
                    type="text"
                    id="payrollName"
                    defaultValue="June 2025 Payroll"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="payDate" className="block text-sm font-medium text-gray-700 mb-1">Pay Date</label>
                  <input
                    type="date"
                    id="payDate"
                    defaultValue="2025-07-05"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                  <input
                    type="date"
                    id="startDate"
                    defaultValue="2025-06-01"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                  <input
                    type="date"
                    id="endDate"
                    defaultValue="2025-06-30"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gold-500 focus:ring-gold-400 sm:text-sm"
                  />
                </div>
              </div>
              
              {/* Payroll summary — computed from the actual roster below
                  instead of hardcoded figures, so it can't drift out of sync. */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-md font-medium text-gray-800 mb-3">Payroll Summary</h3>
                {(() => {
                  const totalGross = MOCK_EMPLOYEES_PAYROLL.reduce((sum, e) => sum + totalMonthlyPay(e), 0);
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Total Employees</p>
                        <p className="text-xl font-medium text-gray-900 mt-1">{MOCK_EMPLOYEES_PAYROLL.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Gross Pay</p>
                        <p className="text-xl font-medium text-gray-900 mt-1">AED {totalGross.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Employer WPS ID</p>
                        <p className="text-xl font-medium text-gray-900 mt-1">{MOCK_EMPLOYER.establishmentId}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {runPayrollResult && (
                <div className="rounded-md bg-success-50 border border-success-200 text-success-800 text-sm px-4 py-3">
                  {runPayrollResult}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setRunPayrollResult(`Preview generated for ${MOCK_EMPLOYEES_PAYROLL.length} employees — review the summary above before processing.`)}
                >
                  Preview
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    const { fileName, content } = generateWpsSif({
                      employer: MOCK_EMPLOYER,
                      payPeriod: new Date().toISOString().slice(0, 7),
                      payments: MOCK_EMPLOYEES_PAYROLL.map(e => ({
                        laborCardNumber: e.laborCardNumber,
                        iban: e.iban,
                        bankRoutingCode: e.bankRoutingCode,
                        fixedAmount: e.basicSalary + e.housingAllowance + e.transportAllowance,
                        variableAmount: e.otherAllowances,
                        daysWorked: 30,
                        leaveDays: 0,
                      })),
                    });
                    downloadTextFile(fileName, content);
                    setRunPayrollResult(`WPS file "${fileName}" generated for ${MOCK_EMPLOYEES_PAYROLL.length} employees. Validate the field layout against your bank's WPS template before submitting it.`);
                  }}
                >
                  Generate WPS File
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => setRunPayrollResult(`Payroll run queued for ${MOCK_EMPLOYEES_PAYROLL.length} employees. Real bank disbursement requires the Phase 1c backend.`)}
                >
                  Process Payroll
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
