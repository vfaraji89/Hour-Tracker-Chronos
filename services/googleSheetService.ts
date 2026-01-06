
import { WorkRecord, ReceiptRecord } from '../types';

export const GOOGLE_SCRIPT_CODE = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var type = data.syncType || 'work';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = type === 'receipt' ? 'Receipts' : (type === 'test' ? 'SystemLogs' : 'WorkRecords');
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  if (sheet.getLastRow() === 0) {
    if (type === 'receipt') {
      sheet.appendRow(["Timestamp", "ID", "Date", "Vendor", "Amount", "Category", "Tax Deductible", "Notes"]);
    } else if (type === 'test') {
      sheet.appendRow(["Test Timestamp", "Status", "Client"]);
    } else {
      sheet.appendRow(["Timestamp", "ID", "Date", "Start", "End", "Duration", "Category", "Notes", "Link"]);
    }
  }
  
  if (type === 'receipt') {
    sheet.appendRow([new Date(), data.id, data.date, data.vendor, data.amount, data.category, data.isTaxDeductible ? "Yes" : "No", data.notes]);
  } else if (type === 'test') {
    sheet.appendRow([new Date(), "Connection Verified", data.clientName]);
  } else {
    sheet.appendRow([new Date(), data.id, data.date, data.startTime, data.endTime, data.durationMinutes, data.category, data.notes, data.appLink]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({"status":"success"})).setMimeType(ContentService.MimeType.JSON);
}`;

export const googleSheetService = {
  testConnection: async (webAppUrl: string, clientName: string): Promise<boolean> => {
    if (!webAppUrl || !webAppUrl.startsWith('http')) return false;
    try {
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'test', clientName }),
      });
      return true; // Since no-cors hides response, we assume success if no throw
    } catch (e) {
      return false;
    }
  },

  syncRecord: async (record: WorkRecord, webAppUrl: string): Promise<boolean> => {
    if (!webAppUrl || !webAppUrl.startsWith('http')) return false;
    try {
      const payload = { ...record, syncType: 'work', appLink: window.location.origin };
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  syncReceipt: async (receipt: ReceiptRecord, webAppUrl: string): Promise<boolean> => {
    if (!webAppUrl || !webAppUrl.startsWith('http')) return false;
    try {
      const payload = { ...receipt, syncType: 'receipt' };
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (error) {
      return false;
    }
  }
};
