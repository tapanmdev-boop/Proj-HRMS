import { useState } from 'react';
import { PageHeader } from '../components/ui/Dashboard';
import { Select, Button } from '../components/ui/Form';

type MetricCard = {
  id: string;
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
};

type PerformanceTrend = {
  month: string;
  reviews: number;
  goals: number;
  feedback: number;
};

const initialMetrics: MetricCard[] = [
  {
    id: '1',
    title: 'Review Completion Rate',
    value: '86%',
    change: '+4%',
    trend: 'up',
    color: 'green'
  },
  {
    id: '2',
    title: 'Goal Achievement',
    value: '73%',
    change: '+2%',
    trend: 'up',
    color: 'blue'
  },
  {
    id: '3',
    title: 'Feedback Engagement',
    value: '68%',
    change: '-3%',
    trend: 'down',
    color: 'amber'
  },
  {
    id: '4',
    title: '1:1 Meeting Completion',
    value: '92%',
    change: '+5%',
    trend: 'up',
    color: 'indigo'
  }
];

const performanceTrends: PerformanceTrend[] = [
  { month: 'Jan', reviews: 78, goals: 65, feedback: 71 },
  { month: 'Feb', reviews: 82, goals: 68, feedback: 69 },
  { month: 'Mar', reviews: 79, goals: 70, feedback: 72 },
  { month: 'Apr', reviews: 81, goals: 72, feedback: 70 },
  { month: 'May', reviews: 85, goals: 73, feedback: 67 },
  { month: 'Jun', reviews: 86, goals: 73, feedback: 68 }
];

// Department performance data for radar chart
const departmentPerformance = [
  {
    department: 'Engineering',
    metrics: {
      reviewCompletion: 88,
      goalAchievement: 75,
      feedbackQuality: 82,
      skillsDevelopment: 79,
      teamCollaboration: 86
    }
  },
  {
    department: 'Marketing',
    metrics: {
      reviewCompletion: 92,
      goalAchievement: 81,
      feedbackQuality: 76,
      skillsDevelopment: 72,
      teamCollaboration: 78
    }
  },
  {
    department: 'Sales',
    metrics: {
      reviewCompletion: 85,
      goalAchievement: 89,
      feedbackQuality: 73,
      skillsDevelopment: 68,
      teamCollaboration: 82
    }
  },
  {
    department: 'Product',
    metrics: {
      reviewCompletion: 90,
      goalAchievement: 76,
      feedbackQuality: 85,
      skillsDevelopment: 82,
      teamCollaboration: 84
    }
  }
];

