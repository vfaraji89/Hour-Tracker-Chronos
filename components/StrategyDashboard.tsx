import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ClientHealth } from '../types';

interface StrategyDashboardProps {
  healthData: ClientHealth[];
  forecast: string;
  onRefresh: () => void;
  loading: boolean;
}

const StrategyDashboard: React.FC<StrategyDashboardProps> = ({ healthData, forecast, onRefresh, loading }) => {
  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">AI Strategy</h2>
          <p className="text-gray-400 text-sm mt-1">Algorithmic business intelligence & forecasting.</p>
        </div>
        <button 
          onClick={onRefresh}
          className="bg-black text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-2"
        >
          {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-bolt"></i>}
          Analyze
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="vercel-card rounded-xl p-8">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Market Position Radar</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={healthData}>
                <PolarGrid stroke="#f4f4f5" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} />
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

        <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 relative">
          <div className="absolute top-8 right-8 text-gray-200">
            <i className="fa-solid fa-quote-right text-4xl"></i>
          </div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Autonomous Insight</h3>
          <div className="relative z-10">
            <p className="text-base leading-relaxed text-black font-medium font-serif italic">
              {forecast || "Select a client and click refresh to generate a deep financial strategy and revenue projection."}
            </p>
          </div>
          
          <div className="mt-12 flex items-center gap-3">
             <div className="px-2 py-1 bg-black text-white rounded text-[8px] font-bold uppercase">Confidence: High</div>
             <div className="px-2 py-1 bg-white border border-gray-200 text-gray-400 rounded text-[8px] font-bold uppercase">Model: Gemini 2.5</div>
          </div>
        </div>
      </div>

      {healthData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {healthData.map(h => (
            <div key={h.clientId} className="vercel-card p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <p className="font-bold text-sm">{h.name}</p>
                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${h.profitability > 70 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {h.profitability > 70 ? 'Optimal' : 'Caution'}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{h.recommendation}</p>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-1000" 
                  style={{ width: `${h.profitability}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategyDashboard;