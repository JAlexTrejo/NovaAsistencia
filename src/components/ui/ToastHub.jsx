// src/components/ui/ToastHub.jsx
import { useEffect, useState } from 'react';

const QUEUE_LIMIT = 4;
const TTL = 4000;

export function showToast({ title = 'Aviso', message = '', type = 'info' } = {}) {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { title, message, type } }));
}

export default function ToastHub() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (e) => {
      const t = { id: crypto.randomUUID(), ...e.detail };
      setToasts((prev) => {
        const next = [...prev, t];
        return next.slice(-QUEUE_LIMIT);
      });
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), TTL);
    };
    window.addEventListener('app:toast', onToast);
    return () => window.removeEventListener('app:toast', onToast);
  }, []);

  return (
    <div className="fixed z-[9999] bottom-6 right-6 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`min-w-[280px] max-w-[360px] rounded-lg border p-3 shadow-lg bg-white ${
            t.type === 'error'
              ? 'border-red-300'
              : t.type === 'success'
              ? 'border-emerald-300'
              : 'border-slate-200'
          }`}
        >
          <div className="text-sm font-semibold">
            {t.title}
          </div>
          {t.message ? (
            <div className="text-xs text-slate-600 mt-0.5">{t.message}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
