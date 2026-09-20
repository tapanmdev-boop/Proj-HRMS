import { useState } from 'react';
import { PageHeader } from '../components/ui/Dashboard';
import { Button, Input, Select, Textarea } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';

type Interview = {
  id: string;
  candidateName: string;
  position: string;
  date: string;
  time: string;
  duration: number;
  interviewers: string[];
  type: 'video' | 'phone' | 'onsite';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
};

type InterviewCalendarEntry = {
  date: string;
  dayOfWeek: string;
  interviews: Interview[];
};

// Mock interview data
const initialInterviews: Interview[] = [
  {
    id: '1',
    candidateName: 'Maria Rodriguez',
    position: 'UX/UI Designer',
    date: '2025-06-15',
    time: '10:00',
    duration: 45,
    interviewers: ['Alex Thompson', 'Sarah Chen'],
    type: 'video',
    status: 'scheduled'
  },
  {
    id: '2',
    candidateName: 'James Wilson',
    position: 'Full Stack Developer',
    date: '2025-06-15',
    time: '13:30',
    duration: 60,
    interviewers: ['Mike Johnson', 'Emily Davis', 'Robert Kim'],
    type: 'video',
    status: 'scheduled'
  },
  {
    id: '3',
    candidateName: 'Sarah Parker',
    position: 'Product Manager',
    date: '2025-06-16',
    time: '11:00',
    duration: 60,
    interviewers: ['David Lee', 'Jennifer Wu'],
    type: 'onsite',
    status: 'scheduled'
  },
  {
    id: '4',
    candidateName: 'Michael Chang',
    position: 'Full Stack Developer',
    date: '2025-06-14',
    time: '14:00',
    duration: 45,
    interviewers: ['Emily Davis', 'Robert Kim'],
    type: 'video',
    status: 'completed',
    notes: 'Strong technical skills, good culture fit. Moving to next round.'
  }
];

// Team members for scheduling
const teamMembers = [
  { id: '1', name: 'Alex Thompson', role: 'Design Lead', availability: 'High' },
  { id: '2', name: 'Sarah Chen', role: 'Senior Designer', availability: 'Medium' },
  { id: '3', name: 'Mike Johnson', role: 'Tech Lead', availability: 'Low' },
  { id: '4', name: 'Emily Davis', role: 'Senior Developer', availability: 'High' },
  { id: '5', name: 'Robert Kim', role: 'Developer', availability: 'Medium' },
  { id: '6', name: 'David Lee', role: 'Product Director', availability: 'Low' },
  { id: '7', name: 'Jennifer Wu', role: 'Product Manager', availability: 'Medium' }
];

// Generate calendar days
const generateCalendarDays = (interviews: Interview[]): InterviewCalendarEntry[] => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const calendarDays: InterviewCalendarEntry[] = [];
  
  // Get all unique dates from interviews
  const uniqueDates = [...new Set(interviews.map(interview => interview.date))];
  
  // Add some dates without interviews for completeness
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    if (!uniqueDates.includes(dateString)) {
      uniqueDates.push(dateString);
    }
  }
  
  // Sort dates
  uniqueDates.sort((a, b) => a.localeCompare(b));
  
  // Create calendar entries
  uniqueDates.forEach(dateString => {
    const date = new Date(dateString);
    const dayOfWeek = dayNames[date.getDay()];
    const dayInterviews = interviews.filter(interview => interview.date === dateString);
    
    calendarDays.push({
      date: dateString,
      dayOfWeek,
      interviews: dayInterviews
    });
  });
  
  return calendarDays;
};

