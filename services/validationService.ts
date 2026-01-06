
import { WorkRecord, Client, ReceiptRecord, Task, AppSettings, CurrencyCode } from '../types';

/**
 * Input Sanitization & Validation Utilities
 * Protects against XSS, injection, and malformed data
 */

// Text sanitization
export const sanitizeText = (input: string, maxLength = 500): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
};

// Number validation
export const sanitizeNumber = (input: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number => {
  const num = Number(input);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
};

// Currency code validation
const VALID_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'TRY'];
export const isValidCurrency = (currency: unknown): currency is CurrencyCode => {
  return typeof currency === 'string' && VALID_CURRENCIES.includes(currency as CurrencyCode);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidGoogleScriptUrl = (url: string): boolean => {
  if (!url) return false;
  const pattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/;
  return pattern.test(url);
};

// Date validation
export const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const sanitizeDate = (dateString: string): string => {
  if (isValidISODate(dateString)) return dateString;
  return new Date().toISOString();
};

// UUID validation
export const isValidUUID = (id: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(id);
};

// Client validation
export const validateClient = (client: Partial<Client>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!client.name || client.name.trim().length < 1) {
    errors.push('Client name is required');
  }
  if (client.name && client.name.length > 100) {
    errors.push('Client name must be under 100 characters');
  }
  if (client.hourlyRate !== undefined && (client.hourlyRate < 0 || client.hourlyRate > 10000)) {
    errors.push('Hourly rate must be between 0 and 10,000');
  }
  if (client.currency && !isValidCurrency(client.currency)) {
    errors.push('Invalid currency code');
  }
  if (client.sheetUrl && !isValidGoogleScriptUrl(client.sheetUrl)) {
    errors.push('Invalid Google Script URL format');
  }
  
  return { valid: errors.length === 0, errors };
};

// Work record validation
export const validateWorkRecord = (record: Partial<WorkRecord>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!record.clientId) {
    errors.push('Client ID is required');
  }
  if (record.durationMinutes !== undefined && (record.durationMinutes < 1 || record.durationMinutes > 1440)) {
    errors.push('Duration must be between 1 and 1440 minutes (24 hours)');
  }
  if (record.notes && record.notes.length > 1000) {
    errors.push('Notes must be under 1000 characters');
  }
  if (record.date && !isValidISODate(record.date)) {
    errors.push('Invalid date format');
  }
  
  return { valid: errors.length === 0, errors };
};

// Receipt validation
export const validateReceipt = (receipt: Partial<ReceiptRecord>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!receipt.clientId) {
    errors.push('Client ID is required');
  }
  if (receipt.amount !== undefined && (receipt.amount < 0 || receipt.amount > 1000000)) {
    errors.push('Amount must be between 0 and 1,000,000');
  }
  if (receipt.vendor && receipt.vendor.length > 200) {
    errors.push('Vendor name must be under 200 characters');
  }
  if (receipt.date && !isValidISODate(receipt.date)) {
    errors.push('Invalid date format');
  }
  
  return { valid: errors.length === 0, errors };
};

// Settings validation
export const validateSettings = (settings: Partial<AppSettings>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (settings.dailyGoalHours !== undefined && (settings.dailyGoalHours < 1 || settings.dailyGoalHours > 24)) {
    errors.push('Daily goal must be between 1 and 24 hours');
  }
  if (settings.userName && settings.userName.length > 50) {
    errors.push('Username must be under 50 characters');
  }
  if (settings.theme && !['light', 'dark', 'system'].includes(settings.theme)) {
    errors.push('Invalid theme value');
  }
  
  return { valid: errors.length === 0, errors };
};

// Sanitize client before saving
export const sanitizeClient = (client: Client): Client => ({
  id: client.id || crypto.randomUUID(),
  name: sanitizeText(client.name, 100),
  hourlyRate: sanitizeNumber(client.hourlyRate, 0, 10000),
  currency: isValidCurrency(client.currency) ? client.currency : 'USD',
  color: client.color ? sanitizeText(client.color, 20) : undefined,
  sheetUrl: client.sheetUrl && isValidGoogleScriptUrl(client.sheetUrl) ? client.sheetUrl : undefined
});

// Sanitize work record before saving
export const sanitizeWorkRecord = (record: WorkRecord): WorkRecord => ({
  id: record.id || crypto.randomUUID(),
  clientId: record.clientId,
  date: sanitizeDate(record.date),
  startTime: sanitizeText(record.startTime, 10),
  endTime: sanitizeText(record.endTime, 10),
  durationMinutes: sanitizeNumber(record.durationMinutes, 1, 1440),
  category: sanitizeText(record.category, 50),
  notes: sanitizeText(record.notes, 1000),
  location: record.location ? sanitizeText(record.location, 100) : undefined,
  syncStatus: record.syncStatus || 'pending'
});

// Sanitize receipt before saving
export const sanitizeReceipt = (receipt: ReceiptRecord): ReceiptRecord => ({
  id: receipt.id || crypto.randomUUID(),
  clientId: receipt.clientId,
  date: sanitizeDate(receipt.date),
  vendor: sanitizeText(receipt.vendor, 200),
  amount: sanitizeNumber(receipt.amount, 0, 1000000),
  category: sanitizeText(receipt.category, 50),
  notes: sanitizeText(receipt.notes, 500),
  imageUrl: receipt.imageUrl ? sanitizeText(receipt.imageUrl, 2000) : undefined,
  isTaxDeductible: Boolean(receipt.isTaxDeductible),
  syncStatus: receipt.syncStatus || 'pending'
});

// Check localStorage usage
export const getStorageUsage = (): { used: number; limit: number; percentage: number } => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage.getItem(key)?.length || 0;
    }
  }
  const limit = 5 * 1024 * 1024; // 5MB approximate limit
  return {
    used: total,
    limit,
    percentage: Math.round((total / limit) * 100)
  };
};

// Check if storage is getting full
export const isStorageNearLimit = (threshold = 80): boolean => {
  const { percentage } = getStorageUsage();
  return percentage >= threshold;
};
