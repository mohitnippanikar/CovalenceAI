"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme-provider';

interface PolicySection {
  id: string;
  title: string;
  content: string | React.ReactNode;
  subsections?: PolicySubsection[];
  icon?: string;
}

interface PolicySubsection {
  id: string;
  title: string;
  content: string | React.ReactNode;
  roles?: RoleContent[];
  icon?: string;
}

interface RoleContent {
  role: string;
  content: string;
}

type Role = 'All' | 'Admin' | 'Contractor' | 'Intern' | 'Manager';
type Department = 'All' | 'Sales' | 'HR' | 'IT';

interface PolicyFilters {
  section?: string;
  role?: string;
  department?: string;
}

interface PolicyDocumentProps {
  initialFilters?: PolicyFilters;
}

export const PolicyDocument: React.FC<PolicyDocumentProps> = ({ initialFilters }) => {
  const { theme } = useTheme();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedSubsections, setExpandedSubsections] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSections, setFilteredSections] = useState<PolicySection[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('All');
  const [policyData, setPolicyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Apply initial filters when component mounts or initialFilters changes
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.section) {
        // Automatically expand the specified section when loaded
        setExpandedSections(prev => 
          prev.includes(initialFilters.section!) 
            ? prev 
            : [...prev, initialFilters.section!]
        );
      }
      
      if (initialFilters.role && initialFilters.role !== 'All') {
        setSelectedRole(initialFilters.role as Role);
      }
      
      if (initialFilters.department && initialFilters.department !== 'All') {
        setSelectedDepartment(initialFilters.department as Department);
      }
    }
  }, [initialFilters]);

  useEffect(() => {
    // Fetch the policy data from the data.json file
    fetch('/data/policyData.json')
      .then(response => response.json())
      .then(data => {
        setPolicyData(data.policy);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading policy data:', error);
        setLoading(false);
      });
  }, []);
  
  useEffect(() => {
    if (policyData) {
      // Initialize sections from the policy data
      const sections = policyData.sections.map((section: any) => {
        // Convert the section to our PolicySection type
        const policySection: PolicySection = {
          id: section.id,
          title: section.title,
          content: typeof section.content === 'string' 
            ? section.content 
            : Array.isArray(section.content) 
              ? (
                <ul className="list-disc pl-6 space-y-2">
                  {section.content.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )
              : section.content
        };
        
        // If the section has subsections, add them
        if (section.subsections) {
          policySection.subsections = section.subsections.map((subsection: any) => {
            let subsectionContent: any = subsection.content;
            
            // Handle different content structures in subsections
            if (typeof subsection.content === 'object' && !React.isValidElement(subsection.content)) {
              if (subsection.content.general) {
                subsectionContent = (
                  <div className="space-y-3">
                    <ul className="list-disc pl-6 space-y-1">
                      {subsection.content.general.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    {subsection.content.roles && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(subsection.content.roles).map(([role, desc]: [string, any]) => (
                          <p key={role}><strong>{role}:</strong> {desc}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            } else if (Array.isArray(subsection.content)) {
              subsectionContent = (
                <ul className="list-disc pl-6 space-y-1">
                  {subsection.content.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              );
            }
            
            return {
              id: subsection.id,
              title: subsection.title,
              content: subsectionContent
            };
          });
        }
        
        return policySection;
      });
      
      setFilteredSections(sections);
    }
  }, [policyData]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(secId => secId !== id) : [...prev, id]
    );
  };

  const toggleSubsection = (id: string) => {
    setExpandedSubsections(prev => 
      prev.includes(id) ? prev.filter(secId => secId !== id) : [...prev, id]
    );
  };

  const isSectionExpanded = (id: string) => expandedSections.includes(id);
  const isSubsectionExpanded = (id: string) => expandedSubsections.includes(id);

  // Implement search functionality
  useEffect(() => {
    if (!policyData) return;
    
    if (!searchQuery && selectedRole === 'All' && selectedDepartment === 'All') {
      // If no filters are applied, show all sections
      setFilteredSections(policyData.sections.map((section: any) => {
        // Convert to our PolicySection type as done above
        // ... (same code as in the previous useEffect)
        const policySection: PolicySection = {
          id: section.id,
          title: section.title,
          content: typeof section.content === 'string' 
            ? section.content 
            : Array.isArray(section.content) 
              ? (
                <ul className="list-disc pl-6 space-y-2">
                  {section.content.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )
              : section.content,
          icon: section.icon
        };
        
        // If the section has subsections, add them
        if (section.subsections) {
          policySection.subsections = section.subsections.map((subsection: any) => {
            let subsectionContent: any = subsection.content;
            
            // Handle different content structures in subsections
            if (typeof subsection.content === 'object' && !React.isValidElement(subsection.content)) {
              if (subsection.content.general) {
                subsectionContent = (
                  <div className="space-y-3">
                    <ul className="list-disc pl-6 space-y-1">
                      {subsection.content.general.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    {subsection.content.roles && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(subsection.content.roles).map(([role, desc]: [string, any]) => (
                          <p key={role}><strong>{role}:</strong> {desc}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            } else if (Array.isArray(subsection.content)) {
              subsectionContent = (
                <ul className="list-disc pl-6 space-y-1">
                  {subsection.content.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              );
            }
            
            return {
              id: subsection.id,
              title: subsection.title,
              content: subsectionContent,
              icon: subsection.icon
            };
          });
        }
        
        return policySection;
      }));
      return;
    }

    // Apply filters
    const filteredData = policyData.sections.filter((section: any) => {
      const titleMatch = section.title.toLowerCase().includes(searchQuery.toLowerCase());
      const contentMatch = typeof section.content === 'string' && 
        section.content.toLowerCase().includes(searchQuery.toLowerCase());

      // Check if it matches the role filter
      const roleMatch = selectedRole === 'All' || 
        (section.id === 'roles' && section.subsections?.some((s: any) => 
          s.title.toLowerCase() === selectedRole.toLowerCase() || 
          s.id.includes(selectedRole.toLowerCase())));

      // Check if it matches the department filter
      const deptMatch = selectedDepartment === 'All' || 
        (section.id === 'departments' && section.subsections?.some((s: any) => 
          s.title.toLowerCase().includes(selectedDepartment.toLowerCase()) || 
          s.id.includes(selectedDepartment.toLowerCase())));
      
      return (titleMatch || contentMatch) && roleMatch && deptMatch;
    }).map((section: any) => {
      // Same conversion code as above
      // ... (same code for creating PolicySection)
      const policySection: PolicySection = {
        id: section.id,
        title: section.title,
        content: typeof section.content === 'string' 
          ? section.content 
          : Array.isArray(section.content) 
            ? (
              <ul className="list-disc pl-6 space-y-2">
                {section.content.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )
            : section.content,
        icon: section.icon
      };
      
      // If the section has subsections, add them
      if (section.subsections) {
        policySection.subsections = section.subsections
          .filter((subsection: any) => {
            // Filter subsections based on search and role/dept
            const titleMatch = subsection.title.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Check content match based on its type
            let contentMatch = false;
            if (typeof subsection.content === 'string') {
              contentMatch = subsection.content.toLowerCase().includes(searchQuery.toLowerCase());
            } else if (Array.isArray(subsection.content)) {
              contentMatch = subsection.content.some((item: string) => 
                item.toLowerCase().includes(searchQuery.toLowerCase()));
            } else if (subsection.content?.general) {
              contentMatch = subsection.content.general.some((item: string) => 
                item.toLowerCase().includes(searchQuery.toLowerCase()));
            }
            
            // Role/department specific matching
            const roleMatch = selectedRole === 'All' || subsection.applicableTo?.includes(selectedRole);
            const deptMatch = selectedDepartment === 'All' || subsection.applicableTo?.includes(selectedDepartment);
            
            return (titleMatch || contentMatch) && roleMatch && deptMatch;
          })
          .map((subsection: any) => {
            // Same conversion code for subsections
            // ... (same code for creating subsections)
            let subsectionContent: any = subsection.content;
            
            // Handle different content structures in subsections
            if (typeof subsection.content === 'object' && !React.isValidElement(subsection.content)) {
              if (subsection.content.general) {
                subsectionContent = (
                  <div className="space-y-3">
                    <ul className="list-disc pl-6 space-y-1">
                      {subsection.content.general.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    {subsection.content.roles && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(subsection.content.roles).map(([role, desc]: [string, any]) => (
                          <p key={role}><strong>{role}:</strong> {desc}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            } else if (Array.isArray(subsection.content)) {
              subsectionContent = (
                <ul className="list-disc pl-6 space-y-1">
                  {subsection.content.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              );
            }
            
            return {
              id: subsection.id,
              title: subsection.title,
              content: subsectionContent,
              icon: subsection.icon
            };
          });
      }
      
      return policySection;
    });
    
    setFilteredSections(filteredData);
    
    // Auto-expand sections when filtering or searching
    if (searchQuery || selectedRole !== 'All' || selectedDepartment !== 'All') {
      // Expand all matching sections
      const sectionIds = filteredData.map((section: PolicySection) => section.id);
      setExpandedSections(sectionIds);
      
      // Get all subsection IDs for auto-expansion
      const subsectionIds: string[] = [];
      filteredData.forEach((section: PolicySection) => {
        if (section.subsections) {
          section.subsections.forEach((subsection: PolicySubsection) => {
            subsectionIds.push(subsection.id);
          });
        }
      });
      
      setExpandedSubsections(subsectionIds);
    }
  }, [searchQuery, selectedRole, selectedDepartment, policyData]);

  // Function to map icon strings to emoji or components
  const renderIcon = (iconString?: string) => {
    if (!iconString) return null;
    
    // Map emoji strings to SVG icons
    const iconMap: Record<string, JSX.Element> = {
      '📜': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>,
      '⚖️': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-purple-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>,
      '⏰': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-green-500 to-green-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>,
      '🖥️': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
              </svg>
            </div>,
      '👷': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-500 to-yellow-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>,
      '🎓': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-500 to-red-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
            </div>,
      '🧑‍💼': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-teal-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>,
      '💰': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>,
      '🧑‍🤝‍🧑': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-pink-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>,
      '💻': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-cyan-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
              </svg>
            </div>,
      '🌴': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-green-500 to-green-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683c1.112.476 2.125.685 3.122.62.975-.065 1.837-.438 2.514-1.158a3.723 3.723 0 00-1.63-1.926A2.983 2.983 0 0010 8c.396 0 .776.079 1.12.222a3.723 3.723 0 00-1.63 1.926c.678.72 1.54 1.093 2.514 1.158.996.065 2.01-.144 3.122-.62V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.704 3.704 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132z" clipRule="evenodd" />
              </svg>
            </div>,
      '🔐': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>,
      '👔': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
            </div>,
      '📎': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-purple-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
            </div>,
      '✍️': <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-lime-500 to-lime-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
    };
    
    // Return mapped icon if available, or a default icon
    return iconMap[iconString] || 
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center mr-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
      </div>;
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {filteredSections.map((section) => (
        <motion.div
          key={section.id}
          id={section.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`
            overflow-hidden shadow-lg rounded-xl transition-all duration-300
            ${theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-blue-500 shadow-md hover:shadow-blue-900/20' 
              : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-xl'
            }
          `}
        >
          <div 
            className={`
              p-5 cursor-pointer flex items-center justify-between
              ${theme === 'dark' 
                ? 'bg-gradient-to-r from-gray-800 via-indigo-900/20 to-gray-800 border-b border-gray-700' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'
              }
            `}
            onClick={() => toggleSection(section.id)}
          >
            <div className="flex items-center gap-3">
              {section.icon && renderIcon(section.icon)}
              <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {section.title}
              </h3>
            </div>
            <motion.div 
              animate={{ rotate: isSectionExpanded(section.id) ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className={`
                p-1 rounded-full
                ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-blue-100 text-blue-500'}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </motion.div>
          </div>
          
          {isSectionExpanded(section.id) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="p-5"
            >
              <div className="mb-4">
                {section.content}
              </div>
              
              {section.subsections && section.subsections.length > 0 && (
                <div className="space-y-4 mt-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  {section.subsections.map((subsection) => (
                    <div key={subsection.id} className="ml-2">
                      <div 
                        className={`
                          py-2 px-3 cursor-pointer flex items-center justify-between rounded-lg
                          ${theme === 'dark' 
                            ? 'bg-gray-800 hover:bg-gray-700' 
                            : 'bg-gray-50 hover:bg-gray-100'
                          }
                        `}
                        onClick={() => toggleSubsection(subsection.id)}
                      >
                        <div className="flex items-center">
                          {subsection.icon && renderIcon(subsection.icon)}
                          <h4 className="font-semibold">{subsection.title}</h4>
                        </div>
                        <motion.div 
                          animate={{ rotate: isSubsectionExpanded(subsection.id) ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className={`
                            p-1 rounded-full
                            ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-500'}
                          `}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </motion.div>
                      </div>
                      
                      {isSubsectionExpanded(subsection.id) && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`
                            mt-2 p-4 rounded-lg
                            ${theme === 'dark' 
                              ? 'bg-gray-800/50 border border-gray-700' 
                              : 'bg-white border border-gray-200'
                            }
                          `}
                        >
                          {subsection.content}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-5 mt-5">
      {filteredSections.map((section) => (
        <motion.div
          key={section.id}
          id={section.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`
            overflow-hidden shadow-md rounded-xl transition-all duration-300
            ${theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-blue-500' 
              : 'bg-white border border-gray-200 hover:border-blue-400 hover:shadow-lg'
            }
          `}
        >
          <div 
            className={`
              p-5 cursor-pointer flex items-center justify-between
              ${theme === 'dark' 
                ? 'bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50'
              }
            `}
            onClick={() => toggleSection(section.id)}
          >
            <div className="flex items-center">
              {section.icon && renderIcon(section.icon)}
              <h3 className="font-bold text-lg">
                {section.title}
              </h3>
            </div>
            <motion.div 
              animate={{ rotate: isSectionExpanded(section.id) ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className={`
                p-1 rounded-full
                ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-blue-100 text-blue-500'}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </motion.div>
          </div>
          
          {isSectionExpanded(section.id) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="p-5"
            >
              <div className="mb-5">
                {section.content}
              </div>
              
              {section.subsections && section.subsections.length > 0 && (
                <div className="mt-5 space-y-4 pl-4 border-l-2 border-blue-200 dark:border-gray-700">
                  {section.subsections.map((subsection) => (
                    <motion.div 
                      key={subsection.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`
                        rounded-lg overflow-hidden shadow-md
                        ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
                      `}
                    >
                      <div 
                        className={`
                          p-4 cursor-pointer flex items-center justify-between
                          ${theme === 'dark' 
                            ? 'bg-gradient-to-r from-gray-700 to-gray-800' 
                            : 'bg-gradient-to-r from-indigo-50 to-blue-50'
                          }
                        `}
                        onClick={() => toggleSubsection(subsection.id)}
                      >
                        <div className="flex items-center">
                          {subsection.icon && renderIcon(subsection.icon)}
                          <h4 className="font-semibold">
                            {subsection.title}
                          </h4>
                        </div>
                        <motion.div 
                          animate={{ rotate: isSubsectionExpanded(subsection.id) ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className={`
                            p-1 rounded-full text-xs
                            ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-blue-100 text-blue-500'}
                          `}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </motion.div>
                      </div>
                      
                      {isSubsectionExpanded(subsection.id) && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="p-4"
                        >
                          {subsection.content}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );

  // Helper to highlight matching text in content
  const highlightMatches = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? 
        <span key={i} className="bg-yellow-200 text-black px-1 rounded">{part}</span> : 
        part
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
      {/* Header with branding */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-lg mr-4 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text' : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-transparent bg-clip-text'}`}>
            Adani Group Policy
          </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
              <span>Version 1.0 • Last Updated: April 5, 2025</span>
            </div>
          </div>
        </div>
        <div className="py-2 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Official Corporate Document</span>
        </div>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="space-y-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search policy content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all
                  ${theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' 
                    : 'bg-white border-gray-300 focus:ring-blue-400'}`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all
                ${theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' 
                  : 'bg-white border-gray-300 focus:ring-blue-400'}`}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Contractor">Contractor</option>
              <option value="Intern">Intern</option>
              <option value="Manager">Manager</option>
            </select>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value as Department)}
              className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all
                ${theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' 
                  : 'bg-white border-gray-300 focus:ring-blue-400'}`}
            >
              <option value="All">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
            </select>
            <button
              onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
              className={`px-4 py-3 rounded-lg border focus:outline-none transition-all flex items-center
                ${theme === 'dark'
                  ? 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700' 
                  : 'bg-blue-500 border-blue-400 text-white hover:bg-blue-600'}`}
            >
              {viewMode === 'card' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  List
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Cards
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Active Filters */}
        {(searchQuery || selectedRole !== 'All' || selectedDepartment !== 'All') && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm
                ${theme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}
              >
                <span>Search: {searchQuery}</span>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {selectedRole !== 'All' && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm
                ${theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'}`}
              >
                <span>Role: {selectedRole}</span>
                <button 
                  onClick={() => setSelectedRole('All')}
                  className="ml-2 text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {selectedDepartment !== 'All' && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm
                ${theme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}
              >
                <span>Department: {selectedDepartment}</span>
                <button 
                  onClick={() => setSelectedDepartment('All')}
                  className="ml-2 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('All');
                setSelectedDepartment('All');
              }}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm
                ${theme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <span>Clear All</span>
            </button>
          </div>
        )}
        
        {/* Quick Navigation */}
        <div className="overflow-x-auto">
          <div className="inline-flex flex-nowrap gap-2 py-1">
            <span className={`text-sm flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Access:
            </span>
            {policyData?.sections?.map((section: any) => (
              <button
                key={section.id}
                onClick={() => {
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  if (!expandedSections.includes(section.id)) {
                    toggleSection(section.id);
                  }
                }}
                className={`text-xs px-3 py-2 rounded-full transition-colors whitespace-nowrap flex items-center gap-1
                  ${theme === 'dark' 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'}`}
              >
                {section.title.replace(/^[IV]+\.\s+/, '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results info */}
      {(searchQuery || selectedRole !== 'All' || selectedDepartment !== 'All') && (
        <div className={`mb-5 px-4 py-2 rounded-md text-sm
          ${theme === 'dark' 
            ? 'bg-blue-900/20 text-blue-300 border border-blue-900/30' 
            : 'bg-blue-50 text-blue-700 border border-blue-100'}`}
        >
          {filteredSections.length === 0 ? (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No policy sections match your search criteria
            </div>
          ) : (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Found {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} matching your criteria
            </div>
          )}
        </div>
      )}

      {/* Policy Content */}
      <div>
        {filteredSections.length > 0 ? (
          viewMode === 'card' ? renderCardView() : renderListView()
        ) : (
          <div className={`text-center p-10 rounded-lg border
            ${theme === 'dark' ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">No policy sections match your search criteria</p>
            <p className="mt-2">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('All');
                setSelectedDepartment('All');
              }}
              className={`mt-4 px-4 py-2 rounded-md
                ${theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 