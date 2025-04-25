// Remove the import
// import { generateDummyData as generateSalesData } from './debug-csv';

interface MonthlyData {
  month: number;
  revenue: number;
  units: number;
  customers: number;
  avgOrderValue: number;
  growthRate: number;
  marketingSpend: number;
  customerSatisfaction: number;
  supportTickets?: number;
  returns?: number;
}

interface QuarterlyData {
  quarter: number;
  revenue: number;
  units: number;
  customers: number;
  avgOrderValue: number;
  growthRate: number;
  marketingSpend: number;
  customerSatisfaction: number;
  supportTickets: number;
  returns: number;
}

interface CategoryData {
  name: string;
  value: number;
  color?: string;
}

interface RegionData {
  name: string;
  revenue: number;
  customers: number;
  units?: number;
}

interface SalesData {
  monthly: MonthlyData[];
  quarterly: QuarterlyData[];
  categories: CategoryData[];
  regions: RegionData[];
  totalRevenue: number;
  totalUnits: number;
  totalCustomers: number;
  avgOrderValue: number;
  avgGrowthRate: number;
  avgMarketingROI: number;
  avgCustomerSatisfaction: number;
  topCategory?: CategoryData;
  topRegion?: RegionData;
}

// Categories with defined colors
const categoryColors = {
  'Electronics': '#00E5BE',
  'Home_Goods': '#FFD166',
  'Apparel': '#FF6B6B',
  'Home Goods': '#FFD166',
  'Clothing': '#FF6B6B'
};

// Region names mapping
const regionNames = {
  'NorthAmerica': 'North America',
  'Europe': 'Europe',
  'Asia': 'Asia'
};

/**
 * Parse CSV data and convert it to the SalesData format
 * @param csvData CSV data as a string
 * @param year The year to filter data for
 * @returns SalesData object with formatted data
 */
export const parseCSVData = (csvData: string, year: number): SalesData => {
  // Parse CSV into array of objects
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  const rows = lines.slice(1).filter(line => line.trim() !== '').map(line => {
    const values = line.split(',');
    const row: Record<string, string | number> = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      // Convert numeric values to numbers
      row[header] = isNaN(Number(value)) ? value : Number(value);
    });
    
    return row;
  });
  
  // Filter rows for the selected year
  const yearRows = rows.filter(row => row.Year === year);
  
  if (yearRows.length === 0) {
    console.warn(`No data found for year ${year} in CSV, using generated data`);
    return generateSalesData(year);
  }
  
  // Generate monthly data
  const monthly = yearRows.map(row => ({
    month: Number(row.Month),
    revenue: Number(row.Revenue),
    units: Number(row.Units_Sold),
    customers: Number(row.Customers),
    avgOrderValue: Number(row.Avg_Order_Value),
    growthRate: Number(row.Growth_Rate),
    marketingSpend: Number(row.Marketing_Spend),
    customerSatisfaction: Number(row.Customer_Satisfaction),
    supportTickets: Number(row.Support_Tickets) || 0,
    returns: Number(row.Returns) || 0
  }));
  
  // Group by quarter and generate quarterly data
  const quarterMap: Record<string, QuarterlyData> = {};
  
  monthly.forEach(month => {
    const quarter = Math.ceil(month.month / 3);
    const quarterKey = `Q${quarter}`;
    
    if (!quarterMap[quarterKey]) {
      quarterMap[quarterKey] = {
        quarter,
        revenue: 0,
        units: 0, 
        customers: 0,
        avgOrderValue: 0,
        growthRate: 0,
        marketingSpend: 0,
        customerSatisfaction: 0,
        supportTickets: 0,
        returns: 0
      };
    }
    
    // Aggregate data
    quarterMap[quarterKey].revenue += month.revenue;
    quarterMap[quarterKey].units += month.units;
    quarterMap[quarterKey].customers += month.customers;
    quarterMap[quarterKey].marketingSpend += month.marketingSpend;
    quarterMap[quarterKey].supportTickets += month.supportTickets || 0;
    quarterMap[quarterKey].returns += month.returns || 0;
    
    // For rates and satisfaction, we'll average them later
    quarterMap[quarterKey].growthRate += month.growthRate;
    quarterMap[quarterKey].customerSatisfaction += month.customerSatisfaction;
  });
  
  // Calculate averages for rates
  Object.keys(quarterMap).forEach(key => {
    const monthsInQuarter = monthly.filter(m => Math.ceil(m.month / 3) === quarterMap[key].quarter).length;
    quarterMap[key].growthRate /= monthsInQuarter;
    quarterMap[key].customerSatisfaction /= monthsInQuarter;
    quarterMap[key].avgOrderValue = quarterMap[key].revenue / quarterMap[key].customers;
  });
  
  const quarterly = Object.values(quarterMap);
  
  // Organize category data if available
  const categories: { name: string; value: number }[] = [];
  const categoryFields = ['Electronics', 'Apparel', 'Home_Goods', 'Other'];
  
  categoryFields.forEach(field => {
    if (yearRows[0][field] !== undefined) {
      const totalValue = yearRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
      categories.push({
        name: field.replace('_', ' '),
        value: totalValue
      });
    }
  });
  
  // Organize regional data if available
  const regions: RegionData[] = [];
  const regionFields = ['NorthAmerica', 'Europe', 'Asia', 'Other'];
  
  regionFields.forEach(field => {
    if (yearRows[0][`${field}_Revenue`] !== undefined) {
      const revenue = yearRows.reduce((sum, row) => sum + Number(row[`${field}_Revenue`] || 0), 0);
      const customers = yearRows.reduce((sum, row) => sum + Number(row[`${field}_Customers`] || 0), 0);
      const units = yearRows.reduce((sum, row) => sum + Number(row[`${field}_Units`] || 0), 0);
      
      regions.push({
        name: regionNames[field as keyof typeof regionNames] || field,
        revenue,
        customers,
        units
      });
    }
  });
  
  // Return organized data
  return {
    monthly,
    quarterly,
    categories,
    regions,
    totalRevenue: 0, // Will be calculated later
    totalUnits: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    avgGrowthRate: 0,
    avgMarketingROI: 0,
    avgCustomerSatisfaction: 0
  };
};

