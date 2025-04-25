"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { useActions } from "ai/rsc";
import { Message } from "@/components/message";
import { motion } from "framer-motion";
import { MasonryIcon } from "@/components/icons";
import Link from "next/link";
import { SalesData } from "@/components/sales-data";
import { MediaViewer } from "@/components/media-viewer";
import { useTheme } from "@/components/theme-provider";
import { PolicyDocument } from "@/components/policy-document";
import { ThemeToggle } from "../../components/theme-toggle";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { EmployeeData } from "@/components/employee-data";
import SalesReport from "@/components/sales-report";
import { Square, Mic } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Define SpeechRecognition interface
interface SpeechRecognitionEvent extends Event {
  results: {
    item(index: number): {
      item(index: number): {
        transcript: string;
        confidence: number;
      };
    };
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  continuous: boolean;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Define a custom type for our div element with scrollToBottom method
interface ScrollableDiv extends HTMLDivElement {
  scrollToBottom: () => void;
}

// Speech Recognition Popup component
function SpeechRecognitionPopup({ 
  isActive, 
  transcript, 
  onClose 
}: { 
  isActive: boolean; 
  transcript: string;
  onClose: () => void;
}) {
  if (!isActive) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50" onClick={(e) => e.stopPropagation()}>
      <div className="max-w-md w-full bg-[#13131F] border border-gray-700 p-6 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Voice Input</h3>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-red-500 text-sm font-medium">Recording</span>
          </div>
        </div>
        
        <div className="relative mb-6 flex justify-center">
          <div className="absolute inset-0 rounded-full bg-[#00E5BE]/20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-[#00E5BE]/10 animate-pulse scale-125"></div>
          <div className="relative w-20 h-20 rounded-full bg-[#00E5BE]/90 flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-black"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </div>
        </div>
        
        <div className="bg-black/30 rounded-xl p-4 mb-4 min-h-[80px] max-h-[120px] overflow-y-auto">
          <p className="text-white/90">
            {transcript || "Listening..."}
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-400">Click the microphone button again to stop recording</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-500 border border-red-500/50 text-sm hover:bg-red-500/30 transition-colors"
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { sendMessage } = useActions();
  const searchParams = useSearchParams();
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Array<ReactNode>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<ScrollableDiv>();
  const { theme, toggleTheme } = useTheme();
  const [customSalesData, setCustomSalesData] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showSpeechPopup, setShowSpeechPopup] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Extract userId from URL query parameters or use a random default
  const queryUserId = searchParams?.get('userid');
  const [userId, setUserId] = useState<number>(
    queryUserId ? parseInt(queryUserId) : Math.floor(Math.random() * 10000)
  );
  
  // Log the user ID for debugging
  useEffect(() => {
    console.log(`Using user ID: ${userId}`);
  }, [userId]);

  // Check if speech recognition is supported
  useEffect(() => {
    const isSpeechRecognitionSupported = 
      'SpeechRecognition' in window || 
      'webkitSpeechRecognition' in window;
    setSpeechSupported(isSpeechRecognitionSupported);
  }, []);

  // Improved speech recognition handler
  const toggleSpeechRecognition = () => {
    // If already listening, stop recognition
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping speech recognition:", error);
        }
      }
      return;
    }

    // Start speech recognition
    if (!speechSupported) {
      console.error("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not available");
      return;
    }

    try {
      // Create and configure recognition instance
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;
      
      // Clear previous transcript
      setTranscript("");
      
      // Start recognition and show popup
      recognition.start();
      setIsListening(true);
      setShowSpeechPopup(true);
      console.log("Speech recognition started");

      // Handle speech results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update both the transcript for the popup and the input field
        const currentTranscript = finalTranscript || interimTranscript;
        
        if (currentTranscript) {
          setTranscript(currentTranscript);
          setInput(prev => {
            const trimmedPrev = prev.trim();
            if (finalTranscript) {
              // For final results, append to the input
              return trimmedPrev ? `${trimmedPrev} ${finalTranscript}`.trim() : finalTranscript.trim();
            }
            // For interim results, just show in the popup but don't modify input yet
            return prev;
          });
        }
      };

      // Handle errors
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setShowSpeechPopup(false);
        recognitionRef.current = null;
      };

      // Handle recognition end
      recognition.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
        setShowSpeechPopup(false);
        recognitionRef.current = null;
        
        // Focus the input field
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      setIsListening(false);
      setShowSpeechPopup(false);
    }
  };
  
  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping speech recognition on cleanup:", error);
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current && messagesContainerRef.current.scrollToBottom) {
      messagesContainerRef.current.scrollToBottom();
    }
  }, [messages.length, messagesContainerRef]);
  
  // Focus input when messages change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages.length]);

  // Alternate direct scroll implementation
  useEffect(() => {
    // Using a short timeout to ensure the DOM has updated with new messages
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages.length, messagesEndRef]);

  // Function to detect and parse JSON in the user input
  const detectAndParseJson = (input: string) => {
    try {
      // Look for content that might be JSON (between curly braces)
      const jsonMatch = input.match(/(\{.*\})/s);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        const parsedData = JSON.parse(jsonString);
        
        // Check if this looks like our expected sales data format
        if (parsedData.year && 
           (parsedData.monthly || parsedData.quarterly || parsedData.weekly) && 
            parsedData.categories && 
            parsedData.regions) {
          return parsedData;
        }
      }
      return null;
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return null;
    }
  };

  // Function to directly handle the viewSalesData action
  const handleSalesData = (year: number, key?: number, customData?: any) => {
    // If custom data is provided, use it directly
    if (customData) {
      setCustomSalesData(customData);
    } else {
      // Reset custom data to null to allow the component to load CSV data
      setCustomSalesData(null);
    }
    
    // Create a unique key for this component to avoid React rendering issues
    const uniqueKey = `sales-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const salesComponent = (
      <Message 
        key={uniqueKey}
        role="assistant" 
        content={
          <>
            <p className="mb-4">Here&apos;s the sales performance data{customData ? " you provided" : ` for ${year}`}:</p>
            <div className="w-full">
              <SalesData initialYear={year} customData={customData} />
            </div>
          </>
        } 
      />
    );
    
    setMessages(prev => [...prev, salesComponent]);
  };

  // Function to handle media content
  const handleMediaContent = (mediaType: 'video' | 'audio' | 'pdf' | 'image', mediaName: string, key?: number) => {
    return (
      <Message
        key={key}
        role="assistant"
        content={
          <>
            <p className="mb-4">Here&apos;s the {mediaType} content you requested:</p>
            <div className="w-full">
              <MediaViewer mediaType={mediaType} mediaName={mediaName} />
            </div>
          </>
        }
      />
    );
  };

  // Handler for company policy document
  const handlePolicyDocument = (
    key?: number, 
    specificSection?: string | null, 
    specificRole?: string | null, 
    specificDepartment?: string | null
  ) => {
    // Set up any specific filter parameters for the policy document
    let filterParams: { section?: string, role?: string, department?: string } = {};
    
    if (specificSection) {
      filterParams = { ...filterParams, section: specificSection };
    }
    
    if (specificRole) {
      filterParams = { ...filterParams, role: specificRole };
    }
    
    if (specificDepartment) {
      filterParams = { ...filterParams, department: specificDepartment };
    }
    
    return (
      <Message
        key={key}
        role="assistant"
        content={
          <>
            <p className="mb-4">Here&apos;s the Adani company policy document as requested:</p>
            <div className="w-full">
              <PolicyDocument initialFilters={filterParams} />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              You can use the search and filters to find specific policy sections. Type &quot;policy [topic]&quot; to see policies related to a specific topic.
            </p>
          </>
        }
      />
    );
  };

  // Handler to show data format help
  const handleDataFormatHelp = (key?: number) => {
    return (
      <Message 
        key={key}
        role="assistant" 
        content={
          <>
            <p className="mb-2 font-semibold">Sales Data JSON Format:</p>
            <p className="mb-4">You can provide your own sales data for visualization by sending a JSON object with the following structure:</p>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto mb-4">
              {`{
  "year": 2024,
  "monthly": [
    { "month": 1, "revenue": 120500, "units": 1250, "customers": 380, "avgOrderValue": 317 },
    { "month": 2, "revenue": 115800, "units": 1180, "customers": 350, "avgOrderValue": 331 },
    // ... remaining months
  ],
  "quarterly": [
    { "quarter": 1, "revenue": 371500, "units": 3750, "customers": 1140, "avgOrderValue": 326 },
    // ... remaining quarters
  ],
  "weekly": [
    { "week": 1, "revenue": 27800, "units": 285, "customers": 88, "avgOrderValue": 316 },
    // ... remaining weeks
  ],
  "categories": [
    { "name": "Electronics", "value": 722000, "color": "#00E5BE" },
    // ... other categories
  ],
  "regions": [
    { "name": "North", "revenue": 523000, "customers": 1650 },
    // ... other regions
  ]
}`}
            </pre>
            <p>Simply paste the entire JSON object in a message, and I&apos;ll render it as a dashboard for you.</p>
          </>
        } 
      />
    );
  };

  // Function to handle employee data
  const handleEmployeeData = (key?: number) => {
    console.log("Rendering employee data component");
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
        "skills": ["JavaScript", "React", "Node.js", "AWS", "AI/ML", "System Architecture"],
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
      },
      {
        "id": "emp_003",
        "name": "Aditya Singh",
        "email": "aditya.singh@adani.com",
        "phone": "+91 76543 21098",
        "location": "Delhi, India",
        "department": "Finance",
        "position": "Financial Analyst",
        "joinDate": "2023-02-28",
        "status": "inactive",
        "skills": ["Financial Modeling", "Data Analysis", "Forecasting"],
        "avatar": "https://randomuser.me/api/portraits/men/67.jpg"
      },
      {
        "id": "emp_004",
        "name": "Neha Gupta",
        "email": "neha.gupta@adani.com",
        "phone": "+91 65432 10987",
        "location": "Bangalore, India",
        "department": "Marketing",
        "position": "Marketing Director",
        "joinDate": "2020-04-10",
        "status": "active",
        "skills": ["Brand Strategy", "Digital Marketing", "Analytics"],
        "avatar": "https://randomuser.me/api/portraits/women/28.jpg"
      },
      {
        "id": "emp_005",
        "name": "Vikram Joshi",
        "email": "vikram.joshi@adani.com",
        "phone": "+91 94321 09876", 
        "location": "Hyderabad, India",
        "department": "Operations",
        "position": "Project Manager",
        "joinDate": "2023-03-30",
        "status": "new",
        "skills": ["Project Management", "Risk Assessment", "Team Leadership"],
        "avatar": "https://randomuser.me/api/portraits/men/53.jpg"
      }
    ];
    
    return (
      <Message
        key={key}
        role="assistant"
        content={
          <>
            <p className="mb-4">Here&apos;s the employee data you requested:</p>
            <div className="w-full">
              <EmployeeData employees={fallbackData} />
            </div>
          </>
        }
      />
    );
  };

  // Handler for sales report
  const handleSalesReport = (year: number, key?: number) => {
    return (
      <Message
        key={key}
        role="assistant"
        content={
          <>
            <p className="mb-4">Here&apos;s the sales report for {year} you requested:</p>
            <div className="w-full">
              <SalesReport year={year} />
            </div>
          </>
        }
      />
    );
  };

  // Handler for actions
  const handleAction = async (action: string, args?: Record<string, any>) => {
    // Handle specific actions based on keywords or commands
    const lowerAction = action.toLowerCase();
    if (lowerAction === 'viewsalesdata' || 
        lowerAction.includes('show sales data') || 
        lowerAction.includes('display sales') ||
        lowerAction.includes('sales data')) {
      
      // Extract year if mentioned, default to 2023
      const yearMatch = lowerAction.match(/\b(202[0-4])\b/);
      const year = args?.year || (yearMatch ? parseInt(yearMatch[1]) : 2023);
      
      // Create user message with unique key
      const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userMessage = (
        <Message 
          key={userMessageKey}
          role="user" 
          content={`Show me sales data for ${year}`} 
        />
      );
      
      // Add the user message to the chat
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Add sales data component after a short delay to ensure proper rendering
      setTimeout(() => {
        handleSalesData(year);
      }, 100);
      
      return;
    }
    // Handle employee data requests
    else if (lowerAction.includes('employee data') || 
             lowerAction.includes('show employee') || 
             lowerAction.includes('display employee') ||
             lowerAction.includes('employee information') ||
             lowerAction.includes('employee details') ||
             lowerAction.includes('staff directory') ||
             lowerAction.includes('employee directory') ||
             lowerAction.includes('employee list') ||
             lowerAction.includes('staff information') ||
             lowerAction.includes('show staff') ||
             lowerAction.includes('employee roster') ||
             lowerAction.includes('mohit') ||
             lowerAction.includes('staff list') ||
             lowerAction.includes('employee details')) {
             
      // Create user message with unique key
      const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userMessage = (
        <Message 
          key={userMessageKey}
          role="user" 
          content="Show me employee data" 
        />
      );
      
      // Add the user message to the chat
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Add employee data component after a short delay to ensure proper rendering
      setTimeout(() => {
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          newMessages.push(handleEmployeeData(newMessages.length));
          return newMessages;
        });
      }, 100);
      
      return;
    }
    // Handle policy document requests
    else if (lowerAction.includes('policy') || 
             lowerAction.includes('company policy') ||
             lowerAction.includes('show policy') ||
             lowerAction.includes('display policy')) {
             
      const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userMessage = (
        <Message key={userMessageKey} role="user" content={action} />
      );
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Extract specific filters from the action string
      let section = null;
      let role = null;
      let department = null;
      
      if (lowerAction.includes('introduction') || lowerAction.includes('intro')) {
        section = 'introduction';
      } else if (lowerAction.includes('code of conduct')) {
        section = 'code-of-conduct';
      } else if (lowerAction.includes('attendance') || lowerAction.includes('working hours')) {
        section = 'attendance';
      } else if (lowerAction.includes('roles') || lowerAction.includes('role specific')) {
        section = 'roles';
      } else if (lowerAction.includes('departments') || lowerAction.includes('department guidelines')) {
        section = 'departments';
      } else if (lowerAction.includes('leave') || lowerAction.includes('vacation')) {
        section = 'leave-policy';
      } else if (lowerAction.includes('data privacy') || lowerAction.includes('security')) {
        section = 'data-privacy';
      } else if (lowerAction.includes('dress code') || lowerAction.includes('attire')) {
        section = 'dress-code';
      } else if (lowerAction.includes('compliance') || lowerAction.includes('disciplinary')) {
        section = 'compliance';
      } else if (lowerAction.includes('acknowledgment')) {
        section = 'acknowledgment';
      }
      
      if (lowerAction.includes('admin') || lowerAction.includes('administrator')) {
        role = 'Admin';
      } else if (lowerAction.includes('contractor')) {
        role = 'Contractor';
      } else if (lowerAction.includes('manager')) {
        role = 'Manager';
      } else if (lowerAction.includes('intern')) {
        role = 'Intern';
      }
      
      if (lowerAction.includes('sales')) {
        department = 'Sales';
      } else if (lowerAction.includes('hr') || lowerAction.includes('human resources')) {
        department = 'HR';
      } else if (lowerAction.includes('it') || lowerAction.includes('information technology')) {
        department = 'IT';
      }
      
      // Add policy document component
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        newMessages.push(handlePolicyDocument(newMessages.length, section, role, department));
        return newMessages;
      });
      
      return;
    }
    // Handle sales report generation request
    else if (lowerAction.includes('generate sales report') || 
             lowerAction.includes('create sales report') || 
             lowerAction.includes('sales report')) {
      
      // Extract year if mentioned, default to 2023
      const yearMatch = lowerAction.match(/\b(202[0-4])\b/);
      const year = args?.year || (yearMatch ? parseInt(yearMatch[1]) : 2023);
      
      // Create user message with unique key
      const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userMessage = (
        <Message 
          key={userMessageKey}
          role="user" 
          content={`Generate sales report for ${year}`} 
        />
      );
      
      // Add the user message to the chat
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Add sales report component
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, userMessage];
        newMessages.push(handleSalesReport(year, newMessages.length));
        return newMessages;
      });
      
      return;
    }
    // Handle media content requests
    else if (lowerAction.includes('video') || lowerAction.includes('show video')) {
      const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userMessage = (
        <Message key={userMessageKey} role="user" content={action} />
      );
      
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, userMessage];
        // Add media content with the current messages length as key (will be a number)
        newMessages.push(handleMediaContent('video', 'Sample Video', newMessages.length));
        return newMessages;
      });
      return;
    }
    else if (lowerAction.includes('audio') || lowerAction.includes('show audio')) {
      const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userMessage = (
        <Message key={userMessageKey} role="user" content={action} />
      );
      
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, userMessage];
        // Add media content with the current messages length as key (will be a number)
        newMessages.push(handleMediaContent('audio', 'Sample Audio', newMessages.length));
        return newMessages;
      });
      return;
    }
    else if (lowerAction.includes('pdf') || lowerAction.includes('show pdf')) {
      const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userMessage = (
        <Message key={userMessageKey} role="user" content={action} />
      );
      
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, userMessage];
        // Add media content with the current messages length as key (will be a number)
        newMessages.push(handleMediaContent('pdf', 'Sample PDF Document', newMessages.length));
        return newMessages;
      });
      return;
    }
    else if (lowerAction.includes('image') || lowerAction.includes('show image')) {
      const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userMessage = (
        <Message key={userMessageKey} role="user" content={action} />
      );
      
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, userMessage];
        // Add media content with the current messages length as key (will be a number)
        newMessages.push(handleMediaContent('image', 'Sample Image', newMessages.length));
        return newMessages;
      });
      return;
    }
    
    // For all other actions, use the default handler
    const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userMessage = (
      <Message key={userMessageKey} role="user" content={action} />
    );
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    try {
      // Extract user query and create args object with user_id (default to 2412 if not provided)
      const query = action;
      const userId = args?.user_id ? parseInt(args.user_id) : 2412;
      
      // Call sendMessage with the query and user_id
      const response = await sendMessage(query, { user_id: userId });
      setMessages(prevMessages => [...prevMessages, response]);
    } catch (error) {
      console.error('Error handling action:', error);
      
      // Add a fallback response if sending the message fails
      const fallbackKey = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fallbackResponse = (
        <Message 
          key={fallbackKey}
          role="assistant" 
          content="I'm sorry, I couldn't process that request. Please try again or ask something else." 
        />
      );
      
      setMessages(prevMessages => [...prevMessages, fallbackResponse]);
    }
  };

  const suggestedActions = [
    { title: "View all", label: "my cameras", action: "View all my cameras" },
    { title: "Show me", label: "my smart home hub", action: "Show me my smart home hub" },
    { title: "Show me", label: "sales performance", action: "Show me sales performance data for 2024" },
    { title: "View", label: "company policy", action: "Show me the Adani company policy document" },
    { title: "View", label: "policy for managers", action: "Show me the company policy for managers" },
    { title: "Show", label: "employee data", action: "Show me employee data" },
    { title: "Show", label: "a video", action: "Show me a video" },
    { title: "Use custom", label: "sales data (JSON)", action: "You can paste your own JSON sales data for visualization. The data should follow a specific format with year, monthly, quarterly, weekly data, categories, and regions. Example: {\"year\": 2024, \"monthly\": [...], ...}" }
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userInput = input;
    setInput("");
    
    // Create user message with unique key
    const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userMessage = (
      <Message key={userMessageKey} role="user" content={userInput} />
    );
    
    // Add user message to chat
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    try {
      // Send all input to the ML backend
      const response = await fetch('http://10.120.135.116:5001/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_query: userInput,
          user_id: userId 
        }),
      });
      
      const data = await response.json();
      
      // Handle the response based on the message content
      if (data.message.includes("access denied")) {
        // Display access denied in red color
        const accessDeniedKey = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const accessDeniedMessage = (
          <Message 
            key={accessDeniedKey}
            role="assistant" 
            content={
              <div className="text-red-500 font-medium">
                {data.message}
              </div>
            } 
          />
        );
        
        setMessages(prevMessages => [...prevMessages, accessDeniedMessage]);
      } 
      else if (data.message.toLowerCase().includes("show")) {
        // Treat as a dynamic component request and process normally
        const lowerInput = userInput.toLowerCase();
        
        // Check for sales data requests
        if (lowerInput.includes('sales data') || 
            lowerInput.includes('display sales') ||
            lowerInput.includes('show sales')) {
          
          // Extract year if specified
          const yearMatch = lowerInput.match(/\b(202[0-4])\b/);
          const year = yearMatch ? parseInt(yearMatch[1]) : 2023; // Default to 2023
          
          // Handle sales data visualization
          handleSalesData(year);
        }
        // Check for employee data requests
        else if (lowerInput.includes('employee data') || 
                lowerInput.includes('show employee') || 
                lowerInput.includes('display employee') ||
                lowerInput.includes('employee info') ||
                lowerInput.includes('staff directory') ||
                lowerInput.includes('employee directory') ||
                lowerInput.includes('employee list') ||
                lowerInput.includes('employee roster') ||
                lowerInput.includes('staff list') ||
                lowerInput.includes('employee details')) {
          
          // Add employee data component
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            newMessages.push(handleEmployeeData(newMessages.length));
            return newMessages;
          });
        }
        // Check for policy document requests
        else if (lowerInput.includes('policy') || 
                lowerInput.includes('company policy') ||
                lowerInput.includes('show policy') ||
                lowerInput.includes('display policy')) {
          
          // Extract specific section, role, or department if mentioned
          let section = null;
          let role = null;
          let department = null;
          
          // Check for specific policy sections
          if (lowerInput.includes('introduction') || lowerInput.includes('intro')) {
            section = 'introduction';
          } else if (lowerInput.includes('code of conduct')) {
            section = 'code-of-conduct';
          } else if (lowerInput.includes('attendance') || lowerInput.includes('working hours')) {
            section = 'attendance';
          } else if (lowerInput.includes('roles') || lowerInput.includes('role specific')) {
            section = 'roles';
          } else if (lowerInput.includes('departments') || lowerInput.includes('department guidelines')) {
            section = 'departments';
          } else if (lowerInput.includes('leave') || lowerInput.includes('vacation')) {
            section = 'leave-policy';
          } else if (lowerInput.includes('data privacy') || lowerInput.includes('security')) {
            section = 'data-privacy';
          } else if (lowerInput.includes('dress code') || lowerInput.includes('attire')) {
            section = 'dress-code';
          } else if (lowerInput.includes('compliance') || lowerInput.includes('disciplinary')) {
            section = 'compliance';
          } else if (lowerInput.includes('acknowledgment')) {
            section = 'acknowledgment';
          }
          
          // Check for specific roles
          if (lowerInput.includes('admin') || lowerInput.includes('administrator')) {
            role = 'Admin';
          } else if (lowerInput.includes('contractor')) {
            role = 'Contractor';
          } else if (lowerInput.includes('intern')) {
            role = 'Intern';
          } else if (lowerInput.includes('manager')) {
            role = 'Manager';
          }
          
          // Check for specific departments
          if (lowerInput.includes('sales department') || lowerInput.includes('sales team')) {
            department = 'Sales';
          } else if (lowerInput.includes('hr') || lowerInput.includes('human resources')) {
            department = 'HR';
          } else if (lowerInput.includes('it') || lowerInput.includes('information technology')) {
            department = 'IT';
          }
          
          // Add policy document component
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            newMessages.push(handlePolicyDocument(newMessages.length, section, role, department));
            return newMessages;
          });
        }
        // Check for sales report generation request
        else if (lowerInput.includes('generate sales report') ||
                lowerInput.includes('create sales report') ||
                lowerInput.includes('sales report')) {
          
          // Extract year if specified
          const yearMatch = lowerInput.match(/\b(202[0-4])\b/);
          const year = yearMatch ? parseInt(yearMatch[1]) : 2023; // Default to 2023
          
          // Add sales report component
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            newMessages.push(handleSalesReport(year, newMessages.length));
            return newMessages;
          });
        }
        // Handle media content requests
        else if (lowerInput.includes('video') || lowerInput.includes('show video')) {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            newMessages.push(handleMediaContent('video', 'Sample Video', newMessages.length));
            return newMessages;
          });
        }
        else if (lowerInput.includes('audio') || lowerInput.includes('show audio')) {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            newMessages.push(handleMediaContent('audio', 'Sample Audio', newMessages.length));
            return newMessages;
          });
        }
        else if (lowerInput.includes('pdf') || lowerInput.includes('show pdf')) {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            newMessages.push(handleMediaContent('pdf', 'Sample PDF Document', newMessages.length));
            return newMessages;
          });
        }
        else if (lowerInput.includes('image') || lowerInput.includes('show image')) {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            newMessages.push(handleMediaContent('image', 'Sample Image', newMessages.length));
            return newMessages;
          });
        }
      }
      else {
        // Display the response normally
        const responseKey = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const assistantMessage = (
          <Message 
            key={responseKey}
            role="assistant" 
            content={data.message} 
          />
        );
        
        setMessages(prevMessages => [...prevMessages, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message to backend:', error);
      
      // Display error message
      const errorKey = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const errorMessage = (
        <Message 
          key={errorKey}
          role="assistant" 
          content="Sorry, there was an error processing your request. Please try again." 
        />
      );
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
    
    // Force scroll to bottom after handling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Test CSV data loading and validation
      import('@/components/debug-csv').then(({ validateCSV }) => {
        validateCSV().then(isValid => {
          if (isValid) {
            console.log('CSV file is valid and ready for use');
            // No automatic display of sales data - fixing startup glitch
            
            import('@/components/sales-data-utils').then(({ fetchCSVData }) => {
              fetchCSVData(2023)
                .then(data => {
                  console.log('Successfully loaded CSV data:', data);
                })
                .catch(err => {
                  console.error('Failed to load CSV data:', err);
                });
            });
          } else {
            console.error('CSV validation failed, will not attempt to load data');
          }
        });
      });
    }
  }, []);

  // Check for text in speech recognition that might be asking for employee data
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      const processedTranscript = transcript.trim().toLowerCase();
      
      // Process the transcript based on content
      if (processedTranscript.includes('sales data') || 
          processedTranscript.includes('display sales') ||
          processedTranscript.includes('show sales') ||
          processedTranscript.includes('revenue') ||
          processedTranscript.includes('performance data')) {
        
        // Extract year if mentioned, default to 2023
        const yearMatch = processedTranscript.match(/\b(202[0-4])\b/);
        const year = yearMatch ? parseInt(yearMatch[1]) : 2023;
        
        // Clear transcript and handle the action
        setTranscript('');
        handleAction("viewSalesData", { year: year });
      } else if (processedTranscript.includes('policy') ||
                 processedTranscript.includes('company policy') ||
                 processedTranscript.includes('display policy')) {
        
        // Clear transcript and handle the policy action
        setTranscript('');
        handleAction("Show company policy");
      } else if (processedTranscript.includes('employee data') ||
                 processedTranscript.includes('show employee') ||
                 processedTranscript.includes('display employee') ||
                 processedTranscript.includes('employee information') ||
                 processedTranscript.includes('staff directory') ||
                 processedTranscript.includes('employee directory') ||
                 processedTranscript.includes('employee list') ||
                 processedTranscript.includes('employee roster') ||
                 processedTranscript.includes('staff list') ||
                 processedTranscript.includes('employee details')) {
        
        // Clear transcript and handle the employee data action
        setTranscript('');
        handleAction("Show employee data");
      } else {
        // For other commands, pass them through as regular text
        setInput(processedTranscript);
        setTranscript('');
      }
    }
  }, [isListening, transcript]);

  const handleTestApiCall = async () => {
    try {
      // Add a test message to the chat
      const userMessageKey = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userMessage = (
        <Message key={userMessageKey} role="user" content="Testing API integration with ML server" />
      );
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Send test message to backend
      const response = await fetch('http://10.120.135.116:5001/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_query: "What is machine learning?",
          user_id: userId 
        }),
      });
      
      const data = await response.json();
      
      // Display the response
      const responseKey = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const assistantMessage = (
        <Message 
          key={responseKey}
          role="assistant" 
          content={data.message} 
        />
      );
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
    } catch (error) {
      console.error('Error during API test:', error);
      
      const fallbackKey = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fallbackResponse = (
        <Message 
          key={fallbackKey}
          role="assistant" 
          content="Error occurred during API test. Check the console for details." 
        />
      );
      
      setMessages(prevMessages => [...prevMessages, fallbackResponse]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Speech Recognition Popup */}
      <SpeechRecognitionPopup 
        isActive={showSpeechPopup} 
        transcript={transcript} 
        onClose={() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (error) {
              console.error("Error stopping speech recognition:", error);
            }
          }
          setIsListening(false);
          setShowSpeechPopup(false);
        }}
      />
      
      {/* Header - Fixed at the top */}
      <header className="py-4 border-b border-gray-700 bg-opacity-80 backdrop-blur-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00E5BE] text-black font-semibold">A</div>
            <span className="font-bold bg-gradient-to-r from-[#00E5BE] to-[#00B3E6] text-transparent bg-clip-text text-lg"> AI Assistant</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content area - Takes remaining height with scrolling */}
      <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
        <div className="container mx-auto py-6 px-4 sm:px-6 max-w-4xl">
          {messages.length > 0 ? (
            <div className="space-y-6 pb-4">
              {messages}
              <div ref={messagesEndRef} className="h-px w-full" />
            </div>
          ) : (
            <div className="fade-in flex flex-col items-center justify-center min-h-[400px] py-20 space-y-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00E5BE] to-[#00B3E6] flex items-center justify-center text-black text-3xl font-bold">
                AI
              </div>
              <h1 className="text-2xl font-bold"> AI Assistant</h1>
              <p className="text-gray-400 max-w-md">
                Ask me to show or display data visualizations, or chat with me about your enterprise needs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <button
                  className="btn-gradient text-sm p-3 flex items-center justify-center gap-2"
                  onClick={() => handleAction("Show Cameras")}
                >
                  <span>Show Cameras</span>
                </button>
                <button 
                  className="btn-gradient text-sm p-3 flex items-center justify-center gap-2"
                  onClick={() => handleAction("viewSalesData", { year: 2023 })}
                >
                  <span>Show Sales Data</span>
                </button>
                <button 
                  className="btn-gradient text-sm p-3 flex items-center justify-center gap-2"
                  onClick={() => handleAction("Generate sales report for 2023")}
                >
                  <span>Generate Sales Report</span>
                </button>
                <button 
                  className="btn-gradient text-sm p-3 flex items-center justify-center gap-2"
                  onClick={() => handleAction("Show company policy")}
                >
                  <span>Company Policy</span>
                </button>
                <button
                  className="btn-gradient text-sm p-3 flex items-center justify-center gap-2"
                  onClick={() => handleAction("Show employee data")}
                >
                  <span>Employee Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area - Fixed at the bottom */}
      <div className="border-t border-gray-700 p-4 bg-opacity-80 backdrop-blur-md">
        <div className="container mx-auto max-w-4xl">
          <form 
            onSubmit={onSubmit} 
            className="flex items-center space-x-2"
          >
            <input
              ref={inputRef}
              className={`flex-1 py-3 px-4 bg-[#13131F] border ${
                isListening 
                  ? 'border-[#00E5BE] ring-2 ring-[#00E5BE]' 
                  : 'border-gray-700 focus:border-[#00E5BE] focus:ring-[#00E5BE] focus:ring-2'
              } outline-none rounded-xl text-base`}
              value={input}
              onChange={handleInputChange}
              placeholder={isListening ? "Listening..." : "Type 'show/display' for UI components or ask any question for AI assistance..."}
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-3 rounded-xl border transition-colors ${
                  isListening 
                    ? 'border-red-500 bg-red-500/20 text-red-500' 
                    : 'border-gray-700 hover:border-[#00E5BE] hover:text-[#00E5BE]'
                }`}
                title={isListening ? 'Stop recording' : 'Start voice input'}
              >
                <span className="sr-only">{isListening ? 'Stop recording' : 'Start voice input'}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  {isListening ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </>
                  ) : (
                    <>
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="22"></line>
                    </>
                  )}
                </svg>
              </button>
            )}
            <button
              type="submit"
              className="btn-gradient p-3 rounded-xl"
              disabled={!input.trim()}
            >
              <span className="sr-only">Send</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
          
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <button 
                onClick={() => handleAction("Show cameras")}
                className="px-3 py-1.5 text-xs rounded-full bg-[#13131F] border border-gray-700 hover:border-[#00E5BE] hover:text-[#00E5BE] transition-colors"
              >
                Show cameras
              </button>
              <button 
                onClick={() => handleAction("viewSalesData", { year: 2023 })}
                className="px-3 py-1.5 text-xs rounded-full bg-[#13131F] border border-gray-700 hover:border-[#00E5BE] hover:text-[#00E5BE] transition-colors"
              >
                Display sales data
              </button>
              <button 
                onClick={() => handleAction("Show employee data")}
                className="px-3 py-1.5 text-xs rounded-full bg-[#13131F] border border-gray-700 hover:border-[#00E5BE] hover:text-[#00E5BE] transition-colors"
              >
                Show employees
              </button>
            </div>
          )}
          
          {/* Add media options */}
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <button 
                onClick={() => handleAction("Show video")}
                className="px-3 py-1.5 text-xs rounded-full bg-[#13131F] border border-gray-700 hover:border-[#00E5BE] hover:text-[#00E5BE] transition-colors"
              >
                Show video
              </button>
              <button 
                onClick={() => handleAction("Show image")}
                className="px-3 py-1.5 text-xs rounded-full bg-[#13131F] border border-gray-700 hover:border-[#00E5BE] hover:text-[#00E5BE] transition-colors"
              >
                Show image
              </button>
              <button 
                onClick={() => handleAction("Show PDF")}
                className="px-3 py-1.5 text-xs rounded-full bg-[#13131F] border border-gray-700 hover:border-[#00E5BE] hover:text-[#00E5BE] transition-colors"
              >
                Show PDF
              </button>
              <button 
                onClick={() => handleAction("Show audio")}
                className="px-3 py-1.5 text-xs rounded-full bg-[#13131F] border border-gray-700 hover:border-[#00E5BE] hover:text-[#00E5BE] transition-colors"
              >
                Show audio
              </button>
              <button 
                onClick={() => handleAction("Generate sales report for 2023")}
                className="px-3 py-1.5 text-xs rounded-full bg-[#13131F] border border-gray-700 hover:border-[#00E5BE] hover:text-[#00E5BE] transition-colors"
              >
                Generate sales report
              </button>
              <button 
                onClick={() => handleAction("Show company policy")}
                className="px-3 py-1.5 text-xs rounded-full bg-[#13131F] border border-gray-700 hover:border-[#00E5BE] hover:text-[#00E5BE] transition-colors"
              >
                Company policy
              </button>
            </div>
          )}
          
          {/* Test API Integration button */}
         
        </div>
      </div>
    </div>
  );
}
