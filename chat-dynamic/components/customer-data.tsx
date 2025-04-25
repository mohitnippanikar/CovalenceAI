"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  orders: number;
  totalSpent: number;
  lastPurchase: string;
  status: string;
  preferences: string[];
  avatar: string;
}

interface CustomerDataProps {
  customers?: Customer[];
}

export function CustomerData({ customers: initialCustomers }: CustomerDataProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [callingCustomerId, setCallingCustomerId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<{
    success: boolean;
    message: string;
    customerId: string | null;
  } | null>(null);
  
  // Fetch customers data if not provided as props
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        if (initialCustomers && initialCustomers.length > 0) {
          setCustomers(initialCustomers);
          setLoading(false);
          return;
        }
        
        const response = await fetch('/data/customerData.json');
        if (!response.ok) {
          throw new Error('Failed to fetch customer data');
        }
        
        const data = await response.json();
        setCustomers(data.customers || []);
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, [initialCustomers]);
  
  // Filter customers based on search query and status
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
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
  const handleCall = async (customer: Customer) => {
    // Set calling state
    setCallingCustomerId(customer.id);
    setCallStatus(null);
    
    try {
      const response = await axios.post('https://helping-cockatoo-neatly.ngrok-free.app/make-call', {
        message: "a call is made"
      });
      console.log('Call request sent:', response.data);
      
      // Show success message
      setCallStatus({
        success: true,
        message: `Call initiated to ${customer.name}`,
        customerId: customer.id
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
        customerId: customer.id
      });
      
      // Reset error status after 3 seconds
      setTimeout(() => {
        setCallStatus(null);
      }, 3000);
    } finally {
      // Reset calling state
      setCallingCustomerId(null);
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
    <div className="bg-[#13131F] rounded-xl border border-gray-700 overflow-hidden">
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
        <h3 className="text-lg font-medium text-white mb-4">Customer Data</h3>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#1A1A27] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00E5BE] pl-10"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
          
          {/* Status filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 bg-[#1A1A27] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00E5BE] appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="premium">Premium</option>
              <option value="new">New</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredCustomers.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <p>No customers found. Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 gap-4 p-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-[#1A1A27] rounded-xl border border-gray-700 hover:border-[#00E5BE] transition-colors p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Avatar and basic info */}
                  <div className="flex gap-4 items-center">
                    <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                      <Image 
                        src={customer.avatar} 
                        alt={customer.name}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{customer.name}</h4>
                      <p className="text-gray-400 text-sm">{customer.email}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(customer.status)} font-medium capitalize`}>
                          {customer.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer details */}
                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 md:mt-0">
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-white">{customer.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Orders</p>
                      <p className="text-white">{customer.orders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Spent</p>
                      <p className="text-white">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Last Purchase</p>
                      <p className="text-white">{formatDate(customer.lastPurchase)}</p>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-end md:pl-4 gap-2">
                    {/* Email button */}
                    <div className="relative group">
                      <a 
                        href={`mailto:${customer.email}?subject=Regarding your recent order&body=Hello ${customer.name},%0D%0A%0D%0AI'm reaching out regarding your recent order.%0D%0A%0D%0ABest regards,%0D%0AThe Team`}
                        className="p-3 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors block"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Email ${customer.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </a>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Email {customer.name}
                      </div>
                    </div>
                    
                    {/* Call button */}
                    <div className="relative group">
                      <button 
                        className={`p-3 rounded-full ${
                          callingCustomerId === customer.id
                            ? 'bg-[#00E5BE]/20 text-[#00E5BE]'
                            : 'bg-[#00E5BE]/10 text-[#00E5BE] hover:bg-[#00E5BE]/20'
                        } transition-colors`}
                        onClick={() => handleCall(customer)}
                        disabled={callingCustomerId === customer.id}
                        aria-label={`Call ${customer.name}`}
                      >
                        {callingCustomerId === customer.id ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        )}
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {callingCustomerId === customer.id ? 'Calling...' : `Call ${customer.name}`}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Preferences */}
                {customer.preferences && customer.preferences.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {customer.preferences.map((pref, index) => (
                        <span key={index} className="bg-[#282836] text-gray-300 text-xs px-2 py-1 rounded-full">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 