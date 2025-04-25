"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface MediaViewerProps {
  mediaType: 'video' | 'audio' | 'pdf' | 'image';
  mediaName: string;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ mediaType, mediaName }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Reset state when media type changes
    setIsLoaded(false);
    setError(null);
    setCopyStatus('idle');
  }, [mediaType, mediaName]);

  // Reset copy status after 2 seconds
  useEffect(() => {
    if (copyStatus === 'copied' || copyStatus === 'error') {
      const timer = setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  let filePath = '';
  
  // Determine file path based on mediaName and mediaType
  switch (mediaType) {
    case 'video':
      filePath = '/video.mp4';
      break;
    case 'audio':
      filePath = '/audio.mp3';
      break;
    case 'pdf':
      filePath = '/pdf.pdf';
      break;
    case 'image':
      filePath = '/image.png';
      break;
    default:
      filePath = '';
  }

  const handleLoadSuccess = () => {
    setIsLoaded(true);
  };

  const handleLoadError = () => {
    setError(`Failed to load ${mediaType} file: ${mediaName}`);
  };

  // Function to copy image to clipboard
  const copyImageToClipboard = async () => {
    if (!imageRef.current || mediaType !== 'image') return;
    
    setCopyStatus('copying');
    
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to match the image
      canvas.width = imageRef.current.naturalWidth;
      canvas.height = imageRef.current.naturalHeight;
      
      // Draw the image on the canvas
      if (ctx) {
        ctx.drawImage(imageRef.current, 0, 0);
      }
      
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          // Get the canvas data as a Blob
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png');
          });
          
          if (!blob) {
            throw new Error('Failed to create image blob');
          }
          
          // Use Clipboard API to copy the image
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          
          setCopyStatus('copied');
          return;
        } catch (clipboardError) {
          console.error('Modern clipboard API failed:', clipboardError);
          // Fall through to fallback method
        }
      }
      
      // Fallback: Try to open the image in a new tab for manual copying
      const dataUrl = canvas.toDataURL('image/png');
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <html>
            <head>
              <title>Copy this image</title>
              <style>body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #2a2a2a; flex-direction: column; color: white; font-family: system-ui; }</style>
            </head>
            <body>
              <h3>Right-click the image and select "Copy Image"</h3>
              <img src="${dataUrl}" alt="Image to copy" style="max-width: 100%; max-height: 80vh;" />
            </body>
          </html>
        `);
        newTab.document.close();
        setCopyStatus('copied');
      } else {
        throw new Error('Failed to open new tab for image copying');
      }
    } catch (err) {
      console.error('Failed to copy image:', err);
      setCopyStatus('error');
    }
  };

  const renderMedia = () => {
    switch (mediaType) {
      case 'video':
        return (
          <video
            className="w-full h-auto rounded-xl shadow-lg max-h-[500px] bg-black"
            controls
            autoPlay={false}
            onLoadedData={handleLoadSuccess}
            onError={handleLoadError}
          >
            <source src={filePath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
      case 'audio':
        return (
          <div className="bg-gradient-to-br from-[#1F1F3F] to-[#0A0A2F] p-6 rounded-xl shadow-lg w-full">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#00E5BE] flex items-center justify-center animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0 0l-2.828 2.828m2.828-2.828a9 9 0 010-12.728m0 0l2.828-2.828" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white text-lg font-medium mb-2">{mediaName}</h3>
                <audio
                  className="w-full"
                  controls
                  onLoadedData={handleLoadSuccess}
                  onError={handleLoadError}
                >
                  <source src={filePath} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <div className="w-full bg-gradient-to-br from-[#3F1F1F] to-[#2F0A0A] p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-medium">{mediaName}</h3>
              <div className="flex gap-2">
              <a
                href={filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#FF6B6B] text-black rounded-lg text-sm font-medium hover:bg-[#ff8c8c] transition-colors"
              >
                Open PDF
              </a>
                <div className="relative group">
                  <a 
                    href={`mailto:?subject=Sharing PDF: ${mediaName}&body=Hello,%0D%0A%0D%0AI wanted to share this PDF document with you.%0D%0A%0D%0ABest regards`}
                    className="p-2 rounded-lg bg-blue-500/80 text-white hover:bg-blue-600 transition-colors block"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Email PDF"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </a>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Email this PDF
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-black rounded-lg p-4 h-[400px] flex items-center justify-center">
              <iframe 
                src={`${filePath}#view=FitH`}
                className="w-full h-full rounded-lg"
                onLoad={handleLoadSuccess}
                onError={handleLoadError}
              >
                This browser does not support PDFs. Please download the PDF to view it.
              </iframe>
            </div>
          </div>
        );
      case 'image':
        return (
          <div className="w-full bg-gradient-to-br from-[#1F3F2F] to-[#0A2F1A] p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-medium">{mediaName}</h3>
              <div className="flex gap-2">
                {/* Copy button */}
                <div className="relative group">
                  <button
                    onClick={copyImageToClipboard}
                    disabled={copyStatus === 'copying' || !isLoaded}
                    className={`p-2 rounded-lg transition-colors ${
                      copyStatus === 'copying' 
                        ? 'bg-gray-500/50 text-gray-300 cursor-wait' 
                        : copyStatus === 'copied'
                          ? 'bg-green-500/80 text-white'
                          : copyStatus === 'error'
                            ? 'bg-red-500/80 text-white'
                            : 'bg-purple-500/80 text-white hover:bg-purple-600'
                    }`}
                    aria-label="Copy image to clipboard"
                  >
                    {copyStatus === 'copying' ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : copyStatus === 'copied' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    ) : copyStatus === 'error' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {copyStatus === 'copying' 
                      ? 'Copying...' 
                      : copyStatus === 'copied' 
                        ? 'Copied!' 
                        : copyStatus === 'error' 
                          ? 'Failed to copy' 
                          : 'Copy to clipboard'}
                  </div>
                </div>
                
                {/* Email button */}
                <div className="relative group">
                  <a 
                    href={`mailto:?subject=Sharing Image: ${mediaName}&body=Hello,%0D%0A%0D%0AI wanted to share this image with you.%0D%0A%0D%0ABest regards`}
                    className="p-2 rounded-lg bg-blue-500/80 text-white hover:bg-blue-600 transition-colors block"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Email Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </a>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Email this image
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg shadow-inner">
              <Image
                src={filePath}
                alt={mediaName}
                width={800}
                height={500}
                className="w-full h-auto object-contain max-h-[500px]"
                onLoad={handleLoadSuccess}
                onError={handleLoadError as any}
                ref={imageRef}
              />
            </div>
          </div>
        );
      default:
        return <div className="text-red-500">Unsupported media type</div>;
    }
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isLoaded ? 1 : 0.7, y: isLoaded ? 0 : 10 }}
      transition={{ duration: 0.5 }}
    >
      {error ? (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-white p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          {!isLoaded && (
            <div className="w-full flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00E5BE]"></div>
            </div>
          )}
          <div className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
            {renderMedia()}
          </div>
        </>
      )}
    </motion.div>
  );
}; 