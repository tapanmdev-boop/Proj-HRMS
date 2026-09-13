import { useState } from 'react';
import { PageHeader } from '../components/ui/Dashboard';
import { Button } from '../components/ui/Form';

// Mock report categories
const reportCategories = [
  {
    id: 'employee',
    name: 'Employee Reports',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    reports: [
      { id: 'emp-directory', name: 'Employee Directory' },
      { id: 'emp-headcount', name: 'Headcount Analysis' },
      { id: 'emp-turnover', name: 'Turnover Report' },
      { id: 'emp-demographics', name: 'Demographics Report' }
    ]
  },
  {
    id: 'attendance',
    name: 'Attendance Reports',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    reports: [
      { id: 'att-monthly', name: 'Monthly Attendance Report' },
      { id: 'att-late', name: 'Late Arrivals Report' },
      { id: 'att-absent', name: 'Absenteeism Report' },
      { id: 'att-overtime', name: 'Overtime Report' }
    ]
  },
  {
    id: 'leave',
    name: 'Leave Reports',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    reports: [
      { id: 'leave-balance', name: 'Leave Balance Report' },
      { id: 'leave-utilization', name: 'Leave Utilization Report' },
      { id: 'leave-trends', name: 'Leave Trends Analysis' }
    ]
  },
  {
    id: 'payroll',
    name: 'Payroll Reports',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    reports: [
      { id: 'payroll-summary', name: 'Payroll Summary Report' },
      { id: 'payroll-statutory', name: 'Statutory Compliance Report' },
      { id: 'payroll-tax', name: 'Tax Deduction Report' },
      { id: 'payroll-cost', name: 'Payroll Cost Analysis' }
    ]
  },
  {
    id: 'compliance',
    name: 'Compliance Reports',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    reports: [
      { id: 'comp-legal', name: 'Legal Compliance Report' },
      { id: 'comp-policy', name: 'Policy Compliance Report' }
    ]
  }
];

// Report button component for individual reports
interface ReportButtonProps {
  report: {
    id: string;
    name: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

const ReportButton = ({ report, isSelected, onClick }: ReportButtonProps) => {
  // Extract conditional class logic
  const getButtonClass = (selected: boolean): string => {
    return selected
      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
      : 'hover:bg-gray-50';
  };

  return (
    <button
      className={`p-3 border rounded-md text-center ${getButtonClass(isSelected)}`}
      onClick={onClick}
    >
      {report.name}
    </button>
  );
};

// Category button component for report categories
interface CategoryButtonProps {
  category: {
    id: string;
    name: string;
    icon: React.ReactNode;
    reports: Array<{ id: string; name: string }>;
  };
  isSelected: boolean;
  onClick: () => void;
}

const CategoryButton = ({ category, isSelected, onClick }: CategoryButtonProps) => {
  // Extract conditional class logic
  const getButtonClass = (selected: boolean): string => {
    return selected 
      ? 'bg-indigo-100 text-indigo-700' 
      : 'text-gray-700 hover:bg-gray-100';
  };

  return (
    <button
      className={`w-full flex items-center px-3 py-2 text-left text-sm rounded-md ${getButtonClass(isSelected)}`}
      onClick={onClick}
    >
      <span className="mr-3 text-indigo-500">{category.icon}</span>
      <span>{category.name}</span>
    </button>
  );
};

// Mock chart components (in a real app, use a charting library like Chart.js or Recharts)
const BarChart = ({ title }: { title: string }) => (
  <div className="bg-white p-4 rounded-lg border">
    <h3 className="text-md font-medium mb-2">{title}</h3>    <div className="h-40 flex items-end space-x-2">
      {[35, 65, 45, 80, 55, 40, 75].map((value, i) => {
        const chartId = `chart-bar-${String.fromCharCode(65 + i)}-${value}`;
        return (
          <div key={chartId} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-indigo-500 rounded-t"
              style={{ height: `${value}%` }}
            ></div>
            <div className="text-xs mt-1">{String.fromCharCode(65 + i)}</div>
          </div>
        );
      })}
    </div>
  </div>
);

const LineChart = ({ title }: { title: string }) => (
  <div className="bg-white p-4 rounded-lg border">
    <h3 className="text-md font-medium mb-2">{title}</h3>
    <div className="h-40 relative">
      <svg className="w-full h-full">
        <polyline
          points="0,80 40,60 80,100 120,30 160,70 200,40 240,20"
          fill="none"
          stroke="rgba(79, 70, 229, 1)"
          strokeWidth="2"
        />
        <polyline
          points="0,80 40,60 80,100 120,30 160,70 200,40 240,20"
          fill="rgba(79, 70, 229, 0.1)"
          strokeWidth="0"
        />
      </svg>
    </div>
  </div>
);

const PieChart = ({ title }: { title: string }) => (
  <div className="bg-white p-4 rounded-lg border">
    <h3 className="text-md font-medium mb-2">{title}</h3>
    <div className="h-40 flex justify-center items-center">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 36 36" className="h-full w-full">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#eee"
            strokeWidth="2"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#4F46E5"
            strokeWidth="2"
            strokeDasharray="60, 100"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-semibold">
          60%
        </div>
      </div>
    </div>
  </div>
);

function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  const csvRows = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function Reports() {
  const [selectedCategory, setSelectedCategory] = useState('employee');
  const [selectedReport, setSelectedReport] = useState('emp-headcount');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [department, setDepartment] = useState('All Departments');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleConfirmation, setScheduleConfirmation] = useState('');

  const currentCategory = reportCategories.find(category => category.id === selectedCategory);
  const currentReportName = currentCategory?.reports.find(r => r.id === selectedReport)?.name ?? selectedReport;

  // Example mock data for export (replace with real data as needed)
  const mockExportData = [
    { Name: 'John Smith', Department: 'Engineering', Status: 'Active' },
    { Name: 'Maria Garcia', Department: 'Design', Status: 'Active' },
    { Name: 'David Johnson', Department: 'Product', Status: 'Active' },
  ];

  // The export now reflects whichever report/filters are actually selected
  // (report name in the filename, department applied as a real filter)
  // instead of always emitting the same fixed 3 rows regardless of selection.
  const handleExportReport = () => {
    const filtered = department === 'All Departments'
      ? mockExportData
      : mockExportData.filter(row => row.Department === department);
    exportToCSV(filtered, `${selectedReport}-${dateRange.replace(/\s+/g, '-').toLowerCase()}.csv`);
  };

  return (
    <div>
      <PageHeader
        title="HR Reports & Analytics"
        subtitle="Generate and analyze HR metrics and reports"
        actionButton={
          <div className="flex space-x-2">
            <Button onClick={handleExportReport}>Export Report</Button>
            <Button variant="outline" onClick={() => setShowScheduleModal(true)}>Schedule Report</Button>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Report Categories */}
        <div className="md:col-span-1 bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Report Categories</h3>
          <nav className="space-y-1">
            {reportCategories.map((category) => (              <CategoryButton
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedReport(category.reports[0].id);
                }}
              />
            ))}
          </nav>
        </div>

