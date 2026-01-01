
import { WorkRecord, Client, ReceiptRecord } from '../types';

const RECORDS_KEY = 'task_hour_records_v2';
const CLIENTS_KEY = 'task_hour_clients_v2';
const RECEIPTS_KEY = 'task_hour_receipts_v2';
const ACTIVE_TIMER_KEY = 'task_hour_active_timer_v2';

export const storageService = {
  // Records
  saveRecords: (records: WorkRecord[]) => localStorage.setItem(RECORDS_KEY, JSON.stringify(records)),
  getRecords: (): WorkRecord[] => JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'),

  // Clients
  saveClients: (clients: Client[]) => localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients)),
  getClients: (): Client[] => {
    const clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
    if (clients.length === 0) {
      const defaultClient: Client = { 
        id: 'default', 
        name: 'Main Contract', 
        hourlyRate: 50, 
        currency: 'USD' 
      };
      localStorage.setItem(CLIENTS_KEY, JSON.stringify([defaultClient]));
      return [defaultClient];
    }
    return clients;
  },

  // Receipts/Accounts
  saveReceipts: (receipts: ReceiptRecord[]) => localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts)),
  getReceipts: (): ReceiptRecord[] => JSON.parse(localStorage.getItem(RECEIPTS_KEY) || '[]'),

  // Timer
  saveActiveTimer: (data: any) => localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(data)),
  getActiveTimer: () => JSON.parse(localStorage.getItem(ACTIVE_TIMER_KEY) || 'null'),
  clearActiveTimer: () => localStorage.removeItem(ACTIVE_TIMER_KEY),
};
