'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }

interface ToastContextType {
  notify: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), type === 'error' ? 5000 : 3000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2" aria-live="polite" role="status">
        {toasts.map(t => {
          const Icon = t.type === 'success' ? CheckCircle : t.type === 'error' ? XCircle : Info;
          const color = t.type === 'success' ? 'text-green-500' : t.type === 'error' ? 'text-red-500' : 'text-blue-500';
          return (
            <div key={t.id} className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-lg dark:bg-slate-800 animate-in slide-in-from-right">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <span className="text-sm text-slate-700 dark:text-slate-200">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Fechar notificação" className="ml-2 shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
