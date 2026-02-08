
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Import Locale and translations to fix property missing error and implement i18n
import { ReceiptRecord, CurrencyCode, Locale } from '../types';
import { translations } from '../translations';

interface ReceiptManagerProps {
  receipts: ReceiptRecord[];
  onUpdate: (receipts: ReceiptRecord[]) => void;
  onScan: () => void;
  isScanning: boolean;
  clientCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  convertAmount: (amount: number, from: CurrencyCode, to: CurrencyCode) => number;
  // Added language to props interface
  language: Locale;
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  TRY: '₺'
};

const ReceiptManager: React.FC<ReceiptManagerProps> = ({ 
  receipts, 
  onUpdate, 
  onScan, 
  isScanning, 
  clientCurrency,
  displayCurrency,
  convertAmount,
  language // Added language destructuring
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = translations[language];

  const deleteReceipt = (id: string) => {
    onUpdate(receipts.filter(r => r.id !== id));
  };

  const updateField = (id: string, field: keyof ReceiptRecord, value: any) => {
    const updated = receipts.map(r => r.id === id ? { ...r, [field]: value, syncStatus: 'pending' as const } : r);
    onUpdate(updated);
  };

  const totalConverted = receipts.reduce((acc, r) => {
    const converted = convertAmount(r.amount, clientCurrency, displayCurrency);
    return acc + converted;
  }, 0);

  return (
    <div className="space-y-16">
      <div className="flex justify-between items-end border-b border-gray-100 pb-12">
        <div>
          <h2 className="text-5xl font-black tracking-tighter">{t.accounts.title}</h2>
          <p className="text-gray-400 text-[11px] mt-2 font-black uppercase tracking-[0.3em]">{t.accounts.subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-end gap-2">
            <span className="material-symbols-outlined !text-xs">account_balance_wallet</span>
            {t.accounts.totalConverted} ({displayCurrency})
          </p>
          <p className="text-4xl font-black italic tracking-tighter">
            {CURRENCY_SYMBOLS[displayCurrency]}{totalConverted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex justify-center">
          <button 
            disabled={isScanning}
            onClick={onScan}
            className="magic-gradient text-white px-12 py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-5 disabled:opacity-50"
          >
            {isScanning ? (
              <span className="material-symbols-outlined animate-spin !text-2xl">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined !text-2xl">photo_camera</span>
            )}
            {isScanning ? t.accounts.scanning : t.accounts.scanButton}
          </button>
        </div>

        <div className="vercel-border rounded-[40px] bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/20">
                  <th className="px-10 py-6">{t.accounts.table.timestamp}</th>
                  <th className="px-10 py-6">{t.accounts.table.vendor}</th>
                  <th className="px-10 py-6">{t.accounts.table.sector}</th>
                  <th className="px-10 py-6 text-right">{t.accounts.table.value} ({displayCurrency})</th>
                  <th className="px-10 py-6 text-right">{t.history.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {receipts.map((receipt) => {
                    const isEditing = editingId === receipt.id;
                    const convertedVal = convertAmount(receipt.amount, clientCurrency, displayCurrency);
                    
                    return (
                      <motion.tr 
                        key={receipt.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`hover:bg-gray-50/10 transition-colors group ${isEditing ? 'bg-gray-50/50' : ''}`}
                      >
                        <td className="px-10 py-6 text-xs font-mono font-bold text-gray-500 uppercase">
                          {isEditing ? (
                            <input 
                              type="date"
                              value={receipt.date}
                              onChange={(e) => updateField(receipt.id, 'date', e.target.value)}
                              className="bg-white vercel-border rounded-lg px-3 py-2 outline-none w-36"
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              {receipt.date}
                              {receipt.syncStatus === 'synced' && (
                                <span className="material-symbols-outlined text-green-500 !text-sm" title="Cloud Verified">cloud_done</span>
                              )}
                              {receipt.syncStatus === 'syncing' && (
                                <span className="material-symbols-outlined animate-spin text-gray-300 !text-sm">sync</span>
                              )}
                              {receipt.syncStatus === 'failed' && (
                                <span className="material-symbols-outlined text-red-400 !text-sm" title="Link Failure">cloud_off</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-10 py-6 font-black text-black">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={receipt.vendor}
                              onChange={(e) => updateField(receipt.id, 'vendor', e.target.value)}
                              className="bg-white vercel-border rounded-lg px-3 py-2 outline-none w-full max-w-[180px]"
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              {receipt.vendor}
                              {receipt.isTaxDeductible && (
                                <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-[0.2em]">{t.accounts.table.deductible}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-10 py-6">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={receipt.category}
                              onChange={(e) => updateField(receipt.id, 'category', e.target.value)}
                              className="bg-white vercel-border rounded-lg px-3 py-2 outline-none w-full max-w-[120px]"
                            />
                          ) : (
                            <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-100 px-3 py-1.5 rounded-lg tracking-widest">
                              {receipt.category}
                            </span>
                          )}
                        </td>
                        <td className="px-10 py-6 text-right font-mono font-black">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-[10px] text-gray-300 font-black">{CURRENCY_SYMBOLS[clientCurrency]}</span>
                              <input 
                                type="number"
                                value={receipt.amount}
                                onChange={(e) => updateField(receipt.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="bg-white vercel-border rounded-lg px-3 py-2 outline-none w-28 text-right"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-black">{CURRENCY_SYMBOLS[displayCurrency]}{convertedVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              {displayCurrency !== clientCurrency && (
                                <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest mt-1">
                                  {CURRENCY_SYMBOLS[clientCurrency]}{receipt.amount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className={`flex justify-end gap-5 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isEditing ? (
                              <button onClick={() => setEditingId(null)} className="text-black hover:scale-125 transition-transform" title="Commit Changes">
                                <span className="material-symbols-outlined !text-lg">check_circle</span>
                              </button>
                            ) : (
                              <>
                                <button onClick={() => setEditingId(receipt.id)} className="text-gray-300 hover:text-black transition-colors" title="Modify Record">
                                  <span className="material-symbols-outlined !text-lg">edit</span>
                                </button>
                                <button onClick={() => deleteReceipt(receipt.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Purge Record">
                                  <span className="material-symbols-outlined !text-lg">delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-10 py-24 text-center">
                       <span className="material-symbols-outlined text-gray-100 !text-6xl mb-4">analytics</span>
                       <p className="text-gray-300 text-[11px] font-black uppercase tracking-[0.3em]">Operational finances are clear.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptManager;
