
import React from 'react';
import { motion } from 'framer-motion';
import { AppSettings, Locale } from '../types';
import { translations } from '../translations';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onClearData: () => void;
  onExport: () => void;
  language: Locale;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onClearData, onExport, language }) => {
  const t = translations[language];

  return (
    <div className="max-w-3xl mx-auto space-y-16">
      <div className="border-b border-gray-100 pb-12">
        <h2 className="text-5xl font-black tracking-tighter">{t.settings.title}</h2>
        <p className="text-gray-400 text-[11px] mt-2 font-black uppercase tracking-[0.3em]">{t.settings.subtitle}</p>
      </div>

      <div className="space-y-10">
        <section className="vercel-card rounded-[40px] p-12 space-y-10 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="material-symbols-outlined !text-sm">tune</span>
            {t.settings.logicTitle}
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-black tracking-tight">{t.settings.goalLabel}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.settings.goalSub}</p>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                value={settings.dailyGoalHours}
                onChange={(e) => onUpdate({ ...settings, dailyGoalHours: Number(e.target.value) })}
                className="w-20 vercel-border rounded-xl px-4 py-3 text-sm font-black text-center outline-none focus:border-black"
              />
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{language === 'tr' ? 'Saat' : 'Hours'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-base font-black tracking-tight">{t.settings.syncLabel}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.settings.syncSub}</p>
            </div>
            <button 
              onClick={() => onUpdate({ ...settings, autoSync: !settings.autoSync })}
              className={`w-16 h-8 rounded-full relative transition-all duration-300 ${settings.autoSync ? 'bg-black' : 'bg-gray-100'}`}
            >
              <motion.div 
                animate={{ x: settings.autoSync ? 34 : 4 }}
                className="absolute top-1.5 left-0 w-5 h-5 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-8 border-t border-gray-50">
            <div>
              <p className="text-base font-black tracking-tight text-indigo-600">{t.settings.demoLabel}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.settings.demoSub}</p>
            </div>
            <button 
              onClick={() => onUpdate({ ...settings, isDemoMode: !settings.isDemoMode })}
              className={`w-16 h-8 rounded-full relative transition-all duration-300 ${settings.isDemoMode ? 'bg-indigo-600' : 'bg-gray-100'}`}
            >
              <motion.div 
                animate={{ x: settings.isDemoMode ? 34 : 4 }}
                className="absolute top-1.5 left-0 w-5 h-5 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>
        </section>

        <section className="vercel-card rounded-[40px] p-12 space-y-10 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="material-symbols-outlined !text-sm">data_usage</span>
            {t.settings.sovereigntyTitle}
          </h3>
          
          <div className="grid grid-cols-2 gap-8">
            <button 
              onClick={onExport}
              className="flex flex-col items-center justify-center gap-4 p-12 vercel-border rounded-[32px] hover:bg-black hover:text-white transition-all group shadow-sm"
            >
              <span className="material-symbols-outlined !text-4xl text-gray-200 group-hover:text-white">encrypted</span>
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">{t.settings.vaultExport}</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex flex-col items-center justify-center gap-4 p-12 vercel-border rounded-[32px] hover:bg-black hover:text-white transition-all group shadow-sm"
            >
              <span className="material-symbols-outlined !text-4xl text-gray-200 group-hover:text-white">print</span>
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">{t.settings.hardcopy}</span>
            </button>
          </div>

          <div className="pt-10 border-t border-gray-50">
            <button 
              onClick={onClearData}
              className="w-full py-6 text-red-500 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-red-50 rounded-[32px] transition-colors flex items-center justify-center gap-4"
            >
              <span className="material-symbols-outlined !text-lg">delete_forever</span>
              {t.settings.purge}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