function exportMetricsToCSV(rows: MetricCard[], filename: string) {
  if (!rows.length) return;
  const csvRows = [
    'Metric,Value,Change',
    ...rows.map(r => `"${r.title}","${r.value}","${r.change}"`),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('6months');
  const [department, setDepartment] = useState('all');

  return (
    <div className="space-y-6">      <PageHeader
        title="Performance Analytics"
        subtitle="Track and analyze performance metrics across your organization"
        actionButton={
          <Button variant="outline" onClick={() => exportMetricsToCSV(initialMetrics, 'performance-analytics.csv')}>
            Export CSV
          </Button>
        }
      />
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <Select
            id="timeframe"
            label="Time Period"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            options={[
              { value: '30days', label: 'Last 30 Days' },
              { value: '90days', label: 'Last 90 Days' },
              { value: '6months', label: 'Last 6 Months' },
              { value: '12months', label: 'Last 12 Months' }
            ]}
          />
        </div>
        <div>
          <Select
            id="department"
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[
              { value: 'all', label: 'All Departments' },
              { value: 'engineering', label: 'Engineering' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'sales', label: 'Sales' },
              { value: 'product', label: 'Product' }
            ]}
          />
        </div>
      </div>
      
      {/* Key performance metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {initialMetrics.map((metric) => (
          <div 
            key={metric.id} 
            className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6 border-t-2"
            style={{ borderColor: `var(--color-${metric.color}-500)` }}
          >
            <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gray-500">{metric.title}</h3>
            <div className="mt-2 flex justify-between items-end">
              <p className="text-3xl font-bold">{metric.value}</p>
              <div className={`flex items-center text-${metric.color}-600`}>
                <span className="text-sm font-medium">{metric.change}</span>
                {metric.trend === 'up' && (
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {metric.trend === 'down' && (
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Performance trends chart */}
      <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Performance Trends</h3>
        <div className="h-80 w-full">
          {/* This would ideally be a chart component using a library like Chart.js or Recharts */}
          <div className="flex h-64 items-end space-x-2">
            {performanceTrends.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-around h-52">
                  <div 
                    className="w-3 bg-blue-500 rounded-t" 
                    style={{ height: `${item.reviews}%` }}
                    title={`Reviews: ${item.reviews}%`}
                  />
                  <div 
                    className="w-3 bg-green-500 rounded-t" 
                    style={{ height: `${item.goals}%` }}
                    title={`Goals: ${item.goals}%`}
                  />
                  <div 
                    className="w-3 bg-purple-500 rounded-t" 
                    style={{ height: `${item.feedback}%` }}
                    title={`Feedback: ${item.feedback}%`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">{item.month}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
              <span className="text-xs text-gray-600">Reviews</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span className="text-xs text-gray-600">Goals</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
              <span className="text-xs text-gray-600">Feedback</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Department Performance Comparison */}
      <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Department Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Completion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goal Achievement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback Quality</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills Development</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Collaboration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departmentPerformance.map((dept) => (
                <tr key={dept.department}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${dept.metrics.reviewCompletion}%` }}></div>
                      </div>
                      <span className="ml-2 text-gray-900">{dept.metrics.reviewCompletion}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${dept.metrics.goalAchievement}%` }}></div>
                      </div>
                      <span className="ml-2 text-gray-900">{dept.metrics.goalAchievement}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${dept.metrics.feedbackQuality}%` }}></div>
                      </div>
                      <span className="ml-2 text-gray-900">{dept.metrics.feedbackQuality}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: `${dept.metrics.skillsDevelopment}%` }}></div>
                      </div>
                      <span className="ml-2 text-gray-900">{dept.metrics.skillsDevelopment}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${dept.metrics.teamCollaboration}%` }}></div>
                      </div>
                      <span className="ml-2 text-gray-900">{dept.metrics.teamCollaboration}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Top Performers</h3>
          <ul className="divide-y divide-gray-200">
            {[
              { name: 'Alex Johnson', role: 'Senior Developer', score: 96, department: 'Engineering' },
              { name: 'Maria Garcia', role: 'Marketing Lead', score: 94, department: 'Marketing' },
              { name: 'David Kim', role: 'Product Manager', score: 92, department: 'Product' },
              { name: 'Sarah Williams', role: 'UX Designer', score: 91, department: 'Design' },
              { name: 'James Wilson', role: 'Sales Director', score: 90, department: 'Sales' }
            ].map((person) => (
              <li key={person.name} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{person.name}</p>
                  <p className="text-sm text-gray-500">{person.role} • {person.department}</p>
                </div>
                <div className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
                  {person.score}%
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Areas for Improvement */}
        <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Areas for Improvement</h3>
          <ul className="space-y-4">
            {[
              { area: 'Skill Development', department: 'Sales', score: 68 },
              { area: 'Goal Setting & Tracking', department: 'Marketing', score: 72 },
              { area: 'Peer Feedback Quality', department: 'Engineering', score: 75 },
              { area: '1:1 Meeting Frequency', department: 'Customer Support', score: 76 },
              { area: 'Recognition & Rewards', department: 'All Departments', score: 77 }
            ].map((item) => (
              <li key={item.area} className="flex flex-col">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.area}</span>
                  <span className="text-sm font-medium text-gray-700">{item.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-amber-500 h-2.5 rounded-full" 
                    style={{ width: `${item.score}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-1">{item.department}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
