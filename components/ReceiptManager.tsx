
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReceiptRecord, CurrencyCode } from '../types';

interface ReceiptManagerProps {
  receipts: ReceiptRecord[];
  onUpdate: (receipts: ReceiptRecord[]) => void;
  onScan: () => void;
  isScanning: boolean;
  clientCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  convertAmount: (amount: number, from: CurrencyCode, to: CurrencyCode) => number;
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
  convertAmount
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

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
    <div className="space-y-12">
      <div className="flex justify-between items-end border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Accounts</h2>
          <p className="text-gray-400 text-[10px] mt-1 font-black uppercase tracking-widest">Financial ledger & expense records</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Total Converted ({displayCurrency})
          </p>
          <p className="text-2xl font-black">
            {CURRENCY_SYMBOLS[displayCurrency]}{totalConverted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-center">
          <button 
            disabled={isScanning}
            onClick={onScan}
            className="magic-gradient text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50"
          >
            {isScanning ? (
              <i className="fa-solid fa-spinner animate-spin"></i>
            ) : (
              <i className="fa-solid fa-camera-retro text-lg"></i>
            )}
            {isScanning ? "AI Analyzing..." : "Scan New Receipt"}
          </button>
        </div>

        <div className="vercel-border rounded-xl bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Amount ({displayCurrency})</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
                        exit={{ opacity: 0, x: -20 }}
                        className={`hover:bg-gray-50/50 transition-colors group ${isEditing ? 'bg-gray-50' : ''}`}
                      >
                        <td className="px-6 py-4 text-xs font-mono font-bold text-gray-500">
                          {isEditing ? (
                            <input 
                              type="date"
                              value={receipt.date}
                              onChange={(e) => updateField(receipt.id, 'date', e.target.value)}
                              className="bg-white border vercel-border rounded px-2 py-1 outline-none w-32"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              {receipt.date}
                              {receipt.syncStatus === 'synced' && (
                                <i className="fa-solid fa-cloud-check text-green-500 text-[10px]" title="Synced to Drive"></i>
                              )}
                              {receipt.syncStatus === 'failed' && (
                                <i className="fa-solid fa-cloud-exclamation text-red-400 text-[10px]" title="Sync Failed"></i>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-black">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={receipt.vendor}
                              onChange={(e) => updateField(receipt.id, 'vendor', e.target.value)}
                              className="bg-white border vercel-border rounded px-2 py-1 outline-none w-full max-w-[150px]"
                            />
                          ) : (
                            <>
                              {receipt.vendor}
                              {receipt.isTaxDeductible && (
                                <span className="ml-2 text-[8px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded uppercase tracking-widest">Tax</span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={receipt.category}
                              onChange={(e) => updateField(receipt.id, 'category', e.target.value)}
                              className="bg-white border vercel-border rounded px-2 py-1 outline-none w-full max-w-[100px]"
                            />
                          ) : (
                            <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded">
                              {receipt.category}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[10px] text-gray-400">{CURRENCY_SYMBOLS[clientCurrency]}</span>
                              <input 
                                type="number"
                                value={receipt.amount}
                                onChange={(e) => updateField(receipt.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="bg-white border vercel-border rounded px-2 py-1 outline-none w-24 text-right"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span>{CURRENCY_SYMBOLS[displayCurrency]}{convertedVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              {displayCurrency !== clientCurrency && (
                                <span className="text-[8px] text-gray-300 font-black uppercase tracking-widest">
                                  Orig: {CURRENCY_SYMBOLS[clientCurrency]}{receipt.amount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`flex justify-end gap-3 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isEditing ? (
                              <button 
                                onClick={() => setEditingId(null)}
                                className="text-black hover:scale-110 transition-transform"
                                title="Commit Changes"
                              >
                                <i className="fa-solid fa-check text-xs"></i>
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={() => setEditingId(receipt.id)}
                                  className="text-gray-400 hover:text-black"
                                  title="Edit Entry"
                                >
                                  <i className="fa-solid fa-pen-to-square text-xs"></i>
                                </button>
                                <button 
                                  onClick={() => deleteReceipt(receipt.id)}
                                  className="text-gray-400 hover:text-red-500"
                                  title="Purge Entry"
                                >
                                  <i className="fa-solid fa-trash-can text-xs"></i>
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
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">
                      No financial records committed.
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
