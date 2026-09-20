import { useState } from 'react';
import { usePerformanceReviews } from './api';

export default function Reviews() {
  const [selectedReview, setSelectedReview] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');
  const { reviews, setReviews, loading, error } = usePerformanceReviews();

  if (loading) {
    return <div className="text-center py-10">Loading reviews...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error loading reviews: {error.message}</div>;
  }

  // Advance a review one stage per click: Not Started -> In Progress (25%),
  // then +25% per click, becoming Completed at 100%.
  const handleAdvanceReview = (id: number) => {
    setReviews(prev => prev.map(r => {
      if (r.id !== id) return r;
      const nextPct = Math.min(100, r.completionPercentage + 25);
      return {
        ...r,
        completionPercentage: nextPct,
        status: nextPct >= 100 ? 'Completed' : 'In Progress',
      };
    }));
  };

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(review => review.status.toLowerCase() === filter.toLowerCase());
  
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'not started':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending approval':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div>
      <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6 mb-6">
        <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink-900 mb-4">Performance Reviews</h2>
        
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              All Reviews
            </button>
            <button 
              onClick={() => setFilter('in progress')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'in progress' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              In Progress
            </button>
            <button 
              onClick={() => setFilter('not started')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'not started' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Not Started
            </button>
            <button 
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Completed
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{review.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(review.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${review.completionPercentage}%` }}>
                        </div>
                      </div>
                      <span className="ml-2 text-xs text-gray-500">{review.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedReview(selectedReview === review.id ? null : review.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3 font-medium"
                    >
                      {selectedReview === review.id ? 'Hide Details' : 'View Details'}
                    </button>
                    
                    {review.status !== 'Completed' && (
                      <button
                        onClick={() => handleAdvanceReview(review.id)}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        {review.status === 'Not Started' ? 'Start' : 'Continue'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedReview !== null && (
        <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
          {filteredReviews.filter(r => r.id === selectedReview).map(review => (
            <div key={`details-${review.id}`}>
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">{review.type} Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Description</p>
                  <p className="text-sm">{review.description}</p>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Reviewers</p>
                    <div className="flex flex-wrap gap-2">
                      {review.reviewers.map((reviewer) => (
                        <span key={reviewer} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {reviewer}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Review Timeline</p>
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-600">
                          Self Assessment
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${review.completionPercentage >= 25 ? 'bg-green-200 text-green-600' : 'bg-gray-200 text-gray-600'}`}>
                          {review.completionPercentage >= 25 ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-600">
                          Manager Assessment
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${review.completionPercentage >= 50 ? 'bg-green-200 text-green-600' : 'bg-gray-200 text-gray-600'}`}>
                          {review.completionPercentage >= 50 ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-600">
                          Review Meeting
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${review.completionPercentage >= 75 ? 'bg-green-200 text-green-600' : 'bg-gray-200 text-gray-600'}`}>
                          {review.completionPercentage >= 75 ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-600">
                          Finalization
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${review.completionPercentage === 100 ? 'bg-green-200 text-green-600' : 'bg-gray-200 text-gray-600'}`}>
                          {review.completionPercentage === 100 ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {review.status !== 'Completed' && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleAdvanceReview(review.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    {review.status === 'Not Started' ? 'Begin Review Process' : 'Continue Review'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
