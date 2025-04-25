import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Bell,
  Lock,
  UserCog,
  Shield,
  Database,
  Palette,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ROUTES } from '../../utils/constants';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('profile');
  const [savedMessage, setSavedMessage] = useState('');

  // Example form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    notificationsEnabled: true,
    helpEmailsEnabled: true,
    marketingEmailsEnabled: false,
    twoFactorEnabled: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate saving
    setSavedMessage('Settings saved successfully');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.AUTH.LOGIN);
  };

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
      description: 'Manage your personal information',
    },
    {
      id: 'account',
      label: 'Account',
      icon: <UserCog className="w-5 h-5" />,
      description: 'Update your account settings',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      description: 'Configure notification preferences',
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="w-5 h-5" />,
      description: 'Manage security settings',
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: <Palette className="w-5 h-5" />,
      description: 'Customize your interface',
    },
    {
      id: 'help',
      label: 'Help Center',
      icon: <HelpCircle className="w-5 h-5" />,
      description: 'Support and documentation',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
          Settings
        </h1>
        <p className="text-gray-400">
          Manage your account settings, profile information, and preferences
        </p>
      </div>

      {/* Settings layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className={`${isDark ? 'bg-gray-900/30' : 'bg-white'} backdrop-blur-sm rounded-xl p-4 h-fit ${
          isDark ? 'border-gray-800/50' : 'border-gray-200'
        } border`}>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200
                  ${activeTab === tab.id 
                    ? `${isDark ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary'}` 
                    : isDark 
                      ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  } hover:scale-[1.02]`}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <div className="ml-3 text-left">
                  <span className="font-medium block">{tab.label}</span>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {tab.description}
                  </span>
                </div>
              </button>
            ))}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-4 py-3 mt-6 rounded-lg transition-all duration-200
                ${isDark 
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                  : 'bg-red-50 text-red-500 hover:bg-red-100'
                } hover:scale-[1.02]`}
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3 font-medium">Logout</span>
            </button>
          </nav>
        </div>

        {/* Content area */}
        <div className={`lg:col-span-3 ${isDark ? 'bg-gray-900/30' : 'bg-white'} backdrop-blur-sm rounded-xl p-6 ${
          isDark ? 'border-gray-800/50' : 'border-gray-200'
        } border`}>
          {/* Success message */}
          {savedMessage && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Save className="w-5 h-5 mr-2" />
                {savedMessage}
              </div>
              <button onClick={() => setSavedMessage('')}>
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Profile Information</h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Profile picture */}
                  <div className="flex items-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center text-black font-bold text-2xl ring-4 ring-primary/30 mr-6">
                      {user?.firstName?.[0] || 'A'}
                    </div>
                    <div>
                      <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>Profile Picture</h3>
                      <div className="flex space-x-3">
                        <button 
                          type="button"
                          className={`px-4 py-2 rounded-lg text-sm ${
                            isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                          } transition-colors`}
                        >
                          Change
                        </button>
                        <button 
                          type="button"
                          className={`px-4 py-2 rounded-lg text-sm ${
                            isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                          } transition-colors`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Personal Info Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-primary/70' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-primary'
                        } focus:outline-none transition-colors`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-primary/70' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-primary'
                        } focus:outline-none transition-colors`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-primary/70' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-primary'
                        } focus:outline-none transition-colors`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Account Settings</h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <div className="flex items-start">
                      <div className={`p-2 rounded-md ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} mr-4`}>
                        <UserCog className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                          Admin Account
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Your account has administrator privileges with full access to all features of Covalence AI.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-md font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Email Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notificationsEnabled"
                          name="notificationsEnabled"
                          checked={formData.notificationsEnabled}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="notificationsEnabled" className={`ml-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Receive system notifications via email
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="helpEmailsEnabled"
                          name="helpEmailsEnabled"
                          checked={formData.helpEmailsEnabled}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="helpEmailsEnabled" className={`ml-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Receive help and tips emails
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="marketingEmailsEnabled"
                          name="marketingEmailsEnabled"
                          checked={formData.marketingEmailsEnabled}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="marketingEmailsEnabled" className={`ml-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Receive marketing and promotional emails
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Security Settings</h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} flex items-start`}>
                    <div className={`p-2 rounded-md ${isDark ? 'bg-green-500/10' : 'bg-green-50'} mr-4`}>
                      <Lock className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="flex items-center mb-2">
                        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mr-3`}>
                          Two-Factor Authentication
                        </h3>
                        <span className="text-xs font-medium bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                          Enabled
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                        Two-factor authentication adds an extra layer of security to your account.
                      </p>
                      <button 
                        type="button"
                        className={`px-4 py-2 rounded-lg text-sm ${
                          isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                        } transition-colors`}
                      >
                        Manage 2FA
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-md font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Current Password
                        </label>
                        <input
                          type="password"
                          className={`w-full px-4 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-800/50 border-gray-700 text-white focus:border-primary/70' 
                              : 'bg-white border-gray-300 text-gray-900 focus:border-primary'
                          } focus:outline-none transition-colors`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          New Password
                        </label>
                        <input
                          type="password"
                          className={`w-full px-4 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-800/50 border-gray-700 text-white focus:border-primary/70' 
                              : 'bg-white border-gray-300 text-gray-900 focus:border-primary'
                          } focus:outline-none transition-colors`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className={`w-full px-4 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-800/50 border-gray-700 text-white focus:border-primary/70' 
                              : 'bg-white border-gray-300 text-gray-900 focus:border-primary'
                          } focus:outline-none transition-colors`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Help Center Tab */}
          {activeTab === 'help' && (
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Help Center</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Documentation</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    Browse our comprehensive documentation to learn how to use all features of Covalence AI.
                  </p>
                  <button className="px-4 py-2 bg-primary text-black rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    View Documentation
                  </button>
                </div>
                
                <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Contact Support</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    Need help with something specific? Our support team is here to help.
                  </p>
                  <button className="px-4 py-2 bg-primary text-black rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    Contact Support
                  </button>
                </div>
              </div>

              <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/40' : 'bg-gray-50'} border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Frequently Asked Questions</h3>
                
                <div className="space-y-4 mt-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      How do I reset my password?
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      You can reset your password in the Security tab of the Settings page. If you're locked out of your account, use the "Forgot Password" option on the login page.
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      How do I upload documents to the system?
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Navigate to the Upload Data section from the sidebar. From there, you can drag and drop files or use the file browser to select documents to upload.
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      How can I manage user permissions?
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Go to the Manage Users section to add new users, modify existing user roles, or revoke access. As an admin, you have full control over user permissions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs rendered similarly... */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Notification Settings</h2>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Configure how and when you receive notifications from the system.
              </p>
              {/* Notification settings content would go here */}
              <div className="opacity-60 flex items-center justify-center p-12">
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Notification settings coming soon
                </p>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Appearance Settings</h2>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Customize the appearance of your Covalence AI interface.
              </p>
              {/* Appearance settings content would go here */}
              <div className="opacity-60 flex items-center justify-center p-12">
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Appearance settings coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 