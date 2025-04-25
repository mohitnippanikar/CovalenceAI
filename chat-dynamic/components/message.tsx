"use client";

import { motion } from "framer-motion";
import { ReactNode, isValidElement, useState } from "react";
import { NonMemoizedMarkdown } from "./markdown";
import { useTheme } from "./theme-provider";
import { ClipboardCopy, Mail, Share2 } from "lucide-react";

export function TextStreamMessage({ 
  content,
  hasCopyButton = false
}: { 
  content: string;
  hasCopyButton?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emails, setEmails] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  
  const stringContent = typeof content === 'string' ? content : String(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(stringContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would integrate with an email API
    console.log(`Sending email to: ${emails}`);
    // Simulate email sending
    setTimeout(() => {
      setEmailSent(true);
      setTimeout(() => {
        setShowEmailForm(false);
        setEmailSent(false);
        setEmails("");
      }, 2000);
    }, 1000);
  };

  return (
    <div className="relative">
      <div className="text-lg">
        <NonMemoizedMarkdown>{stringContent}</NonMemoizedMarkdown>
      </div>
      
      {hasCopyButton && (
        <div className="flex items-center gap-3 mt-6">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm bg-[#00E5BE] text-black font-medium hover:bg-opacity-80 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <ClipboardCopy size={18} />
            {copied ? "Copied!" : "Copy"}
          </button>
          
          <button 
            onClick={() => setShowEmailForm(prev => !prev)}
            className="flex items-center gap-2 text-sm bg-[#00E5BE] text-black font-medium hover:bg-opacity-80 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Mail size={18} />
            Email
          </button>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-2 text-sm bg-[#00E5BE] text-black font-medium hover:bg-opacity-80 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Share2 size={18} />
            Share
          </button>
        </div>
      )}
      
      {showEmailForm && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          {emailSent ? (
            <div className="text-green-500 text-center text-lg font-medium">Email sent successfully!</div>
          ) : (
            <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
              <div>
                <label htmlFor="emails" className="block text-base font-medium mb-2">
                  Email addresses (comma separated)
                </label>
                <input
                  type="text"
                  id="emails"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="example@example.com, another@example.com"
                  className="w-full p-3 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#00E5BE] focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-[#00E5BE] text-black rounded-md hover:bg-opacity-80 font-medium shadow-sm"
                >
                  Send
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}
    </div>
  );
}

export function Message({
  role,
  content,
}: {
  role: "user" | "assistant" | "system";
  content: ReactNode | string;
}) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emails, setEmails] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Sending content to: ${emails}`);
    setTimeout(() => {
      setEmailSent(true);
      setTimeout(() => {
        setShowEmailForm(false);
        setEmailSent(false);
        setEmails("");
      }, 2000);
    }, 1000);
  };
  
  return (
    <motion.div
      className={`flex flex-col w-full max-w-[800px] ${
        role === "assistant"
          ? "rounded-xl p-6 mb-6"
          : "px-6 mb-4"
      }`}
      style={{
        backgroundColor: role === "assistant" ? 'var(--card-bg)' : 'transparent',
        borderWidth: role === "assistant" ? '1px' : '0',
        borderStyle: 'solid',
        borderColor: 'var(--border-color)',
        boxShadow: role === "assistant" ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none'
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            role === "assistant"
              ? "bg-[#00E5BE] text-black font-medium"
              : "text-[#00E5BE]"
          }`}
          style={{
            backgroundColor: role === "assistant" 
              ? '#00E5BE' 
              : theme === 'dark' ? '#222222' : '#E5E7EB'
          }}
        >
          {role === "assistant" ? "AI" : "U"}
        </div>
        <div 
          className="font-medium text-lg"
          style={{
            color: role === "assistant" ? '#00E5BE' : 'var(--text-primary)'
          }}
        >
          {role === "assistant" ? "Assistant" : "You"}
        </div>
      </div>
      
      <div 
        className="prose max-w-none text-base"
        style={{
          color: role === "assistant" ? 'var(--text-primary)' : 'var(--text-secondary)'
        }}
      >
        {isValidElement(content) ? (
          <>
            {content}
            {role === "assistant" && (
              <>
                <div className="flex items-center gap-3 mt-6">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-2 text-sm bg-[#00E5BE] text-black font-medium hover:bg-opacity-80 px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <ClipboardCopy size={18} />
                    {copied ? "Copied link!" : "Copy link"}
                  </button>
                  
                  <button 
                    onClick={() => setShowEmailForm(prev => !prev)}
                    className="flex items-center gap-2 text-sm bg-[#00E5BE] text-black font-medium hover:bg-opacity-80 px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <Mail size={18} />
                    Email
                  </button>
                  
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-2 text-sm bg-[#00E5BE] text-black font-medium hover:bg-opacity-80 px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <Share2 size={18} />
                    Share
                  </button>
                </div>
                
                {showEmailForm && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
                  >
                    {emailSent ? (
                      <div className="text-green-500 text-center text-lg font-medium">Email sent successfully!</div>
                    ) : (
                      <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
                        <div>
                          <label htmlFor="emails" className="block text-base font-medium mb-2">
                            Email addresses (comma separated)
                          </label>
                          <input
                            type="text"
                            id="emails"
                            value={emails}
                            onChange={(e) => setEmails(e.target.value)}
                            placeholder="example@example.com, another@example.com"
                            className="w-full p-3 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#00E5BE] focus:border-transparent"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowEmailForm(false)}
                            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-[#00E5BE] text-black rounded-md hover:bg-opacity-80 font-medium shadow-sm"
                          >
                            Send
                          </button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </>
        ) : typeof content === "string" ? (
          <TextStreamMessage content={content} hasCopyButton={role === "assistant"} />
        ) : (
          <TextStreamMessage content={String(content)} hasCopyButton={role === "assistant"} />
        )}
      </div>
    </motion.div>
  );
}
