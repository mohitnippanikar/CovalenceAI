import React, { useState } from 'react';
import { Search, Filter, FileText, Folder, ChevronDown, FileType, Eye, Download, Share2 } from 'lucide-react';

// Mock data for documents
const MOCK_DOCUMENTS = [
  { 
    id: '1', 
    name: 'Q4 Financial Report 2023.pdf', 
    type: 'PDF', 
    size: '2.4 MB', 
    category: 'Financial',
    dateUploaded: '2023-10-15',
    uploadedBy: 'Sarah Johnson',
  },
  { 
    id: '2', 
    name: 'Marketing Strategy 2024.docx', 
    type: 'DOCX', 
    size: '1.8 MB', 
    category: 'Marketing',
    dateUploaded: '2023-11-02',
    uploadedBy: 'Michael Chen',
  },
  { 
    id: '3', 
    name: 'Customer Feedback Analysis.xlsx', 
    type: 'XLSX', 
    size: '3.2 MB', 
    category: 'Customer',
    dateUploaded: '2023-11-10',
    uploadedBy: 'Emma Williams',
  },
  { 
    id: '4', 
    name: 'Product Development Roadmap.pptx', 
    type: 'PPTX', 
    size: '5.1 MB', 
    category: 'Product',
    dateUploaded: '2023-11-15',
    uploadedBy: 'David Miller',
  },
  { 
    id: '5', 
    name: 'HR Policy Updates.pdf', 
    type: 'PDF', 
    size: '1.5 MB', 
    category: 'HR',
    dateUploaded: '2023-11-20',
    uploadedBy: 'Jessica Lee',
  },
];

// Define categories with colors
const CATEGORIES = [
  { name: 'All', color: 'bg-gray-500' },
  { name: 'Financial', color: 'bg-blue-500' },
  { name: 'Marketing', color: 'bg-green-500' },
  { name: 'Customer', color: 'bg-yellow-500' },
  { name: 'Product', color: 'bg-purple-500' },
  { name: 'HR', color: 'bg-red-500' },
];

const ViewUploads: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Filter documents based on search query and category
  const filteredDocuments = MOCK_DOCUMENTS.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.dateUploaded).getTime() - new Date(b.dateUploaded).getTime() 
        : new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime();
    } else if (sortBy === 'size') {
      const aSize = parseFloat(a.size.split(' ')[0]);
      const bSize = parseFloat(b.size.split(' ')[0]);
      return sortOrder === 'asc' ? aSize - bSize : bSize - aSize;
    }
    return 0;
  });

  // Toggle sort order
  const toggleSort = (newSortBy: 'name' | 'date' | 'size') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const foundCategory = CATEGORIES.find(cat => cat.name === category);
    return foundCategory ? foundCategory.color : 'bg-gray-500';
  };

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Document Library</h1>
        <p className="text-gray-400">
          Browse, view, and download documents that have been uploaded to the platform.
        </p>
      </div>

      {/* Search and filter bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-800/50 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-primary text-white"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
        </div>
        
        <div className="flex space-x-3">
          <div className="relative">
            <button 
              className="bg-gray-900/50 border border-gray-800/50 rounded-lg py-3 px-4 flex items-center text-white hover:border-primary/50 transition-colors"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter className="w-5 h-5 mr-2 text-gray-400" />
              <span>Filter</span>
              <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showFilterDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-800/50 shadow-xl py-2 w-48 z-10">
                <div className="px-3 py-2 border-b border-gray-800/50">
                  <p className="text-sm font-medium text-gray-300">Categories</p>
                </div>
                {CATEGORIES.map((category) => (
                  <button 
                    key={category.name}
                    className={`flex items-center w-full text-left px-3 py-2 hover:bg-gray-800/50 ${selectedCategory === category.name ? 'bg-gray-800/80 text-primary' : 'text-gray-300'}`}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <span className={`w-3 h-3 rounded-full mr-2 ${category.color}`}></span>
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex space-x-1 bg-gray-900/50 border border-gray-800/50 rounded-lg overflow-hidden">
            <button 
              className={`py-3 px-4 ${sortBy === 'name' ? 'text-primary' : 'text-gray-400'} hover:bg-gray-800/50`}
              onClick={() => toggleSort('name')}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              className={`py-3 px-4 ${sortBy === 'date' ? 'text-primary' : 'text-gray-400'} hover:bg-gray-800/50`}
              onClick={() => toggleSort('date')}
            >
              Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              className={`py-3 px-4 ${sortBy === 'size' ? 'text-primary' : 'text-gray-400'} hover:bg-gray-800/50`}
              onClick={() => toggleSort('size')}
            >
              Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((category) => (
          <button 
            key={category.name}
            className={`flex items-center py-1.5 px-3 rounded-full text-sm ${
              selectedCategory === category.name 
                ? 'bg-primary text-black' 
                : 'bg-gray-800/60 text-gray-300 hover:bg-gray-800/90'
            }`}
            onClick={() => setSelectedCategory(category.name)}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${selectedCategory === category.name ? 'bg-black' : category.color}`}></span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Documents list */}
      {sortedDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedDocuments.map((doc) => (
            <div 
              key={doc.id}
              className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start mb-4">
                  <div className={`p-3 rounded-lg ${getCategoryColor(doc.category)}/20 text-${getCategoryColor(doc.category).split('-')[1]}-500`}>
                    {doc.type === 'PDF' && <FileText className="w-8 h-8" />}
                    {doc.type === 'DOCX' && <FileText className="w-8 h-8" />}
                    {doc.type === 'XLSX' && <FileType className="w-8 h-8" />}
                    {doc.type === 'PPTX' && <FileType className="w-8 h-8" />}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-white text-lg truncate">{doc.name}</h3>
                    <div className="flex items-center text-sm text-gray-400 mt-1">
                      <span className="flex items-center">
                        <FileType className="w-3.5 h-3.5 mr-1" />
                        {doc.type}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-400 mb-4">
                  <div className={`w-2 h-2 rounded-full ${getCategoryColor(doc.category)} mr-2`}></div>
                  <span>{doc.category}</span>
                  <span className="mx-2">•</span>
                  <span>Uploaded {new Date(doc.dateUploaded).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-400">
                  <span>By {doc.uploadedBy}</span>
                </div>
              </div>
              
              <div className="flex items-center border-t border-gray-800/50 bg-gray-900/50">
                <button className="flex-1 py-3 flex items-center justify-center text-gray-300 hover:text-primary hover:bg-gray-800/70 transition-colors">
                  <Eye className="w-5 h-5 mr-2" />
                  View
                </button>
                <div className="w-px h-8 bg-gray-800/50"></div>
                <button className="flex-1 py-3 flex items-center justify-center text-gray-300 hover:text-primary hover:bg-gray-800/70 transition-colors">
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </button>
                <div className="w-px h-8 bg-gray-800/50"></div>
                <button className="flex-1 py-3 flex items-center justify-center text-gray-300 hover:text-primary hover:bg-gray-800/70 transition-colors">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-12 text-center">
          <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No documents found</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {searchQuery 
              ? `No documents match your search for "${searchQuery}". Try a different search term or category.` 
              : 'There are no documents in this category. Try selecting a different category or check back later.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewUploads; 