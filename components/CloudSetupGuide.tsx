
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GOOGLE_SCRIPT_CODE } from '../services/googleSheetService';

interface CloudSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const CloudSetupGuide: React.FC<CloudSetupGuideProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/90 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-2xl w-full vercel-card rounded-3xl p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tighter italic">Cloud Protocol Setup</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">Zero-Server Persistence Layer</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-black transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">01</span>
              <h3 className="font-bold text-sm">Prepare Google Sheet</h3>
            </div>
            <p className="text-xs text-gray-500 pl-12">Create a new Google Sheet. Rename it to "Chronos Ledger" or similar. This will be your primary data anchor.</p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">02</span>
              <h3 className="font-bold text-sm">Deploy Apps Script</h3>
            </div>
            <div className="pl-12 space-y-4">
              <p className="text-xs text-gray-500">Go to <strong>Extensions > Apps Script</strong>. Replace everything in the editor with the code below:</p>
              <div className="relative">
                <pre className="bg-gray-50 p-4 rounded-xl text-[10px] font-mono text-gray-600 overflow-x-auto border border-gray-100 max-h-48">
                  {GOOGLE_SCRIPT_CODE}
                </pre>
                <button 
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 bg-black text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">03</span>
              <h3 className="font-bold text-sm">Authorize & Publish</h3>
            </div>
            <div className="pl-12 text-xs text-gray-500 space-y-2">
              <p>1. Click <strong>Deploy > New Deployment</strong>.</p>
              <p>2. Select <strong>Web App</strong>.</p>
              <p>3. Set "Execute as" to <strong>Me</strong>.</p>
              <p>4. Set "Who has access" to <strong>Anyone</strong>.</p>
              <p>5. Copy the <strong>Web App URL</strong> and paste it into Client settings.</p>
            </div>
          </section>

          <button 
            onClick={onClose}
            className="w-full bg-black text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 transition-all"
          >
            System Integrated. Close Guide.
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CloudSetupGuide;
