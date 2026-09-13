import { useState } from 'react';
import { useGoals } from './api';

// Status badge component to display status with appropriate styling
const StatusBadge = ({ status }: { status: string }) => {
  // Helper function to determine badge color class based on status
  const getBadgeColorClass = (statusValue: string): string => {
    if (statusValue === 'Completed') return 'bg-green-100 text-green-800';
    if (statusValue === 'In Progress') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`text-sm px-2 py-0.5 rounded-full ${getBadgeColorClass(status)}`}>
      {status}
    </span>
  );
};

export default function Goals() {
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { goals, setGoals, loading, error } = useGoals();
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', category: '', dueDate: '', description: '' });
  const [addingKeyResultTo, setAddingKeyResultTo] = useState<number | null>(null);
  const [newKeyResultTitle, setNewKeyResultTitle] = useState('');

  // Categories for filtering - derived from the goals data
  const categories = goals ? [...new Set(goals.map(goal => goal.category))] : [];
    // Handle loading and error states
  if (loading) {
    return <div className="text-center py-10">Loading goals...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error loading goals: {error.message}</div>;
  }

  const filteredGoals = goals
    .filter(goal => filter === 'all' || goal.category === filter)
    .filter(goal => statusFilter === 'all' || goal.status.toLowerCase() === statusFilter.toLowerCase());

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.category || !newGoal.dueDate) return;
    const nextId = Math.max(0, ...goals.map(g => g.id)) + 1;
    setGoals(prev => [
      { id: nextId, ...newGoal, progress: 0, status: 'Not Started', keyResults: [] },
      ...prev,
    ]);
    setShowAddGoalModal(false);
    setNewGoal({ title: '', category: '', dueDate: '', description: '' });
  };

  const handleAddKeyResult = () => {
    if (addingKeyResultTo === null || !newKeyResultTitle) return;
    setGoals(prev => prev.map(g => {
      if (g.id !== addingKeyResultTo) return g;
      const nextKrId = Math.max(0, ...g.keyResults.map(kr => kr.id)) + 1;
      return { ...g, keyResults: [...g.keyResults, { id: nextKrId, title: newKeyResultTitle, progress: 0 }] };
    }));
    setAddingKeyResultTo(null);
    setNewKeyResultTitle('');
  };

  const calculateOverallProgress = (goal: {keyResults: {progress: number}[]}) => {
    if (goal.keyResults.length === 0) return 0;
    
    const totalProgress = goal.keyResults.reduce((sum: number, kr: {progress: number}) => sum + kr.progress, 0);
    return Math.round(totalProgress / goal.keyResults.length);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-medium text-gray-800 mb-4">Goals & OKRs</h2>
        
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="not started">Not Started</option>
            </select>
          </div>
          
          <div className="flex-grow" />
          
          <div className="self-end">
            <button
              onClick={() => setShowAddGoalModal(true)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add New Goal
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {filteredGoals.map((goal) => (
            <div
              key={goal.id}
              className="border rounded-lg overflow-hidden"
            >
              <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                  <div className="mt-1 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      Due: {new Date(goal.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {goal.category}
                    </span>                    <StatusBadge status={goal.status} />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Progress</p>
                    <p className="text-xl font-bold text-blue-600">{calculateOverallProgress(goal)}%</p>
                  </div>
                  
                  <button
                    onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
                    className="rounded-md p-2 bg-gray-100 hover:bg-gray-200"
                  >
                    <svg className={`h-5 w-5 text-gray-500 transform transition-transform ${selectedGoal === goal.id ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {selectedGoal === goal.id && (
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                  
                  <h4 className="font-medium text-gray-900 mb-2">Key Results</h4>
                  <div className="space-y-4">
                    {goal.keyResults.map((kr) => (
                      <div key={`kr-${kr.id}`} className="border rounded p-3">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-sm">{kr.title}</span>
                          <span className="text-sm font-medium">{kr.progress}%</span>
                        </div>
                        
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${kr.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${kr.progress}%` }}>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {goal.status !== 'Completed' && (
                      <button
                        onClick={() => setAddingKeyResultTo(goal.id)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Key Result
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showAddGoalModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Add New Goal</h3>
            <div className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Goal Title"
                value={newGoal.title}
                onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Category"
                value={newGoal.category}
                onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
              />
              <input
                className="w-full border rounded px-3 py-2"
                type="date"
                value={newGoal.dueDate}
                onChange={e => setNewGoal({ ...newGoal, dueDate: e.target.value })}
              />
              <textarea
                className="w-full border rounded px-3 py-2"
                placeholder="Description"
                value={newGoal.description}
                onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 border rounded-md" onClick={() => setShowAddGoalModal(false)}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={handleAddGoal}>Create</button>
            </div>
          </div>
        </div>
      )}

      {addingKeyResultTo !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Add Key Result</h3>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Key result title"
              value={newKeyResultTitle}
              onChange={e => setNewKeyResultTitle(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 border rounded-md" onClick={() => { setAddingKeyResultTo(null); setNewKeyResultTitle(''); }}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={handleAddKeyResult}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
