import { useState } from 'react';
import { PageHeader, DataTable } from '../components/ui/Dashboard';
import { Button, Input } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';

// Mock survey data
const initialSurveys = [
  {
    id: '1',
    title: 'Employee Engagement Survey Q2 2025',
    status: 'Active',
    startDate: '2025-06-01',
    endDate: '2025-06-15',
    responseRate: 65,
    department: 'All Departments'
  },
  {
    id: '2',
    title: 'Work-Life Balance Assessment',
    status: 'Active',
    startDate: '2025-06-05',
    endDate: '2025-06-20',
    responseRate: 48,
    department: 'All Departments'
  },
  {
    id: '3',
    title: 'Manager Effectiveness Survey',
    status: 'Draft',
    startDate: '',
    endDate: '',
    responseRate: 0,
    department: 'All Departments'
  },
  {
    id: '4',
    title: 'Product Team Collaboration Survey',
    status: 'Completed',
    startDate: '2025-05-10',
    endDate: '2025-05-25',
    responseRate: 92,
    department: 'Product'
  },
  {
    id: '5',
    title: 'Remote Work Effectiveness',
    status: 'Completed',
    startDate: '2025-04-15',
    endDate: '2025-04-30',
    responseRate: 78,
    department: 'All Departments'
  }
];

// Column definitions for the surveys table
const surveyColumns = [
  { key: 'title', label: 'Survey Title' },
  { key: 'status', label: 'Status' },
  { key: 'dateRange', label: 'Date Range' },
  { key: 'responseRate', label: 'Response Rate' },
  { key: 'department', label: 'Department' }
];

// Mock survey template categories
const surveyTemplates = [
  {
    category: 'Employee Engagement',
    templates: [
      { id: 'template1', name: 'Standard Engagement Survey' },
      { id: 'template2', name: 'Pulse Check' },
      { id: 'template3', name: 'eNPS Survey' }
    ]
  },
  {
    category: 'Work Environment',
    templates: [
      { id: 'template4', name: 'Remote Work Assessment' },
      { id: 'template5', name: 'Workspace Satisfaction' },
      { id: 'template6', name: 'Work-Life Balance' }
    ]
  },
  {
    category: 'Team & Management',
    templates: [
      { id: 'template7', name: 'Team Dynamics Survey' },
      { id: 'template8', name: 'Manager Effectiveness' },
      { id: 'template9', name: 'Communication Assessment' }
    ]
  },
  {
    category: 'Company Culture',
    templates: [
      { id: 'template10', name: 'Company Values Alignment' },
      { id: 'template11', name: 'Diversity & Inclusion Survey' },
      { id: 'template12', name: 'Organizational Health' }
    ]
  }
];

