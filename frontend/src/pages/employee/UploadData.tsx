import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, FileText, Code, Copy, Check, Loader2, Upload, FileType, File as FileIcon, CheckCircle, AlertCircle, Trash2, LogOut, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardTour from '../../components/DashboardTour';
import { useAuth } from '../../contexts/AuthContext';

// Server URL with fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

// Define interface for Notion API response
interface NotionData {
  object: string;
  results: any[];
  next_cursor: string | null;
  has_more: boolean;
}

// Simulate response from curl command
const simulatedNotionResponse: NotionData = {
  "object": "list",
  "results": [
    {
      "object": "page",
      "id": "sample-page-id-1",
      "created_time": "2023-04-05T12:00:00.000Z",
      "last_edited_time": "2023-04-05T14:30:00.000Z",
      "parent": {
        "type": "database_id",
        "database_id": "1ccf3925b4028037ab17d1756a90816a"
      },
      "properties": {
        "Name": {
          "id": "title",
          "type": "title",
          "title": [
            {
              "type": "text",
              "text": {
                "content": "Sample Document 1",
                "link": null
              },
              "annotations": {
                "bold": false,
                "italic": false,
                "strikethrough": false,
                "underline": false,
                "code": false,
                "color": "default"
              },
              "plain_text": "Sample Document 1",
              "href": null
            }
          ]
        },
        "Status": {
          "id": "status",
          "type": "select",
          "select": {
            "id": "active",
            "name": "Active",
            "color": "green"
          }
        },
        "Date": {
          "id": "date",
          "type": "date",
          "date": {
            "start": "2023-04-01",
            "end": null,
            "time_zone": null
          }
        }
      }
    },
    {
      "object": "page",
      "id": "sample-page-id-2",
      "created_time": "2023-04-03T09:15:00.000Z",
      "last_edited_time": "2023-04-04T11:45:00.000Z",
      "parent": {
        "type": "database_id",
        "database_id": "1ccf3925b4028037ab17d1756a90816a"
      },
      "properties": {
        "Name": {
          "id": "title",
          "type": "title",
          "title": [
            {
              "type": "text",
              "text": {
                "content": "Sample Document 2",
                "link": null
              },
              "annotations": {
                "bold": false,
                "italic": false,
                "strikethrough": false,
                "underline": false,
                "code": false,
                "color": "default"
              },
              "plain_text": "Sample Document 2",
              "href": null
            }
          ]
        },
        "Status": {
          "id": "status",
          "type": "select",
          "select": {
            "id": "pending",
            "name": "Pending",
            "color": "yellow"
          }
        },
        "Date": {
          "id": "date",
          "type": "date",
          "date": {
            "start": "2023-03-28",
            "end": null,
            "time_zone": null
          }
        }
      }
    }
  ],
  "next_cursor": null,
  "has_more": false
};

