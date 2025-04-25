import React, { useState, useEffect, useRef } from 'react';
import { BarChart, TrendingUp, Download, Activity, Users, ArrowUpRight, ChevronDown, FileText, RefreshCw, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { faker } from '@faker-js/faker';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Generate random data
const generateChartData = () => {
  // Generate dates for the last 14 days
  const endDate = new Date();
  const startDate = subDays(endDate, 13);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Format dates as strings (e.g., "Jan 01")
  const labels = dateRange.map(date => format(date, 'MMM dd'));
  
  // Generate random query data (increasing trend)
  const queryData = dateRange.map((_, index) => {
    const base = 150 + index * 12;
    return base + Math.floor(Math.random() * 50);
  });
  
  // Generate random user data
  const userData = dateRange.map((_, index) => {
    const base = 80 + index * 3;
    return base + Math.floor(Math.random() * 30);
  });
  
  // Generate random document processing data
  const documentData = dateRange.map((_, index) => {
    const base = 40 + index * 5;
    return base + Math.floor(Math.random() * 25);
  });
  
  return { labels, queryData, userData, documentData };
};

// Generate department data for doughnut chart
const generateDepartmentData = () => {
  return {
    labels: ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR'],
    data: [
      Math.floor(Math.random() * 100) + 100,
      Math.floor(Math.random() * 80) + 60,
      Math.floor(Math.random() * 120) + 90,
      Math.floor(Math.random() * 60) + 40,
      Math.floor(Math.random() * 50) + 30
    ]
  };
};

// Generate accuracy data
const generateAccuracyData = () => {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  // Start with lower accuracy and improve over time (with some variance)
  const data = labels.map((_, index) => {
    const base = 70 + index * 2;
    return Math.min(97, base + Math.floor(Math.random() * 3));
  });
  
  return { labels, data };
};

// Helper function for simplified PDF generation (fallback approach)
const generateSimplifiedPDF = (dashboardRef: React.RefObject<HTMLDivElement>, activePeriod: string) => {
  if (!dashboardRef.current) return null;
  
  try {
    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Analytics Dashboard Report', 105, 20, { align: 'center' });
    
    // Add period
    pdf.setFontSize(14);
    pdf.text(`Period: ${activePeriod}`, 105, 30, { align: 'center' });
    
    // Add date
    const date = format(new Date(), 'MMMM dd, yyyy');
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${date}`, 105, 40, { align: 'center' });
    
    // Add text summary of dashboard data
    pdf.setFontSize(11);
    pdf.text('Dashboard Summary:', 20, 55);
    pdf.setFontSize(10);
    
    const summaryLines = [
      'Total Queries: 3,721 (↑ 24%)',
      'AI Accuracy: 92% (↑ 12%)',
      'Daily Active Users: 245 (↑ 18%)',
      'Documents Processed: 1,482 (↑ 32%)'
    ];
    
    summaryLines.forEach((line, index) => {
      pdf.text(line, 25, 65 + (index * 8));
    });
    
    // Add explanation about charts
    pdf.setFontSize(10);
    pdf.text('Note: This is a simplified PDF report. For the complete interactive', 105, 120, { align: 'center' });
    pdf.text('dashboard with charts, please view the application directly.', 105, 128, { align: 'center' });
    
    // Add footer
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('© 2023 Your Organization - Confidential', 105, 280, { align: 'center' });
    
    return pdf;
  } catch (error) {
    console.error('Error in simplified PDF generation:', error);
    return null;
  }
};

const Analytics: React.FC = () => {
  const [chartData, setChartData] = useState(() => generateChartData());
  const [departmentData, setDepartmentData] = useState(() => generateDepartmentData());
  const [accuracyData, setAccuracyData] = useState(() => generateAccuracyData());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState('Last 14 Days');
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  
  // Create refs for the sections to include in the PDF
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setChartData(generateChartData());
      setDepartmentData(generateDepartmentData());
      setAccuracyData(generateAccuracyData());
      setIsRefreshing(false);
    }, 800); // Simulate loading
  };
  
  // Config for the line chart
  const lineChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Queries',
        data: chartData.queryData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Users',
        data: chartData.userData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Documents',
        data: chartData.documentData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: lightMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: lightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.9)',
        borderColor: lightMode ? 'rgba(200, 200, 200, 0.5)' : 'rgba(107, 114, 128, 0.5)',
        borderWidth: 1,
        titleColor: lightMode ? 'black' : 'white',
        bodyColor: lightMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: lightMode ? 'rgba(200, 200, 200, 0.4)' : 'rgba(107, 114, 128, 0.2)',
        },
        ticks: {
          color: lightMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        },
      },
      y: {
        grid: {
          color: lightMode ? 'rgba(200, 200, 200, 0.4)' : 'rgba(107, 114, 128, 0.2)',
        },
        ticks: {
          color: lightMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6,
      },
    },
  };

  // Config for the bar chart - AI accuracy
  const accuracyChartData = {
    labels: accuracyData.labels,
    datasets: [
      {
        label: 'Accuracy %',
        data: accuracyData.data,
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };
  
  const accuracyChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'white',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        callbacks: {
          label: function(context: any) {
            return `Accuracy: ${context.parsed.y}%`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.2)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        min: 60,
        max: 100,
      },
    },
  };
  
  // Config for the doughnut chart
  const doughnutChartData = {
    labels: departmentData.labels,
    datasets: [
      {
        data: departmentData.data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 1,
        hoverOffset: 8,
      },
    ],
  };
  
  const doughnutChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
          },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'white',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
      },
    },
    cutout: '65%',
  };
  
  // Handle report download with multiple fallback options
  const handleDownloadReport = async () => {
    setDownloadStarted(true);
    
    if (dashboardRef.current) {
      try {
        // Apply a specific class for PDF generation to help with styling
        dashboardRef.current.classList.add('pdf-export-mode');
        
        // Create temporary light mode for better PDF output
        const currentMode = lightMode;
        if (!lightMode) setLightMode(true);
        
        // Wait longer for state to update and re-render
        await new Promise(resolve => setTimeout(resolve, 800));
        
        let generationSuccessful = false;
        
        // APPROACH 1: Try html2canvas with high quality settings
        try {
          console.log("Attempting high-quality PDF generation...");
          // Capture the dashboard as canvas with better settings
          const canvas = await html2canvas(dashboardRef.current, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            allowTaint: true, // Allow tainted canvas
            logging: true, // Enable logging for debugging
            backgroundColor: '#ffffff',
            windowWidth: dashboardRef.current.scrollWidth,
            windowHeight: dashboardRef.current.scrollHeight,
            onclone: (document) => {
              // You can modify the cloned document if needed
              console.log("Document cloned for PDF generation");
              
              // Apply any necessary style adjustments to the cloned document
              const allCanvases = document.querySelectorAll('canvas');
              allCanvases.forEach(canvas => {
                // Ensure canvas renders properly in the clone
                canvas.style.maxHeight = 'none';
                canvas.style.maxWidth = 'none';
                canvas.style.background = 'white';
              });
              
              return document;
            }
          });
          
          // Generate PDF with error handling
          try {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });
            
            // Calculate dimensions to maintain aspect ratio
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            let imgHeight = (canvas.height * imgWidth) / canvas.width;
            let leftMargin = 0;
            
            // Check if the content is too tall for a single page
            if (imgHeight > pageHeight - 50) { // Leave room for header and footer
              // Scale down the content to fit on one page
              const scale = (pageHeight - 50) / imgHeight;
              imgHeight = imgHeight * scale;
              // Adjust imgWidth to maintain aspect ratio
              const originalWidth = imgWidth;
              imgWidth = imgWidth * scale;
              
              // Center the image horizontally
              leftMargin = (originalWidth - imgWidth) / 2;
            }
            
            // Add title
            pdf.setFontSize(18);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Analytics Dashboard Report', 105, 15, { align: 'center' });
            
            // Add subtitle with time period
            pdf.setFontSize(14);
            pdf.setTextColor(60, 60, 60);
            pdf.text(`${activePeriod} Overview`, 105, 22, { align: 'center' });
            
            // Add date
            const date = format(new Date(), 'MMMM dd, yyyy');
            pdf.setFontSize(12);
            pdf.setTextColor(80, 80, 80);
            pdf.text(`Generated on: ${date}`, 105, 29, { align: 'center' });
            
            // Add image (centered if needed)
            pdf.addImage(imgData, 'PNG', leftMargin, 35, imgWidth, imgHeight);
            
            // Add note about chart quality
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            const totalHeight = 35 + imgHeight;
            if (totalHeight < 280) { // Only add note if there's room
              pdf.text('Note: Some charts may appear with reduced quality in the PDF format.', 105, totalHeight + 10, { align: 'center' });
            }
            
            // Add footer
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text('© 2023 Your Organization - Confidential', 105, 290, { align: 'center' });
            
            // Save PDF with try-catch
            try {
              pdf.save(`Analytics_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
              console.log("PDF generation completed successfully");
              generationSuccessful = true;
            } catch (saveError) {
              console.error("Error saving PDF:", saveError);
              
              // Alternative download approach using data URL
              try {
                const pdfBlob = pdf.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = `Analytics_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
                link.click();
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
                generationSuccessful = true;
              } catch (altSaveError) {
                console.error("Alternative save method also failed:", altSaveError);
              }
            }
            
          } catch (pdfError) {
            console.error("Error creating PDF from canvas:", pdfError);
            
            // Fallback: Try to at least download the image
            try {
              const link = document.createElement('a');
              link.href = canvas.toDataURL('image/png');
              link.download = `Analytics_Screenshot_${format(new Date(), 'yyyy-MM-dd')}.png`;
              link.click();
              alert("We couldn't generate a PDF, but we saved a screenshot of your dashboard instead.");
              generationSuccessful = true;
            } catch (imgError) {
              console.error("Image fallback also failed:", imgError);
            }
          }
          
        } catch (canvasError) {
          console.error("Error capturing dashboard as canvas:", canvasError);
          // Wait before trying next approach
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // APPROACH 2: If all above methods failed, try section-by-section approach
        if (!generationSuccessful) {
          console.log("Attempting section-by-section PDF generation...");
          
          // Try a simpler canvas approach first with just the header section
          try {
            const headerSection = dashboardRef.current.querySelector('.mb-8');
            if (headerSection) {
              const headerCanvas = await html2canvas(headerSection as HTMLElement, {
                scale: 1.5, // Slightly higher quality
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
              });
              
              const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
              });
              
              // Add header image
              const headerImgData = headerCanvas.toDataURL('image/png');
              const headerImgWidth = 190; // Slightly narrower than page width
              const headerImgHeight = (headerCanvas.height * headerImgWidth) / headerCanvas.width;
              
              pdf.addImage(headerImgData, 'PNG', 10, 10, headerImgWidth, headerImgHeight);
              
              // Add summary statistics
              pdf.setFontSize(14);
              pdf.setTextColor(40, 40, 40);
              pdf.text('Dashboard Summary', 105, headerImgHeight + 30, { align: 'center' });
              
              pdf.setFontSize(11);
              
              // Add some basic stats
              const stats = [
                { label: 'Total Queries:', value: '3,721', change: '+24%' },
                { label: 'AI Accuracy:', value: '92%', change: '+12%' },
                { label: 'Daily Active Users:', value: '245', change: '+18%' },
                { label: 'Documents Processed:', value: '1,482', change: '+32%' }
              ];
              
              stats.forEach((stat, index) => {
                const y = headerImgHeight + 45 + (index * 12);
                pdf.setFontSize(11);
                pdf.setTextColor(60, 60, 60);
                pdf.text(stat.label, 30, y);
                
                pdf.setFontSize(11);
                pdf.setTextColor(0, 0, 0);
                pdf.text(stat.value, 100, y);
                
                pdf.setFontSize(10);
                pdf.setTextColor(40, 167, 69); // Green color
                pdf.text(stat.change, 140, y);
              });
              
              // Add note about the report
              pdf.setFontSize(10);
              pdf.setTextColor(100, 100, 100);
              pdf.text('This is a partial report with key statistics.', 105, headerImgHeight + 110, { align: 'center' });
              pdf.text('For full interactive charts, please view the dashboard directly.', 105, headerImgHeight + 118, { align: 'center' });
              
              // Add footer
              pdf.setFontSize(9);
              pdf.setTextColor(100, 100, 100);
              pdf.text('© 2023 Your Organization - Confidential', 105, 280, { align: 'center' });
              
              // Save the partial PDF
              pdf.save(`Analytics_Partial_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
              alert('We generated a partial report with the dashboard header and key statistics.');
              generationSuccessful = true;
            }
          } catch (partialError) {
            console.error('Error generating partial PDF:', partialError);
            // Wait before trying next approach
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          // If partial approach failed, try one more approach with DOM preparation
          if (!generationSuccessful) {
            console.log("Attempting DOM preparation for better canvas capture...");
            
            try {
              // Prepare the DOM for better rendering
              const dashboardClone = dashboardRef.current.cloneNode(true) as HTMLDivElement;
              
              // Create a temporary container to hold our clone
              const tempContainer = document.createElement('div');
              tempContainer.style.position = 'absolute';
              tempContainer.style.left = '-9999px';
              tempContainer.style.top = '0';
              tempContainer.style.width = '900px'; // Fixed width
              tempContainer.style.background = 'white';
              tempContainer.style.zIndex = '-1';
              
              // Adjust clone styles for better rendering
              dashboardClone.style.width = '900px';
              dashboardClone.style.padding = '20px';
              dashboardClone.style.background = 'white';
              dashboardClone.style.color = 'black';
              dashboardClone.style.maxHeight = 'none';
              dashboardClone.style.overflow = 'visible';
              
              // Fix chart rendering in clone
              const chartCanvases = dashboardClone.querySelectorAll('canvas');
              chartCanvases.forEach(canvas => {
                canvas.style.maxHeight = 'none';
                canvas.style.maxWidth = 'none';
              });
              
              // Add clone to temporary container
              tempContainer.appendChild(dashboardClone);
              document.body.appendChild(tempContainer);
              
              // Give browser time to render the clone
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Try to capture this better-prepared DOM
              const preparedCanvas = await html2canvas(dashboardClone, {
                scale: 1.2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
              });
              
              // Create a nice PDF from this canvas
              const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
              });
              
              const imgData = preparedCanvas.toDataURL('image/png');
              const imgWidth = 210; // A4 width
              let imgHeight = (preparedCanvas.height * imgWidth) / preparedCanvas.width;
              
              // If image is too tall, scale it down
              if (imgHeight > 280) {
                const scale = 280 / imgHeight;
                imgHeight = imgHeight * scale;
                const newWidth = imgWidth * scale;
                const leftMargin = (210 - newWidth) / 2;
                pdf.addImage(imgData, 'PNG', leftMargin, 10, newWidth, imgHeight);
              } else {
                pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight);
              }
              
              // Add footer
              pdf.setFontSize(9);
              pdf.setTextColor(100, 100, 100);
              pdf.text('© 2023 Your Organization - Confidential', 105, 290, { align: 'center' });
              
              // Save the prepared PDF
              pdf.save(`Analytics_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
              console.log("DOM preparation approach succeeded");
              generationSuccessful = true;
              
              // Clean up
              document.body.removeChild(tempContainer);
              
            } catch (domPrepError) {
              console.error("DOM preparation approach failed:", domPrepError);
              // Clean up any temporary elements
              const tempContainer = document.querySelector('div[style*="left: -9999px"]');
              if (tempContainer) document.body.removeChild(tempContainer);
              
              // Wait before trying the final approach
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
          
          // If all graphical approaches failed, try text-only PDF as final fallback
          if (!generationSuccessful) {
            console.log("Attempting text-only PDF as final fallback...");
            const simplePdf = generateSimplifiedPDF(dashboardRef, activePeriod);
            
            if (simplePdf) {
              try {
                simplePdf.save(`Analytics_Report_Basic_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
                alert("We've generated a simplified text-only PDF report. For best results with full charts, try using Chrome browser.");
                generationSuccessful = true;
              } catch (simpleError) {
                console.error("Simplified PDF generation also failed:", simpleError);
              }
            }
          }
        }
        
        // If all methods failed
        if (!generationSuccessful) {
          alert("PDF generation failed with all approaches. Please try using Chrome or contact support.");
        }
        
        // Restore original mode and remove PDF export class
        if (!currentMode) setLightMode(false);
        dashboardRef.current.classList.remove('pdf-export-mode');
        
      } catch (error) {
        console.error('Error in PDF generation process:', error);
        alert(`PDF generation failed: ${error.message || 'Unknown error'}`);
      } finally {
        setDownloadStarted(false);
        // Make sure we clean up any temporary elements
        const tempContainer = document.querySelector('div[style*="left: -9999px"]');
        if (tempContainer) document.body.removeChild(tempContainer);
      }
    } else {
      setDownloadStarted(false);
      alert('Could not generate PDF. Dashboard element not found.');
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div 
        ref={dashboardRef}
        className={`py-6 max-w-6xl mx-auto ${lightMode ? 'bg-gray-50 text-gray-800' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <motion.h1 
              className={`text-3xl font-bold ${lightMode ? 'text-gray-800' : 'text-white'} mb-2`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              Analytics Dashboard
            </motion.h1>
            <motion.p 
              className={lightMode ? 'text-gray-600' : 'text-gray-400'}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
          View platform usage statistics and performance metrics.
            </motion.p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              className={`${lightMode ? 'bg-white border-gray-200 text-gray-800' : 'bg-gray-800/80 text-white border-gray-700'} p-2 rounded-lg border flex items-center`}
              onClick={() => setLightMode(!lightMode)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {lightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </motion.button>
            
            <motion.div 
              className="relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <button
                className={`${lightMode ? 'bg-white border-gray-200 text-gray-800' : 'bg-gray-800/80 text-white border-gray-700'} px-4 py-2 rounded-lg border flex items-center`}
              >
                {activePeriod} <ChevronDown className="ml-2 w-4 h-4 opacity-70" />
              </button>
            </motion.div>
            
            <motion.button
              className={`${lightMode ? 'bg-white border-gray-200 text-gray-800' : 'bg-gray-800/80 text-white border-gray-700'} p-2 rounded-lg border flex items-center`}
              onClick={refreshData}
              disabled={isRefreshing}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
            
            <motion.button
              className="bg-primary text-black px-4 py-2 rounded-lg flex items-center font-medium"
              onClick={handleDownloadReport}
              disabled={downloadStarted}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {downloadStarted ? (
                <>Generating<span className="animate-pulse">...</span></>
              ) : (
                <>
                  <Download className="mr-2 w-4 h-4" />
                  Export Report
                </>
              )}
            </motion.button>
          </div>
      </div>
      
        {/* Stat cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <motion.div 
            className={`${!lightMode ? 'bg-gradient-to-br from-blue-900/40 to-blue-600/10 backdrop-blur-sm border-blue-800/30 hover:border-blue-700/50' : 'bg-white border-blue-200 hover:border-blue-300 hover:shadow-blue-100/50'} rounded-xl p-6 border transition-all shadow-lg`}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
          <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${lightMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-500'}`}>
              <BarChart size={20} />
            </div>
            <div className="flex items-center text-green-500">
              <span className="text-sm font-medium">+24%</span>
              <TrendingUp size={16} className="ml-1" />
            </div>
          </div>
            <h3 className={`text-2xl font-bold ${lightMode ? 'text-gray-800' : 'text-white'} mb-1`}>3,721</h3>
            <p className={`${lightMode ? 'text-gray-600' : 'text-gray-300'} text-sm`}>Total Queries</p>
          </motion.div>
          
          <motion.div 
            className={`${!lightMode ? 'bg-gradient-to-br from-green-900/40 to-green-600/10 backdrop-blur-sm border-green-800/30 hover:border-green-700/50' : 'bg-white border-green-200 hover:border-green-300 hover:shadow-green-100/50'} rounded-xl p-6 border transition-all shadow-lg`}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
          <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${lightMode ? 'bg-green-100 text-green-600' : 'bg-green-500/20 text-green-500'}`}>
                <Activity size={20} />
            </div>
            <div className="flex items-center text-green-500">
              <span className="text-sm font-medium">+12%</span>
              <TrendingUp size={16} className="ml-1" />
            </div>
          </div>
            <h3 className={`text-2xl font-bold ${lightMode ? 'text-gray-800' : 'text-white'} mb-1`}>92%</h3>
            <p className={`${lightMode ? 'text-gray-600' : 'text-gray-300'} text-sm`}>AI Accuracy</p>
          </motion.div>
          
          <motion.div 
            className={`${!lightMode ? 'bg-gradient-to-br from-orange-900/40 to-orange-600/10 backdrop-blur-sm border-orange-800/30 hover:border-orange-700/50' : 'bg-white border-orange-200 hover:border-orange-300 hover:shadow-orange-100/50'} rounded-xl p-6 border transition-all shadow-lg`}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
          <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${lightMode ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-500'}`}>
                <Users size={20} />
            </div>
            <div className="flex items-center text-green-500">
              <span className="text-sm font-medium">+18%</span>
              <TrendingUp size={16} className="ml-1" />
            </div>
          </div>
            <h3 className={`text-2xl font-bold ${lightMode ? 'text-gray-800' : 'text-white'} mb-1`}>245</h3>
            <p className={`${lightMode ? 'text-gray-600' : 'text-gray-300'} text-sm`}>Daily Active Users</p>
          </motion.div>
          
          <motion.div 
            className={`${!lightMode ? 'bg-gradient-to-br from-purple-900/40 to-purple-600/10 backdrop-blur-sm border-purple-800/30 hover:border-purple-700/50' : 'bg-white border-purple-200 hover:border-purple-300 hover:shadow-purple-100/50'} rounded-xl p-6 border transition-all shadow-lg`}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
          <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${lightMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-500'}`}>
                <FileText size={20} />
            </div>
            <div className="flex items-center text-green-500">
              <span className="text-sm font-medium">+32%</span>
              <TrendingUp size={16} className="ml-1" />
            </div>
          </div>
            <h3 className={`text-2xl font-bold ${lightMode ? 'text-gray-800' : 'text-white'} mb-1`}>1,482</h3>
            <p className={`${lightMode ? 'text-gray-600' : 'text-gray-300'} text-sm`}>Documents Processed</p>
          </motion.div>
        </motion.div>
        
        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-8">
          {/* Main chart - Platform activity */}
          <motion.div 
            className={`lg:col-span-4 ${lightMode ? 'bg-white border-gray-200' : 'bg-gray-900/30 backdrop-blur-sm border-gray-800/50'} rounded-xl p-6 border shadow-lg`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${lightMode ? 'text-gray-800' : 'text-white'}`}>Platform Activity</h3>
              <p className={`${lightMode ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Combined trends for queries, users, and documents</p>
            </div>
            
            <div className="w-full h-[300px]">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </motion.div>
          
          {/* Department usage pie chart */}
          <motion.div 
            className={`lg:col-span-3 ${lightMode ? 'bg-white border-gray-200' : 'bg-gray-900/30 backdrop-blur-sm border-gray-800/50'} rounded-xl p-6 border shadow-lg`}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${lightMode ? 'text-gray-800' : 'text-white'}`}>Department Usage</h3>
              <p className={`${lightMode ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Query distribution by department</p>
            </div>
            
            <div className="flex items-center justify-center h-[280px]">
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            </div>
          </motion.div>
        </div>
        
        {/* Additional charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI Accuracy chart */}
          <motion.div 
            className={`${lightMode ? 'bg-white border-gray-200' : 'bg-gray-900/30 backdrop-blur-sm border-gray-800/50'} rounded-xl p-6 border shadow-lg`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${lightMode ? 'text-gray-800' : 'text-white'}`}>AI Accuracy Trend</h3>
              <p className={`${lightMode ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Monthly accuracy measurements</p>
            </div>
            
            <div className="w-full h-[250px]">
              <Bar data={accuracyChartData} options={accuracyChartOptions} />
            </div>
          </motion.div>
          
          {/* Key insights */}
          <motion.div 
            className={`${lightMode ? 'bg-white border-gray-200' : 'bg-gray-900/30 backdrop-blur-sm border-gray-800/50'} rounded-xl p-6 border shadow-lg`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${lightMode ? 'text-gray-800' : 'text-white'}`}>Key Insights</h3>
              <p className={`${lightMode ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Performance highlights and opportunities</p>
      </div>

            <div className="space-y-4">
              <motion.div 
                className={`${lightMode ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/10 border-blue-500/20'} rounded-lg p-4 border`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg mr-3 ${lightMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h4 className={`font-medium ${lightMode ? 'text-blue-700' : 'text-blue-400'}`}>Growth Trend</h4>
                    <p className={`${lightMode ? 'text-gray-700' : 'text-gray-300'} text-sm mt-1`}>User engagement increased by 24% this month compared to previous period.</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className={`${lightMode ? 'bg-green-50 border-green-100' : 'bg-green-500/10 border-green-500/20'} rounded-lg p-4 border`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg mr-3 ${lightMode ? 'bg-green-100 text-green-600' : 'bg-green-500/20 text-green-400'}`}>
                    <ArrowUpRight size={18} />
                  </div>
                  <div>
                    <h4 className={`font-medium ${lightMode ? 'text-green-700' : 'text-green-400'}`}>Performance</h4>
                    <p className={`${lightMode ? 'text-gray-700' : 'text-gray-300'} text-sm mt-1`}>AI model accuracy has improved consistently over the last 6 months.</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className={`${lightMode ? 'bg-purple-50 border-purple-100' : 'bg-purple-500/10 border-purple-500/20'} rounded-lg p-4 border`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg mr-3 ${lightMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400'}`}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className={`font-medium ${lightMode ? 'text-purple-700' : 'text-purple-400'}`}>User Activity</h4>
                    <p className={`${lightMode ? 'text-gray-700' : 'text-gray-300'} text-sm mt-1`}>Engineering department shows highest platform usage with 32% of all queries.</p>
      </div>
    </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        {/* Advanced analytics section */}
        <motion.div 
          className={`${lightMode ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200' : 'bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border-primary/20'} rounded-xl p-8 text-center border shadow-lg`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          whileHover={{ scale: 1.01 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <BarChart className={`w-16 h-16 ${lightMode ? 'text-blue-500' : 'text-primary'} mx-auto mb-4`} />
          </motion.div>
          <h3 className={`text-xl font-semibold ${lightMode ? 'text-gray-800' : 'text-white'} mb-2`}>Advanced Analytics</h3>
          <p className={`${lightMode ? 'text-gray-600' : 'text-gray-400'} max-w-md mx-auto mb-6`}>
            Get deeper insights with our advanced analytics module. Generate custom reports, explore trends, and discover optimization opportunities.
          </p>
          <motion.button 
            className={`${lightMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-primary hover:bg-white'} text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Advanced Features
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Analytics; 