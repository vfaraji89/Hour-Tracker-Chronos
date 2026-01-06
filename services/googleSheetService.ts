
import { WorkRecord, ReceiptRecord } from '../types';

// Enhanced Apps Script with CORS support and batch operations
export const GOOGLE_SCRIPT_CODE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = data.syncType || 'work';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = type === 'receipt' ? 'Receipts' : (type === 'test' ? 'SystemLogs' : 'WorkRecords');
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    
    // Initialize headers
    if (sheet.getLastRow() === 0) {
      if (type === 'receipt') {
        sheet.appendRow(["Timestamp", "ID", "Date", "Vendor", "Amount", "Category", "Tax Deductible", "Notes"]);
      } else if (type === 'test') {
        sheet.appendRow(["Test Timestamp", "Status", "Client"]);
      } else {
        sheet.appendRow(["Timestamp", "ID", "Date", "Start", "End", "Duration (min)", "Category", "Notes", "App Link"]);
      }
    }
    
    // Handle batch sync
    if (type === 'batch' && data.records) {
      data.records.forEach(function(record) {
        sheet.appendRow([
          new Date(), record.id, record.date, record.startTime, 
          record.endTime, record.durationMinutes, record.category, 
          record.notes, record.appLink || ''
        ]);
      });
    } else if (type === 'receipt') {
      sheet.appendRow([new Date(), data.id, data.date, data.vendor, data.amount, data.category, data.isTaxDeductible ? "Yes" : "No", data.notes]);
    } else if (type === 'test') {
      sheet.appendRow([new Date(), "Connection Verified ✓", data.clientName]);
    } else {
      sheet.appendRow([new Date(), data.id, data.date, data.startTime, data.endTime, data.durationMinutes, data.category, data.notes, data.appLink || '']);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({"status":"success", "timestamp": new Date().toISOString()}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({"status":"error", "message": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({"status":"ok", "message": "Chronos endpoint active"}))
    .setMimeType(ContentService.MimeType.JSON);
}`;

// URL validation for Google Apps Script Web App URLs
const isValidGoogleScriptUrl = (url: string): boolean => {
  if (!url) return false;
  const pattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/;
  return pattern.test(url);
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (
  url: string, 
  options: RequestInit, 
  retries = MAX_RETRIES
): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries > 0) {
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
}

export const googleSheetService = {
  /**
   * Validates if a URL is a proper Google Apps Script Web App URL
   */
  validateUrl: (url: string): boolean => isValidGoogleScriptUrl(url),

  /**
   * Test connection to Google Sheet endpoint
   * Note: Due to CORS, we use no-cors mode which limits error detection
   */
  testConnection: async (webAppUrl: string, clientName: string): Promise<SyncResult> => {
    if (!isValidGoogleScriptUrl(webAppUrl)) {
      return { 
        success: false, 
        message: 'Invalid URL format. Must be https://script.google.com/macros/s/.../exec' 
      };
    }
    
    try {
      // First try with regular fetch (works if CORS is properly configured)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      await fetchWithRetry(webAppUrl, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          syncType: 'test', 
          clientName: clientName || 'Test Client',
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // With no-cors, we can't read the response, but if no error thrown, request was sent
      return { 
        success: true, 
        message: 'Request sent successfully. Check your Google Sheet for confirmation.',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false, 
        message: `Connection failed: ${errorMessage}` 
      };
    }
  },

  /**
   * Sync a single work record to Google Sheet
   */
  syncRecord: async (record: WorkRecord, webAppUrl: string): Promise<SyncResult> => {
    if (!isValidGoogleScriptUrl(webAppUrl)) {
      return { success: false, message: 'Invalid Google Script URL' };
    }
    
    try {
      const payload = { 
        ...record, 
        syncType: 'work', 
        appLink: window.location.origin,
        syncedAt: new Date().toISOString()
      };
      
      await fetchWithRetry(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      return { 
        success: true, 
        message: 'Record synced',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Sync failed' 
      };
    }
  },

  /**
   * Sync a receipt record to Google Sheet
   */
  syncReceipt: async (receipt: ReceiptRecord, webAppUrl: string): Promise<SyncResult> => {
    if (!isValidGoogleScriptUrl(webAppUrl)) {
      return { success: false, message: 'Invalid Google Script URL' };
    }
    
    try {
      const payload = { 
        ...receipt, 
        syncType: 'receipt',
        syncedAt: new Date().toISOString()
      };
      
      await fetchWithRetry(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      return { 
        success: true, 
        message: 'Receipt synced',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Sync failed' 
      };
    }
  },

  /**
   * Batch sync multiple records (more efficient)
   */
  syncBatch: async (records: WorkRecord[], webAppUrl: string): Promise<SyncResult> => {
    if (!isValidGoogleScriptUrl(webAppUrl)) {
      return { success: false, message: 'Invalid Google Script URL' };
    }
    
    if (records.length === 0) {
      return { success: true, message: 'No records to sync' };
    }
    
    try {
      // Limit batch size to prevent payload issues
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        await fetchWithRetry(webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            syncType: 'batch', 
            records: batch.map(r => ({
              ...r,
              appLink: window.location.origin
            }))
          }),
        });
      }
      
      return { 
        success: true, 
        message: `${records.length} records synced in ${batches.length} batch(es)`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Batch sync failed' 
      };
    }
  }
};
