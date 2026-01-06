
import { WorkRecord, Client, ReceiptRecord, Task, AppSettings } from '../types';

const RECORDS_KEY = 'task_hour_records_v2';
const CLIENTS_KEY = 'task_hour_clients_v2';
const RECEIPTS_KEY = 'task_hour_receipts_v2';
const ACTIVE_TIMER_KEY = 'task_hour_active_timer_v2';
const TASKS_KEY = 'task_hour_backlog_v2';
const SETTINGS_KEY = 'task_hour_settings_v2';
const LAST_BACKUP_KEY = 'task_hour_last_backup';

// Storage quota management
const MAX_RECORDS = 5000;
const MAX_RECEIPTS = 2000;
const MAX_TASKS = 1000;
const ARCHIVE_AFTER_MONTHS = 6;

// Safe JSON parse with fallback
const safeParse = <T>(data: string | null, fallback: T): T => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse stored data:', error);
    return fallback;
  }
};

// Check storage usage
const getStorageSize = (): number => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (localStorage.getItem(key)?.length || 0) * 2; // UTF-16
    }
  }
  return total;
};

const isStorageNearLimit = (): boolean => {
  const used = getStorageSize();
  const limit = 4.5 * 1024 * 1024; // 4.5MB threshold (leave buffer)
  return used >= limit;
};

// Archive old records to reduce storage
const archiveOldRecords = (records: WorkRecord[]): { recent: WorkRecord[]; archived: WorkRecord[] } => {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - ARCHIVE_AFTER_MONTHS);
  
  const recent = records.filter(r => new Date(r.date) > cutoffDate);
  const archived = records.filter(r => new Date(r.date) <= cutoffDate);
  
  return { recent, archived };
};

export const storageService = {
  // Settings
  saveSettings: (settings: AppSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
  
  getSettings: (): AppSettings => {
    const defaults: AppSettings = {
      dailyGoalHours: 8,
      autoSync: true,
      userName: 'Operator',
      theme: 'system'
    };
    return safeParse(localStorage.getItem(SETTINGS_KEY), defaults);
  },

  // Records with quota management
  saveRecords: (records: WorkRecord[]) => {
    try {
      // Limit total records to prevent quota issues
      const limitedRecords = records.slice(0, MAX_RECORDS);
      localStorage.setItem(RECORDS_KEY, JSON.stringify(limitedRecords));
      
      // Warn if storage is getting full
      if (isStorageNearLimit()) {
        console.warn('Storage is near limit. Consider exporting and archiving old data.');
      }
    } catch (error) {
      if ((error as Error).name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Attempting to archive old records...');
        const { recent } = archiveOldRecords(records);
        localStorage.setItem(RECORDS_KEY, JSON.stringify(recent.slice(0, MAX_RECORDS / 2)));
      }
    }
  },
  
  getRecords: (): WorkRecord[] => safeParse(localStorage.getItem(RECORDS_KEY), []),

  // Tasks
  saveTasks: (tasks: Task[]) => {
    try {
      const limitedTasks = tasks.slice(0, MAX_TASKS);
      localStorage.setItem(TASKS_KEY, JSON.stringify(limitedTasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  },
  
  getTasks: (): Task[] => safeParse(localStorage.getItem(TASKS_KEY), []),

  // Clients
  saveClients: (clients: Client[]) => {
    try {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    } catch (error) {
      console.error('Failed to save clients:', error);
    }
  },
  
  getClients: (): Client[] => {
    const clients = safeParse<Client[]>(localStorage.getItem(CLIENTS_KEY), []);
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

  // Receipts with quota management
  saveReceipts: (receipts: ReceiptRecord[]) => {
    try {
      const limitedReceipts = receipts.slice(0, MAX_RECEIPTS);
      localStorage.setItem(RECEIPTS_KEY, JSON.stringify(limitedReceipts));
    } catch (error) {
      console.error('Failed to save receipts:', error);
    }
  },
  
  getReceipts: (): ReceiptRecord[] => safeParse(localStorage.getItem(RECEIPTS_KEY), []),

  // Timer
  saveActiveTimer: (data: { startTime: number; category: string; notes: string }) => {
    try {
      localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  },
  
  getActiveTimer: (): { startTime: number; category: string; notes: string } | null => {
    return safeParse(localStorage.getItem(ACTIVE_TIMER_KEY), null);
  },
  
  clearActiveTimer: () => localStorage.removeItem(ACTIVE_TIMER_KEY),

  // Backup functionality
  createBackup: (): string => {
    const backup = {
      version: '2.0',
      createdAt: new Date().toISOString(),
      data: {
        clients: storageService.getClients(),
        records: storageService.getRecords(),
        receipts: storageService.getReceipts(),
        tasks: storageService.getTasks(),
        settings: storageService.getSettings()
      }
    };
    return JSON.stringify(backup, null, 2);
  },

  downloadBackup: () => {
    const backup = storageService.createBackup();
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Update last backup timestamp
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  },

  restoreBackup: (backupJson: string): { success: boolean; message: string } => {
    try {
      const backup = JSON.parse(backupJson);
      
      if (!backup.data) {
        return { success: false, message: 'Invalid backup format' };
      }
      
      if (backup.data.clients) storageService.saveClients(backup.data.clients);
      if (backup.data.records) storageService.saveRecords(backup.data.records);
      if (backup.data.receipts) storageService.saveReceipts(backup.data.receipts);
      if (backup.data.tasks) storageService.saveTasks(backup.data.tasks);
      if (backup.data.settings) storageService.saveSettings(backup.data.settings);
      
      return { success: true, message: `Restored backup from ${backup.createdAt || 'unknown date'}` };
    } catch (error) {
      return { success: false, message: 'Failed to parse backup file' };
    }
  },

  getLastBackupDate: (): string | null => {
    return localStorage.getItem(LAST_BACKUP_KEY);
  },

  shouldPromptBackup: (): boolean => {
    const lastBackup = storageService.getLastBackupDate();
    if (!lastBackup) return true;
    
    const daysSinceBackup = Math.floor(
      (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceBackup >= 7; // Prompt if no backup in 7 days
  },

  // Storage stats
  getStorageStats: () => {
    const records = storageService.getRecords();
    const receipts = storageService.getReceipts();
    const tasks = storageService.getTasks();
    const clients = storageService.getClients();
    
    const usedBytes = getStorageSize();
    const limitBytes = 5 * 1024 * 1024;
    
    return {
      records: records.length,
      receipts: receipts.length,
      tasks: tasks.length,
      clients: clients.length,
      usedBytes,
      usedMB: (usedBytes / (1024 * 1024)).toFixed(2),
      limitMB: 5,
      percentUsed: Math.round((usedBytes / limitBytes) * 100),
      isNearLimit: isStorageNearLimit()
    };
  },

  // Archive old data
  archiveAndCleanup: (): { archivedRecords: WorkRecord[]; archivedReceipts: ReceiptRecord[] } => {
    const records = storageService.getRecords();
    const receipts = storageService.getReceipts();
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - ARCHIVE_AFTER_MONTHS);
    
    const recentRecords = records.filter(r => new Date(r.date) > cutoffDate);
    const archivedRecords = records.filter(r => new Date(r.date) <= cutoffDate);
    
    const recentReceipts = receipts.filter(r => new Date(r.date) > cutoffDate);
    const archivedReceipts = receipts.filter(r => new Date(r.date) <= cutoffDate);
    
    storageService.saveRecords(recentRecords);
    storageService.saveReceipts(recentReceipts);
    
    return { archivedRecords, archivedReceipts };
  }
};
