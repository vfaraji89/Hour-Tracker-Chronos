
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
import StrategyDashboard from './components/StrategyDashboard';
import { WorkRecord, Client, ReceiptRecord, Task, CurrencyCode, AppSettings, Locale } from './types';
import { storageService } from './services/storageService';
import { parseSmartCommand, parseReceipt, getStrategicForecast, analyzeClientHealth } from './services/geminiService';
import { googleSheetService } from './services/googleSheetService';
import { translations } from './translations';

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
  const [activeTab, setActiveTab] = useState<'track' | 'calendar' | 'strategy' | 'tasks' | 'accounts' | 'clients' | 'settings'>('track');
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
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [forecast, setForecast] = useState('');
  const [healthData, setHealthData] = useState<any[]>([]);

  const [newClientName, setNewClientName] = useState('');
  const [newClientRate, setNewClientRate] = useState(50);
  const [newClientCurrency, setNewClientCurrency] = useState<CurrencyCode>('USD');
  const [newClientSheetUrl, setNewClientSheetUrl] = useState('');

  const timerRef = useRef<{ handleExternalStart: (notes: string) => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // i18n helper
  const t = translations[settings.language];

  useEffect(() => {
    refreshLocalState();
    setSystemLocation(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const active = storageService.getActiveTimer();
        if (!active && !settings.isDemoMode) {
          triggerMagicFeedback(settings.language === 'tr' ? "Yeni bir oturuma hazır mısın?" : "Ready for a new session?");
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [settings.language]);

  const refreshLocalState = () => {
    setClients(storageService.getClients());
    setRecords(storageService.getRecords());
    setTasks(storageService.getTasks());
    setReceipts(storageService.getReceipts());
    setSettings(storageService.getSettings());
  };

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
    triggerMagicFeedback(settings.language === 'tr' ? "Düğümler senkronize ediliyor..." : "Synchronizing nodes...");
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
    triggerMagicFeedback(settings.language === 'tr' ? "Bulut durumu güncellendi." : "Cloud state updated.");
  };

  const handleTestConnection = async () => {
    if (!newClientSheetUrl) return;
    setIsTestingConn(true);
    const success = await googleSheetService.testConnection(newClientSheetUrl, newClientName || "Test Client");
    triggerMagicFeedback(success ? (settings.language === 'tr' ? "Bağlantı Aktif" : "Link Active") : (settings.language === 'tr' ? "Doğrulama Başarısız" : "Verification Failed"));
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
    if (newSettings.isDemoMode && !settings.isDemoMode) {
      storageService.generateDemoData();
      refreshLocalState();
      triggerMagicFeedback(settings.language === 'tr' ? "Stratejik demo verileri yüklendi." : "Strategic demo data loaded.");
    }
  };

  const handleLanguageChange = (lang: Locale) => {
    const updated = { ...settings, language: lang };
    setSettings(updated);
    storageService.saveSettings(updated);
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
          category: result.category || (settings.language === 'tr' ? 'Derin Çalışma' : 'Deep Work'),
          date: new Date().toISOString(),
          startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          endTime: new Date(Date.now() + (result.durationMinutes || 60)*60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
        triggerMagicFeedback(result.message || (settings.language === 'tr' ? "Döngü kaydedildi." : "Cycle committed."));
      } else if (result.type === 'sync') {
        await handleBulkSync();
      } else if (result.type === 'expense') {
        setActiveTab('accounts');
        triggerMagicFeedback(settings.language === 'tr' ? "Gider modu aktif." : "Expense mode activated.");
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
        triggerMagicFeedback(settings.language === 'tr' ? "İş listesine eklendi." : "Backlog item added.");
      }
    } catch (err) {
      triggerMagicFeedback(settings.language === 'tr' ? "İşlemci hatası." : "Processor error.");
    }
    setSmartInput('');
    setLoadingAction(false);
  };

  const handleRefreshStrategy = async () => {
    setStrategyLoading(true);
    try {
      const [newForecast, newHealth] = await Promise.all([
        getStrategicForecast(filteredRecords, filteredReceipts, activeClient),
        analyzeClientHealth(records, receipts, clients)
      ]);
      setForecast(newForecast);
      setHealthData(newHealth);
    } catch (e) {
      triggerMagicFeedback(settings.language === 'tr' ? "Zeka analizi başarısız." : "Intelligence analysis failed.");
    }
    setStrategyLoading(false);
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
    triggerMagicFeedback(settings.language === 'tr' ? "Gemini Vision işleniyor..." : "Gemini Vision processing...");
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
            vendor: result.vendor || (settings.language === 'tr' ? 'Bilinmeyen' : 'Unknown'),
            amount: result.amount || 0,
            category: result.category || (settings.language === 'tr' ? 'Genel' : 'General'),
            notes: 'AI Optik Tarama',
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
          triggerMagicFeedback(`${CURRENCY_SYMBOLS[activeClient.currency]}${result.amount}`);
        } else {
          triggerMagicFeedback(settings.language === 'tr' ? "Analiz yetersiz." : "Analysis inconclusive.");
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      triggerMagicFeedback("OCR Error.");
      setIsScanning(false);
    }
  };

  const pendingCount = records.filter(r => r.syncStatus !== 'synced').length + receipts.filter(r => r.syncStatus !== 'synced').length;

  const NAV_ITEMS = [
    { id: 'track', label: t.nav.track, icon: 'timer' },
    { id: 'calendar', label: t.nav.calendar, icon: 'calendar_month' },
    { id: 'strategy', label: t.nav.strategy, icon: 'insights' },
    { id: 'tasks', label: t.nav.tasks, icon: 'checklist' },
    { id: 'accounts', label: t.nav.accounts, icon: 'receipt_long' },
    { id: 'clients', label: t.nav.clients, icon: 'groups' },
    { id: 'settings', label: t.nav.settings, icon: 'settings' },
  ] as const;

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white pb-24">
      <CloudSetupGuide isOpen={showSetupGuide} onClose={() => setShowSetupGuide(false)} language={settings.language} />
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      
      <AnimatePresence>
        {magicFeedback && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-8 py-4 rounded-full text-xs font-bold shadow-2xl flex items-center gap-4 border border-white/10">
            <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
            {magicFeedback}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md vercel-border border-t-0 border-x-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('track')}>
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
              </div>
              <span className="font-black text-xl tracking-tighter uppercase italic">MESA CHRONOS</span>
            </div>
            
            <nav className="hidden xl:flex items-center gap-8">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all py-2 border-b-2 ${activeTab === item.id ? 'text-black border-black' : 'text-gray-300 border-transparent hover:text-black'}`}
                >
                  <span className="material-symbols-outlined !text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
             {/* Language Selector */}
             <div className="vercel-border rounded-xl px-4 py-2 flex items-center gap-3 bg-gray-50/50">
              <span className="material-symbols-outlined text-gray-400 !text-sm">translate</span>
              <select value={settings.language} onChange={(e) => handleLanguageChange(e.target.value as Locale)} className="bg-transparent text-[10px] font-black focus:outline-none appearance-none cursor-pointer uppercase tracking-widest outline-none">
                <option value="tr">TR</option>
                <option value="en">EN</option>
              </select>
            </div>

             <div className="vercel-border rounded-xl px-4 py-2 flex items-center gap-3 bg-gray-50/50">
              <span className="material-symbols-outlined text-gray-400 !text-sm">payments</span>
              <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value as CurrencyCode)} className="bg-transparent text-[10px] font-black focus:outline-none appearance-none cursor-pointer uppercase tracking-widest outline-none">
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="TRY">TRY</option>
              </select>
            </div>

             <div className="vercel-border rounded-xl px-4 py-2 flex items-center gap-3 bg-gray-50/50">
              <span className="material-symbols-outlined text-gray-400 !text-sm">person</span>
              <select value={activeClientId} onChange={(e) => setActiveClientId(e.target.value)} className="bg-transparent text-[10px] font-black focus:outline-none appearance-none cursor-pointer uppercase tracking-widest max-w-[120px] truncate outline-none">
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-20">
        <AnimatePresence mode="wait">
          {activeTab === 'track' && (
            <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center space-y-20">
              <div className="w-full max-w-4xl">
                <form onSubmit={handleMagicExecute} className="relative magic-bar-focus transition-all rounded-3xl overflow-hidden bg-white vercel-border p-2 group shadow-2xl">
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400">
                    <span className="material-symbols-outlined !text-xl">auto_awesome</span>
                  </div>
                  <input type="text" value={smartInput} onChange={(e) => setSmartInput(e.target.value)} placeholder={t.track.placeholder} className="w-full bg-transparent pl-16 pr-48 py-6 text-base font-bold outline-none placeholder:text-gray-200" />
                  <button type="submit" disabled={loadingAction} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                    {loadingAction ? t.track.processing : t.track.execute}
                  </button>
                </form>
              </div>

              <div className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                   <div className="lg:col-span-7 vercel-card rounded-[40px] p-12 bg-gray-50/10 shadow-sm">
                      <TimerDisplay onRecordComplete={handleRecordComplete} ref={timerRef} language={settings.language} />
                   </div>
                   <div className="lg:col-span-5 space-y-8">
                      <div className="vercel-card rounded-[40px] p-10 bg-black text-white border-none shadow-2xl relative overflow-hidden group">
                         <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8 flex items-center gap-2">
                           <span className="material-symbols-outlined !text-sm">visibility</span>
                           {t.track.visionTitle}
                         </h4>
                         <button disabled={isScanning} onClick={() => fileInputRef.current?.click()} className="w-full py-12 rounded-3xl border-2 border-dashed border-white/10 text-[10px] font-black uppercase tracking-widest hover:border-white hover:bg-white/5 transition-all flex flex-col items-center gap-6">
                            {isScanning ? <span className="material-symbols-outlined animate-spin !text-4xl">progress_activity</span> : <><span className="material-symbols-outlined !text-5xl opacity-40 group-hover:opacity-100">add_a_photo</span>{t.track.visionButton}</>}
                         </button>
                         <p className="mt-6 text-[9px] font-black uppercase text-gray-600 tracking-[0.2em] text-center">{t.track.visionPipeline}</p>
                      </div>
                      <div className="vercel-card rounded-[40px] p-10 border-l-[12px] border-l-black">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{t.track.performanceTitle}</h4>
                         <p className="text-4xl font-black italic tracking-tighter">{(filteredRecords.reduce((acc, r) => acc + r.durationMinutes, 0) / 60).toFixed(1)}h {t.track.totalHours}</p>
                         <div className="mt-6 flex items-center gap-2 text-green-500">
                           <span className="material-symbols-outlined !text-sm">trending_up</span>
                           <span className="text-[10px] font-black uppercase tracking-widest">{t.track.performanceGrowth}</span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="w-full pt-16 space-y-20 border-t border-gray-100">
                <MonthlySummary records={filteredRecords} language={settings.language} />
                <HistoryList records={filteredRecords} onDelete={(id) => { const updated = records.filter(x => x.id !== id); setRecords(updated); storageService.saveRecords(updated); }} onUpdate={handleUpdateRecord} currency={activeClient.currency} language={settings.language} />
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><CalendarView records={filteredRecords} language={settings.language} /></motion.div>}
          {activeTab === 'strategy' && <motion.div key="strategy" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><StrategyDashboard healthData={healthData} forecast={forecast} onRefresh={handleRefreshStrategy} loading={strategyLoading} language={settings.language} /></motion.div>}
          {activeTab === 'tasks' && <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><TaskDashboard tasks={filteredTasks} onTasksChange={(newTasks) => handleUpdateTasks([...tasks.filter(t => t.clientId !== activeClient.id), ...newTasks])} onStartTask={handleStartTask} language={settings.language} /></motion.div>}
          {activeTab === 'accounts' && <motion.div key="accounts" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ReceiptManager receipts={filteredReceipts} onUpdate={handleUpdateReceipts} onScan={() => fileInputRef.current?.click()} isScanning={isScanning} clientCurrency={activeClient.currency} displayCurrency={displayCurrency} convertAmount={convertAmount} language={settings.language} /></motion.div>}

          {activeTab === 'clients' && (
            <motion.div key="clients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-12">
              <div className="vercel-card rounded-[40px] p-12 space-y-10">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined !text-sm">add_box</span>
                  {t.clients.title}
                </h3>
                <div className="space-y-6">
                  <input className="w-full vercel-border rounded-2xl px-6 py-5 text-base font-black outline-none focus:border-black placeholder:text-gray-200" placeholder={t.clients.namePlaceholder} value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                  <div className="grid grid-cols-2 gap-6">
                    <input type="number" className="vercel-border rounded-2xl px-6 py-5 text-base font-bold outline-none focus:border-black" placeholder={t.clients.ratePlaceholder} value={newClientRate} onChange={(e) => setNewClientRate(Number(e.target.value))} />
                    <select className="vercel-border rounded-2xl px-6 py-5 text-xs font-black outline-none bg-white uppercase tracking-widest" value={newClientCurrency} onChange={(e) => setNewClientCurrency(e.target.value as CurrencyCode)}>
                      <option value="USD">USD</option><option value="EUR">EUR</option><option value="TRY">TRY</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                      <span className="material-symbols-outlined !text-xs">cloud</span>
                      {t.clients.endpointLabel}
                    </label>
                    <div className="flex gap-3">
                      <input className="flex-1 vercel-border rounded-2xl px-6 py-5 text-[11px] font-bold outline-none focus:border-black" placeholder="https://script.google.com/macros/s/..." value={newClientSheetUrl} onChange={(e) => setNewClientSheetUrl(e.target.value)} />
                      <button onClick={handleTestConnection} disabled={isTestingConn || !newClientSheetUrl} className="px-8 vercel-border rounded-2xl bg-gray-50 hover:bg-black hover:text-white transition-all text-[9px] font-black uppercase disabled:opacity-30">
                        {isTestingConn ? "..." : t.clients.linkButton}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => { if (!newClientName) return; const client: Client = { id: crypto.randomUUID(), name: newClientName, hourlyRate: newClientRate, currency: newClientCurrency, sheetUrl: newClientSheetUrl }; const updated = [...clients, client]; setClients(updated); storageService.saveClients(updated); setNewClientName(''); setNewClientSheetUrl(''); setActiveClientId(client.id); triggerMagicFeedback(`${newClientName} bağlamı başlatıldı.`); }} className="w-full bg-black text-white py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:-translate-y-1 transition-all">{t.clients.secureButton}</button>
                </div>
              </div>
              
              <div className="vercel-card rounded-[40px] p-12 bg-gray-50/30 flex items-center justify-between border-dashed border-2">
                <div>
                  <h4 className="text-lg font-black italic tracking-tighter">{t.clients.persistenceTitle}</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{t.clients.persistenceSubtitle}</p>
                </div>
                <button onClick={() => setShowSetupGuide(true)} className="px-10 py-4 bg-white vercel-border rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm hover:shadow-lg transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined !text-sm">help_outline</span>
                  {t.clients.guideButton}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Settings settings={settings} onUpdate={handleUpdateSettings} onExport={() => { const data = JSON.stringify({ clients, records, receipts, tasks, settings }, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `mesa_kasa_${new Date().toISOString().split('T')[0]}.json`; a.click(); }} onClearData={() => { if (confirm(settings.language === 'tr' ? "Tüm sistem bağlamlarını silmek istediğine emin misin?" : "Are you sure you want to purge all contexts?")) { localStorage.clear(); window.location.reload(); } }} language={settings.language} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-2xl border-t border-gray-100 flex items-center px-10 justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest z-[60]">
        <div className="flex items-center gap-8">
          <span className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${pendingCount === 0 ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`}></div> 
            {settings.language === 'tr' ? 'Bulut Bağlantısı' : 'Cloud Link'}: {activeClient.sheetUrl ? (pendingCount === 0 ? t.header.secure : t.header.unsynced) : t.header.disconnected}
          </span>
          {pendingCount > 0 && (
            <button onClick={handleBulkSync} className="text-black bg-amber-400 px-5 py-2 rounded-xl flex items-center gap-2 shadow-sm hover:scale-105 transition-all">
              <span className="material-symbols-outlined !text-sm">sync</span>
              {pendingCount} {settings.language === 'tr' ? 'Kaydı Kaydet' : 'Commits Pending'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-8">
          <span className="opacity-50 flex items-center gap-2">
            <span className="material-symbols-outlined !text-sm">public</span>
            {systemLocation}
          </span>
          <span className="bg-gray-100 px-4 py-2 rounded-lg text-black">MESA CHRONOS Build 3.7.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
