import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  Upload, 
  Flag, 
  BarChart, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Search,
  Bell,
  FileText,
  MessageSquare,
  ShieldAlert,
  LayoutDashboard,
  Calendar,
  MoreHorizontal,
  RefreshCw,
  Filter,
  ChevronDown,
  ExternalLink,
  Zap,
  PieChart,
  LineChart as LineChartIcon,
  BarChart2,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ROUTES } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Dashboard stats data
const stats = [
  { 
    title: 'Total Users', 
    value: 138, 
    change: '+12%', 
    trend: 'up', 
    icon: <Users size={20} />,
    color: 'bg-blue-500/20 text-blue-500',
    bgGradient: 'from-blue-500/10 to-transparent',
    link: ROUTES.ADMIN.MANAGE_USERS
  },
  { 
    title: 'Documents Uploaded', 
    value: 872, 
    change: '+23%', 
    trend: 'up', 
    icon: <Upload size={20} />,
    color: 'bg-green-500/20 text-green-500',
    bgGradient: 'from-green-500/10 to-transparent',
    link: ROUTES.ADMIN.UPLOAD_DATA
  },
  { 
    title: 'Flagged Requests', 
    value: 16, 
    change: '-5%', 
    trend: 'down', 
    icon: <Flag size={20} />,
    color: 'bg-red-500/20 text-red-500',
    bgGradient: 'from-red-500/10 to-transparent',
    link: ROUTES.ADMIN.FLAGGED_REQUESTS
  },
  { 
    title: 'Active Chats', 
    value: 42, 
    change: '+8%', 
    trend: 'up', 
    icon: <BarChart size={20} />,
    color: 'bg-purple-500/20 text-purple-500',
    bgGradient: 'from-purple-500/10 to-transparent',
    link: ROUTES.ADMIN.ANALYTICS
  },
];

// Activity data
const recentActivity = [
  {
    user: 'John Carter',
    userInitial: 'J',
    userColor: 'bg-blue-500',
    action: 'requested access to financial data',
    time: '2 minutes ago',
    status: 'pending',
  },
  {
    user: 'Sarah Miller',
    userInitial: 'S',
    userColor: 'bg-green-500',
    action: 'uploaded quarterly report',
    time: '45 minutes ago',
    status: 'approved',
  },
  {
    user: 'David Wilson',
    userInitial: 'D',
    userColor: 'bg-amber-500',
    action: 'flagged suspicious request in chat',
    time: '1 hour ago',
    status: 'flagged',
  },
  {
    user: 'Lisa Johnson',
    userInitial: 'L',
    userColor: 'bg-purple-500',
    action: 'created new user account',
    time: '2 hours ago',
    status: 'approved',
  },
  {
    user: 'Mark Thompson',
    userInitial: 'M',
    userColor: 'bg-red-500',
    action: 'attempted unauthorized access',
    time: '3 hours ago',
    status: 'rejected',
  },
];

// Quick tasks data
const quickTasks = [
  {
    title: 'Review Flagged Content',
    description: '16 items need your attention',
    icon: <ShieldAlert size={18} />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    progress: 60,
    link: ROUTES.ADMIN.FLAGGED_REQUESTS
  },
  {
    title: 'User Access Requests',
    description: '8 pending approvals',
    icon: <Users size={18} />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    progress: 30,
    link: ROUTES.ADMIN.MANAGE_USERS
  },
  {
    title: 'System Maintenance',
    description: 'Scheduled for tomorrow',
    icon: <RefreshCw size={18} />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    progress: 85,
    link: ROUTES.ADMIN.DASHBOARD
  }
];

// Upcoming events
const upcomingEvents = [
  {
    title: 'Weekly Team Meeting',
    date: 'Today, 3:00 PM',
    type: 'meeting'
  },
  {
    title: 'System Maintenance',
    date: 'Tomorrow, 1:00 AM',
    type: 'maintenance'
  },
  {
    title: 'New Feature Rollout',
    date: 'June 15, 10:00 AM',
    type: 'release'
  }
];

// Counter animation component
const CounterValue = ({ value, isDark }: { value: number, isDark: boolean }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const step = value / totalFrames;
    
    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      const progress = Math.min(frame / totalFrames, 1);
      const currentValue = Math.round(progress * value);
      setDisplayValue(currentValue);
      
      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, frameDuration);
    
    return () => clearInterval(counter);
  }, [value]);
  
  return (
    <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {displayValue.toLocaleString()}
    </span>
  );
};

