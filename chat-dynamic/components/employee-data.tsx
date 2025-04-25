"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  department: string;
  position: string;
  joinDate: string;
  status: string;
  skills: string[];
  avatar: string;
}

interface EmployeeDataProps {
  employees?: Employee[];
}

export function EmployeeData({ employees: initialEmployees }: EmployeeDataProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [callingEmployeeId, setCallingEmployeeId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<{
    success: boolean;
    message: string;
    employeeId: string | null;
  } | null>(null);
  
  // Fetch employees data if not provided as props
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        if (initialEmployees && initialEmployees.length > 0) {
          setEmployees(initialEmployees);
          setLoading(false);
          console.log('Using provided employees:', initialEmployees);
          return;
        }
        
        console.log('Fetching employee data from JSON file...');
        
        // Try both paths to be safe
        try {
          // First try with a direct path
          const response = await fetch('/data/employeeData.json');
          
          if (!response.ok) {
            throw new Error(`Failed to fetch from /data: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Employee data fetched successfully from /data path:', data);
          
          if (data.employees && Array.isArray(data.employees)) {
            setEmployees(data.employees);
            console.log('Set employees data with', data.employees.length, 'employees');
            setLoading(false);
            return; // Exit if successful
          }
        } catch (firstError) {
          console.error('First fetch attempt failed:', firstError);
          // Continue to second attempt
        }
        
        // Second attempt with public path
        try {
          const response = await fetch('/public/data/employeeData.json');
          
          if (!response.ok) {
            throw new Error(`Failed to fetch from /public/data: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Employee data fetched successfully from /public/data path:', data);
          
          if (data.employees && Array.isArray(data.employees)) {
            setEmployees(data.employees);
            console.log('Set employees data with', data.employees.length, 'employees from second attempt');
          } else {
            throw new Error('Invalid data structure in second attempt');
          }
        } catch (secondError) {
          console.error('Second fetch attempt failed:', secondError);
          
          // Last resort: inline data
          console.log('Using hardcoded fallback data');
          const fallbackData = [
            {
              "id": "emp_001",
              "name": "Mohit Nippanikar",
              "email": "mohit.nippanikar@adani.com",
              "phone": "+91 98765 43210",
              "location": "Mumbai, India",
              "department": "Engineering",
              "position": "Senior Developer",
              "joinDate": "2022-06-15",
              "status": "premium",
              "skills": ["JavaScript", "React", "Node.js", "AWS", "AI/ML"],
              "avatar": "https://randomuser.me/api/portraits/men/32.jpg"
            },
            {
              "id": "emp_002",
              "name": "Priya Patel",
              "email": "priya.patel@adani.com",
              "phone": "+91 87654 32109",
              "location": "Ahmedabad, India",
              "department": "Human Resources",
              "position": "HR Manager",
              "joinDate": "2021-04-02",
              "status": "active",
              "skills": ["Recruiting", "Employee Relations", "Training"],
              "avatar": "https://randomuser.me/api/portraits/women/44.jpg"
            }
          ];
          setEmployees(fallbackData);
        }
      } catch (error) {
        console.error('Error in main fetchEmployees function:', error);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, [initialEmployees]);
  
  // Get unique departments for filter
  const departments = [...new Set(employees.map(employee => employee.department))];
  
  // Get unique locations for filter
  const locations = [...new Set(employees.map(employee => employee.location))];
  
  // Filter employees based on search query, status, department, and location
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    const matchesLocation = selectedLocation === 'all' || employee.location === selectedLocation;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesLocation;
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Handle making a call
  const handleCall = async (employee: Employee) => {
    // Set calling state
    setCallingEmployeeId(employee.id);
    setCallStatus(null);
    
    try {
      const response = await axios.post('https://helping-cockatoo-neatly.ngrok-free.app/make-call', {
        message: "a call is made"
      });
      console.log('Call request sent:', response.data);
      
      // Show success message
      setCallStatus({
        success: true,
        message: `Call initiated to ${employee.name}`,
        employeeId: employee.id
      });
      
      // Reset calling state after 3 seconds
      setTimeout(() => {
        setCallStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error making call request:', error);
      
      // Show error message
      setCallStatus({
        success: false,
        message: 'Failed to initiate call. Please try again.',
        employeeId: employee.id
      });
      
      // Reset error status after 3 seconds
      setTimeout(() => {
        setCallStatus(null);
      }, 3000);
    } finally {
      // Reset calling state
      setCallingEmployeeId(null);
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'premium':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5BE]"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#13131F] rounded-xl border border-gray-700">
      {/* Toast Notification */}
      {callStatus && (
        <div 
          className={`fixed bottom-4 right-4 max-w-md px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in ${
            callStatus.success 
              ? 'bg-[#00E5BE]/20 border border-[#00E5BE]/50 text-[#00E5BE]' 
              : 'bg-red-500/20 border border-red-500/50 text-red-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {callStatus.success ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
            <span>{callStatus.message}</span>
          </div>
        </div>
      )}
      
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Employee Directory</h3>
        
        {/* Search input */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5BE]/50"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Filters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5BE]/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="premium">Premium</option>
              <option value="new">New</option>
            </select>
          </div>
          
          {/* Department filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5BE]/50"
            >
              <option value="all">All Departments</option>
              {departments.map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>
          
          {/* Location filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5BE]/50"
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Employees list with only horizontal scrolling */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[1000px] whitespace-nowrap">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-left text-xs uppercase tracking-wider">
              <th className="py-3 px-4" style={{width: "30%"}}>Employee</th>
              <th className="py-3 px-4" style={{width: "18%"}}>Position</th>
              <th className="py-3 px-4" style={{width: "18%"}}>Department</th>
              <th className="py-3 px-4" style={{width: "15%"}}>Join Date</th>
              <th className="py-3 px-4" style={{width: "10%"}}>Status</th>
              <th className="py-3 px-4 text-right" style={{width: "9%"}}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(employee => (
                <tr key={employee.id} className="hover:bg-gray-800/30">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                        <Image 
                          src={employee.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                          alt={employee.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white truncate">{employee.name}</div>
                        <div className="text-sm text-gray-400 truncate">{employee.email}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {employee.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="inline-block px-1.5 py-0.5 bg-gray-800 text-gray-300 text-[10px] rounded">
                              {skill}
                            </span>
                          ))}
                          {employee.skills.length > 3 && (
                            <div className="relative inline-block group">
                              <span className="inline-block px-1.5 py-0.5 bg-gray-800 text-gray-300 text-[10px] rounded cursor-help">
                                +{employee.skills.length - 3} more
                              </span>
                              <div className="absolute left-0 bottom-full z-10 mb-2 w-40 p-2 bg-gray-900 text-xs text-white rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <p className="font-medium mb-1">All Skills:</p>
                                <div className="flex flex-wrap gap-1">
                                  {employee.skills.map((skill, index) => (
                                    <span key={index} className="inline-block px-1.5 py-0.5 bg-gray-800 text-gray-300 text-[10px] rounded">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white">{employee.position}</td>
                  <td className="py-4 px-4 text-white">{employee.department}</td>
                  <td className="py-4 px-4 text-white">{formatDate(employee.joinDate)}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(employee.status)}`}>
                      {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleCall(employee)}
                        disabled={callingEmployeeId === employee.id}
                        className={`p-2 rounded-lg transition-colors ${
                          callingEmployeeId === employee.id 
                            ? 'bg-[#00E5BE]/20 text-[#00E5BE] cursor-not-allowed'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-[#00E5BE]'
                        }`}
                      >
                        <span className="sr-only">Call</span>
                        {callingEmployeeId === employee.id ? (
                          <svg className="animate-pulse h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        )}
                      </button>
                      <button
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-[#00E5BE]"
                      >
                        <span className="sr-only">Email</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-[#00E5BE]"
                      >
                        <span className="sr-only">View Profile</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    <p className="mb-1 font-medium">No matching employees found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Employee count and filters summary */}
      <div className="p-4 border-t border-gray-700 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'} found
        </div>
        
        <div className="flex gap-2">
          {searchQuery && (
            <div className="inline-flex items-center px-3 py-1 text-xs rounded-full bg-blue-900/30 text-blue-400">
              Search: {searchQuery}
              <button 
                onClick={() => setSearchQuery('')}
                className="ml-2 hover:text-blue-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {selectedStatus !== 'all' && (
            <div className="inline-flex items-center px-3 py-1 text-xs rounded-full bg-green-900/30 text-green-400">
              Status: {selectedStatus}
              <button 
                onClick={() => setSelectedStatus('all')}
                className="ml-2 hover:text-green-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {selectedDepartment !== 'all' && (
            <div className="inline-flex items-center px-3 py-1 text-xs rounded-full bg-purple-900/30 text-purple-400">
              Department: {selectedDepartment}
              <button 
                onClick={() => setSelectedDepartment('all')}
                className="ml-2 hover:text-purple-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {selectedLocation !== 'all' && (
            <div className="inline-flex items-center px-3 py-1 text-xs rounded-full bg-teal-900/30 text-teal-400">
              Location: {selectedLocation}
              <button 
                onClick={() => setSelectedLocation('all')}
                className="ml-2 hover:text-teal-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {(searchQuery || selectedStatus !== 'all' || selectedDepartment !== 'all' || selectedLocation !== 'all') && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedDepartment('all');
                setSelectedLocation('all');
              }}
              className="px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      
      {/* Employee details modal would go here */}
    </div>
  );
} 