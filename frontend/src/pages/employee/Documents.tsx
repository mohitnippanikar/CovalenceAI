import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Download, Share, Clock, FileText, FileImage, Star, StarOff, FileCode, MoreHorizontal, Plus, Lock, ShieldAlert, Globe, X, Upload } from 'lucide-react';

// Document types with their icons
const DOC_TYPES = {
  pdf: <FileText className="w-5 h-5 text-red-400" />,
  doc: <FileText className="w-5 h-5 text-blue-400" />,
  img: <FileImage className="w-5 h-5 text-green-400" />,
  code: <FileCode className="w-5 h-5 text-yellow-400" />,
};

// Confidentiality levels with their icons and styles
const CONFIDENTIALITY = {
  public: {
    icon: <Globe className="w-4 h-4" />,
    label: 'Public',
    style: 'text-green-400 bg-green-400/10 border-green-400/20'
  },
  internal: {
    icon: <Lock className="w-4 h-4" />,
    label: 'Internal',
    style: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
  },
  confidential: {
    icon: <ShieldAlert className="w-4 h-4" />,
    label: 'Confidential',
    style: 'text-red-400 bg-red-400/10 border-red-400/20'
  }
};

type ConfidentialityLevel = 'public' | 'internal' | 'confidential';

// Mock data for document categories
const CATEGORIES = [
  { id: 'all', name: 'All Documents', count: 24 },
  { id: 'shared', name: 'Shared with Me', count: 7 },
  { id: 'starred', name: 'Starred', count: 5 },
  { id: 'recent', name: 'Recently Viewed', count: 12 },
];

// Interface for document with confidentiality
interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  author: string;
  starred: boolean;
  shared: boolean;
  confidentiality: ConfidentialityLevel;
  url?: string; // Optional URL for viewing the document
}

// Mock data for documents
const DEFAULT_DOCUMENTS: Document[] = [
  {
    id: '1',
    name: 'Q3 Financial Report 2023.pdf',
    type: 'pdf',
    size: '4.2 MB',
    lastModified: '2023-10-15',
    author: 'Marcus Johnson',
    starred: true,
    shared: false,
    confidentiality: 'confidential'
  },
  {
    id: '2',
    name: 'Product Roadmap 2024.doc',
    type: 'doc',
    size: '2.1 MB',
    lastModified: '2023-11-01',
    author: 'Emma Roberts',
    starred: true,
    shared: true,
    confidentiality: 'internal'
  },
  {
    id: '3',
    name: 'Marketing Campaign Assets.zip',
    type: 'code',
    size: '15.7 MB',
    lastModified: '2023-11-12',
    author: 'Sophia Chen',
    starred: false,
    shared: true,
    confidentiality: 'public'
  },
  {
    id: '4',
    name: 'Company Branding Guidelines.pdf',
    type: 'pdf',
    size: '3.5 MB',
    lastModified: '2023-09-28',
    author: 'Alex Thompson',
    starred: false,
    shared: false,
    confidentiality: 'internal'
  },
  {
    id: '5',
    name: 'Product Demo Screenshots.png',
    type: 'img',
    size: '8.3 MB',
    lastModified: '2023-11-18',
    author: 'You',
    starred: true,
    shared: true,
    confidentiality: 'public'
  },
  {
    id: '6',
    name: 'Annual Report 2023.pdf',
    type: 'pdf',
    size: '5.9 MB',
    lastModified: '2023-11-20',
    author: 'Marcus Johnson',
    starred: false,
    shared: false,
    confidentiality: 'confidential'
  },
];

