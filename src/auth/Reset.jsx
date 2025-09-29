// src/auth/reset.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function AuthReset() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { updatePassword } = useAuth();

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Asegura la sesión de recuperación (supabase añade tokens en el hash)
  useEffect(() => {
    let mounted = true;

    const ensureRecoverySession = async () => {
      try {
        // ¿Ya hay sesión?
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          if (mounted) {
            setHasSession(true);
            setReady(true);
          }
          return;
        }

        // Intento manual con tokens del hash
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");

        if (access_token && refresh_token) {
          const { data: setData, error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (mounted) {
            if (setErr) {
              setError(setErr.message);
              setHasSession(false);
            } else {
              setHasSession(!!setData?.session);
              // Limpia el hash para no dejar tokens a la vista
              history.replaceState(null, "", window.location.pathname + window.location.search);
            }
          }
        } else {
          // Reintento rápido por si tarda en hidratar
          await new Promise((r) => setTimeout(r, 250));
          const { data: data2 } = await supabase.auth.getSession();
          if (mounted) setHasSession(!!data2?.session);
        }
      } catch (e) {
        if (mounted) setError(e?.message || "Error preparando la sesión de recuperación.");
      } finally {
        if (mounted) setReady(true);
      }
    };

    ensureRecoverySession();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!hasSession) {
      setError(
        "No hay sesión de recuperación activa. Abre el enlace del correo en este navegador."
      );
      return;
    }
    if (!password || password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSubmitting(true);
    const res = await updatePassword(password);
    setSubmitting(false);

    if (!res?.success) {
      setError(res?.error || "No se pudo actualizar la contraseña.");
      return;
    }

    // ✅ Redirige inmediatamente al login. Conserva `next` si venía en la URL.
    const next = params.get("next");
    const loginUrl = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
    navigate(loginUrl, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-20">
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">Nueva contraseña</h1>

        {!ready ? (
          <div className="text-sm text-gray-600 text-center">Preparando…</div>
        ) : !hasSession ? (
          <div className="space-y-4">
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error ||
                "No se detectó sesión de recuperación. Reabre el enlace del correo en este navegador."}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Nueva contraseña (mínimo 8 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoFocus
            />

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 text-white px-3 py-2 font-medium disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Guardando…" : "Guardar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
