
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimerDisplay from './components/TimerDisplay';
import HistoryList from './components/HistoryList';
import MonthlySummary from './components/MonthlySummary';
import StrategyDashboard from './components/StrategyDashboard';
import CalendarView from './components/CalendarView';
import { WorkRecord, Client, ReceiptRecord, ClientHealth, CurrencyCode } from './types';
import { storageService } from './services/storageService';
import { parseReceipt, analyzeClientHealth, getStrategicForecast, parseSmartCommand } from './services/geminiService';
import { googleSheetService } from './services/googleSheetService';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  TRY: '₺'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'track' | 'calendar' | 'accounts' | 'strategy' | 'invoices' | 'clients'>('track');
  const [clients, setClients] = useState<Client[]>(() => storageService.getClients());
  const [activeClientId, setActiveClientId] = useState(() => {
    const stored = storageService.getClients();
    return stored.length > 0 ? stored[0].id : 'default';
  });
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [healthData, setHealthData] = useState<ClientHealth[]>([]);
  const [forecast, setForecast] = useState('');
  const [magicFeedback, setMagicFeedback] = useState<string | null>(null);
  const [systemLocation, setSystemLocation] = useState<string>('');

  // Fix: Added missing state variables for client creation form
  const [newClientName, setNewClientName] = useState('');
  const [newClientRate, setNewClientRate] = useState(50);
  const [newClientCurrency, setNewClientCurrency] = useState<CurrencyCode>('USD');
  const [newClientSheetUrl, setNewClientSheetUrl] = useState('');

  useEffect(() => {
    setClients(storageService.getClients());
    setRecords(storageService.getRecords());
    setReceipts(storageService.getReceipts());
    setSystemLocation(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Visibility API Listener - Remind user to work
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const active = storageService.getActiveTimer();
        if (!active) {
          triggerMagicFeedback("Welcome back. Ready to initialize a session?");
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const activeClient = clients.find(c => c.id === activeClientId) || clients[0] || {
    id: 'fallback',
    name: 'Unknown',
    hourlyRate: 0,
    currency: 'USD' as CurrencyCode,
    sheetUrl: ''
  };

  const filteredRecords = records.filter(r => r.clientId === activeClient.id);
  const filteredReceipts = receipts.filter(r => r.clientId === activeClient.id);

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
    
    if (activeClient.sheetUrl) {
      handleSync(record);
    }
  };

  const handleSync = async (record: WorkRecord) => {
    if (!activeClient.sheetUrl) return;
    const success = await googleSheetService.syncRecord(record, activeClient.sheetUrl);
    if (success) {
      handleUpdateRecord(record.id, { syncStatus: 'synced' });
    } else {
      handleUpdateRecord(record.id, { syncStatus: 'failed' });
    }
  };

  const handleUpdateRecord = (id: string, updates: Partial<WorkRecord>) => {
    const updated = records.map(r => r.id === id ? { ...r, ...updates } : r);
    setRecords(updated);
    storageService.saveRecords(updated);
  };

  const triggerMagicFeedback = (msg: string) => {
    setMagicFeedback(msg);
    setTimeout(() => setMagicFeedback(null), 4000);
  };

  const handleMagicExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput) return;
    setLoadingStrategy(true);
    
    try {
      const result = await parseSmartCommand(smartInput, clients);
      
      switch (result.type) {
        case 'work':
          handleRecordComplete({
            durationMinutes: result.durationMinutes || 60,
            notes: result.notes || smartInput,
            category: result.category || 'Deep Work',
            date: new Date().toISOString(),
            startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            endTime: new Date(Date.now() + (result.durationMinutes || 60)*60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          });
          triggerMagicFeedback(result.message || "Work session logged and optimized.");
          break;
        case 'sync':
          const pending = records.filter(r => r.syncStatus === 'pending');
          for (const r of pending) {
            const cl = clients.find(c => c.id === r.clientId);
            if (cl?.sheetUrl) await handleSync(r);
          }
          triggerMagicFeedback(`Batch synchronized ${pending.length} records to Google Drive.`);
          break;
        case 'report':
          setActiveTab('strategy');
          triggerMagicFeedback("Synthesizing strategic financial report...");
          break;
        case 'expense':
          const newRec: ReceiptRecord = {
            id: crypto.randomUUID(),
            clientId: activeClient.id,
            date: new Date().toISOString().split('T')[0],
            vendor: result.vendor || 'Magic Vendor',
            amount: result.amount || 0,
            category: result.category || 'Expense',
            notes: result.notes || 'AI Parsed'
          };
          setReceipts([newRec, ...receipts]);
          storageService.saveReceipts([newRec, ...receipts]);
          triggerMagicFeedback(`Expense of ${CURRENCY_SYMBOLS[activeClient.currency]}${result.amount} logged.`);
          break;
        default:
          triggerMagicFeedback("Command interpreted but no action taken.");
      }
    } catch (err) {
      console.error(err);
      triggerMagicFeedback("Magic failed. System recalibrating...");
    }
    
    setSmartInput('');
    setLoadingStrategy(false);
  };

  const handleShare = () => {
    const totalMinutes = filteredRecords.reduce((acc, r) => acc + r.durationMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const earnings = ( (totalMinutes / 60) * activeClient.hourlyRate ).toFixed(2);
    const summary = `Chronos Log — ${activeClient.name}\nTotal Output: ${totalHours}h\nExpected: ${CURRENCY_SYMBOLS[activeClient.currency]} ${earnings}\nStatus: Active`;
    
    navigator.clipboard.writeText(summary);
    triggerMagicFeedback('Summary copied to clipboard. Shareable insights ready.');
  };

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      {/* Magic Notification Overlay */}
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
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="font-bold text-lg tracking-tighter">Chronos</span>
            </motion.div>
            
            <nav className="hidden lg:flex items-center gap-6">
              {(['track', 'calendar', 'accounts', 'strategy', 'invoices', 'clients'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative text-xs font-bold uppercase tracking-widest transition-colors py-2 ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col text-right mr-4">
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Node Path</span>
               <span className="text-[10px] font-bold uppercase">{systemLocation}</span>
             </div>
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={handleShare}
               className="hidden sm:flex vercel-border px-3 py-1.5 rounded-md text-[10px] font-bold uppercase hover:bg-gray-50 items-center gap-2"
             >
               <i className="fa-solid fa-share-nodes"></i> Share
             </motion.button>
             <div className="vercel-border rounded-md px-3 py-1.5 flex items-center gap-2 bg-gray-50 group transition-colors hover:border-black">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-black">Port</span>
              <select 
                value={activeClientId}
                onChange={(e) => setActiveClientId(e.target.value)}
                className="bg-transparent text-xs font-black focus:outline-none appearance-none cursor-pointer pr-4 uppercase"
              >
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Magic Execute Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 max-w-3xl"
        >
          <form onSubmit={handleMagicExecute} className="relative magic-bar-focus transition-all rounded-2xl overflow-hidden bg-white vercel-border p-1">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              {loadingStrategy ? <i className="fa-solid fa-sparkles animate-spin text-black"></i> : <i className="fa-solid fa-terminal text-[10px]"></i>}
            </div>
            <input 
              type="text" 
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              placeholder="Magic Execute: 'Log 2h dev' or 'Sync pending to drive'..."
              className="w-full bg-transparent pl-12 pr-40 py-4 text-sm font-medium outline-none placeholder:text-gray-300"
            />
            <button 
              type="submit"
              disabled={loadingStrategy}
              className="absolute right-2 top-1/2 -translate-y-1/2 magic-gradient text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loadingStrategy ? "Processing..." : <><i className="fa-solid fa-wand-magic-sparkles"></i> Magic Execute</>}
            </button>
          </form>
          <div className="mt-4 flex gap-3 px-2">
             <span className="text-[9px] font-bold text-gray-300 uppercase">Suggested:</span>
             <button onClick={() => setSmartInput("Sync all logs to Google Drive")} className="text-[9px] font-bold text-gray-400 hover:text-black transition-colors">Sync Drive</button>
             <button onClick={() => setSmartInput("Generate profit report")} className="text-[9px] font-bold text-gray-400 hover:text-black transition-colors">Profit Report</button>
             <button onClick={() => setSmartInput("Log 1 hour for design")} className="text-[9px] font-bold text-gray-400 hover:text-black transition-colors">Quick Log</button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'track' && (
            <motion.div 
              key="track"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                  <TimerDisplay onRecordComplete={handleRecordComplete} />
                </div>
                <div className="lg:col-span-8">
                  <MonthlySummary records={filteredRecords} />
                </div>
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
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <CalendarView records={filteredRecords} />
            </motion.div>
          )}

          {activeTab === 'strategy' && (
            <motion.div key="strategy" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <StrategyDashboard 
                healthData={healthData} 
                forecast={forecast} 
                onRefresh={async () => {
                  setLoadingStrategy(true);
                  const [h, f] = await Promise.all([
                    analyzeClientHealth(records, receipts, clients),
                    getStrategicForecast(filteredRecords, filteredReceipts, activeClient)
                  ]);
                  setHealthData(h);
                  setForecast(f);
                  setLoadingStrategy(false);
                }} 
                loading={loadingStrategy} 
              />
            </motion.div>
          )}

          {activeTab === 'clients' && (
            <motion.div key="clients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-12">
              <div className="vercel-card rounded-xl p-8 space-y-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Client Lifecycle</h3>
                <div className="space-y-4">
                  <input 
                    className="w-full vercel-border rounded px-4 py-3 text-sm focus:border-black outline-none font-bold"
                    placeholder="CLIENT NAME"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                  <div className="flex gap-4">
                    <input 
                      type="number" 
                      className="flex-1 vercel-border rounded px-4 py-3 text-sm focus:border-black outline-none font-mono"
                      placeholder="RATE"
                      value={newClientRate}
                      onChange={(e) => setNewClientRate(Number(e.target.value))}
                    />
                    <select 
                      className="vercel-border rounded px-4 py-3 text-sm focus:border-black outline-none bg-white font-bold"
                      value={newClientCurrency}
                      onChange={(e) => setNewClientCurrency(e.target.value as CurrencyCode)}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>
                  <input 
                    className="w-full vercel-border rounded px-4 py-3 text-sm focus:border-black outline-none"
                    placeholder="GOOGLE SHEETS APP URL (OPTIONAL)"
                    value={newClientSheetUrl}
                    onChange={(e) => setNewClientSheetUrl(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      if (!newClientName) return;
                      const client: Client = {
                        id: crypto.randomUUID(),
                        name: newClientName,
                        hourlyRate: newClientRate,
                        currency: newClientCurrency,
                        sheetUrl: newClientSheetUrl
                      };
                      const updated = [...clients, client];
                      setClients(updated);
                      storageService.saveClients(updated);
                      setNewClientName('');
                      setActiveClientId(client.id);
                      triggerMagicFeedback('Contract deployed and synchronized.');
                    }}
                    className="w-full bg-black text-white py-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-800"
                  >
                    Deploy Contract
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm vercel-border border-t-0 border-x-0 h-10 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              Synchronized
            </span>
            <span>{records.length} Cycles Logged</span>
          </div>
          <div className="hover:text-black cursor-help transition-colors">
            End of Line — System Ready
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