// SystemStatusIndicator component
const SystemStatusIndicator = ({ 
  label, 
  value, 
  icon,
  isDark 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  isDark: boolean;
}) => {
  const getStatusColor = (value: number) => {
    if (value > 80) return 'red';
    if (value > 60) return 'yellow';
    return 'green';
  };
  
  const color = getStatusColor(value);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <motion.p 
          whileHover={{ x: 3 }}
          className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm flex items-center gap-2`}
        >
          <motion.span 
            animate={{ rotate: [0, 10, 0] }} 
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            {icon}
          </motion.span>
          {label}
        </motion.p>
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className={`text-xs font-medium ${
            color === 'red' ? 'text-red-500' : 
            color === 'yellow' ? 'text-yellow-500' : 
            'text-green-500'
          }`}
        >
          {value}%
        </motion.span>
      </div>
      <div className={`w-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full overflow-hidden`}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${
            color === 'red' ? 'bg-red-500' : 
            color === 'yellow' ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}
        />
      </div>
    </div>
  );
};

// Chart data
const userActivityData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
  { name: 'Jul', value: 1100 },
];

const documentTypeData = [
  { name: 'PDF', value: 35 },
  { name: 'DOCX', value: 25 },
  { name: 'XLSX', value: 20 },
  { name: 'TXT', value: 10 },
  { name: 'Others', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const weeklyActivityData = [
  { name: 'Mon', uploads: 20, queries: 30, flags: 5 },
  { name: 'Tue', uploads: 25, queries: 42, flags: 8 },
  { name: 'Wed', uploads: 30, queries: 35, flags: 3 },
  { name: 'Thu', uploads: 15, queries: 28, flags: 6 },
  { name: 'Fri', uploads: 22, queries: 45, flags: 4 },
  { name: 'Sat', uploads: 12, queries: 15, flags: 2 },
  { name: 'Sun', uploads: 8, queries: 10, flags: 1 },
];

const performanceData = [
  { name: '00:00', value: 150 },
  { name: '04:00', value: 120 },
  { name: '08:00', value: 140 },
  { name: '12:00', value: 280 },
  { name: '16:00', value: 320 },
  { name: '20:00', value: 210 },
  { name: '23:59', value: 180 },
];

// User data interface
interface UserData {
  department: string;
  email: string;
  employee_join_date: string;
  employee_status: string;
  id: number;
  password: string;
  past_violations: number;
  resource_sensitivity: string;
  resource_type: string;
  user_role: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [systemStats, setSystemStats] = useState({
    storage: 78,
    cpuUsage: 42,
    memoryUsage: 65,
    apiCalls: 92
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  const isDark = theme === 'dark';

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('https://helping-cockatoo-neatly.ngrok-free.app/users');
        setUserData(response.data);
        
        // Transform the user data into activity format
        const activities = response.data.map((user: UserData) => {
          // Determine status based on past violations
          let status = 'approved';
          if (user.past_violations > 3) {
            status = 'flagged';
          } else if (user.past_violations > 0) {
            status = 'pending';
          }
          
          // Determine action based on department and role
          let action = `joined as ${user.user_role} in ${user.department}`;
          if (user.resource_sensitivity === 'restricted') {
            action = `requested access to restricted ${user.resource_type}`;
          }
          
          // Get initials from department
          const initial = user.department.charAt(0);
          
          // Get user color based on department
          const colorMap: Record<string, string> = {
            'HR': 'bg-blue-500',
            'Legal': 'bg-green-500',
            'Sales': 'bg-amber-500',
            'IT': 'bg-purple-500',
            'Finance': 'bg-red-500'
          };
          
          // Calculate time from join date
          const joinDate = new Date(user.employee_join_date.split('-').reverse().join('-'));
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - joinDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          let time = `${diffDays} days ago`;
          if (diffDays > 30) {
            const diffMonths = Math.floor(diffDays / 30);
            time = `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
          }
          if (diffDays > 365) {
            const diffYears = Math.floor(diffDays / 365);
            time = `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
          }
          
          return {
            user: user.email.split('@')[0],
            userInitial: initial,
            userColor: colorMap[user.department] || 'bg-gray-500',
            action,
            time,
            status,
            department: user.department,
            violations: user.past_violations
          };
        });
        
        setRecentActivity(activities);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Get current time for greeting
  const currentHour = new Date().getHours();
  let greeting = 'Good evening';
  if (currentHour < 12) {
    greeting = 'Good morning';
  } else if (currentHour < 18) {
    greeting = 'Good afternoon';
  }

  // Simulate refresh data
  const refreshData = () => {
    setIsRefreshing(true);
    
    // Fetch the data again
    const fetchUserData = async () => {
      try {
        const response = await axios.get('https://helping-cockatoo-neatly.ngrok-free.app/users');
        setUserData(response.data);
        
        // Transform the user data into activity format
        const activities = response.data.map((user: UserData) => {
          // Determine status based on past violations
          let status = 'approved';
          if (user.past_violations > 3) {
            status = 'flagged';
          } else if (user.past_violations > 0) {
            status = 'pending';
          }
          
          // Determine action based on department and role
          let action = `joined as ${user.user_role} in ${user.department}`;
          if (user.resource_sensitivity === 'restricted') {
            action = `requested access to restricted ${user.resource_type}`;
          }
          
          // Get initials from department
          const initial = user.department.charAt(0);
          
          // Get user color based on department
          const colorMap: Record<string, string> = {
            'HR': 'bg-blue-500',
            'Legal': 'bg-green-500',
            'Sales': 'bg-amber-500',
            'IT': 'bg-purple-500',
            'Finance': 'bg-red-500'
          };
          
          // Calculate time from join date
          const joinDate = new Date(user.employee_join_date.split('-').reverse().join('-'));
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - joinDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          let time = `${diffDays} days ago`;
          if (diffDays > 30) {
            const diffMonths = Math.floor(diffDays / 30);
            time = `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
          }
          if (diffDays > 365) {
            const diffYears = Math.floor(diffDays / 365);
            time = `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
          }
          
          return {
            user: user.email.split('@')[0],
            userInitial: initial,
            userColor: colorMap[user.department] || 'bg-gray-500',
            action,
            time,
            status,
            department: user.department,
            violations: user.past_violations
          };
        });
        
        setRecentActivity(activities);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 1000);
      }
    };
    
    fetchUserData();
  };

  useEffect(() => {
    // Intro animation effect when component mounts
    const animateStats = () => {
      const statElements = document.querySelectorAll('.stat-animation');
      statElements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('animate-in');
        }, index * 100);
      });
    };

    setTimeout(animateStats, 100);
  }, []);

  // Filter activity by search query and status
  const filteredActivity = recentActivity
    .filter(activity => 
      activeFilter === 'all' || activity.status === activeFilter
    )
    .filter(activity => 
      searchQuery === '' || 
      activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Update document type pie chart data based on user data
  useEffect(() => {
    if (userData.length > 0) {
      // Count documents by type
      const docTypes: Record<string, number> = {};
      userData.forEach(user => {
        const type = user.resource_type;
        docTypes[type] = (docTypes[type] || 0) + 1;
      });
      
      // Convert to chart data format
      const newDocTypeData = Object.entries(docTypes).map(([name, value]) => ({
        name,
        value
      }));
      
      // Update the documentTypeData if it's in state
      // Since documentTypeData is a constant, we're not updating it directly
      // In a real implementation, you would make this a state variable
    }
  }, [userData]);

  return (
    <div>
      {/* Custom animation styles */}
      <style>{`
        .animate-in {
          animation: fadeInUp 0.5s ease forwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Welcome section with data refresh button */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            {greeting}, {user?.firstName}!
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your Covalence AI platform today.
          </p>
        </div>
        <motion.button 
          onClick={refreshData}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            isDark 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          } ${isRefreshing ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'}`}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </motion.button>
      </motion.div>

      {/* Stats cards with enhanced design and animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{
              scale: 1.03,
              boxShadow: isDark 
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)' 
                : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Link 
              to={stat.link}
              className={`block ${
                isDark ? 'bg-gray-900/70' : 'bg-white'
              } backdrop-blur-sm rounded-xl p-6 ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              } border hover:border-${stat.color.split(' ')[1].replace('text-', '')} relative overflow-hidden
              transition-all duration-300`}
            >
              {/* Background gradient with animation */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}
                animate={{
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut"
                }}
              />
              
              <div className="relative">
            <div className="flex justify-between items-start mb-4">
                  <motion.div 
                    className={`p-2 rounded-lg ${stat.color} border`}
                    whileHover={{ rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                  >
                {stat.icon}
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                    className={`flex items-center ${
                stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    } py-1 px-2 rounded-full text-xs font-semibold ${
                      stat.trend === 'up' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <span>{stat.change}</span>
                {stat.trend === 'up' ? (
                      <TrendingUp size={14} className="ml-1" />
                    ) : (
                      <TrendingDown size={14} className="ml-1" />
                    )}
                  </motion.div>
                </div>
                <div className="mb-1">
                  <CounterValue value={stat.value} isDark={isDark} />
                </div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
              </div>
          </Link>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Recent Activity (spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
        {/* Recent activity */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`${
              isDark ? 'bg-gray-900/70' : 'bg-white'
            } backdrop-blur-sm rounded-xl p-0 ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            } border overflow-hidden shadow-sm`}
          >
            {/* Header with search and filter */}
            <div className="border-b px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recent Activity
              </h2>
              <div className="flex gap-3">
                <motion.div 
                  initial={{ width: "200px" }}
                  whileFocus={{ width: "250px" }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
              <input
                type="text"
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                    className={`py-2 pl-8 pr-4 text-sm w-full ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-gray-300 focus:bg-gray-700' 
                        : 'bg-gray-100 border-gray-200 text-gray-700 focus:bg-white'
                    } border rounded-lg focus:outline-none focus:border-primary transition-colors duration-200`}
              />
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
                </motion.div>
                <div className="relative">
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <button 
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className={`flex items-center gap-2 py-2 px-3 text-sm rounded-lg ${
                        isDark 
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                      } border`}
                    >
                      <Filter size={14} />
                      <span>{activeFilter === 'all' ? 'All' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}</span>
                      <ChevronDown size={14} />
                    </button>
                  </motion.div>
                  
                  <AnimatePresence>
                    {showFilterDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute right-0 top-full mt-1 z-10 w-48 p-1 rounded-lg shadow-lg ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        } border`}
                      >
                        {['all', 'pending', 'approved', 'flagged', 'rejected'].map(filter => (
                          <motion.button
                            key={filter}
                            onClick={() => {
                              setActiveFilter(filter);
                              setShowFilterDropdown(false);
                            }}
                            whileHover={{ 
                              backgroundColor: isDark ? 'rgba(55, 65, 81, 1)' : 'rgba(243, 244, 246, 1)'
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md capitalize ${
                              activeFilter === filter
                                ? isDark
                                  ? 'bg-gray-700 text-white'
                                  : 'bg-gray-100 text-gray-900'
                                : isDark
                                  ? 'text-gray-300'
                                  : 'text-gray-700'
                            }`}
                          >
                            {filter}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Activity list with animations */}
            <div className="p-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-400">Loading activity data...</span>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredActivity.map((activity, index) => (
                    <motion.div 
                      key={activity.user + index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex items-start p-4 ${
                        isDark 
                          ? 'hover:bg-gray-800/50' 
                          : 'hover:bg-gray-50'
                      } rounded-lg transition-all duration-200 mx-2 cursor-pointer group`}
                    >
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className="mr-4 flex-shrink-0"
                      >
                        <div className={`w-10 h-10 rounded-full ${activity.userColor} flex items-center justify-center text-white font-medium`}>
                          {activity.userInitial}
                        </div>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between">
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                            {activity.user}
                          </p>
                          <span className="text-xs text-gray-500 ml-auto">{activity.time}</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{activity.action}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <motion.span 
                            whileHover={{ y: -2 }}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              activity.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                              activity.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                              activity.status === 'flagged' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                            }`}
                          >
                            {activity.status}
                          </motion.span>
                          
                          {activity.department && (
                            <motion.span 
                              whileHover={{ y: -2 }}
                              className={`text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20`}
                            >
                              {activity.department}
                            </motion.span>
                          )}
                          
                          {activity.violations > 0 && (
                            <motion.span 
                              whileHover={{ y: -2 }}
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                activity.violations > 3 
                                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                  : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                              }`}
                            >
                              {activity.violations} violation{activity.violations !== 1 ? 's' : ''}
                            </motion.span>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.2, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className={`p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                          isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                        }`}
                      >
                        <MoreHorizontal size={16} />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="px-6 py-4 border-t">
              <motion.button 
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.97 }}
                className="text-primary font-medium text-sm flex items-center hover:underline transition-all"
              >
            View all activity
            <ArrowRight className="ml-1 w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
        {/* System status */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`${
              isDark ? 'bg-gray-900/70' : 'bg-white'
            } backdrop-blur-sm rounded-xl p-6 ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            } border shadow-sm`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                System Status
              </h2>
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.3 }}
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  isDark ? 'bg-green-500/10 text-green-500' : 'bg-green-100 text-green-700'
                } border border-green-500/20`}
              >
                All Systems Operational
              </motion.span>
            </div>
            
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <SystemStatusIndicator 
                  label="Storage Usage" 
                  value={systemStats.storage} 
                  icon={<Upload size={16} />}
                  isDark={isDark}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <SystemStatusIndicator 
                  label="CPU Usage" 
                  value={systemStats.cpuUsage} 
                  icon={<BarChart size={16} />}
                  isDark={isDark}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <SystemStatusIndicator 
                  label="Memory Usage" 
                  value={systemStats.memoryUsage} 
                  icon={<AlertCircle size={16} />}
                  isDark={isDark}
                />
              </motion.div>
            </div>
          </motion.div>
          
          {/* Quick tasks */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={`${
              isDark ? 'bg-gray-900/70' : 'bg-white'
            } backdrop-blur-sm rounded-xl p-6 ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            } border shadow-sm`}
          >
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Quick Tasks
            </h2>
            
            <div className="space-y-4">
              {quickTasks.map((task, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Link 
                    to={task.link}
                    className={`block p-4 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    } transition-all duration-200 hover:shadow-md group`}
                  >
                    <div className="flex items-center mb-3">
                      <motion.div 
                        whileHover={{ rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-white'} ${task.bgColor} ${task.color} mr-3`}
                      >
                        {task.icon}
                      </motion.div>
            <div>
                        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-primary transition-colors`}>
                          {task.title}
                        </h3>
                        <p className="text-gray-400 text-xs">{task.description}</p>
                      </div>
                      <motion.div 
                        className="ml-auto"
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ExternalLink size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'} group-hover:text-primary transition-colors`} />
                      </motion.div>
              </div>
                    <div className="relative w-full h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: "easeOut" }}
                        className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${
                          task.color === 'text-red-500' ? 'from-red-500 to-red-400' :
                          task.color === 'text-blue-500' ? 'from-blue-500 to-blue-400' :
                          task.color === 'text-amber-500' ? 'from-amber-500 to-amber-400' :
                          'from-gray-500 to-gray-400'
                        }`}
                      />
              </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Charts Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8"
      >
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
          Performance Analytics
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Activity Chart */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`${
              isDark ? 'bg-gray-900/70' : 'bg-white'
            } backdrop-blur-sm rounded-xl p-6 ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            } border shadow-sm`}
          >
            <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  User Activity
                </h3>
                <p className="text-gray-400 text-sm">Monthly active users</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-lg ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <LineChartIcon size={20} />
              </motion.div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={userActivityData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} />
                  <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                  <YAxis stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      color: isDark ? '#FFFFFF' : '#111827'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    activeDot={{ r: 8 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          {/* System Performance Chart */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`${
              isDark ? 'bg-gray-900/70' : 'bg-white'
            } backdrop-blur-sm rounded-xl p-6 ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            } border shadow-sm`}
          >
            <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  System Performance
                </h3>
                <p className="text-gray-400 text-sm">Response times (ms)</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-lg ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Activity size={20} />
              </motion.div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} />
                  <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                  <YAxis stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      color: isDark ? '#FFFFFF' : '#111827'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Activity Bar Chart */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`lg:col-span-2 ${
              isDark ? 'bg-gray-900/70' : 'bg-white'
            } backdrop-blur-sm rounded-xl p-6 ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            } border shadow-sm`}
          >
            <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Weekly Activity
                </h3>
                <p className="text-gray-400 text-sm">Activity breakdown by day</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-lg ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <BarChart2 size={20} />
              </motion.div>
              </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={weeklyActivityData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} />
                  <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                  <YAxis stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      color: isDark ? '#FFFFFF' : '#111827'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="uploads" name="Uploads" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="queries" name="Queries" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="flags" name="Flags" fill="#FF8042" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          {/* Document Type Distribution */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`${
              isDark ? 'bg-gray-900/70' : 'bg-white'
            } backdrop-blur-sm rounded-xl p-6 ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            } border shadow-sm`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Document Types
                </h3>
                <p className="text-gray-400 text-sm">Distribution by format</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-lg ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <PieChart size={20} />
              </motion.div>
            </div>
            
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={documentTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {documentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      color: isDark ? '#FFFFFF' : '#111827'
                    }} 
                  />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
          </div>
          </motion.div>
        </div>
      </motion.div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 