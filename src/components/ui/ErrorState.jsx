// src/components/ui/ErrorState.jsx
export default function ErrorState({ message = 'Ocurrió un error', onRetry }) {
  return (
    <div className="w-full py-6 text-center">
      <div className="text-red-600 text-sm mb-2">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 text-sm rounded bg-slate-800 text-white hover:bg-slate-700"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
