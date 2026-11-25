import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (params: { type?: ToastType; title: string; description?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title, description }: { type?: ToastType; title: string; description?: string }) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 4200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-luxury backdrop-blur-md transition-all ${
                isSuccess
                  ? 'bg-[#1A241E]/95 border-[#D4AF37]/50 text-white'
                  : isError
                  ? 'bg-[#281619]/95 border-rose-500/50 text-white'
                  : 'bg-[#1E1E1E]/95 border-[#D4AF37]/35 text-white'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                ) : isError ? (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                ) : (
                  <Info className="w-5 h-5 text-[#D4AF37]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug text-white">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-xs text-neutral-300 leading-relaxed break-words">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast phải được sử dụng bên trong <ToastProvider>');
  }
  return ctx;
}
