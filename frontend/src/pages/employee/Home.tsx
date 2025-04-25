import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  FileText,
  Key,
  Lightbulb,
  ArrowUpRight,
  Search,
  Send,
  Plus,
  ChevronRight,
  Calendar,
  TrendingUp,
  BarChart3,
  Clock,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import DashboardTour from '../../components/DashboardTour';

// Quick actions for employee
const quickActions = [
  {
    title: 'Talk to Assistant',
    description: 'Ask questions and get instant answers',
    icon: <MessageSquare className="w-6 h-6" />,
    link: ROUTES.EMPLOYEE.CHAT_ASSISTANT,
    color: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  },
  {
    title: 'View Uploads',
    description: 'Browse through available documents',
    icon: <FileText className="w-6 h-6" />,
    link: ROUTES.EMPLOYEE.VIEW_UPLOADS,
    color: 'bg-green-500/20 text-green-500 border-green-500/30',
  },
  {
    title: 'Request Access',
    description: 'Request access to restricted data',
    icon: <Key className="w-6 h-6" />,
    link: ROUTES.EMPLOYEE.REQUEST_ACCESS,
    color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  },
  {
    title: 'Document Explorer',
    description: 'Browse all company documents',
    icon: <Lightbulb className="w-6 h-6" />,
    link: ROUTES.EMPLOYEE.DOCUMENTS,
    color: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  },
];

// Recent interactions data
const recentInteractions = [
  {
    title: 'Q4 Financial Analysis',
    description: 'Annual performance review documents',
    type: 'Document',
    date: '2 hours ago',
    icon: <FileText className="w-4 h-4" />
  },
  {
    title: 'Customer Retention Strategy',
    description: 'AI-assisted conversation about improving retention rates',
    type: 'Chat',
    date: 'Yesterday',
    icon: <MessageSquare className="w-4 h-4" />
  },
  {
    title: 'Employee Performance Review',
    description: 'HR framework for quarterly reviews',
    type: 'Document',
    date: '3 days ago',
    icon: <FileText className="w-4 h-4" />
  },
];

// Analytics data for cards
const analyticsData = [
  {
    title: 'Documents Accessed',
    value: '47',
    change: '+12%',
    period: 'vs last month',
    trend: 'up',
    icon: <FileText className="w-6 h-6" />,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'AI Interactions',
    value: '156',
    change: '+24%',
    period: 'vs last month',
    trend: 'up',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'bg-green-500/10 text-green-500',
  },
  {
    title: 'Time Saved',
    value: '12h',
    change: '+5h',
    period: 'vs last month',
    trend: 'up',
    icon: <Clock className="w-6 h-6" />,
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    title: 'Productivity Score',
    value: '94',
    change: '+7',
    period: 'vs last month',
    trend: 'up',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'bg-yellow-500/10 text-yellow-500',
  },
];