        {/* Report Content */}
        <div className="md:col-span-4">
          {/* Report Selection */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium mb-4">Available {currentCategory?.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {currentCategory?.reports.map((report) => (                <ReportButton
                  key={report.id}
                  report={report}
                  isSelected={selectedReport === report.id}
                  onClick={() => setSelectedReport(report.id)}
                />
              ))}
            </div>
          </div>

          {/* Report Visualization */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">
                {currentReportName}
              </h2>
              <div className="flex space-x-3">
                <select className="border rounded-md px-3 py-1 text-sm" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Last Year</option>
                  <option>Custom Range</option>
                </select>
                <select className="border rounded-md px-3 py-1 text-sm" value={department} onChange={e => setDepartment(e.target.value)}>
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>Design</option>
                  <option>Product</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                  <option>HR</option>
                </select>
              </div>
            </div>

            {/* Visualization components based on the selected report */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <div className="text-sm text-indigo-700">Total Employees</div>
                  <div className="text-2xl font-bold">127</div>
                  <div className="text-xs text-indigo-500 mt-1">↑ 4% from last month</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="text-sm text-green-700">Active Employees</div>
                  <div className="text-2xl font-bold">120</div>
                  <div className="text-xs text-green-500 mt-1">↑ 2% from last month</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <div className="text-sm text-amber-700">Average Tenure</div>
                  <div className="text-2xl font-bold">2.4 years</div>
                  <div className="text-xs text-amber-500 mt-1">↑ 0.2 from last month</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BarChart title="Department Distribution" />
                <LineChart title="Headcount Trends" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PieChart title="Gender Distribution" />
                <PieChart title="Employment Type" />
                <PieChart title="Age Distribution" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {scheduleConfirmation && (
        <div className="mt-4 rounded-md bg-success-50 border border-success-200 text-success-800 text-sm px-4 py-3">
          {scheduleConfirmation}
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Schedule Report</h3>
            <p className="text-sm text-gray-600 mb-4">
              Send "{currentReportName}" on a recurring basis. (Not yet persisted — recurring delivery requires the backend email service.)
            </p>
            <select className="w-full border rounded px-3 py-2 mb-4" defaultValue="Weekly">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleConfirmation(`"${currentReportName}" scheduled for recurring delivery.`);
                }}
              >
                Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
