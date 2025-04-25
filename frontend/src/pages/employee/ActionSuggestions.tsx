import React, { useState } from 'react';
import { Lightbulb, ChevronRight, Search, CheckCircle, ArrowRight, Clock, Calendar, FileText, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Mock suggestion data
const SUGGESTIONS = [
  {
    id: '1',
    title: 'Review Q1 Financial Report',
    description: 'The quarterly financial report needs your review before the team meeting on Friday.',
    priority: 'high',
    dueDate: '2023-04-15',
    category: 'Finance',
    relatedDocuments: ['Q1 Financial Report 2023.pdf'],
    status: 'pending'
  },
  {
    id: '2',
    title: 'Complete Compliance Training',
    description: 'Annual compliance training needs to be completed by the end of this month.',
    priority: 'medium',
    dueDate: '2023-04-30',
    category: 'HR',
    relatedDocuments: ['Compliance Training Guide.pdf'],
    status: 'pending'
  },
  {
    id: '3',
    title: 'Prepare for Customer Meeting',
    description: 'Review customer history and prepare talking points for the upcoming meeting with ABC Corp.',
    priority: 'high',
    dueDate: '2023-04-10',
    category: 'Sales',
    relatedDocuments: ['ABC Corp History.pdf', 'Product Roadmap.pdf'],
    status: 'pending'
  },
  {
    id: '4',
    title: 'Update Personal Development Plan',
    description: 'It\'s time to review and update your personal development goals for the coming quarter.',
    priority: 'low',
    dueDate: '2023-04-20',
    category: 'Career',
    relatedDocuments: ['Personal Development Template.docx'],
    status: 'pending'
  },
  {
    id: '5',
    title: 'Join Product Strategy Workshop',
    description: 'A workshop has been scheduled to discuss the new product features for Q3.',
    priority: 'medium',
    dueDate: '2023-04-12',
    category: 'Product',
    relatedDocuments: ['Product Strategy Deck.pptx'],
    status: 'pending'
  },
];

// Completed actions
const COMPLETED_ACTIONS = [
  {
    id: '101',
    title: 'Submit Expense Report',
    description: 'Monthly expense report for March',
    completedDate: '2023-04-02',
    category: 'Finance'
  },
  {
    id: '102',
    title: 'Complete Security Training',
    description: 'Required security awareness training',
    completedDate: '2023-03-28',
    category: 'IT'
  }
];

const ActionSuggestions: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  
  // Filter suggestions based on search and filters
  const filteredSuggestions = SUGGESTIONS.filter(suggestion => {
    const matchesSearch = searchQuery === '' || 
      suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suggestion.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || suggestion.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || suggestion.priority === selectedPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });
  
  // Get all unique categories
  const categories = ['All', ...new Set(SUGGESTIONS.map(s => s.category))];
  
  // Get all unique priorities
  const priorities = ['All', 'high', 'medium', 'low'];
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Finance': return <FileText className="w-4 h-4" />;
      case 'HR': return <Users className="w-4 h-4" />;
      case 'Sales': return <MessageSquare className="w-4 h-4" />;
      case 'Career': return <Users className="w-4 h-4" />;
      case 'Product': return <FileText className="w-4 h-4" />;
      case 'IT': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="py-6">
      {/* Page header */}
      <div className="mb-8" id="welcome-section">
        <h1 className="text-3xl font-bold text-white mb-2">
          Action Suggestions
        </h1>
        <p className="text-gray-400">
          AI-powered recommendations based on your recent activities and company data.
        </p>
      </div>
      
      {/* Stats section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" id="analytics-section">
        {/* ... existing code ... */}
      </div>
      
      {/* Quick filters */}
      <div className="mb-8" id="search-section">
        <div className="flex flex-wrap gap-2">
          {/* ... existing code ... */}
        </div>
      </div>
      
      {/* Suggestions list */}
      <div className="mb-8" id="quick-actions">
        <h2 className="text-xl font-semibold text-white mb-4">Recommended Actions</h2>
        <div className="grid grid-cols-1 gap-4">
          {/* ... existing code ... */}
        </div>
      </div>
      
      {/* Completed Actions */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
          Recently Completed
        </h2>
        
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
          {COMPLETED_ACTIONS.map((action, index) => (
            <div 
              key={action.id}
              className={`p-4 flex items-start ${index !== COMPLETED_ACTIONS.length - 1 ? 'border-b border-gray-800/30' : ''}`}
            >
              <div className="p-2 bg-green-500/10 rounded-lg mr-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-white">{action.title}</h3>
                    <p className="text-sm text-gray-400">{action.description}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(action.completedDate)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                      {action.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="p-4 border-t border-gray-800/30 flex justify-center">
            <button className="text-primary text-sm font-medium hover:underline flex items-center">
              View all completed actions
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionSuggestions; 