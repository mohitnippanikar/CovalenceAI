/**
 * Debug utility to validate CSV file format
 * This can be called from the browser console by importing it and running validateCSV()
 */

export const validateCSV = async () => {
  try {
    console.log('Attempting to validate CSV file...');
    const response = await fetch('/csv.csv');
    
    if (!response.ok) {
      console.error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const csvText = await response.text();
    console.log(`CSV file loaded, size: ${csvText.length} bytes`);
    
    if (csvText.length === 0) {
      console.error('CSV file is empty');
      return false;
    }
    
    // Check if it has valid headers
    const lines = csvText.split('\n');
    console.log(`CSV has ${lines.length} lines`);
    
    if (lines.length < 2) {
      console.error('CSV file must have at least a header row and one data row');
      return false;
    }
    
    const headers = lines[0].split(',');
    console.log('CSV headers:', headers);
    
    // Check for required columns
    const requiredColumns = ['Year', 'Month', 'Quarter', 'Revenue', 'Units_Sold', 'Customers', 'Avg_Order_Value'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      console.error('Missing required columns:', missingColumns);
      return false;
    }
    
    // Check data rows
    const dataRows = lines.slice(1).filter(line => line.trim() !== '');
    console.log(`CSV has ${dataRows.length} data rows`);
    
    // Check for year 2023 data
    const year2023Data = dataRows.filter(row => row.split(',')[headers.indexOf('Year')] === '2023');
    console.log(`Found ${year2023Data.length} rows for year 2023`);
    
    if (year2023Data.length === 0) {
      console.error('No data found for year 2023');
    }
    
    return true;
  } catch (error) {
    console.error('Error validating CSV:', error);
    return false;
  }
};

// Export a function to check the CSV and create dummy data if needed
export const ensureValidData = async () => {
  const isValid = await validateCSV();
  
  if (!isValid) {
    console.warn('CSV validation failed, will fall back to generated data');
    return false;
  }
  
  return true;
};

// Make it accessible in the global scope for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).validateCSV = validateCSV;
  (window as any).ensureValidData = ensureValidData;
} 