// Function to fetch and parse the CSV file
export const fetchCSVData = async (year: number): Promise<SalesData> => {
  try {
    console.log(`Attempting to fetch CSV data for year ${year}`);
    const response = await fetch('/csv.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV data: ${response.status} ${response.statusText}`);
    }
    
    const csvData = await response.text();
    console.log(`CSV data fetched successfully, length: ${csvData.length} bytes`);
    
    if (!csvData || csvData.length === 0) {
      throw new Error('Empty CSV data received');
    }
    
    try {
      // Try to parse a small sample first to validate format
      console.log('CSV sample (first 100 chars):', csvData.substring(0, 100));
      
      // Parse all data first without filtering to check if the requested year exists
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      const rows = lines.slice(1).filter(line => line.trim() !== '').map(line => {
        const values = line.split(',');
        const row: Record<string, string | number> = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          // Convert numeric values to numbers
          row[header] = isNaN(Number(value)) ? value : Number(value);
        });
        
        return row;
      });
      
      // Check if we have any data for the requested year
      const yearRows = rows.filter(row => row.Year === year);
      
      if (yearRows.length === 0) {
        console.warn(`No data found for year ${year}, using generated data instead`);
        // For years without data, return generated data
        return generateSalesData(year);
      }
      
      const parsedData = parseCSVData(csvData, year);
      
      // Validate the minimum data we need
      if (!parsedData.monthly || parsedData.monthly.length === 0) {
        console.error('No monthly data found after parsing');
        return generateSalesData(year);
      }
      
      console.log(`Successfully parsed ${parsedData.monthly.length} monthly records for year ${year}`);
      
      // Calculate derived metrics
      parsedData.totalRevenue = parsedData.monthly.reduce((sum, month) => sum + month.revenue, 0);
      parsedData.totalUnits = parsedData.monthly.reduce((sum, month) => sum + month.units, 0);
      parsedData.totalCustomers = parsedData.monthly.reduce((sum, month) => sum + month.customers, 0);
      parsedData.avgOrderValue = parsedData.totalRevenue / parsedData.totalCustomers;
      
      const totalMarketingSpend = parsedData.monthly.reduce((sum, month) => sum + month.marketingSpend, 0);
      parsedData.avgMarketingROI = (parsedData.totalRevenue - totalMarketingSpend) / totalMarketingSpend;
      
      parsedData.avgGrowthRate = parsedData.monthly.reduce((sum, month) => sum + month.growthRate, 0) / parsedData.monthly.length;
      parsedData.avgCustomerSatisfaction = parsedData.monthly.reduce((sum, month) => sum + month.customerSatisfaction, 0) / parsedData.monthly.length;
      
      // Find highest revenue category
      if (parsedData.categories && parsedData.categories.length > 0) {
        parsedData.topCategory = [...parsedData.categories].sort((a, b) => b.value - a.value)[0];
      }
      
      // Find highest revenue region
      if (parsedData.regions && parsedData.regions.length > 0) {
        parsedData.topRegion = [...parsedData.regions].sort((a, b) => b.revenue - a.revenue)[0];
      }
      
      return parsedData;
    } catch (error) {
      console.error('Error parsing CSV data:', error);
      // Fall back to generated data on error
      return generateSalesData(year);
    }
  } catch (error) {
    console.error('Error in fetchCSVData:', error);
    // Fall back to generated data on error
    return generateSalesData(year);
  }
};

