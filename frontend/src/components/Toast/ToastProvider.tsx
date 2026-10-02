import { Check, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext } from './toastContext';

type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const DURATION = 4000;

const styles = {
  success: { title: 'Success', icon: 'bg-green-100 text-green-600', bar: 'bg-green-500' },
  error: { title: 'Something went wrong', icon: 'bg-red-100 text-red-600', bar: 'bg-red-500' },
};

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const style = styles[toast.type];
  const Icon = toast.type === 'success' ? Check : X;

  return (
    <div
      role="status"
      className="toast-in pointer-events-auto relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{style.title}</p>
          <p className="mt-0.5 text-sm text-gray-500">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div
        className={`toast-progress absolute bottom-0 left-0 h-1 ${style.bar}`}
        style={{ animationDuration: `${DURATION}ms` }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]); // keep at most 4
      setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (message: string) => push('success', message),
      error: (message: string) => push('error', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}