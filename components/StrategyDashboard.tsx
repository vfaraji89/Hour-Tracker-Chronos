
import React from 'react';
// Import motion from framer-motion to enable animations
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
// Import Locale and translations to fix property missing error and implement i18n
import { ClientHealth, Locale } from '../types';
import { translations } from '../translations';

interface StrategyDashboardProps {
  healthData: ClientHealth[];
  forecast: string;
  onRefresh: () => void;
  loading: boolean;
  // Added language to props interface
  language: Locale;
}

const StrategyDashboard: React.FC<StrategyDashboardProps> = ({ healthData, forecast, onRefresh, loading, language }) => {
  const t = translations[language];

  return (
    <div className="space-y-16">
      <div className="flex justify-between items-end border-b border-gray-100 pb-12">
        <div>
          <h2 className="text-5xl font-black tracking-tighter italic">{t.strategy.title}</h2>
          <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] mt-2">{t.strategy.subtitle}</p>
        </div>
        <button 
          onClick={onRefresh}
          className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all flex items-center gap-3 shadow-xl"
        >
          {loading ? <span className="material-symbols-outlined animate-spin !text-lg">progress_activity</span> : <span className="material-symbols-outlined !text-lg">bolt</span>}
          {t.strategy.analyze}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 vercel-card rounded-[40px] p-12">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-12 flex items-center gap-2">
            <span className="material-symbols-outlined !text-sm">hub</span>
            {t.strategy.matrix}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={healthData}>
                <PolarGrid stroke="#f1f1f1" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontWeight: '900' }} />
                <Radar
                  name="Health"
                  dataKey="profitability"
                  stroke="#000"
                  fill="#000"
                  fillOpacity={0.05}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 bg-gray-50/50 rounded-[40px] p-12 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-12 right-12 text-gray-100">
            <span className="material-symbols-outlined !text-7xl">format_quote</span>
          </div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
            <span className="material-symbols-outlined !text-sm">neurology</span>
            {t.strategy.forecast}
          </h3>
          <div className="relative z-10">
            <p className="text-xl leading-relaxed text-black font-semibold italic tracking-tight font-serif lg:text-2xl">
              {forecast || t.strategy.placeholder}
            </p>
          </div>
          
          <div className="mt-16 flex items-center gap-4">
             <div className="px-4 py-2 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2">
               <span className="material-symbols-outlined !text-xs">verified</span>
               {t.strategy.confidence}
             </div>
             <div className="px-4 py-2 bg-white border border-gray-100 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
               <span className="material-symbols-outlined !text-xs">memory</span>
               Logic: Gemini 3 Flash
             </div>
          </div>
        </div>
      </div>

      {healthData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {healthData.map(h => (
            <div key={h.clientId} className="vercel-card p-8 rounded-[32px] hover:scale-[1.02] transition-all">
              <div className="flex justify-between items-start mb-6">
                <p className="font-black text-sm tracking-tighter uppercase">{h.name}</p>
                <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest ${h.profitability > 70 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                  {h.profitability > 70 ? 'Optimal' : 'Protocol Risk'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-8">{h.recommendation}</p>
              <div className="space-y-3">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-400">
                  <span>Efficiency Ratio</span>
                  <span>{h.profitability}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${h.profitability}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-black"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategyDashboard;
