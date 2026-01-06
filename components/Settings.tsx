
import React from 'react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onClearData: () => void;
  onExport: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onClearData, onExport }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="border-b border-gray-100 pb-8">
        <h2 className="text-4xl font-black tracking-tighter">Preferences</h2>
        <p className="text-gray-400 text-[10px] mt-1 font-black uppercase tracking-widest">Core system configuration</p>
      </div>

      <div className="space-y-8">
        <section className="vercel-card rounded-xl p-8 space-y-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display & Performance</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Daily Work Goal</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Drives calendar intensity metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={settings.dailyGoalHours}
                onChange={(e) => onUpdate({ ...settings, dailyGoalHours: Number(e.target.value) })}
                className="w-16 vercel-border rounded px-2 py-1 text-sm font-bold text-center outline-none"
              />
              <span className="text-xs font-bold text-gray-300">HRS</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Cloud Auto-Sync</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Automatic Google Sheet push</p>
            </div>
            <button 
              onClick={() => onUpdate({ ...settings, autoSync: !settings.autoSync })}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.autoSync ? 'bg-black' : 'bg-gray-200'}`}
            >
              <div 
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
                style={{ left: settings.autoSync ? '24px' : '4px' }}
              />
            </button>
          </div>
        </section>

        <section className="vercel-card rounded-xl p-8 space-y-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data & Sovereignty</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onExport}
              className="flex flex-col items-center justify-center gap-2 p-6 vercel-border rounded-xl hover:bg-black hover:text-white transition-all group"
            >
              <i className="fa-solid fa-download text-lg text-gray-300 group-hover:text-white"></i>
              <span className="text-[8px] font-black uppercase tracking-widest">Export JSON</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex flex-col items-center justify-center gap-2 p-6 vercel-border rounded-xl hover:bg-black hover:text-white transition-all group"
            >
              <i className="fa-solid fa-print text-lg text-gray-300 group-hover:text-white"></i>
              <span className="text-[8px] font-black uppercase tracking-widest">Generate PDF</span>
            </button>
          </div>

          <div className="pt-4 border-t border-gray-50">
            <button 
              onClick={onClearData}
              className="w-full py-4 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-colors"
            >
              Wipe Local Database
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
