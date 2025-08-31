
import * as XLSX from 'xlsx';

/**
 * Parses a CSV string into an array of records.
 * @param data The string content of the file.
 * @returns An array of objects representing the rows.
 */
export function parseCsv(data: string): Record<string, any>[] {
  const lines = data.trim().split('\n');
  if (lines.length < 2) return [];

  const delimiter = ',';
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const rows = lines.slice(1);

  return rows.map(rowStr => {
    const values = rowStr.split(delimiter).map(v => v.trim());
    const record: Record<string, any> = {};
    headers.forEach((header, i) => {
      record[header] = values[i];
    });
    return record;
  });
}

/**
 * Transforms a column-oriented JSON object into an array of records.
 * e.g., { "col1": { "0": "a", "1": "b" }, "col2": { "0": "c", "1": "d" } }
 * becomes: [{ "col1": "a", "col2": "c" }, { "col1": "b", "col2": "d" }]
 */
function transformColumnOrientedJson(data: Record<string, Record<string, any>>): Record<string, any>[] {
    const records: Record<string, any>[] = [];
    const columns = Object.keys(data);
    if (columns.length === 0) return [];
  
    // Determine the number of rows from the first column
    const numRows = Object.keys(data[columns[0]]).length;
  
    for (let i = 0; i < numRows; i++) {
      const record: Record<string, any> = {};
      const rowIndexStr = String(i);
      columns.forEach(col => {
        record[col] = data[col][rowIndexStr];
      });
      records.push(record);
    }
    return records;
}

/**
 * Checks if the data is in column-oriented format.
 */
function isColumnOriented(data: any): data is Record<string, Record<string, any>> {
    if (typeof data !== 'object' || Array.isArray(data) || data === null) {
        return false;
    }
    const keys = Object.keys(data);
    if (keys.length === 0) return false;
    // Check if all values in the main object are themselves objects
    return keys.every(key => typeof data[key] === 'object' && !Array.isArray(data[key]) && data[key] !== null);
}

/**
 * Parses a JSON string into an array of records, handling various structures.
 * @param jsonData The string content of the JSON file.
 * @returns An array of objects.
 */
export function parseJson(jsonData: string): Record<string, any>[] {
  try {
    let data = JSON.parse(jsonData);

    // Case 1: The JSON is an object containing the array of records (e.g., { "data": [...] })
    if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
        const key = Object.keys(data).find(k => Array.isArray(data[k]));
        if (key) {
            data = data[key];
        } else if (isColumnOriented(data)) {
            // Case 4: Handle column-oriented format if no primary array key is found
            return transformColumnOrientedJson(data);
        } else {
             throw new Error('JSON object does not contain a processable array.');
        }
    }

    if (!Array.isArray(data)) {
        throw new Error('Could not find an array of records in the JSON data.');
    }
    
    if (data.length === 0) return [];

    // Case 2: Array of objects (standard format)
    if (typeof data[0] === 'object' && data[0] !== null) {
      return data;
    }

    // Case 3: Array of arrays (e.g., [["h1", "h2"], ["v1", "v2"]])
    if (Array.isArray(data[0])) {
      const headers = data[0].map(String);
      const rows = data.slice(1);
      return rows.map(rowArray => {
        const record: Record<string, any> = {};
        headers.forEach((header, i) => {
          record[header] = rowArray[i];
        });
        return record;
      });
    }

    throw new Error('Unsupported JSON structure.');
  } catch (error) {
    console.error("JSON parsing error:", error);
    throw error;
  }
}


/**
 * Parses an Excel file buffer into an array of records.
 * @param excelData The buffer of the Excel file.
 * @returns An array of objects.
 */
export function parseExcel(excelData: Buffer): Record<string, any>[] {
  const workbook = XLSX.read(excelData, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}


// --- Client-side preview parsers ---

/**
 * Parses a CSV string to a format suitable for the preview table.
 */
export function parseCsvToTable(csvData: string, rowLimit: number): { headers: string[], rows: string[][] } {
    const lines = csvData.trim().split('\n');
    const delimiter = ',';
    const headers = lines[0].split(delimiter).map(h => h.trim());
    const rows = lines.slice(1, rowLimit + 1).map(line => line.split(delimiter).map(cell => cell.trim()));
    return { headers, rows };
}

/**
 * Parses a JSON string to a format suitable for the preview table, handling multiple structures.
 */
export function parseJsonToTable(jsonData: string, rowLimit: number): { headers: string[], rows: string[][] } | null {
    try {
        let data = JSON.parse(jsonData);

        // Case 1: Object with a data key
        if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
            const key = Object.keys(data).find(k => Array.isArray(data[k]));
            if (key) {
                data = data[key];
            } else if (isColumnOriented(data)) {
                 const records = transformColumnOrientedJson(data);
                 const headers = Object.keys(records[0] || {});
                 const rows = records.slice(0, rowLimit).map(record => headers.map(header => String(record[header] ?? '')));
                 return { headers, rows };
            } else {
                 return null;
            }
        }
        
        if (!Array.isArray(data) || data.length === 0) return null;

        const limitedData = data.slice(0, rowLimit);
        
        // Case 2: Array of Objects
        if (typeof limitedData[0] === 'object' && limitedData[0] !== null) {
            const headers = Object.keys(limitedData[0]);
            const rows = limitedData.map(record => headers.map(header => {
                 const value = record[header];
                 if (typeof value === 'object' && value !== null) return JSON.stringify(value);
                 return String(value);
            }));
            return { headers, rows };
        }

        // Case 3: Array of Arrays
        if (Array.isArray(limitedData[0])) {
            const headers = data[0].map(String);
            const rows = data.slice(1, rowLimit + 1).map(row => row.map(String));
            return { headers, rows };
        }

        return null;
    } catch {
        return null;
    }
}


/**
 * Parses an Excel file ArrayBuffer to a format suitable for the preview table.
 */
export async function parseExcelToTable(excelData: ArrayBuffer, rowLimit: number): Promise<{ headers: string[], rows: string[][] }> {
    const workbook = XLSX.read(excelData, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });
    
    const headers = (json[0] || []).map(String);
    const rows = json.slice(1, rowLimit + 1).map(rowArray => rowArray.map(String));

    return { headers, rows };
}
