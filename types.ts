
export type CurrencyCode = 'USD' | 'EUR' | 'TRY';

export interface Client {
  id: string;
  name: string;
  hourlyRate: number;
  currency: CurrencyCode;
  color?: string;
  sheetUrl?: string; // Optional Google Sheets Web App URL for this client
}

export interface WorkRecord {
  id: string;
  clientId: string;
  date: string; 
  startTime: string;
  endTime: string;
  durationMinutes: number;
  category: string;
  notes: string;
  location?: string; // System location
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface ReceiptRecord {
  id: string;
  clientId: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  notes: string;
  imageUrl?: string;
  isTaxDeductible?: boolean;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface ClientHealth {
  clientId: string;
  name: string;
  profitability: number; // 0-100
  stability: number; // 0-100
  growth: number; // 0-100
  recommendation: string;
}

export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  isIdle?: boolean; // New hibernation property
}
