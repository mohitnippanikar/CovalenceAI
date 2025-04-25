import React, { useState } from 'react';
import { Send, Lock, Shield, Eye, Clock } from 'lucide-react';

// Mock data for access request history
const ACCESS_HISTORY = [
  {
    id: '1',
    document: 'Financial Report Q3 2023',
    status: 'approved',
    requestedAt: '2023-10-12',
    approvedAt: '2023-10-14',
    approvedBy: 'Marcus Johnson',
  },
  {
    id: '2',
    document: 'HR Salary Structures',
    status: 'denied',
    requestedAt: '2023-10-18',
    deniedAt: '2023-10-19',
    deniedBy: 'Emma Roberts',
    reason: 'Insufficient security clearance for this level of data',
  },
  {
    id: '3',
    document: 'Strategic Planning 2024',
    status: 'pending',
    requestedAt: '2023-11-22',
  },
];

// Access levels
const ACCESS_LEVELS = [
  {
    id: 'view',
    label: 'View Only',
    description: 'Can view the document but cannot download or share it',
    icon: <Eye className="w-5 h-5" />,
  },
  {
    id: 'download',
    label: 'Download',
    description: 'Can view and download the document',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: 'share',
    label: 'Full Access',
    description: 'Can view, download, and share the document with others',
    icon: <Lock className="w-5 h-5" />,
  },
];

// Document categories
const DOCUMENT_CATEGORIES = [
  'Financial Reports',
  'Strategic Planning',
  'HR Documents',
  'Customer Data',
  'Product Development',
  'Marketing Materials',
  'Legal Documents',
];

const RequestAccess: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [accessLevel, setAccessLevel] = useState('view');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !requestReason) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Reset form
      setSelectedCategory('');
      setSearchQuery('');
      setRequestReason('');
      setAccessLevel('view');
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    }, 1500);
  };

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Request Access</h1>
        <p className="text-gray-400">
          Request access to restricted content or documents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Form */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">New Access Request</h2>
            
            {showSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg p-4 mb-6 flex items-start">
                <Shield className="w-5 h-5 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Access request submitted successfully!</p>
                  <p className="text-sm mt-1">Your request will be reviewed by an administrator.</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="category" className="block text-sm font-medium mb-2 text-gray-300">
                  Document Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-800/50 rounded-lg py-3 px-4 focus:outline-none focus:border-primary text-white"
                  required
                >
                  <option value="">Select a category</option>
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium mb-2 text-gray-300">
                  Document Name or Keywords (Optional)
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter document name or keywords"
                  className="w-full bg-gray-900/50 border border-gray-800/50 rounded-lg py-3 px-4 focus:outline-none focus:border-primary text-white"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Access Level
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ACCESS_LEVELS.map((level) => (
                    <div
                      key={level.id}
                      className={`border ${
                        accessLevel === level.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-800/50 hover:border-gray-700'
                      } rounded-lg p-4 cursor-pointer transition-colors duration-200`}
                      onClick={() => setAccessLevel(level.id)}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`p-2 rounded-full ${
                          accessLevel === level.id ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {level.icon}
                        </div>
                        <span className={`ml-2 font-medium ${
                          accessLevel === level.id ? 'text-primary' : 'text-white'
                        }`}>
                          {level.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{level.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="reason" className="block text-sm font-medium mb-2 text-gray-300">
                  Business Justification
                </label>
                <textarea
                  id="reason"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Explain why you need access to this document..."
                  rows={4}
                  className="w-full bg-gray-900/50 border border-gray-800/50 rounded-lg py-3 px-4 focus:outline-none focus:border-primary text-white"
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !selectedCategory || !requestReason}
                className={`w-full ${
                  isSubmitting || !selectedCategory || !requestReason
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-black hover:bg-white'
                } px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center`}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="animate-spin mr-2 w-5 h-5" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 w-5 h-5" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Access History */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Requests</h2>
            
            <div className="space-y-4">
              {ACCESS_HISTORY.map((request) => (
                <div 
                  key={request.id}
                  className="p-4 bg-gray-900/50 rounded-lg border border-gray-800/50"
                >
                  <h3 className="font-medium text-white mb-2">{request.document}</h3>
                  
                  <div className="flex items-center mb-3">
                    {request.status === 'approved' && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded-full font-medium">
                        Approved
                      </span>
                    )}
                    {request.status === 'denied' && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-500 text-xs rounded-full font-medium">
                        Denied
                      </span>
                    )}
                    {request.status === 'pending' && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-full font-medium">
                        Pending
                      </span>
                    )}
                    <span className="text-gray-400 text-xs ml-3">
                      Requested: {request.requestedAt}
                    </span>
                  </div>
                  
                  {request.status === 'approved' && (
                    <p className="text-sm text-gray-400">
                      Approved by {request.approvedBy} on {request.approvedAt}
                    </p>
                  )}
                  
                  {request.status === 'denied' && (
                    <div>
                      <p className="text-sm text-gray-400">
                        Denied by {request.deniedBy} on {request.deniedAt}
                      </p>
                      <p className="text-sm text-red-400 mt-2">
                        Reason: {request.reason}
                      </p>
                    </div>
                  )}
                  
                  {request.status === 'pending' && (
                    <p className="text-sm text-gray-400 flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> 
                      Awaiting approval
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAccess; 