const UploadData: React.FC = () => {
  const { user } = useAuth();
  const [notionData, setNotionData] = useState<NotionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showCurlCommand, setShowCurlCommand] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Simulate fetching data using the curl command
  useEffect(() => {
    // Simulate network delay
    const timer = setTimeout(() => {
      try {
        // Instead of actually making the API call, we use the simulated response
        setNotionData(simulatedNotionResponse);
        setLoading(false);
      } catch (err) {
        console.error('Error simulating Notion data:', err);
        setError('Failed to process the curl command.');
        setLoading(false);
      }
    }, 1500); // Simulate a 1.5s delay for the "API call"
    
    return () => clearTimeout(timer);
  }, []);

  // Copy curl command to clipboard
  const copyCurlCommand = () => {
    const curlCommand = `curl -X POST https://api.notion.com/v1/databases/1ccf3925b4028037ab17d1756a90816a/query -H "Authorization: Bearer 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" -H "Content-Type: application/json" -H "Notion-Version: 2022-06-28"`;
    
    navigator.clipboard.writeText(curlCommand)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  // Copy JSON data to clipboard
  const copyToClipboard = () => {
    if (notionData) {
      navigator.clipboard.writeText(JSON.stringify(notionData, null, 2))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
        });
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Upload files to specified directory
  const uploadFiles = async () => {
    if (files.length === 0) {
      alert('Please select files to upload');
      return;
    }
    
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    try {
      // Prepare file data for upload
      const formData = new FormData();
      
      // Add each file to the form data
      files.forEach(file => {
        formData.append('files[]', file);
      });
      
      // Add destination path to formData
      formData.append('destinationPath', '/Users/vedicamrudul/Desktop/Codeshastra_XI_LinearDepression/ml/input_files');
      
      // Make API request to upload files and save to the specified directory
      const uploadResponse = await axios.post(
        `${SERVER_URL}/upload-file`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          }
        }
      );
      
      console.log('Upload successful:', uploadResponse.data);
      setUploadStatus('success');
      alert('Files uploaded successfully to ML input directory!');
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus('error');
      
      // Show error message to user
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        alert(`Failed to upload files: ${errorMessage}`);
      } else {
        alert('Failed to upload files. Please try again later.');
      }
    } finally {
      // Reset after upload attempt
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Add the tour component */}
      <DashboardTour username={user?.firstName} />
      
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-white text-xl font-semibold">Notion Data Integration</h1>
          <Link to="/employee" className="text-primary hover:text-white transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* File Upload Section */}
          <div className="bg-black/40 backdrop-blur-md border border-gray-800/50 rounded-xl overflow-hidden shadow-lg mb-8">
            <div className="bg-gray-900/80 p-6 border-b border-gray-800">
              <div className="flex items-center">
                <FileText className="text-primary mr-3 w-5 h-5" />
                <h2 className="text-white text-lg font-medium">Upload Files to ML Input Directory</h2>
              </div>
              <p className="text-gray-400 mt-2 text-sm">
                Files will be saved to: /Users/vedicamrudul/Desktop/Codeshastra_XI_LinearDepression/ml/input_files
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90"
                />
              </div>
              
              {files.length > 0 && (
                <div className="mb-4">
                  <p className="text-white text-sm mb-2">Selected Files ({files.length}):</p>
                  <ul className="text-gray-400 text-sm list-disc list-inside">
                    {Array.from(files).map((file, index) => (
                      <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {uploadStatus === 'uploading' && (
                <div className="mb-4">
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-1 text-center">Uploading: {uploadProgress}%</p>
                </div>
              )}
              
              <button
                onClick={uploadFiles}
                disabled={files.length === 0 || uploadStatus === 'uploading'}
                className={`w-full py-2 px-4 rounded-md text-white font-medium 
                  ${files.length === 0 || uploadStatus === 'uploading' 
                    ? 'bg-gray-700 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary/90'
                  }
                  transition-colors duration-200
                `}
              >
                {uploadStatus === 'uploading' ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </span>
                ) : 'Upload Files'}
              </button>
            </div>
          </div>

          {/* Curl Command Section */}
          <div className="bg-black/40 backdrop-blur-md border border-gray-800/50 rounded-xl overflow-hidden shadow-lg mb-8">
            <div className="bg-gray-900/80 p-6 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Code className="text-primary mr-3 w-5 h-5" />
                  <h2 className="text-white text-lg font-medium">Notion API curl Command</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={copyCurlCommand}
                    className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy Command'}</span>
                  </button>
                </div>
              </div>
              <p className="text-gray-400 mt-2 text-sm">
                Use this curl command to query the Notion database
              </p>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-900/70 rounded-lg p-4 text-gray-300 text-sm overflow-auto">
                <pre className="whitespace-pre-wrap break-all">
                  <code>curl -X POST https://api.notion.com/v1/databases/1ccf3925b4028037ab17d1756a90816a/query -H "Authorization: Bearer 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" -H "Content-Type: application/json" -H "Notion-Version: 2022-06-28"</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-gray-800/50 rounded-xl overflow-hidden shadow-lg mb-8">
            <div className="bg-gray-900/80 p-6 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="text-primary mr-3 w-5 h-5" />
                  <h2 className="text-white text-lg font-medium">Simulated Response</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
                    disabled={loading || !!error}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
              </div>
              <p className="text-gray-400 mt-2 text-sm">
                Simulated response from executing the curl command for database ID: 1ccf3925b4028037ab17d1756a90816a
              </p>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="ml-3 text-gray-300">Simulating curl command execution...</span>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-200">
                  <p>{error}</p>
                  <p className="mt-2 text-sm">Please check the curl command format.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute right-2 top-2 flex space-x-2">
                    <Code className="text-primary w-5 h-5" />
                  </div>
                  <pre className="bg-gray-900/70 rounded-lg p-4 text-gray-300 text-sm overflow-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                    <code>{JSON.stringify(notionData, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-gray-800/50 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-gray-900/80 p-6 border-b border-gray-800">
              <div className="flex items-center">
                <Code className="text-primary mr-3 w-5 h-5" />
                <h2 className="text-white text-lg font-medium">How to Use the curl Command</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-medium">Terminal / Command Line:</h3>
                  <ol className="list-decimal list-inside text-gray-300 text-sm space-y-2">
                    <li>Open your terminal or command prompt</li>
                    <li>Copy the curl command above</li>
                    <li>Paste and execute the command</li>
                    <li>The response will be shown in JSON format</li>
                  </ol>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-white font-medium">Using Postman:</h3>
                  <ol className="list-decimal list-inside text-gray-300 text-sm space-y-2">
                    <li>Open Postman</li>
                    <li>Create a new POST request to <code className="bg-gray-900 px-1 py-0.5 rounded">https://api.notion.com/v1/databases/1ccf3925b4028037ab17d1756a90816a/query</code></li>
                    <li>Add headers:
                      <ul className="list-disc list-inside ml-5 mt-1">
                        <li><code className="bg-gray-900 px-1 py-0.5 rounded">Authorization: Bearer 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</code></li>
                        <li><code className="bg-gray-900 px-1 py-0.5 rounded">Content-Type: application/json</code></li>
                        <li><code className="bg-gray-900 px-1 py-0.5 rounded">Notion-Version: 2022-06-28</code></li>
                      </ul>
                    </li>
                    <li>Send the request and view the response</li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  <strong>Security Note:</strong> For security reasons, we're displaying a simulated response rather than actually executing the command. 
                  In a real environment, API keys should be stored securely and not exposed in client-side code.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-md border-t border-gray-800 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500 text-sm text-center">
            Notion API Integration - {new Date().getFullYear()} © Covalence AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default UploadData; 