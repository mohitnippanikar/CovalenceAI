import React, { useState, useEffect } from 'react';
import { Flag, AlertTriangle, Search, Eye, Shield, Lock, FileWarning, User, Clock, CheckCircle, XCircle, Filter, CheckSquare, XSquare, Download, Upload, Save } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// Dropbox API constants
const DROPBOX_APP_KEY = 'rd8xgnd1qjwsnzf';
const DROPBOX_APP_SECRET = 'b0xg64tmc1npizp';
const DROPBOX_REDIRECT_URI = window.location.origin + '/admin/flagged-requests';
const DROPBOX_FILE_PATH = '/flagged_requests.json';

// Define the types for our flagged requests
type FlagCategory = 'confidential' | 'unauthorized' | 'suspicious';

type FlaggedRequest = {
  id: number;
  user: {
    name: string;
    email: string;
    department: string;
  };
  timestamp: string;
  category: FlagCategory;
  description: string;
  resource: string;
  severity: 'high' | 'medium' | 'low';
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
};

// Helper function to generate random date within the last 30 days
const getRandomDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  
  // Format date: DD/MM/YY HH:MM
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// Generate hardcoded flagged requests
const generateHardcodedData = (): FlaggedRequest[] => {
  return [
    {
      id: 1001,
      user: { name: 'John Smith', email: 'john.smith@example.com', department: 'Sales' },
      timestamp: '15/06/23 09:45',
      category: 'confidential',
      description: 'Attempted to access confidential financial reports',
      resource: 'Financial Database',
      severity: 'high',
      status: 'pending'
    },
    {
      id: 1002,
      user: { name: 'Emily Johnson', email: 'emily.johnson@example.com', department: 'Marketing' },
      timestamp: '12/06/23 14:22',
      category: 'unauthorized',
      description: 'Multiple login attempts from unauthorized location',
      resource: 'Customer Data Repository',
      severity: 'medium',
      status: 'reviewing'
    },
    {
      id: 1003,
      user: { name: 'Michael Brown', email: 'michael.brown@example.com', department: 'Engineering' },
      timestamp: '10/06/23 11:05',
      category: 'suspicious',
      description: 'Unusual login pattern detected',
      resource: 'Product Development Server',
      severity: 'low',
      status: 'pending'
    },
    {
      id: 1004,
      user: { name: 'Sarah Davis', email: 'sarah.davis@example.com', department: 'HR' },
      timestamp: '09/06/23 16:30',
      category: 'confidential',
      description: 'Downloaded confidential product roadmap',
      resource: 'Executive Communications',
      severity: 'high',
      status: 'resolved'
    },
    {
      id: 1005,
      user: { name: 'David Wilson', email: 'david.wilson@example.com', department: 'Finance' },
      timestamp: '08/06/23 10:18',
      category: 'unauthorized',
      description: 'Accessed resources outside of role permissions',
      resource: 'HR Records System',
      severity: 'medium',
      status: 'pending'
    },
    {
      id: 1006,
      user: { name: 'Jessica Miller', email: 'jessica.miller@example.com', department: 'IT' },
      timestamp: '07/06/23 15:42',
      category: 'suspicious',
      description: 'Multiple downloads in short timeframe',
      resource: 'Internal Documentation',
      severity: 'medium',
      status: 'pending'
    },
    {
      id: 1007,
      user: { name: 'Robert Taylor', email: 'robert.taylor@example.com', department: 'Operations' },
      timestamp: '05/06/23 09:10',
      category: 'confidential',
      description: 'Shared confidential internal communications',
      resource: 'Executive Communications',
      severity: 'high',
      status: 'dismissed'
    },
    {
      id: 1008,
      user: { name: 'Jennifer White', email: 'jennifer.white@example.com', department: 'Legal' },
      timestamp: '04/06/23 11:35',
      category: 'unauthorized',
      description: 'Attempted to modify access control settings',
      resource: 'Access Control System',
      severity: 'high',
      status: 'pending'
    },
    {
      id: 1009,
      user: { name: 'James Anderson', email: 'james.anderson@example.com', department: 'Sales' },
      timestamp: '03/06/23 14:20',
      category: 'suspicious',
      description: 'Unusual search patterns in the database',
      resource: 'Customer Data Repository',
      severity: 'low',
      status: 'pending'
    },
    {
      id: 1010,
      user: { name: 'Patricia Lewis', email: 'patricia.lewis@example.com', department: 'HR' },
      timestamp: '02/06/23 10:05',
      category: 'confidential',
      description: 'Attempted to print confidential HR documents',
      resource: 'HR Records System',
      severity: 'medium',
      status: 'reviewing'
    },
    {
      id: 1011,
      user: { name: 'Mark Johnson', email: 'mark.johnson@example.com', department: 'Engineering' },
      timestamp: '01/06/23 16:15',
      category: 'unauthorized',
      description: 'Attempted to access system outside of authorized hours',
      resource: 'Product Development Server',
      severity: 'medium',
      status: 'pending'
    },
    {
      id: 1012,
      user: { name: 'Lisa Wilson', email: 'lisa.wilson@example.com', department: 'Marketing' },
      timestamp: '31/05/23 13:40',
      category: 'suspicious',
      description: 'Unexpected data export activity',
      resource: 'Marketing Analytics Tool',
      severity: 'high',
      status: 'pending'
    }
  ];
};

