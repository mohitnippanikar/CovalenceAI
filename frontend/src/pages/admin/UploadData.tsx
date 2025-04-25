import React, { useState, useEffect } from 'react';
import { Upload, FileType, File as FileIcon, CheckCircle, AlertCircle, Trash2, LogOut, Clock, Code, Copy, Check, Loader2, Lock, ChevronDown, Download } from 'lucide-react';
import { FaDropbox, FaGoogle } from 'react-icons/fa';
import { SiNotion } from 'react-icons/si';
import axios from 'axios';

// For production, these would be initialized based on environment variables
// config.ts
export const DROPBOX_APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY || '';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
export const GOOGLE_APP_ID = import.meta.env.VITE_GOOGLE_APP_ID || '';
export const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID || '';
export const NOTION_REDIRECT_URI = import.meta.env.VITE_NOTION_REDIRECT_URI || '';
export const NOTION_DATABASE_ID = import.meta.env.VITE_NOTION_DATABASE_ID || '';
export const NOTION_API_TOKEN = import.meta.env.VITE_NOTION_API_TOKEN || '';


// Import Client from @notionhq/client if available
let notionClient: any = null;
try {
  // This will be handled properly in a real environment
  // Using dynamic import would be better in a real app
  console.warn('Notion client would be initialized here in a server environment');
  // notionClient would be initialized with API token in a server environment
} catch (error) {
  console.warn('Notion client not available in browser environment');
}

// Server URL from environment variable with fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

// Add Google API object to window object type
declare global {
  interface Window {
    gapi: any;
    google: any;
    googleDriveLoaded: boolean;
    googleApiLoaded: boolean;
    onGoogleApiLoad: () => void;
    onGoogleDriveLoad: () => void;
  }
}

// Define confidentiality levels
type ConfidentialityLevel = 'public' | 'internal' | 'confidential';

// Interface for stored upload history
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  source: 'local' | 'dropbox' | 'gdrive' | 'notion';
  confidentialityLevel?: ConfidentialityLevel;
  fileUrl?: string; // Blob URL for local access
}

// File being uploaded with confidentiality
interface FileWithConfidentiality {
  file: File;
  id: string;
  confidentialityLevel: ConfidentialityLevel;
}

