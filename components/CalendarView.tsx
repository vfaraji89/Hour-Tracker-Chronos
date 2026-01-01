import React from 'react';
import { motion } from 'framer-motion';
import { WorkRecord } from '../types';

interface CalendarViewProps {
  records: WorkRecord[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ records }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const getDayRecords = (day: number) => {
    return records.filter(r => {
      const d = new Date(r.date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const getIntensityColor = (minutes: number) => {
    if (minutes === 0) return 'bg-transparent';
    if (minutes < 60) return 'bg-gray-100 text-gray-400';
    if (minutes < 240) return 'bg-gray-900 text-white';
    return 'bg-black text-white shadow-lg';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center px-2">
        <h3 className="text-sm font-bold tracking-tight uppercase text-gray-400">
          {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })} Output
        </h3>
        <div className="flex gap-4 text-[10px] font-bold uppercase text-gray-400">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-100"></span> Light</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-900"></span> Focus</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black"></span> Peak</div>
        </div>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-gray-50 p-3 text-center text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
            {d}
          </div>
        ))}
        {emptyDays.map(i => <div key={`empty-${i}`} className="calendar-day bg-gray-50/30"></div>)}
        {days.map(day => {
          const dayRecords = getDayRecords(day);
          const totalMinutes = dayRecords.reduce((acc, r) => acc + r.durationMinutes, 0);
          return (
            <div key={day} className="calendar-day group">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full transition-colors ${totalMinutes > 0 ? 'bg-black text-white' : 'text-gray-300'}`}>
                  {day}
                </span>
                {totalMinutes > 0 && (
                  <span className="text-[10px] font-mono font-bold text-gray-400">
                    {(totalMinutes / 60).toFixed(1)}h
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {dayRecords.slice(0, 3).map(r => (
                  <div 
                    key={r.id} 
                    className={`text-[8px] px-1.5 py-0.5 rounded truncate font-bold uppercase tracking-tighter ${getIntensityColor(r.durationMinutes)}`}
                    title={r.notes}
                  >
                    {r.category}
                  </div>
                ))}
                {dayRecords.length > 3 && (
                  <div className="text-[8px] text-gray-300 font-bold px-1">+ {dayRecords.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CalendarView;