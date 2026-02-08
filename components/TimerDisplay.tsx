
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { TimerState, WorkRecord, Locale } from '../types';
import { storageService } from '../services/storageService';
import { translations } from '../translations';

interface TimerDisplayProps {
  onRecordComplete: (record: Partial<WorkRecord>) => void;
  language: Locale;
}

const TimerDisplay = forwardRef(({ onRecordComplete, language }: TimerDisplayProps, ref) => {
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedSeconds: 0,
    isIdle: false,
  });
  const t = translations[language];
  const [category, setCategory] = useState(language === 'tr' ? 'Derin Çalışma' : 'Deep Work');
  const [notes, setNotes] = useState('');
  
  const intervalRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const IDLE_THRESHOLD = 5 * 60 * 1000;

  useImperativeHandle(ref, () => ({
    handleExternalStart: (externalNotes: string) => {
      setNotes(externalNotes);
      handleStart(externalNotes);
    }
  }));

  useEffect(() => {
    const handleActivity = () => {
      if (timer.isRunning && timer.isIdle) {
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
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    };
  }, [timer.isRunning, timer.isIdle, timer.elapsedSeconds, category, notes]);

  useEffect(() => {
    const activeSession = storageService.getActiveTimer();
    if (activeSession) {
      const now = Date.now();
      setTimer({
        isRunning: true,
        startTime: activeSession.startTime,
        elapsedSeconds: Math.floor((now - activeSession.startTime) / 1000),
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

  const handleStart = (startNotes?: string) => {
    const startTime = Date.now();
    const finalNotes = startNotes ?? notes;
    setTimer({ isRunning: true, startTime: startTime, elapsedSeconds: 0, isIdle: false });
    storageService.saveActiveTimer({ startTime, category, notes: finalNotes });
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
    <div className={`text-center space-y-12 transition-all duration-700 ${timer.isIdle ? 'grayscale opacity-20' : 'opacity-100'}`}>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-3 mb-6">
          <span className={`material-symbols-outlined !text-lg ${timer.isRunning ? 'text-red-600 animate-pulse' : 'text-gray-300'}`}>
            {timer.isRunning ? 'radio_button_checked' : 'radio_button_unchecked'}
          </span>
          <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${timer.isRunning ? 'text-black' : 'text-gray-300'}`}>
            {timer.isRunning ? (timer.isIdle ? t.timer.suspended : t.timer.tracking) : t.timer.inactive}
          </span>
        </div>
        <div className={`text-8xl font-black italic tracking-tighter timer-mono leading-none ${timer.isRunning ? 'text-black' : 'text-gray-200'}`}>
          {formatTime(timer.elapsedSeconds)}
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-8">
        <input 
          type="text"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            if (timer.isRunning && timer.startTime) {
              storageService.saveActiveTimer({ startTime: timer.startTime, category, notes: e.target.value });
            }
          }}
          placeholder={t.timer.objective}
          className="w-full text-center bg-transparent border-b-2 border-gray-50 pb-4 text-sm font-bold outline-none focus:border-black transition-all placeholder:text-gray-100"
        />
        
        <motion.button 
          whileTap={{ scale: 0.96 }}
          onClick={timer.isRunning ? handleStop : () => handleStart()}
          className={`w-full py-8 rounded-[32px] text-xs font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 ${
            timer.isRunning 
              ? 'bg-black text-white shadow-2xl' 
              : 'bg-white vercel-border text-black hover:bg-black hover:text-white hover:border-black'
          }`}
        >
          <span className="material-symbols-outlined !text-xl">
            {timer.isRunning ? 'stop' : 'play_arrow'}
          </span>
          {timer.isRunning ? t.timer.terminate : t.timer.initialize}
        </motion.button>
      </div>
    </div>
  );
});

export default TimerDisplay;
