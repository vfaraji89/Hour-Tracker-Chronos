
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../types';

interface TaskDashboardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onStartTask: (taskText: string) => void;
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({ tasks, onTasksChange, onStartTask }) => {
  const [newTaskText, setNewTaskText] = useState('');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      clientId: '', // Managed by parent
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
    <div className="space-y-12">
      <div className="flex justify-between items-end border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Backlog</h2>
          <p className="text-gray-400 text-[10px] mt-1 font-black uppercase tracking-widest">Planned actions & functional items</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-10">
        <form onSubmit={addTask} className="relative group">
          <input 
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Commit a new objective..."
            className="w-full bg-white vercel-border rounded-xl px-6 py-4 text-sm font-medium outline-none focus:border-black transition-all shadow-sm"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-lg hover:scale-105 transition-transform"
          >
            <i className="fa-solid fa-plus text-xs"></i>
          </button>
        </form>

        <div className="space-y-12">
          {/* Pending Items */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-2">Active Objectives ({pendingTasks.length})</h3>
            <AnimatePresence mode="popLayout">
              {pendingTasks.map((task) => (
                <motion.div 
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="vercel-card rounded-xl p-5 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center hover:border-black transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-gray-100"></div>
                    </button>
                    <span className="text-sm font-medium text-black">{task.text}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onStartTask(task.text)}
                      className="bg-black text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-md hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <i className="fa-solid fa-play text-[7px]"></i> Track Now
                    </button>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </motion.div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center py-10 vercel-border border-dashed rounded-xl">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Backlog Cleared</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Completed Items */}
          {completedTasks.length > 0 && (
            <div className="space-y-4 opacity-40 grayscale">
              <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-2">Archived ({completedTasks.length})</h3>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div key={task.id} className="vercel-card rounded-xl p-4 flex items-center justify-between group bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleTask(task.id)} className="w-5 h-5 rounded border border-black bg-black flex items-center justify-center">
                        <i className="fa-solid fa-check text-white text-[8px]"></i>
                      </button>
                      <span className="text-sm font-medium text-gray-400 line-through">{task.text}</span>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <i className="fa-solid fa-trash-can text-xs"></i>
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
