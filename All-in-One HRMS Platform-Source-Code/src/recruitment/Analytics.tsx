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

type FunnelData = {
  stage: string;
  count: number;
  percentage: number;
  conversionRate?: number;
};

type SourceData = {
  source: string;
  count: number;
  percentage: number;
  quality: number;
};

type TimeToHireData = {
  position: string;
  days: number;
  candidates: number;
};

// Mock analytics data
const initialMetrics: MetricCard[] = [
  {
    id: '1',
    title: 'Total Applications',
    value: '372',
    change: '+12%',
    trend: 'up',
    color: 'indigo'
  },
  {
    id: '2',
    title: 'Time to Hire',
    value: '18 days',
    change: '-3 days',
    trend: 'up',
    color: 'green'
  },
  {
    id: '3',
    title: 'Cost per Hire',
    value: '$4,250',
    change: '+$250',
    trend: 'down',
    color: 'amber'
  },
  {
    id: '4',
    title: 'Offer Acceptance',
    value: '86%',
    change: '+4%',
    trend: 'up',
    color: 'blue'
  }
];

const funnelData: FunnelData[] = [
  { stage: 'Applied', count: 372, percentage: 100 },
  { stage: 'Screened', count: 215, percentage: 58, conversionRate: 58 },
  { stage: 'Interview', count: 124, percentage: 33, conversionRate: 58 },
  { stage: 'Assessment', count: 86, percentage: 23, conversionRate: 69 },
  { stage: 'Offer', count: 42, percentage: 11, conversionRate: 49 },
  { stage: 'Hired', count: 36, percentage: 10, conversionRate: 86 }
];

const sourcesData: SourceData[] = [
  { source: 'LinkedIn', count: 128, percentage: 34, quality: 72 },
  { source: 'Indeed', count: 95, percentage: 26, quality: 65 },
  { source: 'Referrals', count: 76, percentage: 20, quality: 88 },
  { source: 'Company Website', count: 54, percentage: 15, quality: 76 },
  { source: 'Other', count: 19, percentage: 5, quality: 61 }
];

const timeToHireData: TimeToHireData[] = [
  { position: 'Software Engineer', days: 22, candidates: 45 },
  { position: 'Product Manager', days: 26, candidates: 32 },
  { position: 'UX Designer', days: 18, candidates: 28 },
  { position: 'Data Analyst', days: 15, candidates: 23 },
  { position: 'Sales Representative', days: 12, candidates: 37 }
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

export default function RecruitmentAnalytics() {
  const [timeframe, setTimeframe] = useState('90days');
  const [position, setPosition] = useState('all');

  // Calculate maximum value for scaling in the funnel chart
  const maxFunnelCount = Math.max(...funnelData.map(item => item.count));

  return (
    <div className="space-y-6">      <PageHeader
        title="Recruitment Analytics"
        subtitle="Track and analyze your recruitment metrics and performance"
        actionButton={
          <Button variant="outline" onClick={() => exportMetricsToCSV(initialMetrics, 'recruitment-analytics.csv')}>
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
              { value: '180days', label: 'Last 6 Months' },
              { value: '365days', label: 'Last 12 Months' }
            ]}
          />
        </div>
        <div>
          <Select
            id="position"
            label="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            options={[
              { value: 'all', label: 'All Positions' },
              { value: 'engineering', label: 'Software Engineer' },
              { value: 'design', label: 'UX Designer' },
              { value: 'product', label: 'Product Manager' },
              { value: 'data', label: 'Data Analyst' },
              { value: 'sales', label: 'Sales Representative' }
            ]}
          />
        </div>
      </div>
      
      {/* Key metrics */}
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruitment Funnel */}
        <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm lg:col-span-2">
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Recruitment Funnel</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col space-y-4">
              {funnelData.map((stage, index) => (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{stage.stage}</span>
                      {index > 0 && (
                        <div className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                          {stage.conversionRate}% from previous
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{stage.count}</span>
                      <span className="text-gray-500 ml-1">({stage.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-4 rounded-full" 
                      style={{ width: `${(stage.count / maxFunnelCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Application Sources */}
        <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm">
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Application Sources</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {sourcesData.map((source) => (
                <div key={source.source} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-800">{source.source}</span>
                    <span className="font-medium">{source.count} ({source.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Candidate Quality Score:</span>
                    <span>{source.quality}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time to Hire by Position */}
        <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm">
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Time to Hire by Position</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Days to Hire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidates</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeToHireData.map((item) => (
                    <tr key={item.position}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${(item.days / 30) * 100}%` }}
                            ></div>
                          </div>
                          <span>{item.days} days</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.candidates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Hiring Manager Satisfaction */}
        <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm">
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Hiring Manager Satisfaction</h3>
          </div>
          <div className="p-6">
            <div className="flex justify-center mb-4">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="3"
                  />
                  <path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4338ca"
                    strokeWidth="3"
                    strokeDasharray="85, 100"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-3xl font-bold">85%</div>
                  <div className="text-xs text-gray-500">Satisfaction</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Candidate Quality</span>
                  <span className="text-sm text-gray-700">82%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Process Efficiency</span>
                  <span className="text-sm text-gray-700">88%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Communication</span>
                  <span className="text-sm text-gray-700">91%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '91%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Time to Fill</span>
                  <span className="text-sm text-gray-700">79%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '79%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