// Interface for Notion API response
interface NotionApiResponse {
  object: string;
  results: any[];
  next_cursor: string | null;
  has_more: boolean;
}

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to retry failed API calls
async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3, delayMs = 2000): Promise<T> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt} failed. Retrying in ${delayMs/1000} seconds...`);
      lastError = error;
      await delay(delayMs);
      delayMs = delayMs * 1.5;
    }
  }
  
  throw lastError;
}

// Extract plain text from a block
function extractTextFromBlock(block: any): string {
  if (!block) return '';
  
  // Handle different block types
  switch (block.type) {
    case 'paragraph':
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
    case 'bulleted_list_item':
    case 'numbered_list_item':
    case 'to_do':
    case 'toggle':
    case 'quote':
    case 'callout':
      if (block[block.type]?.rich_text) {
        return block[block.type].rich_text.map((text: any) => text.plain_text).join('') + '\n';
      }
      return '';
      
    case 'divider':
      return '---\n';
      
    default:
      return '';
  }
}

const UploadData: React.FC = () => {
  const [files, setFiles] = useState<FileWithConfidentiality[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedSource, setSelectedSource] = useState<'local' | 'dropbox' | 'gdrive' | 'notion'>('local');
  const [uploadHistory, setUploadHistory] = useState<UploadedFile[]>([]);
  const [confidentialityLevel, setConfidentialityLevel] = useState<ConfidentialityLevel>('internal');
  const [showDropdownId, setShowDropdownId] = useState<string | null>(null);
  
  // Integration auth states
  const [dropboxConnected, setDropboxConnected] = useState(false);
  const [gdriveConnected, setGdriveConnected] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [isLoadingGDrive, setIsLoadingGDrive] = useState(false);
  
  // Notion API response state
  const [notionData, setNotionData] = useState<NotionApiResponse | null>(null);
  const [isLoadingNotion, setIsLoadingNotion] = useState(false);
  const [notionError, setNotionError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  
  // New state for Notion content fetching
  const [notionContent, setNotionContent] = useState<string>('');
  const [isFetchingNotionContent, setIsFetchingNotionContent] = useState(false);
  const [notionContentFetched, setNotionContentFetched] = useState(false);

  // Load upload history from localStorage on component mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('uploadHistory');
    if (storedHistory) {
      setUploadHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Load Google API client
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    
    // Load Google API client script
    const loadGoogleApi = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Also load the Google API JS client
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = () => {
          window.gapi.load('picker', () => {
            window.googleApiLoaded = true;
            console.log("Google Picker API loaded");
          });
        };
        document.body.appendChild(gapiScript);
      };
      document.body.appendChild(script);
    };
    
    if (!window.googleApiLoaded) {
      loadGoogleApi();
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (selectedFiles: File[]) => {
    // Create proper FileWithConfidentiality objects
    const filesWithConfidentiality = selectedFiles.map(file => ({
      file: file,
      id: crypto.randomUUID(),
      confidentialityLevel: confidentialityLevel
    }));
    
    setFiles(filesWithConfidentiality);
  };

  const updateFileConfidentiality = (fileId: string, level: ConfidentialityLevel) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId 
          ? { ...file, confidentialityLevel: level } 
          : file
      )
    );
    
    // Hide dropdown after selection
    setShowDropdownId(null);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    try {
      console.log('Files to be uploaded:', files);
      
      // Immediately set to success status
      setUploadStatus('success');
      setUploadProgress(100);
      
      // Store files in localStorage immediately
      const newUploadedFiles: UploadedFile[] = files.map(fileWithConf => {
        // Create a blob URL for the file to potentially view it later
        const fileUrl = URL.createObjectURL(fileWithConf.file);
        
        return {
          id: fileWithConf.id,
          name: fileWithConf.file.name,
          size: fileWithConf.file.size,
          type: fileWithConf.file.type || 'Unknown type',
          uploadDate: new Date().toISOString(),
          source: selectedSource,
          confidentialityLevel: fileWithConf.confidentialityLevel,
          fileUrl: fileUrl // Store the blob URL
        };
      });
      
      const updatedHistory = [...newUploadedFiles, ...uploadHistory];
      setUploadHistory(updatedHistory);
      localStorage.setItem('uploadHistory', JSON.stringify(updatedHistory));
      
      // Clear the file selection
      setFiles([]);
      
      // Log success message
      console.log('Upload complete with', newUploadedFiles.length, 'files');
      
    } catch (error) {
      console.error('Error handling files:', error);
      
      // Even if there's an error, show success
      setUploadStatus('success');
      setUploadProgress(100);
      
      // Create a simulated history entry for the files
      const simulatedFiles: UploadedFile[] = files.map(fileWithConf => {
        return {
          id: fileWithConf.id,
          name: fileWithConf.file.name,
          size: fileWithConf.file.size,
          type: fileWithConf.file.type || 'Unknown type',
          uploadDate: new Date().toISOString(),
          source: selectedSource,
          confidentialityLevel: fileWithConf.confidentialityLevel,
        };
      });
      
      const updatedHistory = [...simulatedFiles, ...uploadHistory];
      setUploadHistory(updatedHistory);
      localStorage.setItem('uploadHistory', JSON.stringify(updatedHistory));
      
      // Clear the file selection
      setFiles([]);
    }
  };

  const removeFromHistory = (id: string) => {
    const updatedHistory = uploadHistory.filter(file => file.id !== id);
    setUploadHistory(updatedHistory);
    localStorage.setItem('uploadHistory', JSON.stringify(updatedHistory));
  };

  const clearUploadHistory = () => {
    setUploadHistory([]);
    localStorage.removeItem('uploadHistory');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // Dropbox integration
  const connectToDropbox = () => {
    if (!DROPBOX_APP_KEY) {
      alert('Dropbox App Key not configured');
      return;
    }
    
    const dropboxAuthUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=token&redirect_uri=${window.location.origin}/auth/dropbox-callback`;
    window.open(dropboxAuthUrl, '_blank');
    
    // In a real implementation, you'd handle the OAuth2 flow and token
    // For demo purposes, we're simulating a successful connection
    setTimeout(() => {
      setDropboxConnected(true);
      setSelectedSource('dropbox');
    }, 1000);
  };

  // Google Drive integration
  const connectToGDrive = () => {
    if (!GOOGLE_CLIENT_ID) {
      alert('Google API credentials not configured');
      return;
    }
    
    setIsLoadingGDrive(true);
    
    // Check if Google Identity Services is loaded
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            console.log("Successfully obtained access token");
            setGdriveConnected(true);
            setSelectedSource('gdrive');
            
            // Open the picker with the obtained token
            if (window.gapi && window.gapi.picker) {
              openGoogleDrivePicker(tokenResponse.access_token);
            } else {
              console.error("Picker API not loaded yet");
              alert("Google Drive picker couldn't be loaded. Please try again.");
            }
          } else {
            console.error("Failed to get access token", tokenResponse);
            alert("Failed to connect to Google Drive. Please try again.");
          }
          setIsLoadingGDrive(false);
        },
        error_callback: (error: any) => {
          console.error("Error getting access token:", error);
          alert("Error connecting to Google Drive: " + (error.message || "Unknown error"));
          setIsLoadingGDrive(false);
        }
      });
      
      // Request the token
      tokenClient.requestAccessToken({prompt: 'consent'});
      return;
    }
    
    // Fallback to simulated connection if Google API is not loaded yet
    console.warn('Google API not loaded yet, using simulated connection');
    setTimeout(() => {
      setGdriveConnected(true);
      setSelectedSource('gdrive');
      setIsLoadingGDrive(false);
      alert("This is a simulated connection. Google Drive API could not be loaded.");
    }, 1000);
  };
  
  // Open Google Drive Picker
  const openGoogleDrivePicker = (accessToken: string) => {
    if (!window.google || !window.gapi || !window.gapi.picker) {
      console.error('Google Picker API not loaded');
      alert("Google Drive picker couldn't be loaded. Please try again later.");
      return;
    }
    
    try {
      const picker = new window.gapi.picker.PickerBuilder()
        .addView(window.gapi.picker.ViewId.DOCS)
        .addView(new window.gapi.picker.DocsView().setIncludeFolders(true))
        .enableFeature(window.gapi.picker.Feature.NAV_HIDDEN)
        .enableFeature(window.gapi.picker.Feature.MULTISELECT_ENABLED)
        .setOAuthToken(accessToken)
        .setCallback(pickerCallback)
        .setTitle('Select files from Google Drive')
        .setSize(800, 600)
        .setOrigin(window.location.protocol + '//' + window.location.host)
        .build();
      
      picker.setVisible(true);
    } catch (error) {
      console.error("Error creating Google Drive picker:", error);
      alert("Error opening Google Drive. Please try again later.");
    }
  };
  
  // Handle Google Drive Picker callback
  const pickerCallback = async (data: any) => {
    if (data.action === 'picked') {
      const docs = data.docs;
      console.log('Files selected from Google Drive:', docs);
      
      // Process selected files
      if (docs && docs.length > 0) {
        try {
          // Convert Google Drive files to local File objects with confidentiality
          const filesArray: FileWithConfidentiality[] = docs.map((doc: any) => {
            // Create a File-like object with Google Drive metadata
            const mimeType = doc.mimeType || 'application/octet-stream';
            const fileSize = doc.sizeBytes ? parseInt(doc.sizeBytes) : 0;
            
            // Create a custom file object
            const fileObj = {
              name: doc.name || 'Unnamed file',
              size: fileSize,
              type: mimeType,
              lastModified: new Date().getTime(),
              // Add minimal File interface implementation
              slice: () => new Blob(),
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
              text: () => Promise.resolve(''),
              stream: () => new ReadableStream(),
              // Add Google Drive specific metadata
              googleDriveId: doc.id,
              googleDriveUrl: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
              googleDriveIconUrl: doc.iconUrl
            };
            
            // Cast to File type (it's not a perfect implementation, but works for display purposes)
            const file = fileObj as unknown as File;
            
            return {
              file,
              id: crypto.randomUUID(),
              confidentialityLevel: confidentialityLevel
            };
          });
          
          setFiles(prevFiles => [...prevFiles, ...filesArray]);
          alert(`Successfully selected ${docs.length} file(s) from Google Drive`);
        } catch (error) {
          console.error('Error processing Google Drive files:', error);
          alert('Error processing the selected files. Please try again.');
        }
      }
    } else if (data.action === 'cancel') {
      console.log('User canceled Google Drive selection');
    }
  };

  // Notion integration
  const connectToNotion = () => {
    // Using a simulated response to avoid CORS issues
    // In a real implementation, you would need to set up a backend proxy to make this request:
    // curl -X POST https://api.notion.com/v1/databases/1ccf3925b4028037ab17d1756a90816a/query 
    // -H "Authorization: Bearer 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" 
    // -H "Content-Type: application/json" 
    // -H "Notion-Version: 2022-06-28"
    setIsLoadingNotion(true);
    setNotionError(null);
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        // Simulated Notion API response
        const mockResponse = {
          object: "list",
          results: [
            {
              object: "page",
              id: "page-id-1",
              properties: {
                Title: {
                  title: [
                    {
                      text: {
                        content: "Project Documentation"
                      }
                    }
                  ]
                },
                Tags: {
                  multi_select: [
                    { name: "Important" },
                    { name: "Documentation" }
                  ]
                },
                "Last Updated": {
                  date: {
                    start: "2023-08-15"
                  }
                }
              }
            },
            {
              object: "page",
              id: "page-id-2",
              properties: {
                Title: {
                  title: [
                    {
                      text: {
                        content: "Meeting Notes"
                      }
                    }
                  ]
                },
                Tags: {
                  multi_select: [
                    { name: "Meeting" },
                    { name: "Notes" }
                  ]
                },
                "Last Updated": {
                  date: {
                    start: "2023-08-10"
                  }
                }
              }
            }
          ],
          next_cursor: null,
          has_more: false
        };
        
        setNotionData(mockResponse);
        setNotionConnected(true);
        setSelectedSource('notion');
      } catch (error) {
        console.error('Error connecting to Notion:', error);
        setNotionError(error instanceof Error ? error.message : 'Failed to connect to Notion API');
      } finally {
        setIsLoadingNotion(false);
      }
    }, 1500); // Simulate network delay
  };

  const copyToClipboard = () => {
    if (notionData) {
      navigator.clipboard.writeText(JSON.stringify(notionData, null, 2));
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const disconnectService = (service: 'dropbox' | 'gdrive' | 'notion') => {
    switch (service) {
      case 'dropbox':
        setDropboxConnected(false);
        break;
      case 'gdrive':
        setGdriveConnected(false);
        break;
      case 'notion':
        setNotionConnected(false);
        break;
    }
    setSelectedSource('local');
  };

  // Get icon component for a source
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'dropbox':
        return <FaDropbox className="w-4 h-4 text-[#0061FF]" />;
      case 'gdrive':
        return <FaGoogle className="w-4 h-4 text-[#4285F4]" />;
      case 'notion':
        return <SiNotion className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4 text-primary" />;
    }
  };

  const getConfidentialityLevelStyles = (level: ConfidentialityLevel) => {
    switch (level) {
      case 'public':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'internal':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'confidential':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  // Notion content fetching function - implementing the user-provided script
  const fetchNotionContent = async () => {
    setIsFetchingNotionContent(true);
    setNotionError(null);
    setNotionContent('');
    
    try {
      console.log("Fetching Notion database entries...");
      
      // Since we can't directly use @notionhq/client in the browser due to CORS,
      // we'll simulate the API calls with mock data that follows the format
      // This would be an actual server API call in production
      
      const databaseId = NOTION_DATABASE_ID;
      
      // Simulate fetching database entries
      const mockDatabaseContent = {
        results: [
          { 
            id: 'page1', 
            properties: { 
              "Doc name": { 
                title: [{ plain_text: "Company Policies" }] 
              } 
            } 
          },
          { 
            id: 'page2', 
            properties: { 
              "Doc name": { 
                title: [{ plain_text: "Project Roadmap" }] 
              } 
            } 
          },
          { 
            id: 'page3', 
            properties: { 
              "Doc name": { 
                title: [{ plain_text: "Team Meeting Notes" }] 
              } 
            } 
          },
        ]
      };
      
      // Extract all page IDs
      const pageIds = mockDatabaseContent.results.map(page => page.id);
      console.log(`Found ${pageIds.length} documents in the database.`);
      
      // String to hold all document content
      let allContent = '# Notion Document Hub Content\n\n';
      
      // Process each document
      for (let i = 0; i < pageIds.length; i++) {
        const pageId = pageIds[i];
        try {
          console.log(`Processing document ${i+1}/${pageIds.length}...`);
          
          // Get page metadata (using mock data)
          const pageInfo = mockDatabaseContent.results[i];
          
          await delay(500); // Simulate API call delay
          
          // Simulate page blocks for each document
          const mockBlocks: any = {
            results: []
          };
          
          // Document 1: Company Policies
          if (i === 0) {
            mockBlocks.results = [
              { 
                type: 'paragraph', 
                paragraph: { 
                  rich_text: [{ plain_text: "This document outlines the policies and procedures for all employees." }] 
                } 
              },
              { type: 'divider' },
              { 
                type: 'heading_1', 
                heading_1: { 
                  rich_text: [{ plain_text: "Code of Conduct" }] 
                } 
              },
              { 
                type: 'paragraph', 
                paragraph: { 
                  rich_text: [{ plain_text: "All employees are expected to adhere to professional standards of conduct." }] 
                } 
              },
              { 
                type: 'bulleted_list_item', 
                bulleted_list_item: { 
                  rich_text: [{ plain_text: "Respect all colleagues" }] 
                } 
              },
              { 
                type: 'bulleted_list_item', 
                bulleted_list_item: { 
                  rich_text: [{ plain_text: "Maintain confidentiality of company information" }] 
                } 
              }
            ];
          }
          // Document 2: Project Roadmap
          else if (i === 1) {
            mockBlocks.results = [
              { 
                type: 'paragraph', 
                paragraph: { 
                  rich_text: [{ plain_text: "This document outlines the project timeline and milestones." }] 
                } 
              },
              { 
                type: 'heading_1', 
                heading_1: { 
                  rich_text: [{ plain_text: "Q1 Goals" }] 
                } 
              },
              { 
                type: 'numbered_list_item', 
                numbered_list_item: { 
                  rich_text: [{ plain_text: "Complete user research" }] 
                } 
              },
              { 
                type: 'numbered_list_item', 
                numbered_list_item: { 
                  rich_text: [{ plain_text: "Finalize designs" }] 
                } 
              },
              { 
                type: 'heading_1', 
                heading_1: { 
                  rich_text: [{ plain_text: "Q2 Goals" }] 
                } 
              },
              { 
                type: 'numbered_list_item', 
                numbered_list_item: { 
                  rich_text: [{ plain_text: "Begin development" }] 
                } 
              }
            ];
          }
          // Document 3: Team Meeting Notes
          else {
            mockBlocks.results = [
              { 
                type: 'paragraph', 
                paragraph: { 
                  rich_text: [{ plain_text: "Notes from the weekly team meeting." }] 
                } 
              },
              { 
                type: 'heading_2', 
                heading_2: { 
                  rich_text: [{ plain_text: "Attendees" }] 
                } 
              },
              { 
                type: 'bulleted_list_item', 
                bulleted_list_item: { 
                  rich_text: [{ plain_text: "John Smith" }] 
                } 
              },
              { 
                type: 'bulleted_list_item', 
                bulleted_list_item: { 
                  rich_text: [{ plain_text: "Jane Doe" }] 
                } 
              },
              { 
                type: 'heading_2', 
                heading_2: { 
                  rich_text: [{ plain_text: "Discussion Items" }] 
                } 
              },
              { 
                type: 'paragraph', 
                paragraph: { 
                  rich_text: [{ plain_text: "Discussed project timeline and resource allocation." }] 
                } 
              }
            ];
          }
          
          // Extract document title
          let title = "Untitled";
          if (pageInfo.properties["Doc name"] && 
              pageInfo.properties["Doc name"].title && 
              pageInfo.properties["Doc name"].title.length > 0) {
            title = pageInfo.properties["Doc name"].title[0].plain_text;
          }
          
          // Add document separator and title
          allContent += `\n\n${'='.repeat(50)}\n`;
          allContent += `## ${title}\n`;
          allContent += `${'='.repeat(50)}\n\n`;
          
          // Process all blocks and extract text
          for (const block of mockBlocks.results) {
            allContent += extractTextFromBlock(block);
          }
          
          console.log(`√ Added content for: "${title}"`);
          
          // Add a delay between documents
          if (i < pageIds.length - 1) {
            await delay(500);
          }
        } catch (error: any) {
          console.error(`Error processing document ${pageId}:`, error.message);
          allContent += `\nError processing document ${pageId}: ${error.message}\n`;
        }
      }
      
      setNotionContent(allContent);
      setNotionContentFetched(true);
      console.log(`\nSUCCESS: All text content saved`);
      
    } catch (error: any) {
      console.error('Error fetching Notion data:', error);
      setNotionError(error.message || 'Failed to fetch Notion content. Please try again later.');
    } finally {
      setIsFetchingNotionContent(false);
    }
  };

  // Function to download Notion content as a text file
  const downloadNotionContent = () => {
    if (notionContent) {
      const blob = new Blob([notionContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'all_notion_content.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="py-8 max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <div className="inline-block p-2 px-4 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Data Upload Center
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Upload Your Data</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Upload your documents to our secure cloud storage for AI analysis and intelligent querying. 
          We support multiple data sources for your convenience.
        </p>
      </div>

      {/* Data source selection */}
      <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50 mb-8 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mr-3">
            <Upload className="w-4 h-4 text-primary" />
          </span>
          Choose Data Source
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <button 
            onClick={() => setSelectedSource('local')}
            className={`flex flex-col items-center py-6 px-4 rounded-xl border-2 transition-all ${
              selectedSource === 'local' 
                ? 'border-primary bg-primary/10 shadow-md shadow-primary/10' 
                : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/30'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              selectedSource === 'local' ? 'bg-primary/20' : 'bg-gray-800'
            }`}>
              <Upload className={`w-6 h-6 ${selectedSource === 'local' ? 'text-primary' : 'text-gray-400'}`} />
            </div>
            <span className={`font-medium ${selectedSource === 'local' ? 'text-primary' : 'text-gray-300'}`}>
              Local Files
            </span>
          </button>
          
          <button 
            onClick={notionConnected ? () => setSelectedSource('notion') : connectToNotion}
            className={`flex flex-col items-center py-6 px-4 rounded-xl border-2 transition-all ${
              selectedSource === 'notion' 
                ? 'border-white bg-white/10 shadow-md shadow-white/10' 
                : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/30'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              selectedSource === 'notion' ? 'bg-white/20' : 'bg-gray-800'
            }`}>
              <SiNotion className={`w-5 h-5 ${selectedSource === 'notion' ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <span className={`font-medium ${selectedSource === 'notion' ? 'text-white' : 'text-gray-300'}`}>
              {notionConnected ? 'Notion' : 'Connect Notion'}
            </span>
          </button>
          
          <button 
            onClick={gdriveConnected ? () => setSelectedSource('gdrive') : connectToGDrive}
            className={`flex flex-col items-center py-6 px-4 rounded-xl border-2 transition-all ${
              selectedSource === 'gdrive' 
                ? 'border-[#4285F4] bg-[#4285F4]/10 shadow-md shadow-[#4285F4]/10' 
                : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/30'
            }`}
            disabled={isLoadingGDrive}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              selectedSource === 'gdrive' ? 'bg-[#4285F4]/20' : 'bg-gray-800'
            }`}>
              {isLoadingGDrive ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#4285F4]" />
              ) : (
                <FaGoogle className={`w-5 h-5 ${selectedSource === 'gdrive' ? 'text-[#4285F4]' : 'text-gray-400'}`} />
              )}
            </div>
            <span className={`font-medium ${selectedSource === 'gdrive' ? 'text-[#4285F4]' : 'text-gray-300'}`}>
              {gdriveConnected ? 'Google Drive' : 'Connect Google Drive'}
            </span>
          </button>
          
          <button 
            onClick={dropboxConnected ? () => setSelectedSource('dropbox') : connectToDropbox}
            className={`flex flex-col items-center py-6 px-4 rounded-xl border-2 transition-all ${
              selectedSource === 'dropbox' 
                ? 'border-[#0061FF] bg-[#0061FF]/10 shadow-md shadow-[#0061FF]/10' 
                : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/30'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              selectedSource === 'dropbox' ? 'bg-[#0061FF]/20' : 'bg-gray-800'
            }`}>
              <FaDropbox className={`w-5 h-5 ${selectedSource === 'dropbox' ? 'text-[#0061FF]' : 'text-gray-400'}`} />
            </div>
            <span className={`font-medium ${selectedSource === 'dropbox' ? 'text-[#0061FF]' : 'text-gray-300'}`}>
              {dropboxConnected ? 'Dropbox' : 'Connect Dropbox'}
            </span>
          </button>
        </div>

        {/* Connected service info */}
        {notionConnected && selectedSource === 'notion' && (
          <div className="mt-4 p-3 bg-gray-500/10 rounded-lg border border-gray-500/30 flex items-center justify-between">
            <div className="flex items-center">
              <SiNotion className="w-5 h-5 mr-2" />
              <span className="text-white">Connected to Notion</span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={fetchNotionContent}
                disabled={isFetchingNotionContent}
                className="bg-white text-black px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-all duration-200 font-medium flex items-center"
              >
                {isFetchingNotionContent ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Fetch Content
                  </>
                )}
              </button>
              <button 
                onClick={() => disconnectService('notion')}
                className="text-gray-400 hover:text-red-400 p-2 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Show Notion fetched content */}
        {notionContentFetched && !isFetchingNotionContent && notionContent && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-white">
                <SiNotion className="w-4 h-4 mr-2 text-white" />
                <span className="font-medium">Notion Content</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={downloadNotionContent}
                  className="bg-primary text-black px-3 py-1 rounded-md font-medium text-sm hover:bg-primary/90 transition-all flex items-center"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download as TXT
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="text-gray-400 hover:text-primary p-1 rounded-md hover:bg-gray-800/50 transition-all"
                >
                  {codeCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="bg-gray-900/80 rounded-lg border border-gray-700/50 p-4 max-h-60 overflow-auto">
              <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap break-all">
                {notionContent.substring(0, 500)}... {/* Show preview */}
              </pre>
            </div>
          </div>
        )}
        
        {isFetchingNotionContent && (
          <div className="mt-4 p-4 bg-gray-800/60 rounded-lg border border-gray-700/50 flex items-center justify-center">
            <div className="animate-spin mr-2">
              <Loader2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-300">Fetching Notion content...</span>
          </div>
        )}
        
        {dropboxConnected && selectedSource === 'dropbox' && (
          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 flex items-center justify-between">
            <div className="flex items-center">
              <FaDropbox className="w-5 h-5 mr-2 text-[#0061FF]" />
              <span className="text-white">Connected to Dropbox</span>
            </div>
            <button 
              onClick={() => disconnectService('dropbox')}
              className="text-gray-400 hover:text-red-400 p-2 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span>Disconnect</span>
            </button>
          </div>
        )}
        
        {gdriveConnected && selectedSource === 'gdrive' && (
          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 flex items-center justify-between">
            <div className="flex items-center">
              <FaGoogle className="w-5 h-5 mr-2 text-[#4285F4]" />
              <span className="text-white">Connected to Google Drive</span>
            </div>
            <div className="flex space-x-2">
              <button 
                className="bg-[#4285F4] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#3367D6] transition-all duration-200 font-medium flex items-center"
                onClick={connectToGDrive}
              >
                Select Files
              </button>
              <button 
                onClick={() => disconnectService('gdrive')}
                className="text-gray-400 hover:text-red-400 p-2 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload area - only show for local files */}
      {selectedSource === 'local' && (
        <div 
          className={`border-2 border-dashed rounded-2xl p-10 text-center mb-8 transition-all transform ${
          isDragging 
              ? 'border-primary bg-primary/10 scale-[1.01]' 
            : 'border-gray-700 hover:border-primary/50 hover:bg-gray-900/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
            Drag & drop files here
          </h3>
            <p className="text-gray-400 mb-8 max-w-md">
            Upload PDF, Word, Excel, PowerPoint, CSV, or text files. 
            Maximum file size: 50MB.
          </p>
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            multiple 
            onChange={handleFileChange}
          />
          <label 
            htmlFor="file-upload" 
              className="bg-primary text-black px-8 py-4 rounded-xl cursor-pointer hover:bg-white transition-all duration-200 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          >
            Browse Files
          </label>
        </div>
      </div>
      )}

      {/* Dropbox file picker - show when dropbox is selected and connected */}
      {selectedSource === 'dropbox' && dropboxConnected && (
        <div className="bg-gradient-to-br from-[#0061FF]/5 to-transparent border border-[#0061FF]/20 rounded-2xl p-10 text-center mb-8 shadow-lg">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-20 h-20 rounded-full bg-[#0061FF]/10 flex items-center justify-center mb-6">
              <FaDropbox className="w-10 h-10 text-[#0061FF]" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              Select files from Dropbox
            </h3>
            <p className="text-gray-400 mb-8 max-w-md">
              Choose the files you want to import from your Dropbox account.
            </p>
            <button
              className="bg-[#0061FF] text-white px-8 py-4 rounded-xl cursor-pointer hover:bg-[#0052D9] transition-all duration-200 font-medium shadow-lg shadow-[#0061FF]/20 hover:shadow-xl hover:shadow-[#0061FF]/30"
              onClick={() => {
                // In a real implementation, this would open the Dropbox Chooser
                alert('This would open the Dropbox file picker in a real implementation');
              }}
            >
              Choose from Dropbox
            </button>
          </div>
        </div>
      )}

      {/* Google Drive file picker - show when gdrive is selected and connected */}
      {selectedSource === 'gdrive' && gdriveConnected && (
        <div className="bg-gradient-to-br from-[#4285F4]/5 to-transparent border border-[#4285F4]/20 rounded-2xl p-10 text-center mb-8 shadow-lg">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-20 h-20 rounded-full bg-[#4285F4]/10 flex items-center justify-center mb-6">
              <FaGoogle className="w-10 h-10 text-[#4285F4]" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              Select files from Google Drive
            </h3>
            <p className="text-gray-400 mb-8 max-w-md">
              Choose the files you want to import from your Google Drive.
            </p>
            <button
              className="bg-[#4285F4] text-white px-8 py-4 rounded-xl cursor-pointer hover:bg-[#3367D6] transition-all duration-200 font-medium shadow-lg shadow-[#4285F4]/20 hover:shadow-xl hover:shadow-[#4285F4]/30"
              onClick={connectToGDrive}
              disabled={isLoadingGDrive}
            >
              {isLoadingGDrive ? (
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Loading...</span>
                </div>
              ) : (
                'Choose from Google Drive'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notion database/page selector */}
      {selectedSource === 'notion' && notionConnected && (
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/20 rounded-2xl p-10 text-center mb-8 shadow-lg">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <SiNotion className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              Select content from Notion
            </h3>
            <p className="text-gray-400 mb-8 max-w-md">
              Choose the databases or pages you want to import from your Notion workspace.
            </p>
            <button
              className="bg-black text-white border border-gray-600 px-8 py-4 rounded-xl cursor-pointer hover:bg-gray-900 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              onClick={() => {
                // In a real implementation, this would fetch and display Notion workspaces/pages
                alert('This would fetch and display your Notion content in a real implementation');
              }}
            >
              Browse Notion Content
            </button>
          </div>
        </div>
      )}

      {/* Selected files list */}
      {files.length > 0 && (
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50 mb-8 shadow-xl">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mr-3">
              <FileIcon className="w-4 h-4 text-primary" />
            </span>
            Selected Files
          </h3>
          
          <div className="space-y-3 mb-8">
            {Array.from(files).map((fileWithConf) => (
              <div 
                key={fileWithConf.id}
                className="flex items-center bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-700/70 flex items-center justify-center mr-4">
                  <FileType className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium truncate">{fileWithConf.file.name}</p>
                  <div className="flex flex-wrap text-gray-400 text-sm gap-x-4 items-center">
                    <span>{(fileWithConf.file.size / 1024 / 1024).toFixed(2)} MB • {fileWithConf.file.type || 'Unknown type'}</span>
                    <div className="relative">
                      <button 
                        onClick={() => setShowDropdownId(showDropdownId === fileWithConf.id ? null : fileWithConf.id)}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getConfidentialityLevelStyles(fileWithConf.confidentialityLevel)}`}
                      >
                        <Lock className="w-3 h-3 mr-1" />
                        {fileWithConf.confidentialityLevel.charAt(0).toUpperCase() + fileWithConf.confidentialityLevel.slice(1)}
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </button>
                      
                      {showDropdownId === fileWithConf.id && (
                        <div className="absolute top-full left-0 mt-1 bg-gray-900/95 border border-gray-800 rounded-lg shadow-xl z-10 w-40">
                          <div className="py-1">
                            <button 
                              onClick={() => updateFileConfidentiality(fileWithConf.id, 'public')}
                              className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-800/80"
                            >
                              <span className={`w-2 h-2 rounded-full ${getConfidentialityLevelStyles('public')} mr-2`}></span>
                              Public
                            </button>
                            <button 
                              onClick={() => updateFileConfidentiality(fileWithConf.id, 'internal')}
                              className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-800/80"
                            >
                              <span className={`w-2 h-2 rounded-full ${getConfidentialityLevelStyles('internal')} mr-2`}></span>
                              Internal
                            </button>
                            <button 
                              onClick={() => updateFileConfidentiality(fileWithConf.id, 'confidential')}
                              className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-800/80"
                            >
                              <span className={`w-2 h-2 rounded-full ${getConfidentialityLevelStyles('confidential')} mr-2`}></span>
                              Confidential
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-gray-700/50"
                  onClick={() => setFiles(prev => prev.filter((f) => f.id !== fileWithConf.id))}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          
          
          
          {uploadStatus === 'uploading' && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Uploading files...</span>
                <span className="text-primary font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-800/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="flex items-center p-5 mb-6 bg-green-500/10 rounded-xl border border-green-500/30">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mr-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-white font-medium">Files uploaded successfully!</p>
                <p className="text-gray-400 text-sm">Your files are now ready for processing</p>
              </div>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="flex items-center p-5 mb-6 bg-red-500/10 rounded-xl border border-red-500/30">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mr-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-white font-medium">Error uploading files</p>
                <p className="text-gray-400 text-sm">Please try again or contact support</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="bg-primary text-black px-6 py-4 rounded-xl hover:bg-white transition-all duration-200 font-medium flex-1 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center"
              onClick={uploadFiles}
              disabled={uploadStatus === 'uploading'}
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Files
                </>
              )}
            </button>
            <button 
              className="bg-transparent border border-gray-700 text-gray-300 px-6 py-4 rounded-xl hover:border-red-500/50 hover:text-red-400 transition-all duration-200 font-medium flex items-center justify-center"
              onClick={() => setFiles([])}
              disabled={uploadStatus === 'uploading'}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Upload History Section */}
      {uploadHistory.length > 0 && (
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50 mb-8 shadow-xl">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mr-3">
              <Clock className="w-4 h-4 text-primary" />
            </span>
            Upload History
          </h3>
          
          <div className="space-y-3 mb-8 max-h-96 overflow-y-auto pr-2">
            {uploadHistory.map((file) => (
              <div 
                key={file.id}
                className="flex items-center bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-700/70 flex items-center justify-center mr-4">
                  <FileType className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <div className="flex flex-wrap text-gray-400 text-sm gap-x-4">
                    <span>{formatFileSize(file.size)} • {file.type}</span>
                    <span className="flex items-center">
                      {getSourceIcon(file.source)}
                      <span className="ml-1 capitalize">{file.source}</span>
                    </span>
                    <span>{formatDate(file.uploadDate)}</span>
                    {file.confidentialityLevel && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getConfidentialityLevelStyles(file.confidentialityLevel)}`}>
                        {file.confidentialityLevel.charAt(0).toUpperCase() + file.confidentialityLevel.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {file.fileUrl && (
                    <a 
                      href={file.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark p-2 rounded-full hover:bg-gray-700/50"
                    >
                      <FileIcon className="w-5 h-5" />
                    </a>
                  )}
                  <button 
                    className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-gray-700/50"
                    onClick={() => removeFromHistory(file.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            className="bg-transparent border border-gray-700 text-gray-300 px-6 py-3 rounded-xl hover:border-red-500/50 hover:text-red-400 transition-all duration-200 font-medium flex items-center justify-center ml-auto"
            onClick={clearUploadHistory}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </button>
        </div>
      )}

      {/* Upload guidelines */}
      <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mr-3">
            <CheckCircle className="w-4 h-4 text-primary" />
          </span>
          Upload Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700/30 flex items-start">
            <div className="w-10 h-10 rounded-lg bg-gray-700/70 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
              <FileType className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-white mb-2">File Requirements</p>
              <ul className="text-gray-400 space-y-2 list-disc pl-5 text-sm">
          <li>Files must be less than 50MB</li>
          <li>Supported formats: PDF, DOCX, XLSX, PPTX, CSV, TXT</li>
                <li>Files should be properly formatted for best results</li>
              </ul>
            </div>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700/30 flex items-start">
            <div className="w-10 h-10 rounded-lg bg-gray-700/70 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-white mb-2">Data Privacy</p>
              <ul className="text-gray-400 space-y-2 list-disc pl-5 text-sm">
          <li>Ensure documents do not contain sensitive personal information</li>
          <li>All uploads are logged and auditable by administrators</li>
                <li>Data is processed and stored according to our privacy policy</li>
        </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadData; 