export default function Surveys() {
  // Was a plain const — no way for Create/Save as Draft/Launch/Edit to
  // persist anything.
  const [surveys, setSurveys] = useState(initialSurveys);
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ title: '', startDate: '', endDate: '', department: 'all' });
  const [actionMessage, setActionMessage] = useState('');

  // Format date values
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Create date range string from start and end dates
  const getDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'Not scheduled';
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Render survey status with appropriate styling
  const renderStatus = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success" rounded>{status}</Badge>;
      case 'Draft':
        return <Badge variant="secondary" rounded>{status}</Badge>;
      case 'Completed':
        return <Badge variant="info" rounded>{status}</Badge>;
      case 'Scheduled':
        return <Badge variant="warning" rounded>{status}</Badge>;
      default:
        return <Badge variant="secondary" rounded>{status}</Badge>;
    }
  };
  // Render response rate with progress bar
  const renderResponseRate = (rate: number) => {
    // Extract nested ternary into a function that determines color based on response rate
    const getColorClass = (value: number): string => {
      if (value < 40) return 'bg-red-500';
      if (value < 70) return 'bg-yellow-500';
      return 'bg-green-500';
    };

    return (
      <div className="flex items-center">
        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
          <div
            className={`h-2 rounded-full ${getColorClass(rate)}`}
            style={{ width: `${rate}%` }}
          ></div>
        </div>
        <span>{rate}%</span>
      </div>
    );
  };

  // Format survey data for display
  const formattedSurveys = surveys.map(survey => ({
    ...survey,
    dateRange: getDateRange(survey.startDate, survey.endDate),
    status: renderStatus(survey.status),
    responseRate: renderResponseRate(survey.responseRate)
  }));

  const handleRowClick = (survey: Record<string, any>) => {
    setSelectedSurvey(survey.id);
    setShowTemplates(false);
  };

  const handleCreateSurvey = () => {
    setSelectedSurvey(null);
    setEditingSurveyId(null);
    setFormState({ title: '', startDate: '', endDate: '', department: 'all' });
    setShowTemplates(true);
  };

  const handleEditSurvey = (survey: { id: string; title: string; startDate: string; endDate: string; department: string }) => {
    setEditingSurveyId(survey.id);
    setFormState({ title: survey.title, startDate: survey.startDate, endDate: survey.endDate, department: survey.department });
    setSelectedSurvey(null);
    setShowTemplates(true);
  };

  const getSurvey = (id: string | null) => {
    return surveys.find(survey => survey.id === id);
  };

  const handleSaveSurvey = (status: 'Draft' | 'Active') => {
    if (!formState.title) return;
    if (editingSurveyId) {
      setSurveys(prev => prev.map(s => s.id === editingSurveyId ? { ...s, ...formState, status } : s));
    } else {
      setSurveys(prev => [
        { id: `survey-${Date.now()}`, ...formState, status, responseRate: 0 },
        ...prev,
      ]);
    }
    setShowTemplates(false);
    setEditingSurveyId(null);
  };

  const handleLaunchSurvey = (id: string) => {
    setSurveys(prev => prev.map(s => s.id === id
      ? { ...s, status: 'Active', startDate: s.startDate || new Date().toISOString().split('T')[0] }
      : s
    ));
  };

  const showActionMessage = (message: string) => {
    setActionMessage(message);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Employee Engagement Surveys"
        subtitle="Create, manage, and analyze employee feedback surveys"
        actionButton={
          <Button onClick={handleCreateSurvey}>Create New Survey</Button>
        }
      />

      {actionMessage && (
        <div className="mt-4 rounded-md bg-success-50 border border-success-200 text-success-800 text-sm px-4 py-3">
          {actionMessage}
        </div>
      )}

      <div className="mt-6 bg-white overflow-hidden rounded-xl border border-ivory-300 shadow-premium-sm">
        <DataTable
          columns={surveyColumns}
          data={formattedSurveys}
          actions={(survey) => (
            <div className="flex space-x-2">
              <button
                className="text-blue-600 hover:text-blue-800 text-sm"
                onClick={() => handleRowClick(survey)}
              >
                {survey._original?.status === 'Draft' ? 'Edit' : 'View Results'}
              </button>
              {survey._original?.status === 'Active' && (
                <button
                  className="text-green-600 hover:text-green-800 text-sm"
                  onClick={() => showActionMessage(`Reminder sent to all pending recipients of "${survey.title}".`)}
                >
                  Send Reminder
                </button>
              )}
            </div>
          )}
        />
      </div>

      {showTemplates ? (
        <div className="mt-6 bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">{editingSurveyId ? 'Edit Survey' : 'Create New Survey'}</h3>
            <Button variant="outline" onClick={() => { setShowTemplates(false); setEditingSurveyId(null); }}>
              Cancel
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Survey Title"
                placeholder="Enter survey title..."
                value={formState.title}
                onChange={e => setFormState({ ...formState, title: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formState.startDate}
                  onChange={e => setFormState({ ...formState, startDate: e.target.value })}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={formState.endDate}
                  onChange={e => setFormState({ ...formState, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gold-400 focus:border-gold-500"
                value={formState.department}
                onChange={e => setFormState({ ...formState, department: e.target.value })}
              >
                <option value="all">All Departments</option>
                <option value="engineering">Engineering</option>
                <option value="product">Product</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="hr">Human Resources</option>
              </select>
            </div>

            <div>
              <h4 className="font-medium mb-4">Survey Templates</h4>
              <div className="space-y-6">
                {surveyTemplates.map((category) => (
                  <div key={category.category}>
                    <h5 className="font-medium text-gray-700 mb-2">{category.category}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {category.templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setFormState({ ...formState, title: template.name })}
                          className={`border rounded-md p-4 text-left hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-colors ${formState.title === template.name ? 'border-indigo-500 bg-indigo-50' : ''}`}
                        >
                          <h6 className="font-medium">{template.name}</h6>
                          <p className="text-sm text-gray-500 mt-1">
                            Use this template as a starting point
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => handleSaveSurvey('Draft')}>Save as Draft</Button>
              <Button onClick={() => handleSaveSurvey('Active')}>{editingSurveyId ? 'Save Survey' : 'Create Survey'}</Button>
            </div>
          </div>
        </div>
      ) : selectedSurvey && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Survey Information */}
          <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Survey Information</h3>
            {getSurvey(selectedSurvey) && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium">{getSurvey(selectedSurvey)?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span>{renderStatus(getSurvey(selectedSurvey)?.status ?? '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">{formatDate(getSurvey(selectedSurvey)?.startDate ?? '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-medium">{formatDate(getSurvey(selectedSurvey)?.endDate ?? '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{getSurvey(selectedSurvey)?.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Rate:</span>
                  <span className="font-medium">{getSurvey(selectedSurvey)?.responseRate}%</span>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Quick Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Recipients:</span>
                      <span className="font-medium">127</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Responses:</span>
                      <span className="font-medium">
                        {Math.round(127 * (getSurvey(selectedSurvey)?.responseRate ?? 0) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completion Time (avg):</span>
                      <span className="font-medium">6.5 min</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 mt-6">
                  {getSurvey(selectedSurvey)?.status === 'Active' && (
                    <>
                      <Button onClick={() => showActionMessage(`Reminder sent to all pending recipients of "${getSurvey(selectedSurvey)?.title}".`)}>
                        Send Reminder
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(`${selectedSurvey}-responses.csv`, `Survey,Response Rate\n${getSurvey(selectedSurvey)?.title},${getSurvey(selectedSurvey)?.responseRate}%\n`)}
                      >
                        Download Responses
                      </Button>
                    </>
                  )}
                  {getSurvey(selectedSurvey)?.status === 'Completed' && (
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(`${selectedSurvey}-report.txt`, `Report for ${getSurvey(selectedSurvey)?.title}\nResponse Rate: ${getSurvey(selectedSurvey)?.responseRate}%\n\n(Detailed results are shown in the panel to the right.)\n`)}
                    >
                      Download Report
                    </Button>
                  )}
                  {getSurvey(selectedSurvey)?.status === 'Draft' && (
                    <>
                      <Button onClick={() => { const s = getSurvey(selectedSurvey); if (s) handleEditSurvey(s); }}>
                        Edit Survey
                      </Button>
                      <Button variant="outline" onClick={() => setShowPreviewModal(true)}>Preview Survey</Button>
                      <Button variant="outline" onClick={() => selectedSurvey && handleLaunchSurvey(selectedSurvey)}>Launch Survey</Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Survey Results */}
          <div className="md:col-span-2 bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">
              {getSurvey(selectedSurvey)?.status === 'Draft' ? 'Survey Questions' : 'Survey Results'}
            </h3>
            
            {getSurvey(selectedSurvey)?.status === 'Draft' ? (
              <div className="space-y-4">
                <p className="text-gray-600">This survey is still in draft mode. No responses have been collected yet.</p>
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">Sample Questions</h4>
                  <div className="space-y-3">
                    <div className="border-b pb-3">
                      <p className="font-medium">How would you rate your overall job satisfaction?</p>
                      <p className="text-sm text-gray-500">Rating Scale (1-5)</p>
                    </div>
                    <div className="border-b pb-3">
                      <p className="font-medium">What aspects of our company culture do you appreciate the most?</p>
                      <p className="text-sm text-gray-500">Multiple Choice</p>
                    </div>
                    <div className="border-b pb-3">
                      <p className="font-medium">Do you feel that you have opportunities for professional growth?</p>
                      <p className="text-sm text-gray-500">Likert Scale (Agreement)</p>
                    </div>
                    <div>
                      <p className="font-medium">What suggestions do you have for improving our workplace?</p>
                      <p className="text-sm text-gray-500">Open Text</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Sample results visualization for active and completed surveys */}
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Overall Engagement Score</h4>
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center text-xl font-bold text-indigo-700 mr-4">
                        7.8
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">out of 10</p>
                        <p className="text-green-600 text-sm">↑ 0.5 from last survey</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">eNPS Score</h4>
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center text-xl font-bold text-green-700 mr-4">
                        32
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Promoters - Detractors</p>
                        <p className="text-green-600 text-sm">↑ 8 from last survey</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-4">Key Metrics</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Work-Life Balance</span>
                        <span className="text-sm font-medium">8.2/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '82%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Manager Support</span>
                        <span className="text-sm font-medium">7.5/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Growth Opportunities</span>
                        <span className="text-sm font-medium">6.8/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Team Collaboration</span>
                        <span className="text-sm font-medium">8.7/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Common Themes from Comments</h4>
                    <span className="text-sm text-gray-500">Based on 42 comments</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-100 text-green-800 text-xs font-semibold rounded-full px-2.5 py-0.5">
                        Positive
                      </span>
                      <span>Flexible work arrangements mentioned 18 times</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-100 text-green-800 text-xs font-semibold rounded-full px-2.5 py-0.5">
                        Positive
                      </span>
                      <span>Supportive team environment mentioned 15 times</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-red-100 text-red-800 text-xs font-semibold rounded-full px-2.5 py-0.5">
                        Negative
                      </span>
                      <span>Meeting frequency concerns mentioned 12 times</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-red-100 text-red-800 text-xs font-semibold rounded-full px-2.5 py-0.5">
                        Negative
                      </span>
                      <span>Career advancement clarity mentioned 10 times</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* This used to render unconditionally (relying on `survey` being
          undefined when nothing was selected), which meant a full-screen
          dark overlay + "Title: undefined" modal sat on top of this entire
          page at all times. Now it only mounts when explicitly opened via
          "Preview Survey". */}
      {showPreviewModal && (
        <SurveyPreviewModal survey={getSurvey(selectedSurvey)} onClose={() => setShowPreviewModal(false)} />
      )}
    </div>
  );
}

// Move the inline component definition out of the parent component
const SurveyPreviewModal = ({ survey, onClose }: { survey: any; onClose: () => void }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px] z-50">
    <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-md">
      <h2 className="font-display text-[22px] font-medium tracking-[-0.015em] text-ink-900 mb-4">Survey Preview</h2>
      <div className="mb-4">
        <p><span className="font-semibold">Title:</span> {survey?.title}</p>
        <p><span className="font-semibold">Status:</span> {survey?.status}</p>
        {/* Add more fields as needed */}
      </div>
      <button onClick={onClose} className="bg-blue-500 text-white px-4 py-2 rounded">Close</button>
    </div>
  </div>
);
