
export type CurrencyCode = 'USD' | 'EUR' | 'TRY';

export interface AppSettings {
  dailyGoalHours: number;
  autoSync: boolean;
  userName: string;
  theme: 'light' | 'dark' | 'system';
}

export interface Client {
  id: string;
  name: string;
  hourlyRate: number;
  currency: CurrencyCode;
  color?: string;
  sheetUrl?: string;
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
  location?: string;
  syncStatus?: 'pending' | 'synced' | 'failed' | 'syncing';
}

export interface Task {
  id: string;
  clientId: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
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
  syncStatus?: 'pending' | 'synced' | 'failed' | 'syncing';
}

export interface ClientHealth {
  clientId: string;
  name: string;
  profitability: number;
  stability: number;
  growth: number;
  recommendation: string;
}

export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  isIdle?: boolean;
}
