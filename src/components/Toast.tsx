import { CheckCircle2, Flame, Award, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'xp' | 'streak' | 'info' | 'success';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast, idx) => {
        return (
          <div
            key={`${toast.id}-${idx}`}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl text-slate-100 text-xs backdrop-blur animate-in slide-in-from-bottom-5 duration-200"
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'streak' && <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce" />}
              {toast.type === 'xp' && <Award className="w-5 h-5 text-sky-400" />}
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'info' && <span className="text-base">ℹ️</span>}
            </div>

            <div className="flex-1">
              <p className="font-bold text-slate-100">{toast.title}</p>
              {toast.description && <p className="text-slate-400 mt-0.5">{toast.description}</p>}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
