"use client"
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, PieController, ArcElement, RadialLinearScale, PointElement as RadarPointElement, RadarController, Filler } from 'chart.js';
import { Line, Bar, Pie, Doughnut, PolarArea, Radar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme } from './theme-provider';
import { fetchCSVData } from './sales-data-utils';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  PieController, 
  ArcElement, 
  RadialLinearScale, 
  RadarController,
  Filler
);

// Dummy data generator
const generateSalesData = (year: number) => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const quarters = [1, 2, 3, 4];
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  const randomValue = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1) + min);

  const randomTrend = (baseValue: number, variance: number) => {
    let value = baseValue;
    return () => {
      value += randomValue(-variance, variance);
      return value;
    };
  };

  // Generate seasonal variations based on year
  const yearFactor = (year - 2020) * 0.1 + 1; // Increasing trend over years
  const baseRevenue = 100000 * yearFactor;
  const baseUnits = 1000 * yearFactor;
  const baseCustomers = 300 * yearFactor;

  const revenueGen = randomTrend(baseRevenue, baseRevenue * 0.1);
  const unitsGen = randomTrend(baseUnits, baseUnits * 0.1);
  const customersGen = randomTrend(baseCustomers, baseCustomers * 0.1);

  // Product categories for pie/doughnut charts
  const categories = [
    { name: 'Electronics', color: '#00E5BE' },
    { name: 'Clothing', color: '#FF6B6B' },
    { name: 'Home Goods', color: '#FFD166' },
    { name: 'Books', color: '#06D6A0' },
    { name: 'Food', color: '#118AB2' }
  ];

  // Regional data for radar chart
  const regions = ['North', 'South', 'East', 'West', 'Central'];

  return {
    year,
    monthly: months.map(month => {
      // Add seasonal variations
      const seasonFactor = month >= 11 ? 1.4 : // Holiday season boost
                          month >= 6 && month <= 8 ? 1.2 : // Summer boost
                          1.0; // Base level
      return {
        month,
        revenue: revenueGen() * seasonFactor,
        units: unitsGen() * seasonFactor,
        customers: customersGen() * seasonFactor,
        avgOrderValue: randomValue(80, 120) * seasonFactor
      };
    }),
    quarterly: quarters.map(quarter => {
      // Quarterly variations
      const quarterFactor = quarter === 4 ? 1.3 : // Q4 holiday boost
                           quarter === 3 ? 1.15 : // Q3 back-to-school
                           1.0; // Base level
      return {
        quarter,
        revenue: revenueGen() * 3 * quarterFactor,
        units: unitsGen() * 3 * quarterFactor,
        customers: customersGen() * 3 * quarterFactor,
        avgOrderValue: randomValue(85, 115) * quarterFactor
      };
    }),
    weekly: weeks.map(week => ({
      week,
      revenue: revenueGen() / 4,
      units: unitsGen() / 4,
      customers: customersGen() / 4,
      avgOrderValue: randomValue(75, 125)
    })),
    // Category data for pie/doughnut charts
    categories: categories.map(category => ({
      name: category.name,
      value: randomValue(baseRevenue * 0.1, baseRevenue * 0.4),
      color: category.color
    })),
    // Regional data for radar chart
    regions: regions.map(region => ({
      name: region,
      revenue: randomValue(baseRevenue * 0.15, baseRevenue * 0.35),
      customers: randomValue(baseCustomers * 0.15, baseCustomers * 0.35)
    }))
  };
};

// Available years for data - update based on CSV file years
const availableYears = [2022, 2023, 2024];

interface SalesDataProps {
  initialYear?: number;
  customData?: any; // Add the customData prop
}