export default function InterviewScheduler() {
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews);
  const [calendarView, setCalendarView] = useState<'week' | 'day'>('week');
  const [showNewInterviewForm, setShowNewInterviewForm] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [calendarDays, setCalendarDays] = useState<InterviewCalendarEntry[]>(
    generateCalendarDays(initialInterviews)
  );
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [viewingScheduleForId, setViewingScheduleForId] = useState<string | null>(null);

  const updateInterview = (id: string, changes: Partial<Interview>) => {
    setInterviews(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, ...changes } : i);
      setCalendarDays(generateCalendarDays(updated));
      return updated;
    });
    setSelectedInterview(prev => prev && prev.id === id ? { ...prev, ...changes } : prev);
  };

  const handleCancelInterview = () => {
    if (!selectedInterview) return;
    updateInterview(selectedInterview.id, { status: 'cancelled' });
    setSelectedInterview(null);
  };

  const handleStartReschedule = () => {
    if (!selectedInterview) return;
    setRescheduleForm({ date: selectedInterview.date, time: selectedInterview.time });
    setIsRescheduling(true);
  };

  const handleSaveReschedule = () => {
    if (!selectedInterview || !rescheduleForm.date || !rescheduleForm.time) return;
    updateInterview(selectedInterview.id, { date: rescheduleForm.date, time: rescheduleForm.time });
    setIsRescheduling(false);
  };

  const handleStartCompletion = () => {
    setCompletionNotes(selectedInterview?.notes ?? '');
    setIsCompleting(true);
  };

  const handleSaveCompletion = () => {
    if (!selectedInterview) return;
    updateInterview(selectedInterview.id, { status: 'completed', notes: completionNotes || undefined });
    setIsCompleting(false);
  };

  // New interview form state
  const [newInterview, setNewInterview] = useState<Omit<Interview, 'id'>>({
    candidateName: '',
    position: '',
    date: '',
    time: '',
    duration: 45,
    interviewers: [],
    type: 'video',
    status: 'scheduled'
  });
  
  const handleCreateInterview = () => {
    const interviewId = Date.now().toString();
    const createdInterview: Interview = {
      ...newInterview,
      id: interviewId
    };
    
    const updatedInterviews = [...interviews, createdInterview];
    setInterviews(updatedInterviews);
    setCalendarDays(generateCalendarDays(updatedInterviews));
    setShowNewInterviewForm(false);
    
    // Reset form
    setNewInterview({
      candidateName: '',
      position: '',
      date: '',
      time: '',
      duration: 45,
      interviewers: [],
      type: 'video',
      status: 'scheduled'
    });
  };
  
  const handleSelectInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsRescheduling(false);
    setIsCompleting(false);
  };

  const handleCloseInterviewDetails = () => {
    setSelectedInterview(null);
    setIsRescheduling(false);
    setIsCompleting(false);
  };
  
  const getInterviewTimeDisplay = (interview: Interview) => {
    const timeString = interview.time;
    const hours = parseInt(timeString.split(':')[0]);
    const minutes = timeString.split(':')[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };
  
  const getInterviewStatusColor = (status: Interview['status']) => {
    switch(status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'no-show': return 'warning';
      default: return 'info';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Interview Scheduler" 
      />
      
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2">
          <Button 
            variant={calendarView === 'week' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setCalendarView('week')}
          >
            Week View
          </Button>
          <Button 
            variant={calendarView === 'day' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setCalendarView('day')}
          >
            Day View
          </Button>
        </div>
        
        <Button 
          variant="primary" 
          onClick={() => setShowNewInterviewForm(true)}
        >
          Schedule Interview
        </Button>
      </div>
      
      <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Interview Calendar</h3>
        </div>
        
        {/* Calendar Body */}
        <div className="p-4">
          <div className="grid grid-cols-1 gap-6">
            {calendarDays.map((day) => (
              <div key={day.date} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 border-b border-gray-200">
                  <h4 className="font-medium">
                    {day.dayOfWeek}, {formatDate(day.date)}
                  </h4>
                </div>
                
                <div className="p-3">
                  {day.interviews.length > 0 ? (
                    <ul className="space-y-3">                      {day.interviews.map((interview) => (
                        <li key={interview.id} className="border border-gray-200 rounded-md overflow-hidden">
                          <button 
                            className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-opacity-50"
                            onClick={() => handleSelectInterview(interview)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{interview.candidateName}</p>
                                <p className="text-sm text-gray-500">{interview.position}</p>
                              </div>
                              <Badge variant={getInterviewStatusColor(interview.status)}>
                                {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-2 items-center text-sm text-gray-600">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {getInterviewTimeDisplay(interview)} ({interview.duration} mins)
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {interview.interviewers.length} interviewer{interview.interviewers.length !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center">
                                {interview.type === 'video' && (
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                                {interview.type === 'phone' && (
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                )}
                                {interview.type === 'onsite' && (
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                )}
                                {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No interviews scheduled</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Team Availability Panel */}
      <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm overflow-hidden">
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Team Availability</h3>
        </div>
        
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">                        {renderAvailabilityBadge(member.availability)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-4" onClick={() => setViewingScheduleForId(member.id)}>View Schedule</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* New Interview Modal */}
      {showNewInterviewForm && (
        <div className="fixed inset-0 bg-ink-950/50 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Schedule New Interview</h3>
              <button 
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowNewInterviewForm(false)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Name
                  </label>
                  <Input
                    id="candidateName"
                    type="text"
                    value={newInterview.candidateName}
                    onChange={(e) => setNewInterview({...newInterview, candidateName: e.target.value})}
                    label="Candidate Name"
                  />
                </div>
                
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <Input
                    id="position"
                    type="text"
                    value={newInterview.position}
                    onChange={(e) => setNewInterview({...newInterview, position: e.target.value})}
                    label="Position"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <Input
                    id="date"
                    type="date"
                    value={newInterview.date}
                    onChange={(e) => setNewInterview({...newInterview, date: e.target.value})}
                    label="Date"
                  />
                </div>
                
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <Input
                    id="time"
                    type="time"
                    value={newInterview.time}
                    onChange={(e) => setNewInterview({...newInterview, time: e.target.value})}
                    label="Time"
                  />
                </div>
                
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <Select
                    id="duration"
                    value={newInterview.duration.toString()}
                    onChange={(e) => setNewInterview({...newInterview, duration: Number(e.target.value)})}
                    options={[
                      { value: '15', label: '15 minutes' },
                      { value: '30', label: '30 minutes' },
                      { value: '45', label: '45 minutes' },
                      { value: '60', label: '1 hour' },
                      { value: '90', label: '1.5 hours' },
                      { value: '120', label: '2 hours' }
                    ]}
                    label="Duration"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Type
                </label>
                <Select
                  id="type"
                  value={newInterview.type}
                  onChange={(e) => setNewInterview({...newInterview, type: e.target.value as 'video' | 'phone' | 'onsite'})}
                  options={[
                    { value: 'video', label: 'Video Call' },
                    { value: 'phone', label: 'Phone Interview' },
                    { value: 'onsite', label: 'Onsite Interview' }
                  ]}
                  label="Interview Type"
                />
              </div>
              
              <div>                <label htmlFor="interviewers" className="block text-sm font-medium text-gray-700 mb-1">
                  Interviewers
                </label>
                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newInterview.interviewers.map((interviewer) => (
                      <div key={interviewer} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        {interviewer}
                        <button
                          type="button"
                          className="ml-1 text-white"
                          onClick={() => {
                            const updatedInterviewers = [...newInterview.interviewers];
                            updatedInterviewers.splice(newInterview.interviewers.indexOf(interviewer), 1);
                            setNewInterview({...newInterview, interviewers: updatedInterviewers});
                          }}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <Select
                    id="interviewers"
                    value=""
                    onChange={(e) => {
                      if (e.target.value && !newInterview.interviewers.includes(e.target.value)) {
                        setNewInterview({
                          ...newInterview,
                          interviewers: [...newInterview.interviewers, e.target.value]
                        });
                      }
                    }}
                    options={[
                      { value: '', label: 'Select interviewers' },
                      ...teamMembers.map(member => ({ value: member.name, label: member.name }))
                    ]}
                    label="Select Interviewers"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Add interview notes, special instructions, etc."
                  value={newInterview.notes ?? ''}
                  onChange={(e) => setNewInterview({...newInterview, notes: e.target.value})}
                  label="Notes"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNewInterviewForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateInterview}
                  disabled={!newInterview.candidateName || !newInterview.date || !newInterview.time || newInterview.interviewers.length === 0}
                >
                  Schedule Interview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Interview Details Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 bg-ink-950/50 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Interview Details</h3>
              <button 
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={handleCloseInterviewDetails}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-medium">{selectedInterview.candidateName}</h4>
                  <p className="text-gray-600">{selectedInterview.position}</p>
                </div>
                <Badge variant={getInterviewStatusColor(selectedInterview.status)}>
                  {selectedInterview.status.charAt(0).toUpperCase() + selectedInterview.status.slice(1)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 border-t border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {formatDate(selectedInterview.date)} at {getInterviewTimeDisplay(selectedInterview)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{selectedInterview.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">{selectedInterview.type}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Interviewers</p>
                <div className="flex flex-wrap gap-2">
                  {selectedInterview.interviewers.map((interviewer) => (
                    <span key={interviewer} className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                      {interviewer}
                    </span>
                  ))}
                </div>
              </div>
              
              {selectedInterview.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="text-sm">{selectedInterview.notes}</p>
                  </div>
                </div>
              )}

              {isRescheduling && (
                <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
                  <p className="text-sm font-medium">New date & time</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Date"
                      type="date"
                      value={rescheduleForm.date}
                      onChange={e => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                    />
                    <Input
                      label="Time"
                      type="time"
                      value={rescheduleForm.time}
                      onChange={e => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsRescheduling(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleSaveReschedule}>Save New Time</Button>
                  </div>
                </div>
              )}

              {isCompleting && (
                <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
                  <Textarea
                    label="Interview Notes / Feedback"
                    rows={4}
                    value={completionNotes}
                    onChange={e => setCompletionNotes(e.target.value)}
                    placeholder="How did the interview go?"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsCompleting(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleSaveCompletion}>Mark Completed</Button>
                  </div>
                </div>
              )}

              {!isRescheduling && !isCompleting && (
                <div className="flex justify-end space-x-3 pt-4">
                  {selectedInterview.status === 'scheduled' && (
                    <>
                      <Button variant="danger" size="sm" onClick={handleCancelInterview}>
                        Cancel Interview
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleStartReschedule}>
                        Reschedule
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleStartCompletion}>
                        Start Interview
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewingScheduleForId && (() => {
        const member = teamMembers.find(m => m.id === viewingScheduleForId);
        if (!member) return null;
        const memberInterviews = interviews.filter(i => i.interviewers.includes(member.name));
        return (
          <div className="fixed inset-0 bg-ink-950/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg max-w-lg w-full p-6">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">{member.name}'s Schedule</h3>
              {memberInterviews.length > 0 ? (
                <ul className="space-y-2">
                  {memberInterviews.map(i => (
                    <li key={i.id} className="flex justify-between border-b pb-2 text-sm">
                      <span>{i.candidateName} — {i.position}</span>
                      <span className="text-gray-500">{formatDate(i.date)} at {getInterviewTimeDisplay(i)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No interviews scheduled for {member.name}.</p>
              )}
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setViewingScheduleForId(null)}>Close</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Implement missing helper function
export function renderAvailabilityBadge(status: string) {
  switch (status) {
    case 'Available':
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Available</span>;
    case 'Busy':
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Busy</span>;
    case 'Unavailable':
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Unavailable</span>;
    default:
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Unknown</span>;
  }
}
