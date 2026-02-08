
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GOOGLE_SCRIPT_CODE } from '../services/googleSheetService';
// Import Locale to fix property missing error
import { Locale } from '../types';

interface CloudSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
  // Added language to props interface
  language: Locale;
}

const CloudSetupGuide: React.FC<CloudSetupGuideProps> = ({ isOpen, onClose, language }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/95 backdrop-blur-3xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-3xl w-full vercel-card rounded-[48px] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic">Cloud Persistence Protocol</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mt-3">Establishing Strategic Data Linkage</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-black transition-colors p-2">
            <span className="material-symbols-outlined !text-3xl">close</span>
          </button>
        </div>

        <div className="space-y-10">
          <section className="space-y-5">
            <div className="flex items-center gap-5">
              <span className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-[11px] font-black shadow-lg">01</span>
              <h3 className="font-black text-base uppercase tracking-tight">Prepare Primary Ledger</h3>
            </div>
            <p className="text-sm text-gray-500 pl-16 font-medium leading-relaxed">Create a dedicated Google Sheet. This will serve as your unalterable cloud-side work history and financial ledger.</p>
          </section>

          <section className="space-y-5">
            <div className="flex items-center gap-5">
              <span className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-[11px] font-black shadow-lg">02</span>
              <h3 className="font-black text-base uppercase tracking-tight">Deploy Synchronous Agent</h3>
            </div>
            <div className="pl-16 space-y-6">
              <p className="text-sm text-gray-500 font-medium">Navigate to <strong>Extensions > Apps Script</strong>. Inject the following autonomous relay logic into the editor:</p>
              <div className="relative">
                <pre className="bg-gray-50 p-6 rounded-[32px] text-[10px] font-mono text-gray-600 overflow-x-auto border border-gray-100 max-h-60 leading-relaxed shadow-inner">
                  {GOOGLE_SCRIPT_CODE}
                </pre>
                <button 
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-2"
                >
                  <span className="material-symbols-outlined !text-sm">{copied ? 'done' : 'content_copy'}</span>
                  {copied ? "Committed" : "Copy Code"}
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center gap-5">
              <span className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-[11px] font-black shadow-lg">03</span>
              <h3 className="font-black text-base uppercase tracking-tight">Publish Endpoint</h3>
            </div>
            <div className="pl-16 text-sm text-gray-500 font-medium space-y-3 leading-relaxed">
              <p>1. Initialize <strong>Deploy > New Deployment</strong>.</p>
              <p>2. Select <strong>Web App</strong>.</p>
              <p>3. Set Execution to <strong>Me</strong> and Access to <strong>Anyone</strong>.</p>
              <p>4. Extract the <strong>Web App URL</strong> and link it within the Clients context.</p>
            </div>
          </section>

          <button 
            onClick={onClose}
            className="w-full bg-black text-white py-6 rounded-[32px] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-4"
          >
            <span className="material-symbols-outlined !text-xl">cloud_done</span>
            System Ready. Terminate Guide.
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CloudSetupGuide;
