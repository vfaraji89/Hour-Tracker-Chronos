import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WorkRecord } from '../types';

interface MonthlySummaryProps {
  records: WorkRecord[];
}

const MonthlySummary: React.FC<MonthlySummaryProps> = ({ records }) => {
  const chartData = useMemo(() => {
    const monthlyGroups: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyGroups[key] = 0;
    }
    records.forEach(r => {
      const month = r.date.substring(0, 7);
      if (monthlyGroups[month] !== undefined) {
        monthlyGroups[month] += r.durationMinutes / 60;
      }
    });
    return Object.entries(monthlyGroups).map(([month, hours]) => {
      const [year, m] = month.split('-');
      const dateLabel = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString(undefined, { month: 'short' });
      return { name: dateLabel, hours: parseFloat(hours.toFixed(1)) };
    });
  }, [records]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthlyRecords = records.filter(r => r.date.startsWith(currentMonthStr));
    const totalMinutes = monthlyRecords.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      count: monthlyRecords.length,
    };
  }, [records]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-3 vercel-card rounded-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Temporal Output (6mo)</h3>
          <div className="flex gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-black"></span> Current</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span> Previous</span>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fafafa" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold' }} 
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#fafafa' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#000' : '#e4e4e7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-black rounded-xl p-8 text-white flex flex-col justify-between">
        <div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Current Cycle</h3>
          <div className="text-5xl font-black italic tracking-tighter">
            {currentMonthStats.hours}<span className="text-xl text-gray-500">h</span>
          </div>
          <div className="text-xl font-bold text-gray-400 mt-1">
            {currentMonthStats.minutes}<span className="text-xs">m</span>
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Volume</p>
          <p className="text-sm font-bold">{currentMonthStats.count} Sessions committed</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;