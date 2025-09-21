'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const colors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500'
};

function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = icons[toast.type];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration || 5000);
    
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);
  
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };
  
  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden max-w-sm w-full pointer-events-auto">
        <div className="p-4">
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colors[toast.type]} bg-opacity-20 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${colors[toast.type].replace('bg-', 'text-')}`} />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-sm text-gray-300">{toast.message}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="ml-4 flex-shrink-0 rounded-md text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toast Container Component
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Listen for custom toast events
    const handleToast = (event: CustomEvent<ToastMessage>) => {
      setToasts(prev => [...prev, { ...event.detail, id: event.detail.id || Date.now().toString() }]);
    };
    
    window.addEventListener('show-toast' as any, handleToast);
    return () => window.removeEventListener('show-toast' as any, handleToast);
  }, []);
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  if (!mounted) return null;
  
  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div className="space-y-4">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </div>,
    document.body
  );
}

// Helper function to show toasts
export function showToast(options: Omit<ToastMessage, 'id'>) {
  const event = new CustomEvent('show-toast', {
    detail: {
      ...options,
      id: Date.now().toString()
    }
  });
  window.dispatchEvent(event);
}
