"use client";

import React, { useEffect, useState, useRef } from 'react';
import { fetchCSVData } from './sales-data-utils';
import { jsPDF } from 'jspdf';
import { Chart, registerables } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import html2canvas from 'html2canvas';

// Register Chart.js components
Chart.register(...registerables);

interface SalesReportProps {
  year: number;
}

const SalesReport: React.FC<SalesReportProps> = ({ year }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Array of refs for each chart
  const chartRefs = {
    revenue: useRef<HTMLDivElement>(null),
    units: useRef<HTMLDivElement>(null),
    categories: useRef<HTMLDivElement>(null),
    regions: useRef<HTMLDivElement>(null),
    metrics: useRef<HTMLDivElement>(null),
    monthly: useRef<HTMLDivElement>(null),
    comparison: useRef<HTMLDivElement>(null),
    performance: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await fetchCSVData(year);
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load sales data. Please try again later.');
        setLoading(false);
      }
    };

    loadData();
  }, [year]);

  const generatePdf = async () => {
    if (!data) return;
    
    setGeneratingPDF(true);
    
    try {
      // Import dependencies only when needed
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'landscape', // Change to landscape for wider tables
        unit: 'mm',
        format: 'a4'
      });
      
      // Helper function to add a title section
      const addTitle = (text: string, y: number, fontSize = 18, color = [0, 51, 102]) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(text, 148, y, { align: 'center' }); // Adjusted for landscape
        return y + 10;
      };
      
      // Helper function to add text
      const addText = (text: string, x: number, y: number, fontSize = 12, color = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(text, x, y);
        return y + 7;
      };
      
      // Helper function for splitting text into multiple lines
      const splitText = (text: string, fontSize = 12, maxWidth = 250) => {
        doc.setFontSize(fontSize);
        return doc.splitTextToSize(text, maxWidth);
      };
      
      // Cover page
      doc.setFillColor(40, 80, 160);
      doc.rect(0, 0, 297, 40, 'F'); // Adjusted for landscape
      
      let y = 30;
      y = addText(`ANNUAL SALES REPORT`, 148, y, 24, [255, 255, 255]);
      y = addText(`FISCAL YEAR ${year}`, 148, y, 18, [255, 255, 255]);
      
      // Add logo or company name
      y = 70;
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(74, y - 10, 150, 60, 5, 5, 'F');
      
      y = addText(`TOTAL REVENUE: $${data.totalRevenue.toLocaleString()}`, 148, y, 16, [40, 80, 160]);
      y = addText(`Units Sold: ${data.totalUnits.toLocaleString()}`, 148, y + 5, 14);
      y = addText(`Total Customers: ${data.totalCustomers.toLocaleString()}`, 148, y + 5, 14);
      y = addText(`Avg. Order Value: $${data.avgOrderValue.toFixed(2)}`, 148, y + 5, 14);
      y = addText(`Growth Rate: ${data.avgGrowthRate >= 0 ? '+' : ''}${data.avgGrowthRate.toFixed(1)}%`, 148, y + 5, 14);
      
      y = 150;
      const dateText = `Report Generated: ${new Date().toLocaleDateString()}`;
      addText(dateText, 148, y, 12, [100, 100, 100]);
      
      // Footer with page numbers
      const addFooter = (pageNum: number, totalPages: number) => {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${pageNum} of ${totalPages}`, 148, 200, { align: 'center' }); // Adjusted for landscape
        doc.text('Confidential - For Internal Use Only', 148, 205, { align: 'center' });
      };
      
      addFooter(1, 6); // First page
      
      // Executive Summary (Page 2)
      doc.addPage();
      
      y = 20;
      y = addTitle('EXECUTIVE SUMMARY', y);
      doc.setDrawColor(40, 80, 160);
      doc.line(20, y, 277, y); // Adjusted for landscape
      y += 10;
      
      const summaryText = [
        `This report presents a comprehensive analysis of our sales performance for the fiscal year ${year}.`,
        `Overall, the business has ${data.avgGrowthRate >= 0 ? 'grown' : 'declined'} by ${Math.abs(data.avgGrowthRate).toFixed(1)}% compared to the previous year, with total revenue reaching $${data.totalRevenue.toLocaleString()}.`,
        '',
        'Key Highlights:',
        `• Total sales volume of ${data.totalUnits.toLocaleString()} units across all product categories`,
        `• Average order value of $${data.avgOrderValue.toLocaleString()}, indicating ${data.avgOrderValue > 150 ? 'strong premium positioning' : 'potential for upsell opportunities'}`,
        `• Customer satisfaction rating of ${data.avgCustomerSatisfaction.toFixed(1)}/10, ${data.avgCustomerSatisfaction >= 8 ? 'reflecting excellent service quality' : 'highlighting areas for improvement'}`,
        `• Marketing ROI of ${((data.avgMarketingROI || 0) * 100).toFixed(1)}%, ${(data.avgMarketingROI || 0) >= 2 ? 'demonstrating highly effective campaigns' : 'suggesting room for optimization'}`,
        `• Return rate of ${(data.monthly.reduce((sum: number, m: any) => sum + (m.returns || 0), 0) / data.totalUnits * 100).toFixed(1)}%, ${(data.monthly.reduce((sum: number, m: any) => sum + (m.returns || 0), 0) / data.totalUnits) < 0.05 ? 'indicating high product quality' : 'requiring quality control review'}`,
        '',
        'Category Performance:',
        `The ${data.topCategory?.name || 'N/A'} category led our product portfolio with $${data.topCategory?.value.toLocaleString() || 0} in sales, representing ${data.topCategory ? ((data.topCategory.value / data.totalRevenue) * 100).toFixed(1) : 0}% of total revenue.`,
        '',
        'Regional Performance:',
        `The ${data.topRegion?.name || 'N/A'} region contributed the most to our revenue with $${data.topRegion?.revenue.toLocaleString() || 0}, accounting for ${data.topRegion ? ((data.topRegion.revenue / data.totalRevenue) * 100).toFixed(1) : 0}% of total sales.`
      ];
      
      summaryText.forEach(line => {
        const lines = splitText(line);
        lines.forEach((splitLine: string) => {
          y = addText(splitLine, 20, y);
        });
        if (line === '') y -= 3; // Reduce space for empty lines
      });
      
      addFooter(2, 6);
      
      // Sales Performance (Page 3)
      doc.addPage();
      
      y = 20;
      y = addTitle('SALES PERFORMANCE', y);
      doc.setDrawColor(40, 80, 160);
      doc.line(20, y, 277, y); // Adjusted for landscape
      y += 10;
      
      y = addText('Monthly Revenue Breakdown', 20, y, 14, [40, 80, 160]);
      y += 5;
      
      // Add monthly revenue table with reduced column widths
      autoTable(doc, {
        startY: y,
        head: [['Month', 'Revenue', 'Units', 'Customers', 'Avg. Order', 'Growth']],
        body: data.monthly.map((m: any) => [
          m.month,
          `$${m.revenue.toLocaleString()}`,
          m.units.toLocaleString(),
          m.customers.toLocaleString(),
          `$${(m.revenue / m.customers).toFixed(2)}`,
          `${m.growthRate >= 0 ? '+' : ''}${m.growthRate.toFixed(1)}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [60, 100, 180], textColor: [255, 255, 255] },
        styles: { fontSize: 10 }, // Reduce font size
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 35, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' }
        }
      });
      
      // @ts-ignore - lastAutoTable is added by the jspdf-autotable plugin
      y = doc.lastAutoTable?.finalY + 15 || y + 120;
      
      y = addText('Quarterly Performance', 20, y, 14, [40, 80, 160]);
      y += 5;
      
      // Add quarterly data table
      autoTable(doc, {
        startY: y,
        head: [['Quarter', 'Revenue', 'Units', 'Customers', 'Avg. Order', 'Growth']],
        body: data.quarterly.map((q: any) => [
          `Q${q.quarter}`,
          `$${q.revenue.toLocaleString()}`,
          q.units.toLocaleString(),
          q.customers.toLocaleString(),
          `$${(q.revenue / q.customers).toFixed(2)}`,
          `${q.growthRate >= 0 ? '+' : ''}${q.growthRate.toFixed(1)}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [60, 100, 180], textColor: [255, 255, 255] },
        styles: { fontSize: 10 }, // Reduce font size
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 35, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' }
        }
      });
      
      addFooter(3, 6);
      
      // Customer Analysis (Page 4)
      doc.addPage();
      
      y = 20;
      y = addTitle('CUSTOMER ANALYSIS', y);
      doc.setDrawColor(40, 80, 160);
      doc.line(20, y, 277, y); // Adjusted for landscape
      y += 10;
      
      const customerText = [
        `Customer Overview for ${year}:`,
        `• Total customer base: ${data.totalCustomers.toLocaleString()}`,
        `• Average order value: $${data.avgOrderValue.toFixed(2)}`,
        `• Customer satisfaction rating: ${data.avgCustomerSatisfaction.toFixed(1)}/10`,
        `• Average items per customer: ${(data.totalUnits / data.totalCustomers).toFixed(2)}`,
        `• Return rate: ${(data.monthly.reduce((sum: number, m: any) => sum + (m.returns || 0), 0) / data.totalUnits * 100).toFixed(1)}%`,
        '',
        'Customer Satisfaction Trends:',
        'Our customer satisfaction scores show ' + (data.avgGrowthRate >= 0 ? 'positive correlation with revenue growth' : 'areas for improvement especially during revenue decline') + '. The highest satisfaction was observed during ' + (data.monthly.sort((a: any, b: any) => b.customerSatisfaction - a.customerSatisfaction)[0]?.month || 'N/A') + '.',
        '',
        'Customer Acquisition Costs:',
        `Based on our marketing spend of $${data.monthly.reduce((sum: number, m: any) => sum + (m.marketingSpend || 0), 0).toLocaleString()} and ${data.totalCustomers.toLocaleString()} customers, our estimated customer acquisition cost is $${(data.monthly.reduce((sum: number, m: any) => sum + (m.marketingSpend || 0), 0) / data.totalCustomers).toFixed(2)}.`,
        '',
        'Customer Retention Insights:',
        'Support tickets and return rates indicate ' + (data.monthly.reduce((sum: number, m: any) => sum + (m.returns || 0), 0) / data.totalUnits < 0.05 ? 'strong product satisfaction and effective customer support' : 'opportunities to improve product quality and support processes') + '.'
      ];
      
      customerText.forEach(line => {
        const lines = splitText(line);
        lines.forEach((splitLine: string) => {
          y = addText(splitLine, 20, y);
        });
        if (line === '') y -= 3; // Reduce space for empty lines
      });
      
      y += 15;
      
      y = addText('Monthly Customer Metrics', 20, y, 14, [40, 80, 160]);
      y += 5;
      
      // Add customer metrics table
      autoTable(doc, {
        startY: y,
        head: [['Month', 'Customers', 'Satisfaction', 'Support Tickets', 'Returns']],
        body: data.monthly.map((m: any) => [
          m.month,
          m.customers.toLocaleString(),
          `${m.customerSatisfaction?.toFixed(1) || 'N/A'}/10`,
          m.supportTickets?.toLocaleString() || 'N/A',
          m.returns?.toLocaleString() || 'N/A'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [60, 100, 180], textColor: [255, 255, 255] },
        styles: { fontSize: 10 } // Reduce font size
      });
      
      addFooter(4, 6);
      
      // Categories & Regions (Page 5)
      doc.addPage();
      
      y = 20;
      y = addTitle('PRODUCT CATEGORIES & REGIONS', y);
      doc.setDrawColor(40, 80, 160);
      doc.line(20, y, 277, y); // Adjusted for landscape
      y += 10;
      
      y = addText('Category Performance', 20, y, 14, [40, 80, 160]);
      y += 5;
      
      // Add categories table with safe access
      if (data.categories && data.categories.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Category', 'Revenue', '% of Total', 'Rank']],
          body: data.categories.sort((a: any, b: any) => b.value - a.value).map((cat: any, index: number) => [
            cat.name || 'N/A',
            `$${(cat.value || 0).toLocaleString()}`,
            `${((cat.value || 0) / data.totalRevenue * 100).toFixed(1)}%`,
            `#${index + 1}`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [60, 100, 180], textColor: [255, 255, 255] },
          styles: { fontSize: 10 } // Reduce font size
        });
        
        // @ts-ignore - lastAutoTable is added by the jspdf-autotable plugin
        y = doc.lastAutoTable?.finalY + 15 || y + 60;
      } else {
        y = addText('No category data available for this period.', 20, y + 10);
        y += 20;
      }
      
      y = addText('Regional Performance', 20, y, 14, [40, 80, 160]);
      y += 5;
      
      // Add regions table with safe access
      if (data.regions && data.regions.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Region', 'Revenue', 'Customers', 'Units', 'Avg. Order']],
          body: data.regions.sort((a: any, b: any) => b.revenue - a.revenue).map((region: any) => [
            region.name || 'N/A',
            `$${(region.revenue || 0).toLocaleString()}`,
            (region.customers || 0).toLocaleString(),
            (region.units || 0).toLocaleString(),
            `$${region.customers ? (region.revenue / region.customers).toFixed(2) : 'N/A'}`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [60, 100, 180], textColor: [255, 255, 255] },
          styles: { fontSize: 10 } // Reduce font size
        });
      } else {
        y = addText('No regional data available for this period.', 20, y + 10);
      }
      
      addFooter(5, 6);
      
      // Insights & Recommendations (Page 6)
      doc.addPage();
      
      y = 20;
      y = addTitle('INSIGHTS & RECOMMENDATIONS', y);
      doc.setDrawColor(40, 80, 160);
      doc.line(20, y, 277, y); // Adjusted for landscape
      y += 10;
      
      const insightsText = [
        'Key Insights:',
        `• ${data.avgGrowthRate >= 0 ? 'Consistent growth' : 'Revenue challenges'} across ${year} indicate ${data.avgGrowthRate >= 0 ? 'positive market reception' : 'need for strategic adjustments'}.`,
        `• ${data.topCategory?.name || 'Leading'} category represents ${data.topCategory ? ((data.topCategory.value / data.totalRevenue) * 100).toFixed(1) : 0}% of revenue, showing ${data.topCategory && data.topCategory.value > data.totalRevenue * 0.3 ? 'potential concentration risk' : 'healthy product mix'}.`,
        `• ${data.topRegion?.name || 'Top'} region contributes ${data.topRegion ? ((data.topRegion.revenue / data.totalRevenue) * 100).toFixed(1) : 0}% of sales, ${data.topRegion && data.topRegion.revenue > data.totalRevenue * 0.4 ? 'suggesting geographic expansion opportunities' : 'indicating balanced regional distribution'}.`,
        `• Marketing spend ROI of ${((data.avgMarketingROI || 0) * 100).toFixed(1)}% shows ${(data.avgMarketingROI || 0) >= 2 ? 'effective campaign strategies' : 'room for optimization'}.`,
        `• Customer satisfaction at ${data.avgCustomerSatisfaction.toFixed(1)}/10 ${data.avgCustomerSatisfaction >= 8 ? 'reflects strong service quality' : 'highlights improvement opportunities'}.`,
        '',
        'Strategic Recommendations:',
        '1. Product Strategy:',
        `   • ${data.categories && data.categories.length > 0 ? 'Expand ' + (data.categories.sort((a: any, b: any) => b.value - a.value)[0]?.name || 'top-performing') + ' line with new variations' : 'Develop new product lines based on market demand'}`,
        `   • ${data.categories && data.categories.length > 1 ? 'Evaluate performance of ' + (data.categories.sort((a: any, b: any) => a.value - b.value)[0]?.name || 'lowest-performing') + ' category for potential repositioning' : 'Evaluate underperforming products for potential discontinuation'}`,
        '',
        '2. Regional Focus:',
        `   • ${data.regions && data.regions.length > 0 ? 'Increase marketing investment in ' + (data.regions.sort((a: any, b: any) => (a.customers / data.totalCustomers) - (b.customers / data.totalCustomers))[0]?.name || 'underperforming regions') + ' to expand market share' : 'Target underperforming regions with tailored marketing campaigns'}`,
        `   • ${data.regions && data.regions.length > 1 ? 'Apply best practices from ' + (data.regions.sort((a: any, b: any) => (b.revenue / b.customers) - (a.revenue / a.customers))[0]?.name || 'best-performing regions') + ' across other regions' : 'Implement region-specific strategies based on local preferences'}`,
        '',
        '3. Customer Experience:',
        `   • ${data.avgCustomerSatisfaction < 8 ? 'Enhance customer support processes to improve satisfaction scores' : 'Maintain excellent customer service standards'}`,
        `   • ${(data.monthly.reduce((sum: number, m: any) => sum + (m.returns || 0), 0) / data.totalUnits) > 0.05 ? 'Address quality issues to reduce return rate' : 'Continue quality control measures to maintain low return rates'}`,
        '',
        '4. Marketing Optimization:',
        `   • ${(data.avgMarketingROI || 0) < 2 ? 'Reallocate marketing budget to highest-performing channels' : 'Scale successful marketing campaigns to drive continued growth'}`,
        `   • Implement targeted upsell strategies to increase average order value from $${data.avgOrderValue.toFixed(2)}`
      ];
      
      insightsText.forEach(line => {
        const lines = splitText(line);
        lines.forEach((splitLine: string) => {
          y = addText(splitLine, 20, y);
          if (y > 180) { // Adjusted for landscape
            addFooter(6, 6);
            doc.addPage();
            y = 20;
            addFooter(6, 6);
          }
        });
        if (line === '') y -= 3; // Reduce space for empty lines
      });
      
      // Save the PDF
      doc.save(`Sales_Report_${year}.pdf`);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const renderChart = (chartType: string) => {
    if (!data) return null;
    
    const months = data.monthly.map((m: any) => `Month ${m.month}`);
    const revenueData = data.monthly.map((m: any) => m.revenue);
    const unitsData = data.monthly.map((m: any) => m.units);
    const customerData = data.monthly.map((m: any) => m.customers);
    const satisfactionData = data.monthly.map((m: any) => m.customerSatisfaction);
    const marketingData = data.monthly.map((m: any) => m.marketingSpend);
    const returnsData = data.monthly.map((m: any) => m.returns || 0);
    const supportTicketsData = data.monthly.map((m: any) => m.supportTickets || 0);
    
    switch (chartType) {
      case 'revenue':
        return (
          <div ref={chartRefs.revenue} className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 p-4 rounded-lg shadow-lg border border-blue-100 dark:border-blue-900">
            <h3 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-300">Monthly Revenue</h3>
            <Bar
              data={{
                labels: months,
                datasets: [
                  {
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: 'rgba(66, 153, 225, 0.7)',
                    borderColor: 'rgba(66, 153, 225, 1)',
                    borderWidth: 2,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(66, 153, 225, 0.9)',
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      font: {
                        weight: 'bold'
                      }
                    }
                  },
                  title: {
                    display: true,
                    text: `Revenue Trend for ${year}`,
                    font: {
                      size: 16
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        return `Revenue: $${context.raw.toLocaleString()}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                      callback: function(value) {
                        return '$' + value.toLocaleString();
                      }
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                animation: {
                  duration: 2000,
                  easing: 'easeOutQuart'
                }
              }}
            />
          </div>
        );
        
      case 'units':
        return (
          <div ref={chartRefs.units} className="bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-900/30 dark:to-green-900/30 p-4 rounded-lg shadow-lg border border-teal-100 dark:border-teal-900">
            <h3 className="text-xl font-semibold mb-4 text-teal-800 dark:text-teal-300">Units Sold vs Customers</h3>
            <Line
              data={{
                labels: months,
                datasets: [
                  {
                    label: 'Units Sold',
                    data: unitsData,
                    backgroundColor: 'rgba(4, 120, 87, 0.6)',
                    borderColor: 'rgba(4, 120, 87, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(4, 120, 87, 1)',
                    pointHoverRadius: 6,
                    yAxisID: 'y',
                  },
                  {
                    label: 'Customers',
                    data: customerData,
                    backgroundColor: 'rgba(236, 72, 153, 0.6)',
                    borderColor: 'rgba(236, 72, 153, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(236, 72, 153, 1)',
                    pointHoverRadius: 6,
                    yAxisID: 'y1',
                  },
                ],
              }}
              options={{
                responsive: true,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  title: {
                    display: true,
                    text: 'Units Sold vs Number of Customers',
                    font: {
                      size: 16
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        return context.dataset.label + ': ' + context.raw.toLocaleString();
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Units'
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                      drawOnChartArea: false,
                    },
                    title: {
                      display: true,
                      text: 'Customers'
                    }
                  },
                },
                animation: {
                  duration: 2000,
                  easing: 'easeOutQuart'
                }
              }}
            />
          </div>
        );
        
      case 'categories':
        return (
          <div ref={chartRefs.categories} className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 p-4 rounded-lg shadow-lg border border-amber-100 dark:border-amber-900">
            <h3 className="text-xl font-semibold mb-4 text-amber-800 dark:text-amber-300">Sales by Category</h3>
            <Pie
              data={{
                labels: data.categories.map((c: any) => c.name),
                datasets: [
                  {
                    data: data.categories.map((c: any) => c.value),
                    backgroundColor: data.categories.map((c: any) => c.color || `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.8)`),
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 2,
                    hoverBorderColor: 'white',
                    hoverBorderWidth: 3,
                    hoverOffset: 10,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      font: {
                        size: 12
                      },
                      boxWidth: 15,
                      padding: 15
                    }
                  },
                  title: {
                    display: true,
                    text: `Sales Distribution by Category - ${year}`,
                    font: {
                      size: 16
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        const value = context.raw as number;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
                      }
                    }
                  }
                },
                animation: {
                  animateRotate: true,
                  animateScale: true,
                  duration: 2000,
                  easing: 'easeOutQuart'
                }
              }}
            />
          </div>
        );
        
      case 'regions':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 rounded-xl shadow-lg text-white">
              <h2 className="text-3xl font-bold">Regional Analysis</h2>
              <p className="mt-2 text-indigo-100">Geographical performance breakdown for {year}</p>
            </div>
            
            {/* Regional Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {data.regions?.map((region: any, index: number) => {
                const colors = [
                  { bg: "from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30", border: "border-blue-100 dark:border-blue-900", accent: "bg-blue-100 dark:bg-blue-800", text: "text-blue-700 dark:text-blue-300" },
                  { bg: "from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30", border: "border-emerald-100 dark:border-emerald-900", accent: "bg-emerald-100 dark:bg-emerald-800", text: "text-emerald-700 dark:text-emerald-300" },
                  { bg: "from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30", border: "border-amber-100 dark:border-amber-900", accent: "bg-amber-100 dark:bg-amber-800", text: "text-amber-700 dark:text-amber-300" },
                  { bg: "from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30", border: "border-rose-100 dark:border-rose-900", accent: "bg-rose-100 dark:bg-rose-800", text: "text-rose-700 dark:text-rose-300" },
                ];
                const color = colors[index % colors.length];
                
                // Calculate metrics
                const revenuePercent = ((region.revenue / data.totalRevenue) * 100).toFixed(1);
                const customersPercent = ((region.customers / data.totalCustomers) * 100).toFixed(1);
                const avgOrderValue = (region.revenue / region.customers).toFixed(2);
                const unitsPerCustomer = (region.units / region.customers).toFixed(2);
                
                return (
                  <div key={region.name} className={`bg-gradient-to-br ${color.bg} p-6 rounded-xl shadow-md border ${color.border}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-semibold ${color.text}`}>{region.name}</p>
                        <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">${region.revenue.toLocaleString()}</p>
                      </div>
                      <div className={`${color.accent} p-2 rounded-lg`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${color.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="block font-medium">Revenue Share</span>
                        <span className="block">{revenuePercent}%</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="block font-medium">Customers</span>
                        <span className="block">{region.customers.toLocaleString()} ({customersPercent}%)</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="block font-medium">Avg. Order</span>
                        <span className="block">${avgOrderValue}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="block font-medium">Units/Customer</span>
                        <span className="block">{unitsPerCustomer}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Revenue by Region Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Revenue by Region</h3>
              <div className="h-80">
                {renderChart('regionRevenue')}
              </div>
            </div>
            
            {/* Regional Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Market Penetration</h3>
                <div className="space-y-4">
                  {data.regions?.sort((a: any, b: any) => b.customers - a.customers).map((region: any, index: number) => {
                    const penetrationRate = ((region.customers / data.totalCustomers) * 100).toFixed(1);
                    const colors = [
                      "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
                      "bg-purple-500", "bg-cyan-500", "bg-lime-500", "bg-orange-500"
                    ];
                    return (
                      <div key={region.name} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{region.name}</span>
                          <span className="text-gray-600 dark:text-gray-300">{penetrationRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className={`${colors[index % colors.length]} h-2.5 rounded-full`} 
                            style={{width: `${penetrationRate}%`}}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Average Order Value</h3>
                <div className="space-y-4">
                  {data.regions?.sort((a: any, b: any) => (b.revenue / b.customers) - (a.revenue / a.customers)).map((region: any, index: number) => {
                    const avgOrderValue = (region.revenue / region.customers).toFixed(2);
                    const maxAvgOrder = Math.max(...data.regions.map((r: any) => r.revenue / r.customers));
                    const percentOfMax = ((region.revenue / region.customers) / maxAvgOrder * 100).toFixed(1);
                    const colors = [
                      "bg-violet-500", "bg-pink-500", "bg-indigo-500", "bg-sky-500",
                      "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-teal-500"
                    ];
                    return (
                      <div key={region.name} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{region.name}</span>
                          <span className="text-gray-600 dark:text-gray-300">${avgOrderValue}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className={`${colors[index % colors.length]} h-2.5 rounded-full`} 
                            style={{width: `${percentOfMax}%`}}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Regional Insights */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Regional Insights</h3>
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p>
                  In {year}, our sales were distributed across {data.regions?.length || 0} regions, with 
                  {data.topRegion?.name ? ` ${data.topRegion.name} ` : ' one region '} 
                  leading in revenue generation at ${data.topRegion?.revenue.toLocaleString() || 0}.
                </p>
                
                <h4>Key Regional Observations</h4>
                <ul>
                  {data.regions?.sort((a: any, b: any) => b.revenue - a.revenue).map((region: any) => {
                    const revenuePercent = ((region.revenue / data.totalRevenue) * 100).toFixed(1);
                    const customersPercent = ((region.customers / data.totalCustomers) * 100).toFixed(1);
                    const avgOrderValue = (region.revenue / region.customers).toFixed(2);
                    
                    let insight = '';
                    const numericAvgOrderValue = parseFloat(avgOrderValue);
                    if (numericAvgOrderValue > data.avgOrderValue * 1.2) {
                      insight = 'showing excellent premium positioning';
                    } else if (numericAvgOrderValue < data.avgOrderValue * 0.8) {
                      insight = 'indicating potential for upsell strategies';
                    } else if (region.customers > data.totalCustomers * 0.3) {
                      insight = 'demonstrating strong market penetration';
                    } else if (region.customers < data.totalCustomers * 0.1) {
                      insight = 'highlighting opportunity for customer acquisition';
                    } else {
                      insight = 'performing within expected parameters';
                    }
                    
                    return (
                      <li key={region.name}>
                        <strong>{region.name}</strong>: Contributed {revenuePercent}% of total revenue with {region.customers.toLocaleString()} customers ({customersPercent}% of total), 
                        average order value of ${avgOrderValue}, {insight}.
                      </li>
                    );
                  })}
                </ul>
                
                <h4>Regional Opportunities</h4>
                <p>
                  {(() => {
                    // Identify region with lowest market penetration
                    const lowestPenetrationRegion = [...(data.regions || [])].sort((a, b) => 
                      (a.customers / data.totalCustomers) - (b.customers / data.totalCustomers)
                    )[0];
                    
                    // Identify region with highest average order value
                    const highestAOVRegion = [...(data.regions || [])].sort((a, b) => 
                      (b.revenue / b.customers) - (a.revenue / a.customers)
                    )[0];
                    
                    if (lowestPenetrationRegion && highestAOVRegion) {
                      return `
                        Market expansion opportunity exists in ${lowestPenetrationRegion.name} with only 
                        ${((lowestPenetrationRegion.customers / data.totalCustomers) * 100).toFixed(1)}% market penetration.
                        Best practices from ${highestAOVRegion.name}, which has our highest average order value of 
                        $${(highestAOVRegion.revenue / highestAOVRegion.customers).toFixed(2)}, 
                        could be adapted across other regions to increase revenue per customer.
                      `;
                    }
                    return 'Regional data analysis indicates opportunities for targeted market expansion and customer value optimization.';
                  })()}
                </p>
                
                <h4>Recommendations</h4>
                <ol>
                  <li>
                    <strong>Regional Marketing Allocation:</strong> Adjust marketing budget to prioritize 
                    {(() => {
                      // Find region with lowest average order but high customer count
                      const targetRegions = (data.regions || [])
                        .filter((r: any) => r.customers > data.totalCustomers * 0.15)
                        .sort((a: any, b: any) => (a.revenue / a.customers) - (b.revenue / a.customers));
                      
                      if (targetRegions.length > 0) {
                        return ` ${targetRegions[0].name} where we have strong customer base but lower average order values`;
                      }
                      return ' regions with strong customer base but lower average order values';
                    })()}.
                  </li>
                  <li>
                    <strong>Customer Acquisition:</strong> Develop targeted acquisition campaigns for 
                    {(() => {
                      // Find regions with low customer penetration
                      const lowPenetrationRegions = (data.regions || [])
                        .filter((r: any) => (r.customers / data.totalCustomers) < 0.15)
                        .sort((a: any, b: any) => a.customers - b.customers)
                        .map((r: any) => r.name)
                        .slice(0, 2);
                      
                      if (lowPenetrationRegions.length > 0) {
                        return ` ${lowPenetrationRegions.join(' and ')} to expand market reach`;
                      }
                      return ' regions with low market penetration';
                    })()}.
                  </li>
                  <li>
                    <strong>Product Mix Optimization:</strong> Analyze product category performance within each region to identify regional preferences and adjust inventory accordingly.
                  </li>
                  <li>
                    <strong>Regional Pricing Strategy:</strong> Implement region-specific pricing strategies based on local economic factors and competitive landscape.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        );
        
      case 'metrics':
        return (
          <div ref={chartRefs.metrics} className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 p-4 rounded-lg shadow-lg border border-emerald-100 dark:border-emerald-900">
            <h3 className="text-xl font-semibold mb-4 text-emerald-800 dark:text-emerald-300">Monthly Performance Metrics</h3>
            <Line
              data={{
                labels: months,
                datasets: [
                  {
                    label: 'Customer Satisfaction',
                    data: satisfactionData,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                    pointHoverRadius: 6,
                  },
                  {
                    label: 'Growth Rate (%)',
                    data: data.monthly.map((m: any) => m.growthRate),
                    backgroundColor: 'rgba(245, 158, 11, 0.6)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(245, 158, 11, 1)',
                    pointHoverRadius: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      font: {
                        weight: 'bold'
                      }
                    }
                  },
                  title: {
                    display: true,
                    text: `Performance Metrics - ${year}`,
                    font: {
                      size: 16
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        const label = context.dataset.label || '';
                        const value = context.raw as number;
                        return label === 'Growth Rate (%)' 
                          ? `${label}: ${value.toFixed(1)}%` 
                          : `${label}: ${value.toFixed(1)}/10`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                animation: {
                  duration: 2000,
                  easing: 'easeOutQuart'
                }
              }}
            />
          </div>
        );
        
      case 'comparison':
        return (
          <div ref={chartRefs.comparison} className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 p-4 rounded-lg shadow-lg border border-rose-100 dark:border-rose-900">
            <h3 className="text-xl font-semibold mb-4 text-rose-800 dark:text-rose-300">Revenue vs Marketing Spend</h3>
            <Bar
              data={{
                labels: months,
                datasets: [
                  {
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(239, 68, 68, 0.9)',
                    yAxisID: 'y',
                  },
                  {
                    label: 'Marketing Spend',
                    data: marketingData,
                    backgroundColor: 'rgba(251, 191, 36, 0.7)',
                    borderColor: 'rgba(251, 191, 36, 1)',
                    borderWidth: 2,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(251, 191, 36, 0.9)',
                    yAxisID: 'y1',
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      font: {
                        weight: 'bold'
                      }
                    }
                  },
                  title: {
                    display: true,
                    text: `Revenue vs Marketing Spend - ${year}`,
                    font: {
                      size: 16
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Revenue'
                    },
                    ticks: {
                      callback: function(value) {
                        return '$' + value.toLocaleString();
                      }
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: true,
                      text: 'Marketing Spend'
                    },
                    ticks: {
                      callback: function(value) {
                        return '$' + value.toLocaleString();
                      }
                    },
                    grid: {
                      drawOnChartArea: false
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                animation: {
                  duration: 2000,
                  easing: 'easeOutQuart'
                }
              }}
            />
          </div>
        );
        
      case 'performance':
        return (
          <div ref={chartRefs.performance} className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/30 dark:to-sky-900/30 p-4 rounded-lg shadow-lg border border-cyan-100 dark:border-cyan-900">
            <h3 className="text-xl font-semibold mb-4 text-cyan-800 dark:text-cyan-300">Customer Support & Returns</h3>
            <Line
              data={{
                labels: months,
                datasets: [
                  {
                    label: 'Support Tickets',
                    data: supportTicketsData,
                    backgroundColor: 'rgba(14, 165, 233, 0.6)',
                    borderColor: 'rgba(14, 165, 233, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(14, 165, 233, 1)',
                    pointHoverRadius: 6,
                    yAxisID: 'y',
                  },
                  {
                    label: 'Returns',
                    data: returnsData,
                    backgroundColor: 'rgba(217, 70, 239, 0.6)',
                    borderColor: 'rgba(217, 70, 239, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(217, 70, 239, 1)',
                    pointHoverRadius: 6,
                    yAxisID: 'y1',
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      font: {
                        weight: 'bold'
                      }
                    }
                  },
                  title: {
                    display: true,
                    text: `Customer Support & Returns - ${year}`,
                    font: {
                      size: 16
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        return `${context.dataset.label}: ${context.raw.toLocaleString()}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Support Tickets'
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: true,
                      text: 'Returns'
                    },
                    grid: {
                      drawOnChartArea: false
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                animation: {
                  duration: 2000,
                  easing: 'easeOutQuart'
                }
              }}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  const renderPageContent = () => {
    if (!data) return null;
    
    switch (currentPage) {
      case 1:
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Executive Summary</h2>
                  <p className="mt-2 text-blue-100">Financial Year {year} • Data as of December 31, {year}</p>
                </div>
                <div className="mt-4 md:mt-0 bg-white/20 rounded-lg p-3 text-center">
                  <p className="text-sm">Overall Performance</p>
                  <div className="flex items-center justify-center mt-1">
                    <div className={`text-2xl font-bold flex items-center ${data.avgGrowthRate >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {data.avgGrowthRate >= 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                        </svg>
                      )}
                      {data.avgGrowthRate >= 0 ? '+' : ''}{data.avgGrowthRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl shadow-md border border-blue-100 dark:border-blue-900">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Total Revenue</p>
                    <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">${data.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                {data.avgGrowthRate && (
                  <div className={`mt-2 text-sm flex items-center ${data.avgGrowthRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {data.avgGrowthRate >= 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                    {data.avgGrowthRate >= 0 ? '+' : ''}{data.avgGrowthRate.toFixed(1)}% vs prev. year
                  </div>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/30 dark:to-fuchsia-900/30 p-6 rounded-xl shadow-md border border-purple-100 dark:border-purple-900">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Units Sold</p>
                    <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">{data.totalUnits.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  ~{Math.round(data.totalUnits / 12).toLocaleString()} units per month
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 p-6 rounded-xl shadow-md border border-rose-100 dark:border-rose-900">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-rose-700 dark:text-rose-300">Total Customers</p>
                    <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">{data.totalCustomers.toLocaleString()}</p>
                  </div>
                  <div className="bg-rose-100 dark:bg-rose-800 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-600 dark:text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {(data.totalCustomers / data.totalUnits).toFixed(2)} items per customer
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 p-6 rounded-xl shadow-md border border-amber-100 dark:border-amber-900">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Avg. Order Value</p>
                    <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">${data.avgOrderValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Based on {data.totalCustomers.toLocaleString()} transactions
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 p-6 rounded-xl shadow-md border border-emerald-100 dark:border-emerald-900">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Customer Satisfaction</p>
                    <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">{data.avgCustomerSatisfaction.toFixed(1)}/10</p>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-800 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                {data.avgCustomerSatisfaction >= 8 ? (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Excellent customer experience
                  </div>
                ) : data.avgCustomerSatisfaction >= 6 ? (
                  <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Room for improvement
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Needs immediate attention
                  </div>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/30 dark:to-sky-900/30 p-6 rounded-xl shadow-md border border-cyan-100 dark:border-cyan-900">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-cyan-700 dark:text-cyan-300">Marketing ROI</p>
                    <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                      {((data.avgMarketingROI || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-cyan-100 dark:bg-cyan-800 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600 dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  ${data.totalRevenue.toLocaleString()} / ${(data.totalRevenue / ((data.avgMarketingROI || 0) + 1)).toLocaleString()} spent
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 p-6 rounded-xl shadow-md border border-red-100 dark:border-red-900">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-red-700 dark:text-red-300">Return Rate</p>
                    <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                      {(data.monthly.reduce((sum: number, m: any) => sum + (m.returns || 0), 0) / data.totalUnits * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-800 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {data.monthly.reduce((sum: number, m: any) => sum + (m.returns || 0), 0).toLocaleString()} total returns
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 p-6 rounded-xl shadow-md border border-violet-100 dark:border-violet-900">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-violet-700 dark:text-violet-300">Top Category</p>
                    <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                      {data.topCategory?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-violet-100 dark:bg-violet-800 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-600 dark:text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  ${data.topCategory?.value.toLocaleString() || 0} in sales
                </div>
              </div>
            </div>
            
            {/* Revenue Chart */}
            <div className="mt-8">
              {renderChart('revenue')}
            </div>
            
            {/* Executive Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Executive Summary</h3>
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p>
                  This report presents a comprehensive analysis of our sales performance for the fiscal year {year}. 
                  Overall, the business has {data.avgGrowthRate >= 0 ? 'grown' : 'declined'} by {Math.abs(data.avgGrowthRate).toFixed(1)}% 
                  compared to the previous year, with total revenue reaching ${data.totalRevenue.toLocaleString()}.
                </p>
                
                <h4>Key Highlights</h4>
                <ul>
                  <li>Total sales volume of {data.totalUnits.toLocaleString()} units across all product categories</li>
                  <li>Average order value of ${data.avgOrderValue.toLocaleString()}, indicating {data.avgOrderValue > 150 ? 'strong premium positioning' : 'potential for upsell opportunities'}</li>
                  <li>Customer satisfaction rating of {data.avgCustomerSatisfaction.toFixed(1)}/10, {data.avgCustomerSatisfaction >= 8 ? 'reflecting excellent service quality' : 'highlighting areas for improvement'}</li>
                  <li>Marketing ROI of {((data.avgMarketingROI || 0) * 100).toFixed(1)}%, {(data.avgMarketingROI || 0) >= 2 ? 'demonstrating highly effective campaigns' : 'suggesting room for optimization'}</li>
                  <li>Return rate of {(data.monthly.reduce((sum: number, m: any) => sum + (m.returns || 0), 0) / data.totalUnits * 100).toFixed(1)}%, {(data.monthly.reduce((sum: number, m: any) => sum + (m.returns || 0), 0) / data.totalUnits) < 0.05 ? 'indicating high product quality' : 'requiring quality control review'}</li>
                </ul>
                
                <h4>Category Performance</h4>
                <p>
                  The {data.topCategory?.name || 'N/A'} category led our product portfolio with ${data.topCategory?.value.toLocaleString() || 0} in sales, 
                  representing {data.topCategory ? ((data.topCategory.value / data.totalRevenue) * 100).toFixed(1) : 0}% of total revenue. 
                  {data.categories && data.categories.length > 1 ? 
                    ` Our second best-performing category was ${data.categories.sort((a: any, b: any) => b.value - a.value)[1]?.name || 'N/A'} with $${data.categories.sort((a: any, b: any) => b.value - a.value)[1]?.value.toLocaleString() || 0} in sales.` : 
                    ''}
                </p>
                
                <h4>Regional Performance</h4>
                <p>
                  The {data.topRegion?.name || 'N/A'} region contributed the most to our revenue with ${data.topRegion?.revenue.toLocaleString() || 0}, 
                  accounting for {data.topRegion ? ((data.topRegion.revenue / data.totalRevenue) * 100).toFixed(1) : 0}% of total sales. 
                  This region also had {data.topRegion?.customers.toLocaleString() || 0} customers with an average order value of 
                  ${data.topRegion ? (data.topRegion.revenue / data.topRegion.customers).toFixed(2) : 0}.
                </p>
                
                <h4>Quarterly Performance</h4>
                <p>
                  {data.quarterly && data.quarterly.length >= 4 ? 
                    `Q${data.quarterly.sort((a: any, b: any) => b.revenue - a.revenue)[0].quarter} was our strongest quarter with $${data.quarterly.sort((a: any, b: any) => b.revenue - a.revenue)[0].revenue.toLocaleString()} in revenue, 
                    while Q${data.quarterly.sort((a: any, b: any) => a.revenue - b.revenue)[0].quarter} was the weakest with $${data.quarterly.sort((a: any, b: any) => a.revenue - b.revenue)[0].revenue.toLocaleString()} in revenue.` : 
                    'Quarterly performance data is not available for detailed analysis.'}
                </p>
                
                <h4>Outlook for ${Number(year) + 1}</h4>
                <p>
                  Based on the current growth trajectory of {data.avgGrowthRate.toFixed(1)}% and market conditions, 
                  we project a {data.avgGrowthRate > 0 ? 'continued upward trend' : 'recovery and stabilization'} in 
                  {Number(year) + 1}. Strategic focus will be placed on {data.avgCustomerSatisfaction < 8 ? 'improving customer satisfaction' : 'expanding market share'} 
                  and {data.avgMarketingROI && data.avgMarketingROI < 2 ? 'optimizing marketing spend' : 'scaling successful marketing campaigns'}.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Quarterly Performance</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quarter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Units</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Avg. Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Growth</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.quarterly.map((quarter: any) => (
                      <tr key={quarter.quarter}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Q{quarter.quarter}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">${quarter.revenue.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{quarter.units.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{quarter.customers.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">${quarter.avgOrderValue.toLocaleString()}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${quarter.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {quarter.growthRate >= 0 ? '+' : ''}{quarter.growthRate.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{quarter.customerSatisfaction.toFixed(1)}/10</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {renderChart('units')}
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            {renderChart('categories')}
            {renderChart('regions')}
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            {renderChart('metrics')}
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Insights &amp; Recommendations</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The {data.topCategory?.name} category was the best performing with ${data.topCategory?.value.toLocaleString()} in sales.</li>
                    <li>The {data.topRegion?.name} region led with ${data.topRegion?.revenue.toLocaleString()} in revenue and {data.topRegion?.customers.toLocaleString()} customers.</li>
                    <li>Customer satisfaction averaged {data.avgCustomerSatisfaction.toFixed(1)}/10 for the year.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Focus marketing efforts on the {data.topCategory?.name} category to build on existing success.</li>
                    <li>Develop targeted campaigns for regions with lower performance to improve market penetration.</li>
                    <li>Analyze customer feedback to improve satisfaction levels and drive repeat business.</li>
                    <li>Implement customer retention strategies to capitalize on the growing customer base.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 rounded-xl shadow-lg text-white">
              <h2 className="text-3xl font-bold">Regional Analysis</h2>
              <p className="mt-2 text-indigo-100">Geographical performance breakdown for {year}</p>
            </div>
            
            {/* Regional Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {data.regions?.map((region: any, index: number) => {
                const colors = [
                  { bg: "from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30", border: "border-blue-100 dark:border-blue-900", accent: "bg-blue-100 dark:bg-blue-800", text: "text-blue-700 dark:text-blue-300" },
                  { bg: "from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30", border: "border-emerald-100 dark:border-emerald-900", accent: "bg-emerald-100 dark:bg-emerald-800", text: "text-emerald-700 dark:text-emerald-300" },
                  { bg: "from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30", border: "border-amber-100 dark:border-amber-900", accent: "bg-amber-100 dark:bg-amber-800", text: "text-amber-700 dark:text-amber-300" },
                  { bg: "from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30", border: "border-rose-100 dark:border-rose-900", accent: "bg-rose-100 dark:bg-rose-800", text: "text-rose-700 dark:text-rose-300" },
                ];
                const color = colors[index % colors.length];
                
                // Calculate metrics
                const revenuePercent = ((region.revenue / data.totalRevenue) * 100).toFixed(1);
                const customersPercent = ((region.customers / data.totalCustomers) * 100).toFixed(1);
                const avgOrderValue = (region.revenue / region.customers).toFixed(2);
                const unitsPerCustomer = (region.units / region.customers).toFixed(2);
                
                return (
                  <div key={region.name} className={`bg-gradient-to-br ${color.bg} p-6 rounded-xl shadow-md border ${color.border}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-semibold ${color.text}`}>{region.name}</p>
                        <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">${region.revenue.toLocaleString()}</p>
                      </div>
                      <div className={`${color.accent} p-2 rounded-lg`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${color.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="block font-medium">Revenue Share</span>
                        <span className="block">{revenuePercent}%</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="block font-medium">Customers</span>
                        <span className="block">{region.customers.toLocaleString()} ({customersPercent}%)</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="block font-medium">Avg. Order</span>
                        <span className="block">${avgOrderValue}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="block font-medium">Units/Customer</span>
                        <span className="block">{unitsPerCustomer}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Revenue by Region Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Revenue by Region</h3>
              <div className="h-80">
                {renderChart('regionRevenue')}
              </div>
            </div>
            
            {/* Regional Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Market Penetration</h3>
                <div className="space-y-4">
                  {data.regions?.sort((a: any, b: any) => b.customers - a.customers).map((region: any, index: number) => {
                    const penetrationRate = ((region.customers / data.totalCustomers) * 100).toFixed(1);
                    const colors = [
                      "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
                      "bg-purple-500", "bg-cyan-500", "bg-lime-500", "bg-orange-500"
                    ];
                    return (
                      <div key={region.name} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{region.name}</span>
                          <span className="text-gray-600 dark:text-gray-300">{penetrationRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className={`${colors[index % colors.length]} h-2.5 rounded-full`} 
                            style={{width: `${penetrationRate}%`}}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Average Order Value</h3>
                <div className="space-y-4">
                  {data.regions?.sort((a: any, b: any) => (b.revenue / b.customers) - (a.revenue / a.customers)).map((region: any, index: number) => {
                    const avgOrderValue = (region.revenue / region.customers).toFixed(2);
                    const maxAvgOrder = Math.max(...data.regions.map((r: any) => r.revenue / r.customers));
                    const percentOfMax = ((region.revenue / region.customers) / maxAvgOrder * 100).toFixed(1);
                    const colors = [
                      "bg-violet-500", "bg-pink-500", "bg-indigo-500", "bg-sky-500",
                      "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-teal-500"
                    ];
                    return (
                      <div key={region.name} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{region.name}</span>
                          <span className="text-gray-600 dark:text-gray-300">${avgOrderValue}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className={`${colors[index % colors.length]} h-2.5 rounded-full`} 
                            style={{width: `${percentOfMax}%`}}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Regional Insights */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Regional Insights</h3>
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p>
                  In {year}, our sales were distributed across {data.regions?.length || 0} regions, with 
                  {data.topRegion?.name ? ` ${data.topRegion.name} ` : ' one region '} 
                  leading in revenue generation at ${data.topRegion?.revenue.toLocaleString() || 0}.
                </p>
                
                <h4>Key Regional Observations</h4>
                <ul>
                  {data.regions?.sort((a: any, b: any) => b.revenue - a.revenue).map((region: any) => {
                    const revenuePercent = ((region.revenue / data.totalRevenue) * 100).toFixed(1);
                    const customersPercent = ((region.customers / data.totalCustomers) * 100).toFixed(1);
                    const avgOrderValue = (region.revenue / region.customers).toFixed(2);
                    
                    let insight = '';
                    const numericAvgOrderValue = parseFloat(avgOrderValue);
                    if (numericAvgOrderValue > data.avgOrderValue * 1.2) {
                      insight = 'showing excellent premium positioning';
                    } else if (numericAvgOrderValue < data.avgOrderValue * 0.8) {
                      insight = 'indicating potential for upsell strategies';
                    } else if (region.customers > data.totalCustomers * 0.3) {
                      insight = 'demonstrating strong market penetration';
                    } else if (region.customers < data.totalCustomers * 0.1) {
                      insight = 'highlighting opportunity for customer acquisition';
                    } else {
                      insight = 'performing within expected parameters';
                    }
                    
                    return (
                      <li key={region.name}>
                        <strong>{region.name}</strong>: Contributed {revenuePercent}% of total revenue with {region.customers.toLocaleString()} customers ({customersPercent}% of total), 
                        average order value of ${avgOrderValue}, {insight}.
                      </li>
                    );
                  })}
                </ul>
                
                <h4>Regional Opportunities</h4>
                <p>
                  {(() => {
                    // Identify region with lowest market penetration
                    const lowestPenetrationRegion = [...(data.regions || [])].sort((a, b) => 
                      (a.customers / data.totalCustomers) - (b.customers / data.totalCustomers)
                    )[0];
                    
                    // Identify region with highest average order value
                    const highestAOVRegion = [...(data.regions || [])].sort((a, b) => 
                      (b.revenue / b.customers) - (a.revenue / a.customers)
                    )[0];
                    
                    if (lowestPenetrationRegion && highestAOVRegion) {
                      return `
                        Market expansion opportunity exists in ${lowestPenetrationRegion.name} with only 
                        ${((lowestPenetrationRegion.customers / data.totalCustomers) * 100).toFixed(1)}% market penetration.
                        Best practices from ${highestAOVRegion.name}, which has our highest average order value of 
                        $${(highestAOVRegion.revenue / highestAOVRegion.customers).toFixed(2)}, 
                        could be adapted across other regions to increase revenue per customer.
                      `;
                    }
                    return 'Regional data analysis indicates opportunities for targeted market expansion and customer value optimization.';
                  })()}
                </p>
                
                <h4>Recommendations</h4>
                <ol>
                  <li>
                    <strong>Regional Marketing Allocation:</strong> Adjust marketing budget to prioritize 
                    {(() => {
                      // Find region with lowest average order but high customer count
                      const targetRegions = (data.regions || [])
                        .filter((r: any) => r.customers > data.totalCustomers * 0.15)
                        .sort((a: any, b: any) => (a.revenue / a.customers) - (b.revenue / a.customers));
                      
                      if (targetRegions.length > 0) {
                        return ` ${targetRegions[0].name} where we have strong customer base but lower average order values`;
                      }
                      return ' regions with strong customer base but lower average order values';
                    })()}.
                  </li>
                  <li>
                    <strong>Customer Acquisition:</strong> Develop targeted acquisition campaigns for 
                    {(() => {
                      // Find regions with low customer penetration
                      const lowPenetrationRegions = (data.regions || [])
                        .filter((r: any) => (r.customers / data.totalCustomers) < 0.15)
                        .sort((a: any, b: any) => a.customers - b.customers)
                        .map((r: any) => r.name)
                        .slice(0, 2);
                      
                      if (lowPenetrationRegions.length > 0) {
                        return ` ${lowPenetrationRegions.join(' and ')} to expand market reach`;
                      }
                      return ' regions with low market penetration';
                    })()}.
                  </li>
                  <li>
                    <strong>Product Mix Optimization:</strong> Analyze product category performance within each region to identify regional preferences and adjust inventory accordingly.
                  </li>
                  <li>
                    <strong>Regional Pricing Strategy:</strong> Implement region-specific pricing strategies based on local economic factors and competitive landscape.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-6">
            {renderChart('metrics')}
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Insights &amp; Recommendations</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The {data.topCategory?.name} category was the best performing with ${data.topCategory?.value.toLocaleString()} in sales.</li>
                    <li>The {data.topRegion?.name} region led with ${data.topRegion?.revenue.toLocaleString()} in revenue and {data.topRegion?.customers.toLocaleString()} customers.</li>
                    <li>Customer satisfaction averaged {data.avgCustomerSatisfaction.toFixed(1)}/10 for the year.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Focus marketing efforts on the {data.topCategory?.name} category to build on existing success.</li>
                    <li>Develop targeted campaigns for regions with lower performance to improve market penetration.</li>
                    <li>Analyze customer feedback to improve satisfaction levels and drive repeat business.</li>
                    <li>Implement customer retention strategies to capitalize on the growing customer base.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center py-10">
            <p>Invalid page selected.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00E5BE]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Notice:</strong>
        <span className="block sm:inline"> No data available for the selected year.</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 p-6 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" ref={reportRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">{year} Sales Report</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">Comprehensive analysis of sales performance from January to December {year}</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={generatePdf}
            disabled={generatingPDF}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow ${
              generatingPDF
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white'
            }`}
          >
            {generatingPDF ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></span>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Download Full PDF Report</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className="flex mb-8 overflow-x-auto scrollbar-hide pb-2">
        <div className="flex space-x-2 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-inner">
          {[1, 2, 3, 4, 5, 6].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 text-sm md:text-base rounded-lg whitespace-nowrap transition-all ${
                currentPage === page
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md'
                  : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {page === 1 && 'Executive Summary'}
              {page === 2 && 'Sales Performance'}
              {page === 3 && 'Customer Analysis'}
              {page === 4 && 'Product Categories'}
              {page === 5 && 'Regional Analysis'}
              {page === 6 && 'Insights & Recommendations'}
            </button>
          ))}
        </div>
      </div>

      {renderPageContent()}
    </div>
  );
};

export default SalesReport; 