export const SalesData: React.FC<SalesDataProps> = ({ initialYear = 2023, customData = null }) => {
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly' | 'weekly'>('monthly');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polar'>('line');
  const [data, setData] = useState(() => customData || generateSalesData(selectedYear));
  const [metric, setMetric] = useState<'revenue' | 'units' | 'customers' | 'avgOrderValue'>('revenue');
  const [displayMode, setDisplayMode] = useState<'all' | 'charts' | 'table'>('all');
  const { theme } = useTheme();
  const [voiceQuery, setVoiceQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reference to maintain the scroll position
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setVoiceQuery(transcript);
        
        // Process voice commands
        processVoiceCommand(transcript.toLowerCase().trim());
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current?.start();
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);
  
  // Process voice commands
  const processVoiceCommand = (command: string) => {
    // Time period commands
    if (command.includes('monthly') || command.includes('month')) {
      setViewMode('monthly');
    } else if (command.includes('quarterly') || command.includes('quarter')) {
      setViewMode('quarterly');
    } else if (command.includes('weekly') || command.includes('week')) {
      setViewMode('weekly');
    }
    
    // Chart type commands
    if (command.includes('line chart')) {
      setChartType('line');
    } else if (command.includes('bar chart')) {
      setChartType('bar');
    } else if (command.includes('pie chart')) {
      setChartType('pie');
    } else if (command.includes('doughnut chart')) {
      setChartType('doughnut');
    } else if (command.includes('radar chart')) {
      setChartType('radar');
    } else if (command.includes('polar chart')) {
      setChartType('polar');
    }
    
    // Sales metric commands
    if (command.includes('revenue')) {
      setMetric('revenue');
    } else if (command.includes('unit')) {
      setMetric('units');
    } else if (command.includes('customer')) {
      setMetric('customers');
    } else if (command.includes('order value') || command.includes('average order')) {
      setMetric('avgOrderValue');
    }
    
    // Display mode commands
    if (command.includes('show all')) {
      setDisplayMode('all');
    } else if (command.includes('show chart')) {
      setDisplayMode('charts');
    } else if (command.includes('show table')) {
      setDisplayMode('table');
    }
    
    // Year commands
    const yearMatch = command.match(/year (\d{4})/);
    if (yearMatch && yearMatch[1]) {
      const year = parseInt(yearMatch[1]);
      if (availableYears.includes(year)) {
        setSelectedYear(year);
      }
    }
  };
  
  // Toggle speech recognition
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Handle year change
  const handleYearChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
    
    if (!customData) {
      setLoading(true);
      try {
        // Try to load real data from CSV first
        const csvData = await fetchCSVData(year);
        setData(csvData);
        setError(null);
      } catch (err) {
        console.error('Error loading CSV data:', err);
        // Fallback to generated data if CSV loading fails
        setData(generateSalesData(year));
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Update with custom data when it changes
  useEffect(() => {
    if (customData) {
      // Ensure weekly and quarterly data exists
      const processed = { ...customData };
      
      // Add customers property to regions if missing
      if (processed.regions) {
        processed.regions = processed.regions.map((region: any) => ({
          ...region,
          customers: region.customers || Math.round(region.revenue / 300) // Estimate if missing
        }));
      }
      
      // Initialize missing data arrays if needed
      if (!processed.weekly && (processed.monthly || processed.quarterly)) {
        processed.weekly = [];
        // Generate weekly data based on monthly data if available
        if (processed.monthly && processed.monthly.length > 0) {
          const weeksPerMonth = 4; // Approximation
          processed.weekly = [];
          
          processed.monthly.forEach((monthData: any, monthIndex: number) => {
            const baseWeek = monthIndex * weeksPerMonth + 1;
            for (let i = 0; i < weeksPerMonth; i++) {
              const weekFraction = 1 / weeksPerMonth;
              const week = baseWeek + i;
              
              // Create weekly record with values proportional to the month
              const weekData: any = {
                week,
                ...Object.keys(monthData)
                  .filter(key => typeof monthData[key] === 'number' && key !== 'month')
                  .reduce((obj: any, key) => {
                    // Distribute values across weeks (with some variation)
                    const variation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
                    obj[key] = Math.round(monthData[key] * weekFraction * variation);
                    return obj;
                  }, {})
              };
              
              processed.weekly.push(weekData);
            }
          });
        }
      }
      
      // Initialize quarterly data if missing
      if (!processed.quarterly && processed.monthly && processed.monthly.length >= 3) {
        processed.quarterly = [];
        const monthsPerQuarter = 3;
        
        for (let q = 0; q < 4; q++) {
          const startMonth = q * monthsPerQuarter;
          const monthlyData = processed.monthly.slice(startMonth, startMonth + monthsPerQuarter);
          
          if (monthlyData.length > 0) {
            const quarterData: any = {
              quarter: q + 1,
            };
            
            // Collect all numeric fields from monthly data
            const numericFields = new Set<string>();
            monthlyData.forEach((month: any) => {
              Object.keys(month).forEach(key => {
                if (typeof month[key] === 'number' && key !== 'month') {
                  numericFields.add(key);
                }
              });
            });
            
            // Sum up values for each field
            numericFields.forEach(field => {
              quarterData[field] = monthlyData.reduce((sum: number, month: any) => 
                sum + (month[field] || 0), 0);
            });
            
            processed.quarterly.push(quarterData);
          }
        }
      }
      
      setData(processed);
    }
  }, [customData]);
  
  // Update initial year if props change
  useEffect(() => {
    if (initialYear !== selectedYear && !customData) {
      setSelectedYear(initialYear);
    }
  }, [initialYear, selectedYear, customData]);

  // Handle view mode changes without scrolling
  const handleViewModeChange = (e: React.MouseEvent, mode: 'monthly' | 'quarterly' | 'weekly') => {
    e.preventDefault();
    const currentScrollY = window.scrollY;
    setViewMode(mode);
    
    // Maintain scroll position after state update
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 0);
  };

  // Handle chart type changes without scrolling
  const handleChartTypeChange = (e: React.MouseEvent, type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polar') => {
    e.preventDefault();
    const currentScrollY = window.scrollY;
    setChartType(type);
    
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 0);
  };

  // Handle metric changes without scrolling
  const handleMetricChange = (e: React.MouseEvent, newMetric: 'revenue' | 'units' | 'customers' | 'avgOrderValue') => {
    e.preventDefault();
    const currentScrollY = window.scrollY;
    setMetric(newMetric);
    
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 0);
  };

  // Handle display mode changes without scrolling
  const handleDisplayModeChange = (e: React.MouseEvent, mode: 'all' | 'charts' | 'table') => {
    e.preventDefault();
    const currentScrollY = window.scrollY;
    setDisplayMode(mode);
    
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 0);
  };

  const downloadCSV = () => {
    const dataToExport = data[viewMode] || [];
    if (!dataToExport.length) return;
    
    const timeLabel = viewMode === 'monthly' ? 'Month' : viewMode === 'quarterly' ? 'Quarter' : 'Week';
    const timeField = viewMode === 'monthly' ? 'month' : viewMode === 'quarterly' ? 'quarter' : 'week';
    
    // Get columns dynamically
    const firstRow = dataToExport[0];
    const columns = Object.keys(firstRow).filter(key => 
      key !== timeField && 
      (typeof firstRow[key] === 'number' || typeof firstRow[key] === 'string')
    );
    
    // Create CSV header
    let csv = `${timeLabel},${columns.map(col => 
      col === 'avgOrderValue' ? 'Average Order Value' : 
      col.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + col.replace(/([A-Z])/g, ' $1').slice(1)
    ).join(',')}\n`;
    
    // Add data rows
    dataToExport.forEach((row: any) => {
      const time = viewMode === 'monthly' 
        ? new Date(2024, row.month - 1).toLocaleString('default', { month: 'long' })
        : `${viewMode === 'quarterly' ? 'Q' : 'Week '}${row[timeField]}`;
      
      const values = columns.map(col => {
        if (typeof row[col] === 'number') {
          if (col.includes('rate') || col.includes('percent') || col.includes('growth') || col.includes('factor')) {
            return (row[col] * 100).toFixed(1) + '%';
          }
          return row[col];
        }
        return row[col] || '';
      });
      
      csv += `${time},${values.join(',')}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_data_${selectedYear}_${viewMode}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCSVDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentScrollY = window.scrollY;
    downloadCSV();
    
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 0);
  };

  const downloadPDF = () => {
    try {
      const dataToExport = data[viewMode] || [];
      if (!dataToExport.length) return;
      
      const timeLabel = viewMode === 'monthly' ? 'Month' : viewMode === 'quarterly' ? 'Quarter' : 'Week';
      const timeField = viewMode === 'monthly' ? 'month' : viewMode === 'quarterly' ? 'quarter' : 'week';
      
      // Get columns dynamically
      const firstRow = dataToExport[0];
      const columns = Object.keys(firstRow).filter(key => 
        key !== timeField && 
        (typeof firstRow[key] === 'number' || typeof firstRow[key] === 'string')
      ).slice(0, 5); // Limit to 5 columns for PDF to avoid overflow
      
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(0, 229, 190); // Teal color
      doc.text(`Sales Report - ${selectedYear}`, 14, 20);
      
      // Add subtitle
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(`${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View`, 14, 30);

      // Add timestamp
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

      // Format column headers
      const headers = [timeLabel, ...columns.map(col => 
        col === 'avgOrderValue' ? 'Avg Order Value' : 
        col.includes('growthRate') || col.includes('growthFactor') ? 'Growth' :
        col.charAt(0).toUpperCase() + col.slice(1)
      )];

      // Prepare table data
      const tableData = dataToExport.map((row: any) => {
        const time = viewMode === 'monthly' 
          ? new Date(2024, row.month - 1).toLocaleString('default', { month: 'long' })
          : `${viewMode === 'quarterly' ? 'Q' : 'Week '}${row[timeField]}`;
        
        const values = columns.map(col => {
          if (typeof row[col] === 'number') {
            if (['revenue', 'avgOrderValue'].includes(col)) {
              return `$${row[col].toLocaleString()}`;
            } else if (col.includes('rate') || col.includes('percent') || col.includes('growth') || col.includes('factor')) {
              return `${(row[col] * 100).toFixed(1)}%`;
            }
            return row[col].toLocaleString();
          }
          return row[col] || '';
        });
        
        return [time, ...values];
      });

      // Add table to PDF
      (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { 
          fillColor: [0, 229, 190],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 45 }
      });

      // Add summary statistics
      const tableEndY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Summary", 14, tableEndY);
      
      // Calculate summaries for each column
      doc.setFontSize(10);
      let yOffset = tableEndY + 8;
      
      columns.slice(0, 4).forEach((col, index) => {
        if (typeof dataToExport[0][col] === 'number') {
          const isPercentage = col.includes('rate') || col.includes('percent') || col.includes('growth') || col.includes('factor');
          const isMonetary = ['revenue', 'avgOrderValue'].includes(col);
          
          let value: number;
          if (isPercentage) {
            // For rates and percentages, calculate average
            value = dataToExport.reduce((sum: number, row: any) => sum + row[col], 0) / dataToExport.length;
          } else {
            // For other numbers, calculate sum
            value = dataToExport.reduce((sum: number, row: any) => sum + row[col], 0);
          }
          
          const formattedValue = isPercentage 
            ? `${(value * 100).toFixed(1)}%` 
            : isMonetary 
                ? `$${value.toLocaleString()}`
                : value.toLocaleString();
          
          const label = col === 'avgOrderValue' ? 'Avg Order Value' : 
            col.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + col.replace(/([A-Z])/g, ' $1').slice(1);
          
          const prefix = isPercentage ? 'Average ' : 'Total ';
          doc.text(`${prefix}${label}: ${formattedValue}`, 14, yOffset);
          yOffset += 8;
        }
      });

      // Save the PDF
      doc.save(`sales_report_${selectedYear}_${viewMode}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
    }
  };

  const handlePDFDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentScrollY = window.scrollY;
    downloadPDF();
    
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 0);
  };

  // Get the appropriate chart data
  const getChartData = () => {
  // Line/Bar chart data
    if (['line', 'bar'].includes(chartType)) {
      // Determine available metrics dynamically
      const firstRow = data[viewMode]?.[0] || {};
      const availableMetrics = Object.keys(firstRow).filter(key => 
        typeof firstRow[key] === 'number' && !['month', 'quarter', 'week'].includes(key)
      );
      
      // Use selected metric if available, otherwise default to first available metric
      const effectiveMetric = availableMetrics.includes(metric) ? metric : availableMetrics[0];
      
      return {
    labels: data[viewMode]?.map((row: any) => 
      viewMode === 'monthly' 
        ? new Date(2024, row.month - 1).toLocaleString('default', { month: 'short' })
        : `${viewMode === 'quarterly' ? 'Q' : 'W'}${row[viewMode === 'quarterly' ? 'quarter' : 'week']}`
    ) || [],
    datasets: [
      {
            label: effectiveMetric === 'revenue' ? 'Revenue ($)' 
              : effectiveMetric === 'units' ? 'Units Sold'
              : effectiveMetric === 'customers' ? 'Customers'
              : effectiveMetric === 'avgOrderValue' ? 'Average Order Value ($)'
              : effectiveMetric.charAt(0).toUpperCase() + effectiveMetric.slice(1),
            data: data[viewMode]?.map((row: any) => row[effectiveMetric]) || [],
            borderColor: theme === 'dark' ? '#00E5BE' : '#00A896',
            backgroundColor: theme === 'dark' ? 'rgba(0, 229, 190, 0.1)' : 'rgba(0, 168, 150, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };
    }

  // Category chart data (pie/doughnut)
    if (['pie', 'doughnut'].includes(chartType)) {
      return {
        labels: data.categories?.map((category: {name: string}) => category.name) || [],
    datasets: [
      {
        label: 'Revenue by Category',
            data: data.categories?.map((category: {value: number}) => category.value) || [],
            backgroundColor: data.categories?.map((category: {color: string}) => category.color) || [],
                borderColor: theme === 'dark' ? '#111111' : '#FFFFFF',
        borderWidth: 2,
      }
    ]
  };
    }

    // Radar/Polar chart data
    return {
      labels: data.regions?.map((region: {name: string}) => region.name) || [],
    datasets: [
      {
        label: 'Revenue by Region',
          data: data.regions?.map((region: {revenue: number}) => region.revenue) || [],
            backgroundColor: theme === 'dark' ? 'rgba(0, 229, 190, 0.2)' : 'rgba(0, 168, 150, 0.2)',
            borderColor: theme === 'dark' ? '#00E5BE' : '#00A896',
        borderWidth: 2,
            pointBackgroundColor: theme === 'dark' ? '#00E5BE' : '#00A896',
      },
      {
        label: 'Customers by Region',
          data: data.regions?.map((region: {customers: number}) => region.customers) || [],
            backgroundColor: theme === 'dark' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 87, 87, 0.2)',
            borderColor: theme === 'dark' ? '#FF6B6B' : '#FF5757',
        borderWidth: 2,
            pointBackgroundColor: theme === 'dark' ? '#FF6B6B' : '#FF5757',
      }
    ]
    };
  };

  const getChartOptions = () => {
    const isDark = theme === 'dark';
    
    return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
              color: isDark ? '#888888' : '#555555',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            titleColor: isDark ? '#00E5BE' : '#00A896',
            bodyColor: isDark ? '#FFFFFF' : '#333333',
            borderColor: isDark ? '#222222' : '#DDDDDD',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
                
            if (context.parsed.y !== undefined) {
              if (metric === 'revenue' || metric === 'avgOrderValue') {
                label += '$' + context.parsed.y.toLocaleString();
              } else {
                label += context.parsed.y.toLocaleString();
              }
            } else if (context.parsed !== undefined) {
              label += '$' + context.parsed.toLocaleString();
            }
                
            return label;
          }
        }
      }
    },
    scales: chartType === 'line' || chartType === 'bar' ? {
      y: {
        grid: {
              color: isDark ? '#222222' : '#EEEEEE'
        },
        ticks: {
              color: isDark ? '#888888' : '#555555',
          callback: function(value: any) {
            if (metric === 'revenue' || metric === 'avgOrderValue') {
              return '$' + value.toLocaleString();
            }
            return value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
              color: isDark ? '#222222' : '#EEEEEE'
        },
        ticks: {
              color: isDark ? '#888888' : '#555555'
        }
      }
    } : undefined
    };
  };

  const renderTimeSeriesChart = () => (
    <div className="h-[400px]">
      {chartType === 'line' ? (
        <Line data={getChartData()} options={getChartOptions()} />
      ) : (
        <Bar data={getChartData()} options={getChartOptions()} />
      )}
    </div>
  );

  const renderCategoryChart = () => (
    <div className="h-[400px]">
      {chartType === 'pie' ? (
        <Pie data={getChartData()} options={getChartOptions()} />
      ) : (
        <Doughnut data={getChartData()} options={getChartOptions()} />
      )}
    </div>
  );

  const renderRadarChart = () => (
    <div className="h-[400px]">
      {chartType === 'radar' ? (
        <Radar data={getChartData()} options={getChartOptions()} />
      ) : (
        <PolarArea data={getChartData()} options={getChartOptions()} />
      )}
    </div>
  );

  const renderChart = () => {
    if (['line', 'bar'].includes(chartType)) return renderTimeSeriesChart();
    if (['pie', 'doughnut'].includes(chartType)) return renderCategoryChart();
    if (['radar', 'polar'].includes(chartType)) return renderRadarChart();
    return null;
  };

  const renderDataTable = () => {
    const dataToRender = data[viewMode] || [];
    if (!dataToRender.length) return <div className="p-4 text-center">No data available for this view</div>;
    
    const timeLabel = viewMode === 'monthly' ? 'Month' : viewMode === 'quarterly' ? 'Quarter' : 'Week';
    const isDark = theme === 'dark';
    
    // Determine columns dynamically
    const firstRow = dataToRender[0] || {};
    const timeField = viewMode === 'monthly' ? 'month' : viewMode === 'quarterly' ? 'quarter' : 'week';
    
    // Get all fields that are not the time identifier and are numbers or strings (not objects/arrays)
    const columns = Object.keys(firstRow).filter(key => 
      key !== timeField && 
      (typeof firstRow[key] === 'number' || typeof firstRow[key] === 'string')
    );
    
    // Color map for different metrics
    const colorMap: {[key: string]: {light: string, dark: string}} = {
      revenue: { dark: 'text-[#00E5BE]', light: 'text-[#00A896]' },
      units: { dark: 'text-[#FF6B6B]', light: 'text-[#FF5757]' },
      customers: { dark: 'text-[#FFD166]', light: 'text-[#E9C46A]' },
      avgOrderValue: { dark: 'text-[#06D6A0]', light: 'text-[#2A9D8F]' }
    };
    
    // Generate colors for additional columns
    const additionalColors = [
      { dark: 'text-[#9CB4CC]', light: 'text-[#5B8AC7]' },
      { dark: 'text-[#B5D5C5]', light: 'text-[#7AB317]' },
      { dark: 'text-[#D8A7B1]', light: 'text-[#CE6A6B]' },
      { dark: 'text-[#E2BCB7]', light: 'text-[#D8737F]' },
      { dark: 'text-[#AFD5AA]', light: 'text-[#7FB069]' }
    ];
    
    let colorIndex = 0;
    columns.forEach(col => {
      if (!colorMap[col]) {
        colorMap[col] = additionalColors[colorIndex % additionalColors.length];
        colorIndex++;
      }
    });

    return (
      <div className={`overflow-x-auto w-full ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'} rounded-xl border ${isDark ? 'border-[#222222]' : 'border-[#DDDDDD]'} mt-4`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${isDark ? 'border-[#222222]' : 'border-[#EEEEEE]'}`}>
              <th className={`px-4 py-3 text-left ${isDark ? 'text-[#888888]' : 'text-[#555555]'}`}>{timeLabel}</th>
              {columns.map((col) => (
                <th 
                  key={col} 
                  className={`px-4 py-3 text-left ${colorMap[col] ? (isDark ? colorMap[col].dark : colorMap[col].light) : (isDark ? 'text-white' : 'text-[#333333]')}`}
                >
                  {col === 'avgOrderValue' ? 'Avg Order Value' : col.charAt(0).toUpperCase() + col.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataToRender.map((row: any, index: number) => (
              <tr 
                key={index}
                className={`border-b ${isDark ? 'border-[#222222]' : 'border-[#EEEEEE]'} last:border-0 ${isDark ? 'hover:bg-[#111111]' : 'hover:bg-[#F9F9F9]'} transition-colors`}
              >
                <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                  {viewMode === 'monthly' 
                    ? new Date(2024, row.month - 1).toLocaleString('default', { month: 'long' })
                    : `${viewMode === 'quarterly' ? 'Q' : 'Week '}${row[timeField]}`
                  }
                </td>
                {columns.map((col) => (
                  <td 
                    key={col}
                    className={`px-4 py-3 ${colorMap[col] ? (isDark ? colorMap[col].dark : colorMap[col].light) : (isDark ? 'text-white' : 'text-[#333333]')}`}
                  >
                    {typeof row[col] === 'number' ? (
                      ['revenue', 'avgOrderValue'].includes(col) ? 
                        `$${row[col].toLocaleString()}` : 
                        col.includes('rate') || col.includes('percent') || col.includes('growth') ? 
                          `${(row[col] * 100).toFixed(1)}%` :
                          row[col].toLocaleString()
                    ) : row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Summary stats card
  const renderSummaryStats = () => {
    const dataToRender = data[viewMode] || [];
    if (!dataToRender.length) return null;
    
    // Get totals and averages
    const totals = {
      revenue: 0,
      units: 0,
      customers: 0,
      avgOrderValue: 0,
      marketingSpend: 0,
      supportTickets: 0,
      returns: 0
    };
    
    const averages = {
      growthRate: 0,
      customerSatisfaction: 0
    };
    
    dataToRender.forEach((row: any) => {
      totals.revenue += row.revenue || 0;
      totals.units += row.units || 0;
      totals.customers += row.customers || 0;
      totals.marketingSpend += row.marketingSpend || 0;
      totals.supportTickets += row.supportTickets || 0;
      totals.returns += row.returns || 0;
      
      averages.growthRate += row.growthRate || 0;
      averages.customerSatisfaction += row.customerSatisfaction || 0;
    });
    
    // Calculate averages
    averages.growthRate = averages.growthRate / dataToRender.length;
    averages.customerSatisfaction = averages.customerSatisfaction / dataToRender.length;
    totals.avgOrderValue = totals.revenue / totals.customers;
    
    // Conversion rate (units sold / customers)
    const conversionRate = totals.units / totals.customers;
    
    // Return rate (returns / units)
    const returnRate = totals.returns / totals.units;
    
    // ROI (Revenue / Marketing Spend)
    const roi = totals.marketingSpend > 0 ? (totals.revenue / totals.marketingSpend) : 0;
            
          return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Revenue" 
          value={`$${totals.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
          icon="💰"
          trend={averages.growthRate}
        />
        <StatCard 
          title="Units Sold" 
          value={totals.units.toLocaleString(undefined, {maximumFractionDigits: 0})}
          icon="📦"
        />
        <StatCard 
          title="Customers" 
          value={totals.customers.toLocaleString(undefined, {maximumFractionDigits: 0})}
          icon="👥"
        />
        <StatCard 
          title="Avg Order Value" 
          value={`$${totals.avgOrderValue.toLocaleString(undefined, {maximumFractionDigits: 2})}`}
          icon="🛒"
        />
       
        </div>
          );
  };
  
  const StatCard = ({ title, value, icon, trend }: {
    title: string, 
    value: string, 
    icon: string, 
    trend?: number
  }) => (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="text-2xl">{icon}</span>
        {trend !== undefined && (
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
            trend > 0 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : trend < 0 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}>
            {trend > 0 ? '▲' : trend < 0 ? '▼' : '•'} {Math.abs(trend * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    );

  // Get chart metric options based on available data
  const getChartMetricOptions = () => {
    return [
      { metric: 'revenue', label: 'Revenue', color: theme === 'dark' ? '#00E5BE' : '#00A896' },
      { metric: 'units', label: 'Units Sold', color: theme === 'dark' ? '#FF6B6B' : '#FF5757' },
      { metric: 'customers', label: 'Customers', color: theme === 'dark' ? '#FFD166' : '#E9C46A' },
      { metric: 'avgOrderValue', label: 'Avg Order Value', color: theme === 'dark' ? '#06D6A0' : '#2A9D8F' },
      { metric: 'growthRate', label: 'Growth Rate', color: theme === 'dark' ? '#118AB2' : '#118AB2' },
      { metric: 'marketingSpend', label: 'Marketing Spend', color: theme === 'dark' ? '#9C6644' : '#B08968' },
      { metric: 'customerSatisfaction', label: 'Satisfaction', color: theme === 'dark' ? '#9381FF' : '#7B68EE' },
      { metric: 'supportTickets', label: 'Support Tickets', color: theme === 'dark' ? '#F94144' : '#E63946' },
      { metric: 'returns', label: 'Returns', color: theme === 'dark' ? '#F8961E' : '#F4A261' }
    ];
  };

  return (
    <div className="p-4 rounded-xl bg-card text-card-foreground space-y-4 transition-all shadow-md" ref={containerRef}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col space-y-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-left">Sales Dashboard</h3>
            {loading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <svg className="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
                Loading data...
            </div>
          )}
            {error && (
              <div className="text-sm text-red-500">
                {error}
            </div>
          )}
        </div>
          <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedYear}
            onChange={handleYearChange}
              className="px-2 py-1 bg-card border border-border rounded shadow-sm text-sm"
              disabled={loading}
          >
            {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
            ))}
          </select>
            
              <button
              onClick={handleCSVDownload}
              className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm flex items-center"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              CSV
              </button>

            <button
              onClick={() => downloadPDF()}
              className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm flex items-center"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              PDF
            </button>
            
            <button
              onClick={toggleListening}
              className={`px-2 py-1 rounded text-sm flex items-center ${isListening ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'}`}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              {isListening ? 'Stop' : 'Voice'}
            </button>
          </div>
        </div>
        
        {isListening && voiceQuery && (
          <div className="text-sm p-2 bg-muted rounded">
            Heard: <span className="font-medium">{voiceQuery}</span>
          </div>
        )}
        
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <svg className="w-10 h-10 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-muted-foreground">Loading sales data for {selectedYear}...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4 max-w-md text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12" y2="16"></line>
            </svg>
            <p className="text-red-500 font-medium">Error loading data</p>
            <p className="text-muted-foreground">{error}</p>
          <button
              onClick={() => {
                setError(null);
                setData(generateSalesData(selectedYear));
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm mt-2"
            >
              Load Fallback Data
          </button>
          </div>
        </div>
      ) : (
        <>
          {/* Controls Row */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-lg border p-1 bg-card">
                {(['monthly', 'quarterly'] as const).map((mode) => (
          <button
                    key={mode}
                    onClick={(e) => handleViewModeChange(e, mode)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      viewMode === mode ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
                ))}
      </div>

              <div className="flex rounded-lg border p-1 bg-card">
        {(['all', 'charts', 'table'] as const).map((mode) => (
          <button
            key={mode}
            onClick={(e) => handleDisplayModeChange(e, mode)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      displayMode === mode ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
            }`}
          >
                    {mode === 'all' ? 'All' : mode === 'charts' ? 'Charts' : 'Table'}
          </button>
        ))}
              </div>
            </div>
      </div>

      {/* Chart Controls */}
      {displayMode !== 'table' && (
        <div className="flex flex-wrap gap-4 items-center">
              <div className="flex flex-wrap rounded-lg border p-1 bg-card">
                {[
                  { type: 'line', label: 'Line' },
                  { type: 'bar', label: 'Bar' },
                  { type: 'pie', label: 'Pie' },
                  { type: 'doughnut', label: 'Doughnut' },
                  { type: 'radar', label: 'Radar' },
                ].map(({ type, label }) => (
              <button
                key={type}
                onClick={(e) => handleChartTypeChange(e, type as any)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      chartType === type ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
              </button>
            ))}
          </div>
          
          {/* Chart Metric selector for line/bar charts */}
          {['line', 'bar'].includes(chartType) && (
                <div className="flex rounded-lg border p-1 bg-card">
                  {getChartMetricOptions().map(({ metric: m, label }) => (
                <button
                  key={m}
                  onClick={(e) => handleMetricChange(e, m as any)}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        metric === m ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
                      }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
            
          {/* Summary Stats */}
          {displayMode !== 'table' && renderSummaryStats()}

      {/* Chart */}
      {displayMode !== 'table' && (
            <div className="rounded-xl border p-4 bg-card shadow-sm">
          {renderChart()}
        </div>
      )}

      {/* Data Table */}
      {(displayMode === 'all' || displayMode === 'table') && renderDataTable()}
        </>
      )}
    </div>
  );
}; 