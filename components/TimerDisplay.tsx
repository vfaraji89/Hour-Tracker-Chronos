
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TimerState, WorkRecord } from '../types';
import { storageService } from '../services/storageService';

interface TimerDisplayProps {
  onRecordComplete: (record: Partial<WorkRecord>) => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ onRecordComplete }) => {
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedSeconds: 0,
    isIdle: false,
  });
  const [category, setCategory] = useState('Development');
  const [notes, setNotes] = useState('');
  
  const intervalRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  // Idle Management
  useEffect(() => {
    const handleActivity = () => {
      if (timer.isRunning && timer.isIdle) {
        // Resume session: Adjust startTime to skip the idle period
        const now = Date.now();
        const adjustedStartTime = now - (timer.elapsedSeconds * 1000);
        setTimer(prev => ({ ...prev, isIdle: false, startTime: adjustedStartTime }));
        storageService.saveActiveTimer({ startTime: adjustedStartTime, category, notes });
      }

      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
      
      if (timer.isRunning && !timer.isIdle) {
        idleTimeoutRef.current = window.setTimeout(() => {
          setTimer(prev => ({ ...prev, isIdle: true }));
        }, IDLE_THRESHOLD);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    };
  }, [timer.isRunning, timer.isIdle, timer.elapsedSeconds, category, notes]);

  useEffect(() => {
    const activeSession = storageService.getActiveTimer();
    if (activeSession) {
      const now = Date.now();
      const elapsedSinceStart = Math.floor((now - activeSession.startTime) / 1000);
      setTimer({
        isRunning: true,
        startTime: activeSession.startTime,
        elapsedSeconds: elapsedSinceStart,
        isIdle: false
      });
      setCategory(activeSession.category);
      setNotes(activeSession.notes);
    }
  }, []);

  useEffect(() => {
    if (timer.isRunning && !timer.isIdle) {
      intervalRef.current = window.setInterval(() => {
        setTimer(prev => ({
          ...prev,
          elapsedSeconds: Math.floor((Date.now() - (prev.startTime || Date.now())) / 1000)
        }));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer.isRunning, timer.isIdle]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    const startTime = Date.now();
    setTimer({ isRunning: true, startTime: startTime, elapsedSeconds: 0, isIdle: false });
    storageService.saveActiveTimer({ startTime, category, notes });
  };

  const handleStop = () => {
    if (!timer.startTime) return;
    const end = new Date();
    const start = new Date(timer.startTime);
    onRecordComplete({
      date: start.toISOString(),
      startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      durationMinutes: Math.max(1, Math.floor(timer.elapsedSeconds / 60)),
      category,
      notes,
    });
    setTimer({ isRunning: false, startTime: null, elapsedSeconds: 0, isIdle: false });
    setNotes('');
    storageService.clearActiveTimer();
  };

  return (
    <div className={`vercel-card rounded-xl p-8 shadow-sm overflow-hidden relative transition-opacity duration-500 ${timer.isIdle ? 'opacity-50' : 'opacity-100'}`}>
      {timer.isRunning && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: timer.isIdle ? 0.01 : 0.03 }}
          className="absolute inset-0 bg-red-600 pointer-events-none"
        />
      )}
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chronometer</span>
          {timer.isIdle && (
            <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Hibernating</span>
          )}
        </div>
        {timer.isRunning && (
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${timer.isIdle ? 'bg-orange-500' : 'bg-red-600 pulse-dot'}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${timer.isIdle ? 'text-orange-500' : 'text-red-600'}`}>
              {timer.isIdle ? 'Idle' : 'Live'}
            </span>
          </div>
        )}
      </div>

      <div className={`text-7xl font-bold timer-mono mb-10 transition-colors ${timer.isRunning ? (timer.isIdle ? 'text-gray-400' : 'text-black') : 'text-gray-200'}`}>
        {formatTime(timer.elapsedSeconds)}
      </div>
      
      <div className="space-y-6 mb-10">
        <div>
          <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Operation Mode</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={timer.isRunning}
            className="w-full bg-white vercel-border rounded-lg px-4 py-3 text-xs font-bold focus:border-black outline-none disabled:bg-gray-50 uppercase tracking-widest"
          >
            <option>Development</option>
            <option>Deep Work</option>
            <option>Interface Design</option>
            <option>Strategic Review</option>
            <option>Consultation</option>
          </select>
        </div>
        <div>
          <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Session Protocol</label>
          <input 
            type="text"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (timer.isRunning && timer.startTime) {
                storageService.saveActiveTimer({ startTime: timer.startTime, category, notes: e.target.value });
              }
            }}
            placeholder="Log intent..."
            className="w-full bg-white vercel-border rounded-lg px-4 py-3 text-xs focus:border-black outline-none font-bold"
          />
        </div>
      </div>

      <motion.button 
        whileTap={{ scale: 0.97 }}
        onClick={timer.isRunning ? handleStop : handleStart}
        className={`w-full py-5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
          timer.isRunning 
            ? 'bg-red-600 text-white shadow-red-100 hover:bg-red-700' 
            : 'bg-black text-white shadow-gray-200 hover:bg-gray-900'
        }`}
      >
        {timer.isRunning ? 'Cease Operation' : 'Initialize Session'}
      </motion.button>
    </div>
  );
};

export default TimerDisplay;
