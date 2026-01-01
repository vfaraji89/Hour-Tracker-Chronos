
import React, { useState } from 'react';
import { WorkRecord, CurrencyCode } from '../types';

interface HistoryListProps {
  records: WorkRecord[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WorkRecord>) => void;
  currency?: CurrencyCode;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, onDelete, onUpdate, currency = 'USD' }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="vercel-border rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        {sortedRecords.length === 0 ? (
          <div className="p-20 text-center">
            <p className="text-gray-300 text-sm font-medium">History is currently empty.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Notes</th>
                <th className="px-6 py-4 font-bold text-center">Duration</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-black">
                    <div className="flex items-center gap-2">
                      {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {record.syncStatus === 'synced' && (
                        <i className="fa-solid fa-cloud-check text-green-500 text-[10px]" title="Synced to Drive"></i>
                      )}
                    </div>
                    <span className="block text-[10px] text-gray-400 font-mono mt-0.5">{record.startTime} – {record.endTime}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === record.id ? (
                      <select 
                        value={record.category}
                        onChange={(e) => onUpdate(record.id, { category: e.target.value })}
                        className="bg-white border rounded px-2 py-1 text-xs outline-none"
                      >
                        <option>Development</option>
                        <option>Deep Work</option>
                        <option>Planning</option>
                        <option>Meeting</option>
                      </select>
                    ) : (
                      <span className="text-black font-semibold text-xs bg-gray-100 px-2 py-1 rounded">
                        {record.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === record.id ? (
                      <input 
                        type="text"
                        value={record.notes}
                        onChange={(e) => onUpdate(record.id, { notes: e.target.value })}
                        onBlur={() => setEditingId(null)}
                        autoFocus
                        className="w-full bg-white border rounded px-2 py-1 text-xs outline-none"
                      />
                    ) : (
                      <span 
                        onClick={() => setEditingId(record.id)}
                        className="text-gray-500 text-xs cursor-pointer hover:text-black hover:underline"
                      >
                        {record.notes || "Click to add log..."}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-xs">
                    {Math.floor(record.durationMinutes / 60)}h {record.durationMinutes % 60}m
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingId(editingId === record.id ? null : record.id)}
                        className="text-gray-400 hover:text-black"
                        title="Edit Entry"
                      >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button 
                        onClick={() => onDelete(record.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Purge Entry"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
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
