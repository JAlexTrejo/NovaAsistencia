// src/components/ui/Loading.jsx
export default function Loading({ label = 'Cargando…' }) {
  return (
    <div className="w-full py-6 text-center text-sm text-slate-600">
      {label}
    </div>
  );
}