// Dummy data generator similar to the one in sales-data.tsx
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
    { name: 'Electronics', value: randomValue(baseRevenue * 0.1, baseRevenue * 0.4), color: '#00E5BE' },
    { name: 'Clothing', value: randomValue(baseRevenue * 0.1, baseRevenue * 0.4), color: '#FF6B6B' },
    { name: 'Home Goods', value: randomValue(baseRevenue * 0.1, baseRevenue * 0.4), color: '#FFD166' },
    { name: 'Books', value: randomValue(baseRevenue * 0.1, baseRevenue * 0.4), color: '#06D6A0' },
    { name: 'Food', value: randomValue(baseRevenue * 0.1, baseRevenue * 0.4), color: '#118AB2' }
  ];

  // Generate monthly data
  const monthly = months.map(month => {
    // Add seasonal variations
    const seasonFactor = month >= 11 ? 1.4 : // Holiday season boost
                       month >= 6 && month <= 8 ? 1.2 : // Summer boost
                       1.0; // Base level
    const revenue = revenueGen() * seasonFactor;
    const units = unitsGen() * seasonFactor;
    const customers = customersGen() * seasonFactor;
    
    return {
      month,
      revenue,
      units,
      customers,
      avgOrderValue: revenue / customers,
      growthRate: randomValue(-5, 15) / 100,
      marketingSpend: revenue * randomValue(10, 20) / 100,
      customerSatisfaction: randomValue(70, 95) / 10,
      supportTickets: randomValue(10, 50),
      returns: randomValue(5, 20)
    };
  });

  // Generate quarterly data
  const quarterly = quarters.map(quarter => {
    // Quarterly variations
    const quarterFactor = quarter === 4 ? 1.3 : // Q4 holiday boost
                         quarter === 3 ? 1.15 : // Q3 back-to-school
                         1.0; // Base level
    
    const monthsInQuarter = monthly.filter(m => Math.ceil(m.month / 3) === quarter);
    const quarterRevenue = monthsInQuarter.reduce((sum, m) => sum + m.revenue, 0);
    const quarterUnits = monthsInQuarter.reduce((sum, m) => sum + m.units, 0);
    const quarterCustomers = monthsInQuarter.reduce((sum, m) => sum + m.customers, 0);
    const quarterMarketingSpend = monthsInQuarter.reduce((sum, m) => sum + m.marketingSpend, 0);
    const quarterSupportTickets = monthsInQuarter.reduce((sum, m) => sum + m.supportTickets, 0);
    const quarterReturns = monthsInQuarter.reduce((sum, m) => sum + m.returns, 0);
    const quarterGrowthRate = monthsInQuarter.reduce((sum, m) => sum + m.growthRate, 0) / monthsInQuarter.length;
    const quarterCustomerSatisfaction = monthsInQuarter.reduce((sum, m) => sum + m.customerSatisfaction, 0) / monthsInQuarter.length;
    
    return {
      quarter,
      revenue: quarterRevenue,
      units: quarterUnits,
      customers: quarterCustomers,
      avgOrderValue: quarterRevenue / quarterCustomers,
      growthRate: quarterGrowthRate,
      marketingSpend: quarterMarketingSpend,
      customerSatisfaction: quarterCustomerSatisfaction,
      supportTickets: quarterSupportTickets,
      returns: quarterReturns
    };
  });

  // Generate regions
  const regions = [
    { name: 'North America', revenue: 0, customers: 0, units: 0 },
    { name: 'Europe', revenue: 0, customers: 0, units: 0 },
    { name: 'Asia', revenue: 0, customers: 0, units: 0 },
    { name: 'Other', revenue: 0, customers: 0, units: 0 }
  ];
  
  // Distribute monthly data across regions
  monthly.forEach(month => {
    regions.forEach(region => {
      // Random distribution of revenue across regions
      const share = randomValue(15, 35) / 100;
      region.revenue += month.revenue * share;
      region.customers += month.customers * share;
      region.units += month.units * share;
    });
  });

  // Calculate totals
  const totalRevenue = monthly.reduce((sum, month) => sum + month.revenue, 0);
  const totalUnits = monthly.reduce((sum, month) => sum + month.units, 0);
  const totalCustomers = monthly.reduce((sum, month) => sum + month.customers, 0);
  const avgOrderValue = totalRevenue / totalCustomers;
  const totalMarketingSpend = monthly.reduce((sum, month) => sum + month.marketingSpend, 0);
  const avgMarketingROI = (totalRevenue - totalMarketingSpend) / totalMarketingSpend;
  const avgGrowthRate = monthly.reduce((sum, month) => sum + month.growthRate, 0) / monthly.length;
  const avgCustomerSatisfaction = monthly.reduce((sum, month) => sum + month.customerSatisfaction, 0) / monthly.length;
  
  // Find top category and region
  const topCategory = [...categories].sort((a, b) => b.value - a.value)[0];
  const topRegion = [...regions].sort((a, b) => b.revenue - a.revenue)[0];

  return {
    monthly,
    quarterly,
    categories,
    regions,
    totalRevenue,
    totalUnits,
    totalCustomers,
    avgOrderValue,
    avgGrowthRate,
    avgMarketingROI,
    avgCustomerSatisfaction,
    topCategory,
    topRegion
  };
}; 