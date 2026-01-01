import { WorkRecord } from '../types';

/**
 * GOOGLE APPS SCRIPT SETUP:
 * 1. Create a Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Paste:
 * 
 * function doPost(e) {
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *   var data = JSON.parse(e.postData.contents);
 *   if (sheet.getLastRow() === 0) {
 *     sheet.appendRow(["Timestamp", "ID", "Date", "Start", "End", "Duration", "Category", "Notes", "Link"]);
 *   }
 *   sheet.appendRow([
 *     new Date(),
 *     data.id,
 *     data.date,
 *     data.startTime,
 *     data.endTime,
 *     data.durationMinutes,
 *     data.category,
 *     data.notes,
 *     data.appLink
 *   ]);
 *   return ContentService.createTextOutput(JSON.stringify({"status":"success"})).setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * 4. Deploy -> New Deployment -> Web App (Execute as Me, Who has access: Anyone).
 * 5. Copy the URL and paste it into the Client config in Chronos.
 */

export const googleSheetService = {
  syncRecord: async (record: WorkRecord, webAppUrl: string): Promise<boolean> => {
    if (!webAppUrl || !webAppUrl.startsWith('http')) return false;

    try {
      const payload = {
        ...record,
        appLink: window.location.origin
      };

      // We use no-cors because browser preflights often fail with Apps Script redirects
      // However, for high-reliability, we attempt the fetch asynchronously.
      fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(err => console.debug('Sync background catch:', err));

      return true;
    } catch (error) {
      console.error('Sheet Sync Exception:', error);
      return false;
    }
  }
};