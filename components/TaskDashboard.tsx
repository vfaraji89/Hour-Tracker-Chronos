
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Import Locale and translations to fix property missing error and implement i18n
import { Task, Locale } from '../types';
import { translations } from '../translations';

interface TaskDashboardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onStartTask: (taskText: string) => void;
  // Added language to props interface
  language: Locale;
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({ tasks, onTasksChange, onStartTask, language }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const t = translations[language];

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      clientId: '', 
      text: newTaskText,
      completed: false,
      priority: 'medium',
      createdAt: new Date().toISOString()
    };
    onTasksChange([newTask, ...tasks]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    onTasksChange(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    onTasksChange(tasks.filter(t => t.id !== id));
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-16">
      <div className="flex justify-between items-end border-b border-gray-100 pb-12">
        <div>
          <h2 className="text-5xl font-black tracking-tighter">{t.tasks.title}</h2>
          <p className="text-gray-400 text-[11px] mt-2 font-black uppercase tracking-[0.3em]">{t.tasks.subtitle}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-16">
        <form onSubmit={addTask} className="relative group">
          <input 
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder={t.tasks.placeholder}
            className="w-full bg-white vercel-border rounded-3xl px-8 py-6 text-base font-bold outline-none focus:border-black transition-all shadow-xl placeholder:text-gray-200"
          />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-3 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg flex items-center justify-center"
          >
            <span className="material-symbols-outlined !text-xl">add</span>
          </button>
        </form>

        <div className="space-y-20">
          {/* Pending Items */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] px-4 flex items-center gap-3">
               <span className="material-symbols-outlined !text-sm">target</span>
               {t.tasks.activeTitle} ({pendingTasks.length})
            </h3>
            <AnimatePresence mode="popLayout">
              {pendingTasks.map((task) => (
                <motion.div 
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="vercel-card rounded-[32px] p-6 flex items-center justify-between group shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-6 flex-1">
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className="w-7 h-7 rounded-xl border-2 border-gray-100 flex items-center justify-center hover:border-black hover:bg-black group/check transition-all"
                    >
                      <span className="material-symbols-outlined !text-xs text-transparent group-hover/check:text-white">check</span>
                    </button>
                    <span className="text-base font-black tracking-tight text-black">{task.text}</span>
                  </div>
                  
                  <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onStartTask(task.text)}
                      className="bg-black text-white text-[9px] font-black uppercase px-5 py-2.5 rounded-xl hover:scale-105 transition-all flex items-center gap-3 shadow-lg"
                    >
                      <span className="material-symbols-outlined !text-sm">timer</span> {t.tasks.trackExecution}
                    </button>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined !text-xl">delete</span>
                    </button>
                  </div>
                </motion.div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center py-20 vercel-border border-dashed border-2 rounded-[32px]">
                   <span className="material-symbols-outlined text-gray-100 !text-6xl mb-4">task_alt</span>
                   <p className="text-gray-300 text-[11px] font-black uppercase tracking-[0.4em]">{t.tasks.completed}</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Completed Items */}
          {completedTasks.length > 0 && (
            <div className="space-y-6 opacity-40 grayscale">
              <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] px-4 flex items-center gap-3">
                 <span className="material-symbols-outlined !text-sm">history</span>
                 {t.tasks.archivedTitle} ({completedTasks.length})
              </h3>
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div key={task.id} className="vercel-card rounded-2xl p-5 flex items-center justify-between group bg-gray-50/20">
                    <div className="flex items-center gap-6">
                      <button onClick={() => toggleTask(task.id)} className="w-6 h-6 rounded-lg border-2 border-black bg-black flex items-center justify-center">
                        <span className="material-symbols-outlined !text-xs text-white">check</span>
                      </button>
                      <span className="text-sm font-bold text-gray-400 line-through tracking-tight">{task.text}</span>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <span className="material-symbols-outlined !text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;
