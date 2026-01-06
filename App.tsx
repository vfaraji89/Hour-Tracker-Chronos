
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimerDisplay from './components/TimerDisplay';
import HistoryList from './components/HistoryList';
import MonthlySummary from './components/MonthlySummary';
import TaskDashboard from './components/TaskDashboard';
import CalendarView from './components/CalendarView';
import ReceiptManager from './components/ReceiptManager';
import Settings from './components/Settings';
import CloudSetupGuide from './components/CloudSetupGuide';
import { WorkRecord, Client, ReceiptRecord, Task, CurrencyCode, AppSettings } from './types';
import { storageService } from './services/storageService';
import { parseSmartCommand, parseReceipt } from './services/geminiService';
import { googleSheetService } from './services/googleSheetService';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  TRY: '₺'
};

const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.93,
  TRY: 34.45
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'track' | 'calendar' | 'tasks' | 'accounts' | 'clients' | 'settings'>('track');
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('USD');
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [clients, setClients] = useState<Client[]>(() => storageService.getClients());
  const [activeClientId, setActiveClientId] = useState(() => {
    const stored = storageService.getClients();
    return stored.length > 0 ? stored[0].id : 'default';
  });
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [magicFeedback, setMagicFeedback] = useState<string | null>(null);
  const [systemLocation, setSystemLocation] = useState<string>('');
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);

  const [newClientName, setNewClientName] = useState('');
  const [newClientRate, setNewClientRate] = useState(50);
  const [newClientCurrency, setNewClientCurrency] = useState<CurrencyCode>('USD');
  const [newClientSheetUrl, setNewClientSheetUrl] = useState('');

  const timerRef = useRef<{ handleExternalStart: (notes: string) => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClients(storageService.getClients());
    setRecords(storageService.getRecords());
    setTasks(storageService.getTasks());
    setReceipts(storageService.getReceipts());
    setSystemLocation(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const active = storageService.getActiveTimer();
        if (!active) {
          triggerMagicFeedback("Ready for a new session?");
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const activeClient = clients.find(c => c.id === activeClientId) || clients[0];
  const filteredRecords = records.filter(r => r.clientId === activeClient.id);
  const filteredTasks = tasks.filter(t => t.clientId === activeClient.id);
  const filteredReceipts = receipts.filter(r => r.clientId === activeClient.id);

  const convertAmount = (amount: number, from: CurrencyCode, to: CurrencyCode): number => {
    if (from === to) return amount;
    const amountInUSD = amount / EXCHANGE_RATES[from];
    return amountInUSD * EXCHANGE_RATES[to];
  };

  const handleRecordComplete = (newRecord: Partial<WorkRecord>) => {
    const record: WorkRecord = {
      ...newRecord,
      id: crypto.randomUUID(),
      clientId: activeClient.id,
      location: systemLocation,
      syncStatus: 'pending'
    } as WorkRecord;
    const updated = [record, ...records];
    setRecords(updated);
    storageService.saveRecords(updated);
    
    if (settings.autoSync && activeClient.sheetUrl) {
      handleSync(record);
    }
  };

  const handleSync = async (record: WorkRecord) => {
    if (!activeClient.sheetUrl) return;
    handleUpdateRecord(record.id, { syncStatus: 'syncing' });
    const success = await googleSheetService.syncRecord(record, activeClient.sheetUrl);
    handleUpdateRecord(record.id, { syncStatus: success ? 'synced' : 'failed' });
  };

  const handleSyncReceipt = async (receipt: ReceiptRecord) => {
    if (!activeClient.sheetUrl) return;
    handleUpdateReceiptStatus(receipt.id, 'syncing');
    const success = await googleSheetService.syncReceipt(receipt, activeClient.sheetUrl);
    handleUpdateReceiptStatus(receipt.id, success ? 'synced' : 'failed');
  };

  const handleBulkSync = async () => {
    setLoadingAction(true);
    triggerMagicFeedback("Synchronizing nodes...");
    const pendingRecords = records.filter(r => r.syncStatus !== 'synced');
    const pendingReceipts = receipts.filter(r => r.syncStatus !== 'synced');
    for (const r of pendingRecords) {
      const client = clients.find(c => c.id === r.clientId);
      if (client?.sheetUrl) await handleSync(r);
    }
    for (const r of pendingReceipts) {
      const client = clients.find(c => c.id === r.clientId);
      if (client?.sheetUrl) await handleSyncReceipt(r);
    }
    setLoadingAction(false);
    triggerMagicFeedback("Cloud state updated.");
  };

  const handleTestConnection = async () => {
    if (!newClientSheetUrl) return;
    setIsTestingConn(true);
    const success = await googleSheetService.testConnection(newClientSheetUrl, newClientName || "Test Client");
    triggerMagicFeedback(success ? "Link Active: Log Committed" : "Check URL Deployment");
    setIsTestingConn(false);
  };

  const handleUpdateRecord = (id: string, updates: Partial<WorkRecord>) => {
    setRecords(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      storageService.saveRecords(updated);
      return updated;
    });
  };

  const handleUpdateReceiptStatus = (id: string, status: 'synced' | 'failed' | 'syncing') => {
    setReceipts(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, syncStatus: status } : r);
      storageService.saveReceipts(updated);
      return updated;
    });
  };

  const handleUpdateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    storageService.saveTasks(newTasks);
  };

  const handleUpdateReceipts = (newReceipts: ReceiptRecord[]) => {
    setReceipts(newReceipts);
    storageService.saveReceipts(newReceipts);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const triggerMagicFeedback = (msg: string) => {
    setMagicFeedback(msg);
    setTimeout(() => setMagicFeedback(null), 4000);
  };

  const handleMagicExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput) return;
    setLoadingAction(true);
    try {
      const result = await parseSmartCommand(smartInput, clients);
      if (result.type === 'work') {
        handleRecordComplete({
          durationMinutes: result.durationMinutes || 60,
          notes: result.notes || smartInput,
          category: result.category || 'Deep Work',
          date: new Date().toISOString(),
          startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          endTime: new Date(Date.now() + (result.durationMinutes || 60)*60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
        triggerMagicFeedback(result.message || "Cycle logged.");
      } else if (result.type === 'sync') {
        await handleBulkSync();
      } else if (result.type === 'expense') {
        setActiveTab('accounts');
        triggerMagicFeedback("Switching to Accounts for expense logging.");
      } else {
        const newTask: Task = {
          id: crypto.randomUUID(),
          clientId: activeClient.id,
          text: smartInput,
          completed: false,
          priority: 'medium',
          createdAt: new Date().toISOString()
        };
        handleUpdateTasks([newTask, ...tasks]);
        triggerMagicFeedback("New item committed to backlog.");
      }
    } catch (err) {
      triggerMagicFeedback("Request processed.");
    }
    setSmartInput('');
    setLoadingAction(false);
  };

  const handleStartTask = (taskText: string) => {
    setActiveTab('track');
    setTimeout(() => {
      if (timerRef.current) {
        timerRef.current.handleExternalStart(taskText);
      }
    }, 100);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    triggerMagicFeedback("AI Scanning initialized...");
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const result = await parseReceipt(base64);
        if (result) {
          const newReceipt: ReceiptRecord = {
            id: crypto.randomUUID(),
            clientId: activeClient.id,
            date: result.date || new Date().toISOString().split('T')[0],
            vendor: result.vendor || 'Unknown Vendor',
            amount: result.amount || 0,
            category: result.category || 'General',
            notes: 'AI Parsed from image',
            isTaxDeductible: result.isTaxDeductible,
            syncStatus: 'pending'
          };
          setReceipts(prev => {
            const updated = [newReceipt, ...prev];
            storageService.saveReceipts(updated);
            return updated;
          });
          if (settings.autoSync && activeClient.sheetUrl) {
            handleSyncReceipt(newReceipt);
          }
          triggerMagicFeedback(`Parsed: ${CURRENCY_SYMBOLS[activeClient.currency]}${result.amount} from ${result.vendor}`);
        } else {
          triggerMagicFeedback("Analysis failed. Please try a clearer image.");
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      triggerMagicFeedback("Error processing image.");
      setIsScanning(false);
    }
  };

  const pendingCount = records.filter(r => r.syncStatus !== 'synced').length + receipts.filter(r => r.syncStatus !== 'synced').length;

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      <CloudSetupGuide isOpen={showSetupGuide} onClose={() => setShowSetupGuide(false)} />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      <AnimatePresence>
        {magicFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-6 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            {magicFeedback}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md vercel-border border-t-0 border-x-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('track')}>
              <div className="w-6 h-6 rounded bg-black flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="font-bold text-sm tracking-tight">Chronos</span>
            </div>
            <nav className="hidden lg:flex items-center gap-6">
              {(['track', 'calendar', 'tasks', 'accounts', 'clients', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-black uppercase tracking-widest transition-colors py-2 ${activeTab === tab ? 'text-black underline underline-offset-8 decoration-2' : 'text-gray-400 hover:text-black'}`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
             <div className="vercel-border rounded-md px-3 py-1.5 flex items-center gap-2 bg-gray-50">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base</span>
              <select 
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent text-[10px] font-black focus:outline-none appearance-none cursor-pointer uppercase tracking-widest"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
              </select>
            </div>
             <div className="vercel-border rounded-md px-3 py-1.5 flex items-center gap-2 bg-gray-50">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Port</span>
              <select 
                value={activeClientId}
                onChange={(e) => setActiveClientId(e.target.value)}
                className="bg-transparent text-[10px] font-black focus:outline-none appearance-none cursor-pointer uppercase tracking-widest"
              >
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        <AnimatePresence mode="wait">
          {activeTab === 'track' && (
            <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center space-y-16">
              <div className="w-full">
                <form onSubmit={handleMagicExecute} className="relative magic-bar-focus transition-all rounded-full overflow-hidden bg-white vercel-border p-1 group shadow-sm hover:shadow-md">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">
                    <i className="fa-solid fa-sparkles text-xs"></i>
                  </div>
                  <input 
                    type="text" 
                    value={smartInput}
                    onChange={(e) => setSmartInput(e.target.value)}
                    placeholder="Commit action: 'Log 2h' or describe a new task..."
                    className="w-full bg-transparent pl-14 pr-44 py-5 text-sm font-medium outline-none placeholder:text-gray-300"
                  />
                  <button 
                    type="submit"
                    disabled={loadingAction}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                  >
                    {loadingAction ? "..." : "Execute"}
                  </button>
                </form>
              </div>

              <div className="w-full max-sm:px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                   <div className="w-full">
                      <TimerDisplay onRecordComplete={handleRecordComplete} ref={timerRef} />
                   </div>
                   <div className="space-y-4">
                      <div className="vercel-card rounded-2xl p-6 text-center">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Receipt Intelligence</h4>
                         <button 
                            disabled={isScanning}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-4 rounded-xl border-2 border-dashed border-gray-100 text-[10px] font-black uppercase tracking-widest hover:border-black hover:bg-gray-50 transition-all flex flex-col items-center gap-2 group"
                         >
                            {isScanning ? (
                              <i className="fa-solid fa-spinner animate-spin text-xl"></i>
                            ) : (
                              <>
                                <i className="fa-solid fa-camera text-xl text-gray-300 group-hover:text-black"></i>
                                Scan Receipt
                              </>
                            )}
                         </button>
                      </div>
                   </div>
                </div>
              </div>

              <div className="w-full pt-12 space-y-12">
                <div className="vercel-border-t pt-12">
                  <MonthlySummary records={filteredRecords} />
                </div>
                <HistoryList 
                  records={filteredRecords} 
                  onDelete={(id) => {
                    const updated = records.filter(x => x.id !== id);
                    setRecords(updated);
                    storageService.saveRecords(updated);
                  }} 
                  onUpdate={handleUpdateRecord}
                  currency={activeClient.currency}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CalendarView records={filteredRecords} />
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <TaskDashboard 
                tasks={filteredTasks} 
                onTasksChange={(newTasks) => handleUpdateTasks([...tasks.filter(t => t.clientId !== activeClient.id), ...newTasks])}
                onStartTask={handleStartTask}
              />
            </motion.div>
          )}

          {activeTab === 'accounts' && (
            <motion.div key="accounts" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ReceiptManager 
                receipts={filteredReceipts} 
                onUpdate={handleUpdateReceipts} 
                onScan={() => fileInputRef.current?.click()}
                isScanning={isScanning}
                clientCurrency={activeClient.currency}
                displayCurrency={displayCurrency}
                convertAmount={convertAmount}
              />
            </motion.div>
          )}

          {activeTab === 'clients' && (
            <motion.div key="clients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto space-y-10">
              <div className="vercel-card rounded-xl p-8 space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Setup</h3>
                <div className="space-y-4">
                  <input className="w-full vercel-border rounded px-4 py-3 text-sm font-bold outline-none focus:border-black" placeholder="CLIENT NAME" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                  <div className="flex gap-4">
                    <input type="number" className="flex-1 vercel-border rounded px-4 py-3 text-sm outline-none focus:border-black" placeholder="RATE" value={newClientRate} onChange={(e) => setNewClientRate(Number(e.target.value))} />
                    <select className="vercel-border rounded px-4 py-3 text-xs font-bold outline-none bg-white" value={newClientCurrency} onChange={(e) => setNewClientCurrency(e.target.value as CurrencyCode)}>
                      <option value="USD">USD</option><option value="EUR">EUR</option><option value="TRY">TRY</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Cloud Endpoint (Google Web App URL)</label>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 vercel-border rounded px-4 py-3 text-xs outline-none focus:border-black" 
                        placeholder="https://script.google.com/..." 
                        value={newClientSheetUrl} 
                        onChange={(e) => setNewClientSheetUrl(e.target.value)} 
                      />
                      <button 
                        onClick={handleTestConnection}
                        disabled={isTestingConn || !newClientSheetUrl}
                        className="px-4 vercel-border rounded bg-gray-50 hover:bg-black hover:text-white transition-all text-[8px] font-black uppercase disabled:opacity-30"
                      >
                        {isTestingConn ? "..." : "Test"}
                      </button>
                    </div>
                  </div>

                  <button onClick={() => {
                    if (!newClientName) return;
                    const client: Client = { id: crypto.randomUUID(), name: newClientName, hourlyRate: newClientRate, currency: newClientCurrency, sheetUrl: newClientSheetUrl };
                    const updated = [...clients, client];
                    setClients(updated);
                    storageService.saveClients(updated);
                    setNewClientName('');
                    setNewClientSheetUrl('');
                    setActiveClientId(client.id);
                  }} className="w-full bg-black text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Initialize Account</button>
                </div>
              </div>

              <div className="vercel-card rounded-xl p-8 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold">Cloud Protocol v2</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sync your database with Google Sheets</p>
                </div>
                <button 
                  onClick={() => setShowSetupGuide(true)}
                  className="px-6 py-3 bg-white vercel-border rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                >
                  View Setup Guide
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Settings 
                settings={settings} 
                onUpdate={handleUpdateSettings}
                onExport={() => {
                  const data = JSON.stringify({ clients, records, receipts, tasks, settings }, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `chronos_export_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
                onClearData={() => {
                  if (confirm("Permanently wipe all local work history and client data?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-10 bg-white/50 backdrop-blur-sm flex items-center px-6 justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span>{systemLocation} — Node Active</span>
          {pendingCount > 0 && (
            <button onClick={handleBulkSync} className="text-black animate-pulse flex items-center gap-2 group">
              <i className="fa-solid fa-cloud-arrow-up text-[10px]"></i>
              <span>{pendingCount} Pending Commits</span>
            </button>
          )}
        </div>
        <div>Chronos Alpha 3.4.1</div>
      </footer>
    </div>
  );
};

export default App;
