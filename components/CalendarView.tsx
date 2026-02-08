
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Import Locale to fix property missing error
import { WorkRecord, Locale } from '../types';
import { storageService } from '../services/storageService';

interface CalendarViewProps {
  records: WorkRecord[];
  // Added language to props interface
  language: Locale;
}

const CalendarView: React.FC<CalendarViewProps> = ({ records, language }) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const settings = storageService.getSettings();
  
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const stats = useMemo(() => {
    const dailyMinutes: Record<number, number> = {};
    let totalMinutes = 0;
    let maxMinutes = 0;
    let activeDays = 0;

    records.forEach(r => {
      const d = new Date(r.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        dailyMinutes[day] = (dailyMinutes[day] || 0) + r.durationMinutes;
        totalMinutes += r.durationMinutes;
      }
    });

    Object.values(dailyMinutes).forEach(m => {
      if (m > maxMinutes) maxMinutes = m;
      if (m > 0) activeDays++;
    });

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      avgHours: activeDays ? (totalMinutes / 60 / activeDays).toFixed(1) : 0,
      peakHours: (maxMinutes / 60).toFixed(1),
      consistency: activeDays ? Math.round((activeDays / daysInMonth) * 100) : 0,
      dailyMinutes
    };
  }, [records, month, year, daysInMonth]);

  const getIntensityLevel = (minutes: number) => {
    if (minutes === 0) return 0;
    const goalMinutes = settings.dailyGoalHours * 60;
    const percent = (minutes / goalMinutes) * 100;
    
    if (percent < 25) return 1;
    if (percent < 50) return 2;
    if (percent < 75) return 3;
    if (percent < 100) return 4;
    return 5;
  };

  const getIntensityStyle = (level: number) => {
    switch(level) {
      case 1: return 'bg-gray-50 text-gray-400 border-gray-100';
      case 2: return 'bg-gray-100 text-gray-600 border-gray-200';
      case 3: return 'bg-gray-300 text-black border-gray-400';
      case 4: return 'bg-gray-800 text-white border-black';
      case 5: return 'bg-black text-white border-black shadow-lg';
      default: return 'bg-white text-gray-300 border-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('dev')) return 'bg-blue-500';
    if (cat.includes('meet')) return 'bg-purple-500';
    if (cat.includes('plan')) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Velocity', value: `${stats.totalHours}h`, sub: 'Total Output' },
          { label: 'Avg Session', value: `${stats.avgHours}h`, sub: 'Per Active Day' },
          { label: 'Peak Capacity', value: `${stats.peakHours}h`, sub: 'Max Daily Load' },
          { label: 'Consistency', value: `${stats.consistency}%`, sub: 'Month Coverage' },
        ].map((stat, i) => (
          <div key={i} className="vercel-card rounded-xl p-5 border-l-4 border-l-black">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-black italic tracking-tight">{stat.value}</p>
            <p className="text-[8px] font-bold text-gray-300 uppercase mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-black tracking-tighter">
              {new Date(year, month).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temporal Heatmap Analysis</p>
          </div>
          <div className="flex gap-2 items-center">
             <span className="text-[8px] font-black text-gray-300 uppercase mr-2">Relative to {settings.dailyGoalHours}h Goal</span>
             {[1, 2, 3, 4, 5].map(lvl => (
               <div key={lvl} className={`w-3 h-3 rounded-sm ${getIntensityStyle(lvl)} border`} />
             ))}
          </div>
        </div>

        <div className="calendar-grid bg-transparent border-none gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-black uppercase text-gray-300 py-2">
              {d}
            </div>
          ))}
          
          {emptyDays.map(i => <div key={`empty-${i}`} className="min-h-[110px] rounded-xl bg-gray-50/20 opacity-30"></div>)}
          
          {days.map((day, idx) => {
            const minutes = stats.dailyMinutes[day] || 0;
            const level = getIntensityLevel(minutes);
            const style = getIntensityStyle(level);
            const dayRecords = records.filter(r => {
              const d = new Date(r.date);
              return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
            });

            return (
              <motion.div 
                key={day}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.01 }}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`calendar-day relative vercel-card rounded-xl p-3 flex flex-col justify-between min-h-[120px] cursor-default transition-all duration-300 ${level > 0 ? 'hover:-translate-y-1 hover:shadow-xl active:scale-95' : 'bg-gray-50/30'}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full transition-colors ${level > 0 ? 'bg-black text-white' : 'text-gray-300'}`}>
                    {day}
                  </span>
                  {minutes > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono font-bold text-black italic">
                        {(minutes / 60).toFixed(1)}h
                      </span>
                      <div className="w-8 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-black transition-all duration-700" 
                          style={{ width: `${Math.min(100, (minutes / (settings.dailyGoalHours * 60)) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {dayRecords.slice(0, 4).map((r, i) => (
                    <div 
                      key={r.id}
                      className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(r.category)} shadow-sm`}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {hoveredDay === day && dayRecords.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 z-20 bg-black/95 text-white rounded-xl p-3 flex flex-col justify-center gap-1.5 overflow-hidden"
                    >
                      <p className="text-[8px] font-black uppercase text-gray-500 mb-1">Session Breakdown</p>
                      {dayRecords.slice(0, 3).map(r => (
                        <div key={r.id} className="border-l border-white/20 pl-2">
                           <p className="text-[9px] font-bold truncate">{r.notes || r.category}</p>
                           <p className="text-[7px] text-gray-400 uppercase font-black">{r.durationMinutes}m @ {r.startTime}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarView;
