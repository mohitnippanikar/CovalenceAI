import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, X, CheckCircle, File, UserPlus, UserCheck, Building, Globe } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  employee_status: string;
  location: string;
  join_date: string;
  region: string;
  past_violation: number;
  password: string;
};

const defaultUser: User = {
  id: 0,
  name: '',
  email: '',
  role: 'user',
  department: '',
  employee_status: 'full-time',
  location: '',
  join_date: new Date().toLocaleDateString('en-GB'),
  region: '',
  past_violation: 0,
  password: ''
};

const demoUser: User = {
  id: 2411,
  name: "John Doe",
  email: "john.doe@example.com",
  role: "admin",
  department: "IT",
  employee_status: "full-time",
  location: "NYC office",
  join_date: "18/03/25",
  region: "APAC",
  past_violation: 0,
  password: "pass@123"
};

// Helper functions for generating random user data
const generateRandomUser = (): User => {
  const firstNames = ['John', 'Emma', 'Michael', 'Sarah', 'David', 'Olivia', 'Daniel', 'Sophia', 'James', 'Ava', 'Robert', 'Emily', 'William', 'Amelia', 'Joseph', 'Isabella'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Lee', 'Patel'];
  const roles = ['admin', 'manager', 'user'];
  const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'R&D', 'Customer Support', 'Legal', 'Executive'];
  const statuses = ['full-time', 'part-time', 'contract'];
  const locations = ['NYC Office', 'LA Office', 'Chicago Office', 'Remote', 'Austin Office', 'Seattle Office', 'Boston Office', 'London Office', 'Singapore Office', 'Sydney Office'];
  const regions = ['APAC', 'EMEA', 'North America', 'South America', 'Global'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  
  // Generate a random date within the last 5 years
  const currentDate = new Date();
  const randomMonths = Math.floor(Math.random() * 60); // 5 years = 60 months
  const joinDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - randomMonths, Math.floor(Math.random() * 28) + 1);
  const formattedDate = `${joinDate.getDate().toString().padStart(2, '0')}/${(joinDate.getMonth() + 1).toString().padStart(2, '0')}/${joinDate.getFullYear().toString().substr(-2)}`;

  return {
    id: Math.floor(1000 + Math.random() * 9000), // 4-digit ID
    name,
    email,
    role: roles[Math.floor(Math.random() * roles.length)],
    department: departments[Math.floor(Math.random() * departments.length)],
    employee_status: statuses[Math.floor(Math.random() * statuses.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    join_date: formattedDate,
    region: regions[Math.floor(Math.random() * regions.length)],
    past_violation: Math.floor(Math.random() * 3), // 0-2 violations
    password: `pass${Math.floor(100 + Math.random() * 900)}` // Simple random password
  };
};

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Load users from localStorage on component mount
  useEffect(() => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  // Update localStorage whenever users state changes
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setCurrentUser(defaultUser);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setCurrentUser(user);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentUser(prevUser => ({
      ...prevUser,
      [name]: name === 'past_violation' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser.name || !currentUser.email) {
      showNotification('Name and email are required', 'error');
      return;
    }

    if (isEditing) {
      // Update existing user
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === currentUser.id ? currentUser : user)
      );
      showNotification('User updated successfully', 'success');
    } else {
      // Add new user with unique ID
      const newId = users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1;
      setUsers(prevUsers => [...prevUsers, { ...currentUser, id: newId }]);
      showNotification('User added successfully', 'success');
    }
    
    closeModal();
  };

  const deleteUser = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      showNotification('User deleted successfully', 'success');
    }
  };

  const addDemoData = () => {
    // Generate between 3-8 random users
    const numberOfUsers = Math.floor(3 + Math.random() * 6);
    const newUsers: User[] = [];
    
    // Always include the original demo user
    if (!users.some(user => user.id === demoUser.id)) {
      newUsers.push({
        ...demoUser,
        name: "John Doe", // Ensure name is set
        email: "john.doe@example.com" // Ensure email is set
      });
    }
    
    // Generate additional random users
    for (let i = 0; i < numberOfUsers; i++) {
      const randomUser = generateRandomUser();
      // Ensure no duplicate IDs
      if (!users.some(user => user.id === randomUser.id) && 
          !newUsers.some(user => user.id === randomUser.id)) {
        newUsers.push(randomUser);
      }
    }
    
    if (newUsers.length > 0) {
      setUsers(prevUsers => [...prevUsers, ...newUsers]);
      showNotification(`Added ${newUsers.length} demo users`, 'success');
    } else {
      showNotification('No new users added', 'error');
    }
  };

  const clearAllUsers = () => {
    if (confirm('Are you sure you want to delete all users? This action cannot be undone.')) {
      setUsers([]);
      showNotification('All users have been removed', 'success');
    }
  };

  // Calculate user statistics
  const userStats = {
    total: users.length,
    admins: users.filter(user => user.role === 'admin').length,
    managers: users.filter(user => user.role === 'manager').length,
    regularUsers: users.filter(user => user.role === 'user').length,
    departments: [...new Set(users.filter(user => user.department).map(user => user.department))].length,
    regions: [...new Set(users.filter(user => user.region).map(user => user.region))].length
  };

  return (
    <div className="py-8 max-w-6xl mx-auto">
      {/* Notification */}
      {notification.show && (
        <div 
          className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center ${
            notification.type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
          } backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-top-5`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-white mr-2" />
          ) : (
            <X className="w-5 h-5 text-white mr-2" />
          )}
          <p className="text-white font-medium">{notification.message}</p>
        </div>
      )}

      <div className="mb-10 text-center">
        <div className="inline-block p-2 px-4 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          User Administration Dashboard
        </div>
        <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-3 tracking-tight`}>Manage Users</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-xl mx-auto`}>
          Streamline your organization's user management with our powerful admin tools.
          Add, edit, and control access with ease.
        </p>
      </div>

      {/* Dashboard Stats */}
      {users.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`bg-gradient-to-br ${isDark ? 'from-primary/20 to-primary/5' : 'from-primary/15 to-primary/5'} backdrop-blur-sm rounded-2xl p-6 ${isDark ? 'border border-primary/20' : 'border border-primary/15 shadow-sm'} shadow-lg`}>
            <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-primary/20' : 'bg-primary/15'} flex items-center justify-center mb-4`}>
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-1`}>{userStats.total}</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
          </div>
          
          <div className={`bg-gradient-to-br ${isDark ? 'from-blue-600/20 to-blue-600/5' : 'from-blue-500/15 to-blue-500/5'} backdrop-blur-sm rounded-2xl p-6 ${isDark ? 'border border-blue-600/20' : 'border border-blue-500/15'} shadow-lg`}>
            <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/15'} flex items-center justify-center mb-4`}>
              <UserCheck className={`w-6 h-6 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-1`}>{userStats.admins}</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Administrators</p>
          </div>
          
          <div className={`bg-gradient-to-br ${isDark ? 'from-green-600/20 to-green-600/5' : 'from-green-500/15 to-green-500/5'} backdrop-blur-sm rounded-2xl p-6 ${isDark ? 'border border-green-600/20' : 'border border-green-500/15'} shadow-lg`}>
            <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-green-600/20' : 'bg-green-500/15'} flex items-center justify-center mb-4`}>
              <Building className={`w-6 h-6 ${isDark ? 'text-green-500' : 'text-green-600'}`} />
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-1`}>{userStats.departments || 0}</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Departments</p>
          </div>
          
          <div className={`bg-gradient-to-br ${isDark ? 'from-purple-600/20 to-purple-600/5' : 'from-purple-500/15 to-purple-500/5'} backdrop-blur-sm rounded-2xl p-6 ${isDark ? 'border border-purple-600/20' : 'border border-purple-500/15'} shadow-lg`}>
            <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-purple-600/20' : 'bg-purple-500/15'} flex items-center justify-center mb-4`}>
              <Globe className={`w-6 h-6 ${isDark ? 'text-purple-500' : 'text-purple-600'}`} />
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-1`}>{userStats.regions || 0}</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Regions</p>
          </div>
        </div>
      )}

      <div className={`${isDark ? 'bg-gradient-to-b from-gray-900/60 to-gray-900/40 border-gray-800/50' : 'bg-white border-gray-200/70'} backdrop-blur-sm rounded-2xl p-8 border mb-8 shadow-xl`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              className={`block w-full pl-10 pr-3 py-3 border ${isDark ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-400' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all`}
              placeholder="Search users by name, email, role..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-3 flex-wrap md:flex-nowrap">
            <button 
              onClick={openAddModal}
              className="bg-primary text-black px-4 py-3 rounded-xl hover:bg-white transition-all duration-200 flex items-center font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
            >
              <Plus className="mr-2 w-5 h-5" />
              Add User
            </button>
            <button 
              onClick={addDemoData}
              className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-500 transition-all duration-200 flex items-center font-medium shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30"
            >
              <Users className="mr-2 w-5 h-5" />
              Add Demo Data
            </button>
            {users.length > 0 && (
              <button 
                onClick={clearAllUsers}
                className="bg-red-600/80 text-white px-4 py-3 rounded-xl hover:bg-red-500 transition-all duration-200 flex items-center font-medium shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30"
              >
                <Trash2 className="mr-2 w-5 h-5" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {users.length > 0 ? (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/30 rounded-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} text-left`}>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium rounded-tl-lg`}>#</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Name</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Email</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Role</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Department</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Status</th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Region</th>
                  <th className={`px-4 py-3 text-right ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium rounded-tr-lg`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`${isDark ? 'border-gray-800/30 hover:bg-gray-800/30' : 'border-gray-200/60 hover:bg-gray-50/80'} border-b transition-colors ${
                      index === filteredUsers.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className={`px-4 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{user.id}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 text-xs font-bold text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{user.email}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium 
                        ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 
                          user.role === 'manager' ? 'bg-blue-500/10 text-blue-500' : 
                          isDark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className={`px-4 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{user.department || 'N/A'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium 
                        ${user.employee_status === 'full-time' ? 'bg-green-500/10 text-green-500' : 
                          user.employee_status === 'part-time' ? 'bg-yellow-500/10 text-yellow-500' : 
                          'bg-purple-500/10 text-purple-500'}`}>
                        {user.employee_status}
                      </span>
                    </td>
                    <td className={`px-4 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{user.region || 'N/A'}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'} transition-colors`}
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteUser(user.id)}
                          className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-red-600/70' : 'bg-gray-100 hover:bg-red-100'} text-gray-600 hover:text-red-600 transition-colors`}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`text-center py-20 ${isDark ? 'bg-gradient-to-br from-gray-900/60 to-gray-900/40 border-gray-800/50' : 'bg-gray-50/50 border-gray-200/50'} backdrop-blur-sm rounded-2xl border shadow-xl`}>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-10 h-10 text-primary" />
            </div>
            <h3 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-3`}>No Users Found</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-md mx-auto mb-8`}>
              Your organization doesn't have any users yet. Add your first user or import demo data to get started with the user management system.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <button 
                onClick={openAddModal}
                className="bg-primary text-black px-6 py-4 rounded-xl hover:bg-white transition-all duration-200 font-medium shadow-lg shadow-primary/20 flex items-center justify-center"
              >
                <Plus className="mr-2 w-5 h-5" />
                Add Your First User
              </button>
              <button 
                onClick={addDemoData}
                className="bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-500 transition-all duration-200 font-medium shadow-lg shadow-blue-600/20 flex items-center justify-center"
              >
                <Users className="mr-2 w-5 h-5" />
                Add Demo Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User info cards */}
      {users.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredUsers.slice(0, 3).map(user => (
            <div 
              key={`card-${user.id}`} 
              className={`${isDark ? 'bg-gradient-to-br from-gray-900/60 to-gray-900/40 border-gray-800/50' : 'bg-white border-gray-200/70'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all ${isDark ? 'hover:border-gray-700/60' : 'hover:border-gray-300'} group`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-primary font-bold text-xl">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium 
                  ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 
                    user.role === 'manager' ? 'bg-blue-500/10 text-blue-500' : 
                    isDark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                  {user.role}
                </span>
              </div>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-1`}>{user.name}</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>{user.email}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className={`${isDark ? 'bg-gray-800/30' : 'bg-gray-100'} p-3 rounded-lg`}>
                  <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs mb-1`}>Department</p>
                  <p className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium`}>{user.department || 'N/A'}</p>
                </div>
                <div className={`${isDark ? 'bg-gray-800/30' : 'bg-gray-100'} p-3 rounded-lg`}>
                  <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs mb-1`}>Status</p>
                  <p className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium`}>{user.employee_status}</p>
                </div>
                <div className={`${isDark ? 'bg-gray-800/30' : 'bg-gray-100'} p-3 rounded-lg`}>
                  <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs mb-1`}>Location</p>
                  <p className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium`}>{user.location || 'N/A'}</p>
                </div>
                <div className={`${isDark ? 'bg-gray-800/30' : 'bg-gray-100'} p-3 rounded-lg`}>
                  <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs mb-1`}>Join Date</p>
                  <p className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium`}>{user.join_date}</p>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-2">
                <button 
                  onClick={() => openEditModal(user)}
                  className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'} transition-colors flex items-center justify-center`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button 
                  onClick={() => deleteUser(user.id)}
                  className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-red-600/70 text-gray-300 hover:text-white' : 'bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600'} transition-colors flex items-center justify-center`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User form modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div 
            className={`${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-900/90 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl max-w-lg w-full p-8 border shadow-2xl animate-in zoom-in-95 duration-150`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {isEditing ? 'Edit User' : 'Add New User'}
              </h2>
              <button 
                onClick={closeModal}
                className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200'} flex items-center justify-center transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center mb-4">
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>All fields marked with * are required</span>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentUser({
                      ...demoUser,
                      id: isEditing ? currentUser.id : 0,
                      name: demoUser.name || "John Doe",
                      email: demoUser.email || "john.doe@example.com"
                    });
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600/70 text-white hover:bg-blue-500 transition-colors text-sm flex items-center"
                >
                  <File className="w-3 h-3 mr-2" />
                  Fill with Demo Data
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 text-sm font-medium`}>
                    Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentUser.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                    required
                  />
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 text-sm font-medium`}>
                    Email*
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={currentUser.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                    required
                  />
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 text-sm font-medium`}>
                    Role
                  </label>
                  <select
                    name="role"
                    value={currentUser.role}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 text-sm font-medium`}>
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={currentUser.department}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                  />
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 text-sm font-medium`}>
                    Employee Status
                  </label>
                  <select
                    name="employee_status"
                    value={currentUser.employee_status}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 text-sm font-medium`}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={currentUser.location}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                  />
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 text-sm font-medium`}>
                    Join Date
                  </label>
                  <input
                    type="text"
                    name="join_date"
                    value={currentUser.join_date}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                    placeholder="DD/MM/YY"
                  />
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 text-sm font-medium`}>
                    Region
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={currentUser.region}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                  />
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 text-sm font-medium`}>
                    Violations
                  </label>
                  <input
                    type="number"
                    name="past_violation"
                    min="0"
                    value={currentUser.past_violation}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                  />
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1 text-sm font-medium`}>
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={currentUser.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                    placeholder={isEditing ? "••••••••" : ""}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-6 py-3 rounded-lg ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} border transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-primary text-black hover:bg-white transition-colors font-medium shadow-md hover:shadow-lg"
                >
                  {isEditing ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers; 