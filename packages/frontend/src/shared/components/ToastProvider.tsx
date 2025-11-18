import { nanoid } from 'nanoid';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastVariant = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_TIMEOUT_MS = 4000;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeout = timers.current.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      timers.current.delete(id);
    }
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((timeout) => window.clearTimeout(timeout));
      timers.current.clear();
    },
    [],
  );

  const pushToast = useCallback(
    (variant: ToastVariant) => (message: string) => {
      const id = nanoid();
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timeout = window.setTimeout(() => removeToast(id), TOAST_TIMEOUT_MS);
      timers.current.set(id, timeout);
    },
    [removeToast],
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      success: pushToast('success'),
      error: pushToast('error'),
      info: pushToast('info'),
    }),
    [pushToast],
  );

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {portalTarget &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="true"
            className="pointer-events-none fixed inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-6"
          >
            {toasts.map((toast) => (
              <button
                key={toast.id}
                type="button"
                onClick={() => removeToast(toast.id)}
                className={`pointer-events-auto min-w-[240px] max-w-sm rounded-2xl px-4 py-3 text-sm shadow-lg transition-all ${
                  toast.variant === 'success'
                    ? 'bg-emerald-600 text-white'
                    : toast.variant === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-white'
                }`}
              >
                {toast.message}
              </button>
            ))}
          </div>,
          portalTarget,
        )}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