const Documents: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [confidentialityFilter, setConfidentialityFilter] = useState<ConfidentialityLevel | 'all'>('all');
  const [saveStatus, setSaveStatus] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents from localStorage on component mount
  useEffect(() => {
    const storedDocs = localStorage.getItem('documents');
    if (storedDocs) {
      try {
        setDocuments(JSON.parse(storedDocs));
      } catch (error) {
        console.error('Error parsing stored documents:', error);
        resetToDefaultDocuments();
      }
    } else {
      // If no documents in localStorage, use default data
      resetToDefaultDocuments();
    }
  }, []);

  // Function to reset to default documents
  const resetToDefaultDocuments = () => {
    setDocuments(DEFAULT_DOCUMENTS);
    localStorage.setItem('documents', JSON.stringify(DEFAULT_DOCUMENTS));
  };

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('documents', JSON.stringify(documents));
      setSaveStatus('Changes saved');
      
      // Clear the save status after 2 seconds
      const timer = setTimeout(() => {
        setSaveStatus('');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [documents]);

  // File upload handling
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newDocuments = files.map(file => {
      // Determine document type based on extension
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      let type = 'doc';
      
      if (['pdf'].includes(extension)) type = 'pdf';
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) type = 'img';
      else if (['zip', 'rar', 'js', 'ts', 'jsx', 'tsx', 'html', 'css'].includes(extension)) type = 'code';
      
      // Create blob URL for the file
      const url = URL.createObjectURL(file);
      
      // Create a new document object
      return {
        id: crypto.randomUUID(),
        name: file.name,
        type,
        size: formatFileSize(file.size),
        lastModified: new Date().toISOString().split('T')[0],
        author: 'You',
        starred: false,
        shared: false,
        confidentiality: 'internal' as ConfidentialityLevel,
        url
      };
    });
    
    // Add new documents to the existing list
    setDocuments(prevDocs => [...newDocuments, ...prevDocs]);
    setSaveStatus('Files uploaded successfully');
    setShowUploadModal(false);
  };

  // Utility function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Function to toggle starred status
  const toggleStarred = (id: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, starred: !doc.starred } : doc
      )
    );
  };

  // Function to change document confidentiality
  const changeConfidentiality = (id: string, level: ConfidentialityLevel) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, confidentiality: level } : doc
      )
    );
  };

  // Delete a document
  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    setSaveStatus('Document deleted');
  };

  // Update category counts
  const categoryCounts = {
    all: documents.length,
    shared: documents.filter(doc => doc.shared).length,
    starred: documents.filter(doc => doc.starred).length,
    recent: Math.min(12, documents.length) // Assuming recent shows latest 12 docs
  };

  // Updated categories with dynamic counts
  const updatedCategories = CATEGORIES.map(category => ({
    ...category,
    count: categoryCounts[category.id as keyof typeof categoryCounts] || 0
  }));

  // Function to filter documents based on active category, search query, and confidentiality
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      activeCategory === 'all' ||
      (activeCategory === 'starred' && doc.starred) ||
      (activeCategory === 'shared' && doc.shared) ||
      (activeCategory === 'recent');

    const matchesSearch = searchQuery
      ? doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.author.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesConfidentiality = 
      confidentialityFilter === 'all' || 
      doc.confidentiality === confidentialityFilter;

    return matchesCategory && matchesSearch && matchesConfidentiality;
  });

  // Function to sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const dateA = new Date(a.lastModified).getTime();
    const dateB = new Date(b.lastModified).getTime();

    switch (sortOrder) {
      case 'newest':
        return dateB - dateA;
      case 'oldest':
        return dateA - dateB;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  return (
    <div className="py-6">
      {/* Upload modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div 
            className={`bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg mx-4 ${dragOver ? 'border-primary border-2' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Upload Documents</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-10 text-center mb-4 transition-all ${
                dragOver 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-700 hover:border-primary/50 hover:bg-gray-900/50'
              }`}
            >
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Drag & drop files here
                </h3>
                <p className="text-gray-400 mb-6 max-w-sm">
                  Upload PDF, Word, Excel, PowerPoint, images or any other files
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  multiple 
                  onChange={handleFileInput}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary text-black px-6 py-3 rounded-lg hover:bg-white transition-all duration-200 font-medium"
                >
                  Browse Files
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              <p>Confidentiality will be set to "Internal" by default. You can change it after upload.</p>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-8" id="welcome-section">
        <h1 className="text-3xl font-bold text-white mb-2">
          Document Explorer
        </h1>
        <p className="text-gray-400">
          Browse through various documents and information available in the system.
        </p>
        
        {/* Save status message */}
        {saveStatus && (
          <div className="mt-2 text-sm text-green-400">
            {saveStatus}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
            <div className="mb-6 space-y-2">
              <button 
                onClick={() => setShowUploadModal(true)}
                className="w-full bg-primary hover:bg-white text-black px-4 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Upload Document
              </button>
              
              <button 
                onClick={resetToDefaultDocuments}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center"
              >
                Reset Documents
              </button>
            </div>

            <div className="space-y-1">
              {updatedCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                    activeCategory === category.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-white hover:bg-gray-800'
                  }`}
                >
                  <span>{category.name}</span>
                  <span
                    className={`text-xs rounded-full px-2 py-1 ${
                      activeCategory === category.id
                        ? 'bg-primary/20'
                        : 'bg-gray-800'
                    }`}
                  >
                    {category.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Confidentiality Filter</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setConfidentialityFilter('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                    confidentialityFilter === 'all'
                      ? 'bg-primary/10 text-primary'
                      : 'text-white hover:bg-gray-800'
                  }`}
                >
                  <span>All Levels</span>
                </button>
                {(Object.keys(CONFIDENTIALITY) as ConfidentialityLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidentialityFilter(level)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center ${
                      confidentialityFilter === level
                        ? 'bg-primary/10 text-primary'
                        : 'text-white hover:bg-gray-800'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${CONFIDENTIALITY[level].style}`}>
                      {CONFIDENTIALITY[level].icon}
                    </span>
                    <span>{CONFIDENTIALITY[level].label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Storage</h3>
              <div className="space-y-2">
                <div className="bg-gray-800/50 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full w-[65%]"></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">65% used</span>
                  <span className="text-white">3.25GB / 5GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
            {/* Search and filters */}
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4" id="search-section">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-800/50 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-primary text-white"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="appearance-none bg-gray-900/50 border border-gray-800/50 rounded-lg py-3 pl-4 pr-10 focus:outline-none focus:border-primary text-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Documents list */}
            {sortedDocuments.length > 0 ? (
              <div className="space-y-4">
                <div className="hidden md:grid grid-cols-12 text-sm text-gray-400 mb-2 px-4">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Modified</div>
                  <div className="col-span-1">Level</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {sortedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="grid grid-cols-1 md:grid-cols-12 items-center p-4 bg-gray-900/50 rounded-lg border border-gray-800/50 hover:border-gray-700 transition-all duration-200 gap-4 md:gap-0"
                  >
                    <div className="col-span-5 flex items-center">
                      <button 
                        className="mr-3 text-gray-400 hover:text-primary"
                        onClick={() => toggleStarred(doc.id)}
                      >
                        {doc.starred ? (
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="w-5 h-5" />
                        )}
                      </button>
                      <div className="mr-3">
                        {DOC_TYPES[doc.type as keyof typeof DOC_TYPES] || <FileText className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">
                          {doc.url ? (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                              {doc.name}
                            </a>
                          ) : (
                            doc.name
                          )}
                        </h3>
                        <p className="text-sm text-gray-400">
                          By {doc.author} {doc.shared && '• Shared'}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 text-gray-400 text-sm">
                      {doc.size}
                    </div>
                    <div className="col-span-2 text-gray-400 text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {doc.lastModified}
                    </div>
                    <div className="col-span-1">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${CONFIDENTIALITY[doc.confidentiality].style}`}>
                        {CONFIDENTIALITY[doc.confidentiality].icon}
                        <span className="ml-1 hidden lg:inline">{CONFIDENTIALITY[doc.confidentiality].label}</span>
                      </div>
                    </div>
                    <div className="col-span-2 flex space-x-2">
                      <div className="relative group">
                        <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors duration-200">
                          <Lock className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-10 hidden group-hover:block">
                          {(Object.keys(CONFIDENTIALITY) as ConfidentialityLevel[]).map(level => (
                            <button
                              key={level}
                              onClick={() => changeConfidentiality(doc.id, level)}
                              className={`flex items-center w-full px-4 py-2 text-left hover:bg-gray-800 ${
                                level === doc.confidentiality ? 'bg-gray-800/70' : ''
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${CONFIDENTIALITY[level].style}`}>
                                {CONFIDENTIALITY[level].icon}
                              </span>
                              <span className="text-white">{CONFIDENTIALITY[level].label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {doc.url && (
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors duration-200"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                      <button 
                        className="p-2 bg-gray-800 hover:bg-red-700 rounded-lg text-gray-400 hover:text-white transition-colors duration-200"
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No documents found</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  {searchQuery
                    ? `No results found for "${searchQuery}". Try a different search term.`
                    : 'No documents in this category. Upload a document to get started.'}
                </p>
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 bg-primary hover:bg-white text-black px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
                >
                  Upload Documents
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 mb-8" id="quick-actions">
        {updatedCategories.map((category) => (
          <div
            key={category.id}
            className={`bg-gray-900/30 backdrop-blur-sm rounded-xl border ${
              activeCategory === category.id ? 'border-primary/30' : 'border-gray-800/50'
            } p-6 cursor-pointer hover:border-primary/20 transition-all duration-200`}
            onClick={() => setActiveCategory(category.id)}
          >
            <h3 className="text-sm font-medium text-gray-400 mb-4">{category.name}</h3>
            <div className="space-y-2">
              <div className="bg-gray-800/50 rounded-full h-2">
                <div className={`${
                  activeCategory === category.id ? 'bg-primary' : 'bg-gray-600'
                } h-2 rounded-full`} 
                style={{width: `${(category.count / Math.max(documents.length, 1)) * 100}%`}}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{category.count} documents</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confidentiality breakdown */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6 mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">Document Confidentiality</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(CONFIDENTIALITY) as ConfidentialityLevel[]).map(level => {
            const count = documents.filter(doc => doc.confidentiality === level).length;
            const percentage = Math.round((count / Math.max(documents.length, 1)) * 100);
            
            return (
              <div key={level} className={`bg-gray-800/30 rounded-xl p-4 border ${CONFIDENTIALITY[level].style}`}>
                <div className="flex items-center mb-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${CONFIDENTIALITY[level].style}`}>
                    {CONFIDENTIALITY[level].icon}
                  </span>
                  <h4 className="text-lg font-medium">{CONFIDENTIALITY[level].label}</h4>
                </div>
                <div className="flex items-end">
                  <span className="text-2xl font-semibold">{count}</span>
                  <span className="text-sm ml-2 text-gray-400">documents ({percentage}%)</span>
                </div>
                <div className="mt-3 bg-gray-800/50 rounded-full h-2">
                  <div className={`h-2 rounded-full ${
                    level === 'public' ? 'bg-green-400' : 
                    level === 'internal' ? 'bg-blue-400' : 'bg-red-400'
                  }`} style={{width: `${percentage}%`}}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Documents; 