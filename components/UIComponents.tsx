
import React from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose?: () => void;
}

const toastColors: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500'
};

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-6 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center gap-3 border border-white/10"
    >
      <div className={`w-2 h-2 rounded-full ${toastColors[type]} animate-pulse`}></div>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
    </div>
  );
};

// Skeleton loading components
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

export const SkeletonText: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded h-4 ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="vercel-card rounded-xl p-6 space-y-4">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

export const SkeletonTimer: React.FC = () => (
  <div className="text-center space-y-10">
    <div className="flex flex-col items-center">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-16 w-64" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <div className="flex gap-3 justify-center">
        <Skeleton className="h-12 w-24 rounded-xl" />
        <Skeleton className="h-12 w-24 rounded-xl" />
      </div>
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 vercel-border rounded-xl">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    ))}
  </div>
);

// Loading spinner
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  };
  
  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// Progress bar
interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label, showPercentage = true }) => (
  <div className="space-y-2">
    {(label || showPercentage) && (
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {label && <span>{label}</span>}
        {showPercentage && <span>{Math.round(progress)}%</span>}
      </div>
    )}
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-black rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

// Empty state
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'fa-inbox', title, description, action }) => (
  <div className="text-center py-12 px-6">
    <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
      <i className={`fa-solid ${icon} text-2xl text-gray-300`}></i>
    </div>
    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
    {description && (
      <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">{description}</p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-6 px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

// Confirmation modal
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
      <div className="max-w-sm w-full bg-white rounded-2xl p-8 shadow-2xl">
        <h3 className="text-lg font-bold tracking-tight mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
              isDangerous 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Storage warning banner
interface StorageWarningProps {
  percentUsed: number;
  onExport: () => void;
  onDismiss: () => void;
}

export const StorageWarning: React.FC<StorageWarningProps> = ({ percentUsed, onExport, onDismiss }) => {
  if (percentUsed < 75) return null;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <i className="fa-solid fa-triangle-exclamation text-yellow-500 mt-0.5"></i>
        <div className="flex-1">
          <p className="text-sm font-bold text-yellow-800">
            Storage {percentUsed}% full
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Export your data to avoid losing records.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-yellow-600"
          >
            Export
          </button>
          <button
            onClick={onDismiss}
            className="text-yellow-400 hover:text-yellow-600"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile Navigation Bar
interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'track', icon: 'fa-play', label: 'Track' },
    { id: 'calendar', icon: 'fa-calendar', label: 'Calendar' },
    { id: 'tasks', icon: 'fa-list-check', label: 'Tasks' },
    { id: 'accounts', icon: 'fa-receipt', label: 'Expenses' },
    { id: 'clients', icon: 'fa-users', label: 'Clients' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === tab.id ? 'text-black' : 'text-gray-300'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-lg`}></i>
            <span className="text-[8px] font-bold uppercase tracking-widest mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Backup reminder banner
interface BackupReminderProps {
  lastBackupDate: string | null;
  onBackup: () => void;
  onDismiss: () => void;
}

export const BackupReminder: React.FC<BackupReminderProps> = ({ lastBackupDate, onBackup, onDismiss }) => {
  const daysSinceBackup = lastBackupDate 
    ? Math.floor((Date.now() - new Date(lastBackupDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (daysSinceBackup !== null && daysSinceBackup < 7) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <i className="fa-solid fa-cloud-arrow-down text-blue-500 mt-0.5"></i>
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-800">
            {lastBackupDate ? `Last backup: ${daysSinceBackup} days ago` : 'No backup found'}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Create a backup to protect your data.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBackup}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600"
          >
            Backup Now
          </button>
          <button
            onClick={onDismiss}
            className="text-blue-400 hover:text-blue-600"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
