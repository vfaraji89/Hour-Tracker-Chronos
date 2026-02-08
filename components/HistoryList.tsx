
import React, { useState } from 'react';
import { WorkRecord, CurrencyCode, Locale } from '../types';
import { translations } from '../translations';

interface HistoryListProps {
  records: WorkRecord[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WorkRecord>) => void;
  currency?: CurrencyCode;
  language: Locale;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, onDelete, onUpdate, currency = 'USD', language }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = translations[language];
  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="vercel-border rounded-[32px] overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        {sortedRecords.length === 0 ? (
          <div className="p-32 text-center">
            <span className="material-symbols-outlined text-gray-200 !text-6xl mb-4">inbox</span>
            <p className="text-gray-300 text-xs font-black uppercase tracking-widest">{t.history.empty}</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/30">
                <th className="px-10 py-6">{t.history.date}</th>
                <th className="px-10 py-6">{t.history.category}</th>
                <th className="px-10 py-6">{t.history.notes}</th>
                <th className="px-10 py-6 text-center">{t.history.duration}</th>
                <th className="px-10 py-6 text-right">{t.history.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-10 py-6 font-bold text-black">
                    <div className="flex items-center gap-3">
                      {new Date(record.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {record.syncStatus === 'synced' && (
                        <span className="material-symbols-outlined text-green-500 !text-sm" title="Cloud Verified">cloud_done</span>
                      )}
                      {record.syncStatus === 'syncing' && (
                        <span className="material-symbols-outlined animate-spin text-gray-300 !text-sm">sync</span>
                      )}
                      {record.syncStatus === 'failed' && (
                        <span className="material-symbols-outlined text-red-400 !text-sm" title="Link Failure">cloud_off</span>
                      )}
                    </div>
                    <span className="block text-[10px] text-gray-400 font-mono mt-1 uppercase">{record.startTime} — {record.endTime}</span>
                  </td>
                  <td className="px-10 py-6">
                    {editingId === record.id ? (
                      <select 
                        value={record.category}
                        onChange={(e) => onUpdate(record.id, { category: e.target.value })}
                        className="bg-white vercel-border rounded-lg px-3 py-2 text-xs font-black outline-none uppercase"
                      >
                        <option>{language === 'tr' ? 'Geliştirme' : 'Development'}</option>
                        <option>{language === 'tr' ? 'Derin Çalışma' : 'Deep Work'}</option>
                        <option>{language === 'tr' ? 'Planlama' : 'Planning'}</option>
                        <option>{language === 'tr' ? 'Toplantı' : 'Meeting'}</option>
                      </select>
                    ) : (
                      <span className="text-black font-black text-[9px] bg-gray-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                        {record.category}
                      </span>
                    )}
                  </td>
                  <td className="px-10 py-6 max-w-xs">
                    {editingId === record.id ? (
                      <input 
                        type="text"
                        value={record.notes}
                        onChange={(e) => onUpdate(record.id, { notes: e.target.value })}
                        onBlur={() => setEditingId(null)}
                        autoFocus
                        className="w-full bg-white vercel-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-black"
                      />
                    ) : (
                      <span 
                        onClick={() => setEditingId(record.id)}
                        className="text-gray-500 text-xs font-medium cursor-pointer hover:text-black transition-colors block truncate"
                      >
                        {record.notes || (language === 'tr' ? "Not girilmedi..." : "No notes...")}
                      </span>
                    )}
                  </td>
                  <td className="px-10 py-6 text-center font-mono font-bold text-xs text-black">
                    {Math.floor(record.durationMinutes / 60)}h {record.durationMinutes % 60}m
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingId(editingId === record.id ? null : record.id)}
                        className="text-gray-300 hover:text-black transition-colors"
                      >
                        <span className="material-symbols-outlined !text-lg">edit</span>
                      </button>
                      <button 
                        onClick={() => onDelete(record.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined !text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoryList;