// Upcoming events data
const upcomingEvents = [
  {
    title: 'Team Meeting',
    time: 'Today, 2:00 PM',
    location: 'Conference Room A',
  },
  {
    title: 'Quarterly Review',
    time: 'Tomorrow, 10:00 AM',
    location: 'Online',
  },
  {
    title: 'Project Deadline',
    time: 'Friday, 5:00 PM',
    location: 'Marketing Department',
  },
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [quickChat, setQuickChat] = useState('');

  // Get current time for greeting
  const currentHour = new Date().getHours();
  let greeting = 'Good evening';
  if (currentHour < 12) {
    greeting = 'Good morning';
  } else if (currentHour < 18) {
    greeting = 'Good afternoon';
  }

  return (
    <div>
      {/* Add the tour component */}
      <DashboardTour username={user?.firstName} />
      
      {/* Welcome section */}
      <div className="mb-8" id="welcome-section">
        <h1 className="text-3xl font-bold text-white mb-2">
          {greeting}, {user?.firstName}!
        </h1>
        <p className="text-gray-400">
          Welcome to your Covalence AI workspace. Here's your activity overview.
        </p>
      </div>
      
      {/* Analytics overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="analytics-section">
        {analyticsData.map((item, index) => (
          <div key={index} className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-5 border border-gray-800/50 flex items-center">
            <div className={`${item.color} p-3 rounded-lg`}>
              {item.icon}
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">{item.title}</p>
              <div className="flex items-end">
                <h3 className="text-2xl font-semibold text-white">{item.value}</h3>
                <div className="flex items-center ml-2 pb-1">
                  <span className={`text-xs font-medium ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {item.change}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">{item.period}</p>
            </div>
          </div>
        ))}
      </div>

      

      {/* Quick access */}
      <div id="quick-actions">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link 
              key={index} 
              to={action.link}
              className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className={`p-3 rounded-lg mb-4 inline-block ${action.color} relative z-10`}>
                {action.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors duration-200 relative z-10">
                {action.title}
              </h3>
              <p className="text-gray-400 mb-4 text-sm relative z-10">
                {action.description}
              </p>
              <div className="flex items-center text-primary text-sm font-medium relative z-10">
                <span>Get started</span>
                <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity and upcoming events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent interactions */}
        <div className="lg:col-span-2 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden" id="recent-activity">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800/50">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <button className="text-primary hover:underline text-sm font-medium flex items-center">
              View all
              <ChevronRight className="ml-1 w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-gray-800/30">
            {recentInteractions.map((item, index) => (
              <div 
                key={index}
                className="p-4 hover:bg-gray-800/30 transition-colors duration-200 cursor-pointer flex items-center"
              >
                <div className={`${item.type === 'Chat' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'} p-3 rounded-lg mr-4`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">{item.title}</h4>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    </div>
                    <div className="text-xs text-gray-500 ml-4 shrink-0">{item.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-800/30 p-4">
            <button className="w-full py-3 border border-gray-700 rounded-lg text-center text-gray-300 hover:border-primary hover:text-primary transition-colors duration-200 flex items-center justify-center">
              <Plus className="w-4 h-4 mr-2" />
              Start New Activity
            </button>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="lg:col-span-1 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden" id="upcoming-events">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800/50">
            <h2 className="text-xl font-semibold text-white">Upcoming Events</h2>
            <button className="text-primary hover:underline text-sm font-medium flex items-center">
              View calendar
              <ChevronRight className="ml-1 w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-gray-800/30">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="p-4 hover:bg-gray-800/30 transition-colors duration-200">
                <div className="flex items-start">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{event.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{event.time}</p>
                    <p className="text-xs text-gray-500 mt-1">{event.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-800/30 p-4">
            <button className="w-full py-3 border border-gray-700 rounded-lg text-center text-gray-300 hover:border-primary hover:text-primary transition-colors duration-200 flex items-center justify-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </button>
          </div>
        </div>
      </div>

      {/* Quick chat */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 flex flex-col overflow-hidden shadow-lg shadow-black/5 mb-8" id="quick-chat">
        <div className="p-6 border-b border-gray-800/50">
          <h2 className="text-xl font-semibold text-white">Quick Chat with AI Assistant</h2>
          <p className="text-gray-400 text-sm">
            Ask a question to get instant help from your AI assistant
          </p>
        </div>

        <div className="flex-grow p-6 flex flex-col">
          <div className="flex-grow mb-4 bg-gray-900/50 rounded-lg p-4 overflow-auto max-h-60">
            <div className="flex items-start mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-black font-bold text-xs">O</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-gray-300 max-w-[80%]">
                <p>Hello {user?.firstName || "there"}! I'm your AI assistant. How can I help you today?</p>
              </div>
            </div>

            {quickChat && (
              <div className="flex items-start justify-end mb-4">
                <div className="bg-primary/20 rounded-lg p-3 text-white max-w-[80%]">
                  <p>{quickChat}</p>
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center ml-4 flex-shrink-0">
                  <span className="text-white font-bold text-xs">
                    {user?.firstName?.[0] || "U"}
                  </span>
                </div>
              </div>
            )}

            {quickChat && (
              <div className="flex items-start mt-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-black font-bold text-xs">O</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-gray-300 max-w-[80%]">
                  <p>
                    I'm analyzing your question. For a more detailed conversation, 
                    please visit the Chat Assistant page where I can help you with 
                    comprehensive answers and follow-up questions.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex">
            <input
              type="text"
              placeholder="Ask something..."
              value={quickChat}
              onChange={(e) => setQuickChat(e.target.value)}
              className="flex-grow bg-gray-800/50 border border-gray-700 rounded-l-lg py-3 px-4 focus:outline-none focus:border-primary text-white"
            />
            <Link
              to={ROUTES.EMPLOYEE.CHAT_ASSISTANT}
              className="bg-primary text-black px-4 py-3 rounded-r-lg font-medium hover:bg-white transition-colors duration-200 flex items-center"
            >
              <span className="hidden sm:inline mr-2">Full Chat</span>
              <Send className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 