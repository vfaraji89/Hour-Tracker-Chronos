
import { WorkRecord, Client, ReceiptRecord, Task, AppSettings } from '../types';

const RECORDS_KEY = 'mesa_records_v3';
const CLIENTS_KEY = 'mesa_clients_v3';
const RECEIPTS_KEY = 'mesa_receipts_v3';
const ACTIVE_TIMER_KEY = 'mesa_active_timer_v3';
const TASKS_KEY = 'mesa_backlog_v3';
const SETTINGS_KEY = 'mesa_settings_v3';

export const storageService = {
  saveSettings: (settings: AppSettings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)),
  getSettings: (): AppSettings => {
    const defaults: AppSettings = {
      dailyGoalHours: 8,
      autoSync: true,
      userName: 'Operatör',
      theme: 'system',
      isDemoMode: false,
      language: 'tr'
    };
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || JSON.stringify(defaults));
  },

  saveRecords: (records: WorkRecord[]) => localStorage.setItem(RECORDS_KEY, JSON.stringify(records)),
  getRecords: (): WorkRecord[] => JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'),

  saveTasks: (tasks: Task[]) => localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)),
  getTasks: (): Task[] => JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'),

  saveClients: (clients: Client[]) => localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients)),
  getClients: (): Client[] => {
    const clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
    if (clients.length === 0) {
      const defaultClient: Client = { 
        id: 'default', 
        name: 'Stratejik Geliştirme A.Ş.', 
        hourlyRate: 150, 
        currency: 'USD' 
      };
      localStorage.setItem(CLIENTS_KEY, JSON.stringify([defaultClient]));
      return [defaultClient];
    }
    return clients;
  },

  saveReceipts: (receipts: ReceiptRecord[]) => localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts)),
  getReceipts: (): ReceiptRecord[] => JSON.parse(localStorage.getItem(RECEIPTS_KEY) || '[]'),

  saveActiveTimer: (data: any) => localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(data)),
  getActiveTimer: () => JSON.parse(localStorage.getItem(ACTIVE_TIMER_KEY) || 'null'),
  clearActiveTimer: () => localStorage.removeItem(ACTIVE_TIMER_KEY),

  generateDemoData: () => {
    const clients: Client[] = [
      { id: 'c1', name: 'Nexus İnovasyon', hourlyRate: 200, currency: 'USD', color: '#000' },
      { id: 'c2', name: 'Stellar Labs', hourlyRate: 175, currency: 'EUR', color: '#333' }
    ];
    
    const records: WorkRecord[] = [];
    const now = new Date();
    for (let i = 0; i < 45; i++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      if (isWeekend && Math.random() > 0.3) continue;

      const duration = 120 + Math.floor(Math.random() * 300);
      records.push({
        id: crypto.randomUUID(),
        clientId: Math.random() > 0.6 ? 'c2' : 'c1',
        date: date.toISOString(),
        startTime: '09:00',
        endTime: '14:30',
        durationMinutes: duration,
        category: i % 3 === 0 ? 'Geliştirme' : (i % 3 === 1 ? 'Planlama' : 'Toplantı'),
        notes: `Kilometre taşı yinelemesi ${i} — stratejik dağıtım.`,
        syncStatus: 'synced'
      });
    }

    const receipts: ReceiptRecord[] = [
      { id: 'r1', clientId: 'c1', date: now.toISOString().split('T')[0], vendor: 'OpenAI API', amount: 24.50, category: 'Yazılım', notes: 'Aylık kullanım', isTaxDeductible: true, syncStatus: 'synced' },
      { id: 'r2', clientId: 'c2', date: now.toISOString().split('T')[0], vendor: 'Bulut Servisleri', amount: 150.00, category: 'Altyapı', notes: 'Sunucu yükü', isTaxDeductible: true, syncStatus: 'synced' }
    ];

    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
  }
};