const FlaggedRequests: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [flaggedRequests, setFlaggedRequests] = useState<FlaggedRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<FlaggedRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FlagCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<FlaggedRequest['status'] | 'all'>('all');
  const [dropboxToken, setDropboxToken] = useState<string | null>(null);
  const [isDropboxConnected, setIsDropboxConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Initialize Dropbox connection
  useEffect(() => {
    // Check for access token in URL hash (from Dropbox OAuth redirect)
    if (window.location.hash.includes('access_token')) {
      const hashParams = window.location.hash.substring(1).split('&');
      const tokenParam = hashParams.find(param => param.startsWith('access_token='));
      
      if (tokenParam) {
        const token = tokenParam.split('=')[1];
        setDropboxToken(token);
        localStorage.setItem('dropboxToken', token);
        
        // Clear the hash to avoid token exposure in browser history
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setIsDropboxConnected(true);
        loadDataFromDropbox(token);
      }
    } else {
      // Try to get token from localStorage
      const storedToken = localStorage.getItem('dropboxToken');
      if (storedToken) {
        setDropboxToken(storedToken);
        setIsDropboxConnected(true);
        loadDataFromDropbox(storedToken);
      } else {
        // Load from localStorage if not connected to Dropbox
        loadDataFromLocalStorage();
      }
    }
  }, []);

  // Load data from localStorage (fallback when not connected to Dropbox)
  const loadDataFromLocalStorage = () => {
    const storedData = localStorage.getItem('flaggedRequests');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setFlaggedRequests(parsedData);
        setFilteredRequests(parsedData);
      } catch (error) {
        console.error("Error parsing localStorage data:", error);
        initializeWithHardcodedData();
      }
    } else {
      initializeWithHardcodedData();
    }
  };

  // Initialize with hardcoded data
  const initializeWithHardcodedData = () => {
    const hardcodedData = generateHardcodedData();
    setFlaggedRequests(hardcodedData);
    setFilteredRequests(hardcodedData);
    localStorage.setItem('flaggedRequests', JSON.stringify(hardcodedData));
  };

  // Connect to Dropbox
  const connectToDropbox = () => {
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=token&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}`;
    window.location.href = authUrl;
  };

  // Disconnect from Dropbox
  const disconnectFromDropbox = () => {
    if (confirm('Are you sure you want to disconnect from Dropbox? Your data will still be available locally.')) {
      localStorage.removeItem('dropboxToken');
      setDropboxToken(null);
      setIsDropboxConnected(false);
      setSaveStatus(null);
    }
  };

  // Load data from Dropbox
  const loadDataFromDropbox = async (token: string) => {
    if (!token) return;
    
    setIsLoading(true);
    
    try {
      // First check if file exists by trying to download it
      const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Dropbox-API-Arg': JSON.stringify({
            path: DROPBOX_FILE_PATH
          })
        }
      });
      
      if (response.status === 200) {
        // File exists, parse the data
        const data = await response.json();
        setFlaggedRequests(data);
        setFilteredRequests(data);
        setSaveStatus({ message: 'Data loaded from Dropbox', type: 'success' });
      } else if (response.status === 409) {
        // File doesn't exist, create it with default data
        console.log("File not found in Dropbox, will be created on first save");
        initializeWithHardcodedData();
      } else {
        // Other error
        console.error("Error accessing Dropbox:", response.statusText);
        loadDataFromLocalStorage();
        setSaveStatus({ message: 'Error loading from Dropbox, using local data', type: 'error' });
      }
    } catch (error) {
      console.error("Error loading data from Dropbox:", error);
      loadDataFromLocalStorage();
      setSaveStatus({ message: 'Could not connect to Dropbox, using local data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save data to Dropbox
  const saveDataToDropbox = async () => {
    if (!dropboxToken) return;
    
    setIsSaving(true);
    setSaveStatus({ message: 'Saving to Dropbox...', type: 'success' });
    
    try {
      // First check if the directory exists and create it if needed
      const checkFileExistsResponse = await fetch('https://api.dropboxapi.com/2/files/get_metadata', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: DROPBOX_FILE_PATH
        })
      }).catch(() => null);
      
      // If file doesn't exist, we'll just proceed to upload (it will be created)
      const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: DROPBOX_FILE_PATH,
            mode: 'overwrite'
          })
        },
        body: JSON.stringify(flaggedRequests)
      });
      
      if (uploadResponse.ok) {
        const currentDate = new Date();
        const timeString = currentDate.toLocaleTimeString();
        setSaveStatus({ message: `Saved to Dropbox at ${timeString}`, type: 'success' });
        
        // Keep a backup in localStorage as well
        localStorage.setItem('flaggedRequests', JSON.stringify(flaggedRequests));
      } else {
        throw new Error(`Failed to save: ${uploadResponse.statusText}`);
      }
    } catch (error) {
      console.error("Error saving to Dropbox:", error);
      setSaveStatus({ message: 'Failed to save to Dropbox, using local storage', type: 'error' });
      
      // Save to localStorage as fallback
      localStorage.setItem('flaggedRequests', JSON.stringify(flaggedRequests));
    } finally {
      setIsSaving(false);
      
      // Clear status after some time (except for errors)
      if (saveStatus?.type !== 'error') {
        setTimeout(() => {
          setSaveStatus(null);
        }, 5000);
      }
    }
  };

  // Auto-save to localStorage whenever flaggedRequests changes
  useEffect(() => {
    if (flaggedRequests.length > 0) {
      localStorage.setItem('flaggedRequests', JSON.stringify(flaggedRequests));
      
      // If connected to Dropbox, save there too (debounced)
      if (isDropboxConnected && !isSaving && !isLoading) {
        const timer = setTimeout(() => {
          saveDataToDropbox();
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [flaggedRequests, isDropboxConnected]);

  // Filter requests based on search term and filters
  useEffect(() => {
    let result = flaggedRequests;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(request => 
        request.user.name.toLowerCase().includes(term) ||
        request.user.email.toLowerCase().includes(term) ||
        request.description.toLowerCase().includes(term) ||
        request.resource.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(request => request.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      result = result.filter(request => request.status === selectedStatus);
    }

    setFilteredRequests(result);
  }, [searchTerm, selectedCategory, selectedStatus, flaggedRequests]);

  const pendingCount = flaggedRequests.filter(req => req.status === 'pending').length;
  
  const getCategoryIcon = (category: FlagCategory) => {
    switch (category) {
      case 'confidential': return <Lock className="w-5 h-5 text-red-500" />;
      case 'unauthorized': return <Shield className="w-5 h-5 text-orange-500" />;
      case 'suspicious': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getCategoryLabel = (category: FlagCategory) => {
    switch (category) {
      case 'confidential': return 'Confidential';
      case 'unauthorized': return 'Unauthorized';
      case 'suspicious': return 'Suspicious';
    }
  };

  const getSeverityColor = (severity: FlaggedRequest['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'low': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const getStatusColor = (status: FlaggedRequest['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'reviewing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'resolved': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'dismissed': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: FlaggedRequest['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'reviewing': return <Eye className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'dismissed': return <XCircle className="w-4 h-4" />;
    }
  };

  // Handle approving or declining a flagged request
  const handleRequestAction = (id: number, action: 'approve' | 'decline') => {
    // Update the status based on the action
    const newStatus = action === 'approve' ? 'resolved' : 'dismissed';
    
    const updatedRequests = flaggedRequests.map(request => 
      request.id === id ? { ...request, status: newStatus } : request
    );
    
    setFlaggedRequests(updatedRequests);
    
    // In a real application, you would call an API here
    console.log(`Request #${id} ${action === 'approve' ? 'approved' : 'declined'}`);
  };

  // Reset all data to original hardcoded values
  const resetToDefault = () => {
    if (confirm('Are you sure you want to reset all data to default? This will erase any changes you made.')) {
      const defaultData = generateHardcodedData();
      setFlaggedRequests(defaultData);
      setFilteredRequests(defaultData);
      
      // Save to Dropbox if connected
      if (isDropboxConnected && dropboxToken) {
        saveDataToDropbox();
      } else {
        localStorage.setItem('flaggedRequests', JSON.stringify(defaultData));
      }
    }
  };

  return (
    <div className="py-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>Flagged Requests</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Review and manage flagged content and access requests.
          </p>
        </div>
        <div className="flex gap-4">
          {/* Dropbox integration */}
          {isDropboxConnected ? (
            <div className="flex gap-2">
              <div className={`${saveStatus?.type === 'success' ? 'bg-green-500/20 text-green-500' : saveStatus?.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'} px-4 py-2 rounded-lg flex items-center`}>
                {saveStatus?.type === 'success' ? (
                  <CheckCircle className="mr-2 w-5 h-5" />
                ) : saveStatus?.type === 'error' ? (
                  <AlertTriangle className="mr-2 w-5 h-5" />
                ) : (
                  <Download className="mr-2 w-5 h-5" />
                )}
                {saveStatus?.message || 'Connected to Dropbox'}
              </div>
              <button 
                onClick={disconnectFromDropbox}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <XCircle className="mr-2 w-5 h-5" />
                Disconnect
              </button>
              <button 
                onClick={saveDataToDropbox}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 w-5 h-5" />
                    Save to Dropbox
                  </>
                )}
              </button>
            </div>
          ) : (
            <button 
              onClick={connectToDropbox}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <Upload className="mr-2 w-5 h-5" />
              Connect to Dropbox
            </button>
          )}
          
          <div className="bg-red-500/20 text-red-500 px-4 py-2 rounded-lg flex items-center">
            <AlertTriangle className="mr-2 w-5 h-5" />
            {pendingCount} Pending Reviews
          </div>
          <button 
            onClick={resetToDefault}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Reset Data
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className={`${isDark ? 'bg-gray-900/40 border-gray-800/50' : 'bg-white border-gray-200'} backdrop-blur-sm rounded-xl p-6 border mb-8`}>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              className={`block w-full pl-10 pr-3 py-2 border ${isDark ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-400' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className={`${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50`}
          >
            <option value="all">All Categories</option>
            <option value="confidential">Confidential</option>
            <option value="unauthorized">Unauthorized</option>
            <option value="suspicious">Suspicious</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className={`${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50`}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
            <div className="flex items-center mb-2">
              <Lock className="w-5 h-5 text-red-500 mr-2" />
              <h3 className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium`}>Confidential</h3>
            </div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Data or access attempts involving confidential information</p>
            <div className="text-red-500 font-semibold">
              {flaggedRequests.filter(req => req.category === 'confidential').length} Incidents
            </div>
          </div>
          
          <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-orange-500 mr-2" />
              <h3 className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium`}>Unauthorized</h3>
            </div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Unauthorized access attempts or permission violations</p>
            <div className="text-orange-500 font-semibold">
              {flaggedRequests.filter(req => req.category === 'unauthorized').length} Incidents
            </div>
          </div>
          
          <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
              <h3 className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium`}>Suspicious</h3>
            </div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Unusual patterns or potentially malicious activity</p>
            <div className="text-yellow-500 font-semibold">
              {flaggedRequests.filter(req => req.category === 'suspicious').length} Incidents
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Requests Table */}
      <div className={`${isDark ? 'bg-gray-900/40 border-gray-800/50' : 'bg-white border-gray-200'} backdrop-blur-sm rounded-xl border overflow-hidden`}>
        {filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} text-left`}>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>ID</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Category</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>User</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Resource</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Timestamp</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Severity</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Status</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <tr 
                    key={request.id} 
                    className={`${isDark ? 'border-gray-800/30 hover:bg-gray-800/30' : 'border-gray-200 hover:bg-gray-50'} border-b transition-colors`}
                  >
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>#{request.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {getCategoryIcon(request.category)}
                        <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{getCategoryLabel(request.category)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium`}>{request.user.name}</div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{request.user.department}</div>
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {request.resource}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {request.timestamp}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(request.severity)}`}>
                        {request.severity.charAt(0).toUpperCase() + request.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {request.status === 'pending' || request.status === 'reviewing' ? (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleRequestAction(request.id, 'approve')}
                            className="flex items-center px-2 py-1 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 transition-colors"
                            title="Allow request"
                          >
                            <CheckSquare className="w-4 h-4 mr-1" />
                            Allow
                          </button>
                          <button 
                            onClick={() => handleRequestAction(request.id, 'decline')}
                            className="flex items-center px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                            title="Decline request"
                          >
                            <XSquare className="w-4 h-4 mr-1" />
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm italic`}>
                          {request.status === 'resolved' ? 'Allowed' : 'Declined'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Flag className="w-16 h-16 text-red-500/60 mx-auto mb-4" />
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>No Flagged Requests Found</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-md mx-auto`}>
              No flagged requests match your current filters. Try adjusting your search criteria or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlaggedRequests; 