// /src/pages/employee-login-portal/index.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../contexts/AuthContext";

const safeInternalPath = (p) =>
  typeof p === "string" && p.startsWith("/") ? p : "/dashboard";

export default function EmployeeLoginPortal() {
  const navigate = useNavigate();
  const [q] = useSearchParams();
  const next = safeInternalPath(q.get("next") || "/dashboard");

  const {
    user,
    loading,
    authError,
    setAuthError,
    signIn,        // email/password
    sendOTP,       // OTP solicitación
    verifyOTP,     // OTP verificación
    resetPassword, // NUEVO: enviar email de restablecimiento
  } = useAuth();

  // --- UI state ---
  const [mode, setMode] = useState("password"); // "password" | "otp"
  const [form, setForm] = useState({ email: "", password: "", phone: "", otp: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [info, setInfo] = useState("");

  // Si ya está autenticado, redirige al destino solicitado
  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true });
  }, [user, loading, next, navigate]);

  const onChange = (e) => {
    setAuthError?.("");
    setMessage("");
    setInfo("");
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  // --- Email/Password login ---
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setInfo("");
    setAuthError?.("");
    try {
      const { email, password } = form;
      const res = await signIn(email, password);
      if (!res?.success) {
        throw new Error(res?.error || "No fue posible iniciar sesión");
      }
      navigate(next, { replace: true });
    } catch (err) {
      setMessage(err.message || "Error de autenticación");
    } finally {
      setSubmitting(false);
    }
  };

  // --- OTP: solicitar código (por email o teléfono) ---
  const handleSendOtp = async () => {
    setSubmitting(true);
    setMessage("");
    setInfo("");
    setAuthError?.("");
    try {
      const phone = form.phone?.trim() || null;
      const email = form.email?.trim() || null;
      if (!phone && !email) throw new Error("Ingresa teléfono o correo para enviar el código.");
      const res = await sendOTP(phone, email);
      if (!res?.success) throw new Error(res?.error || "No se pudo enviar el código");
      setInfo("Código enviado. Revisa tu bandeja o SMS.");
    } catch (err) {
      setMessage(err.message || "No se pudo enviar el código");
    } finally {
      setSubmitting(false);
    }
  };

  // --- OTP: verificar código ---
  const handleVerifyOtp = async () => {
    setSubmitting(true);
    setMessage("");
    setInfo("");
    setAuthError?.("");
    try {
      const { phone, email, otp } = form;
      if (!otp) throw new Error("Ingresa el código recibido.");
      const res = await verifyOTP(phone?.trim() || null, email?.trim() || null, otp.trim());
      if (!res?.success) throw new Error(res?.error || "No se pudo verificar el código");
      navigate(next, { replace: true });
    } catch (err) {
      setMessage(err.message || "No se pudo verificar el código");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Reset password por correo ---
  const handleResetPassword = async () => {
    setSubmitting(true);
    setMessage("");
    setInfo("");
    setAuthError?.("");
    try {
      const email = form.email?.trim();
      if (!email) throw new Error("Escribe tu correo para enviar el enlace de restablecimiento.");
      const res = await resetPassword(email, `${window.location.origin}/auth/reset`);
      if (!res?.success) throw new Error(res?.error || "No se pudo enviar el enlace");
      setInfo("Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.");
    } catch (err) {
      setMessage(err.message || "No se pudo enviar el enlace");
    } finally {
      setSubmitting(false);
    }
  };

  const title = "Portal de Acceso · GY&ID Corporativo";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content="Accede para continuar a tu panel." />
        <style>
          {`
            @keyframes blob {
              0%, 100% { transform: translate(0px, 0px) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
            }
            .animate-blob { animation: blob 7s infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
            .animation-delay-4000 { animation-delay: 4s; }
          `}
        </style>
      </Helmet>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">GY</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              GY&ID Corporativo
            </span>
          </div>
          <p className="text-gray-600">Sistema de Gestión de Recursos Humanos</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Iniciar sesión</h1>
          <p className="text-sm text-gray-600 mb-6">
            Serás redirigido a: <span className="font-semibold text-blue-600">{next}</span>
          </p>

        {(authError || message) && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {authError || message}
          </div>
        )}
        {info && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
            {info}
          </div>
        )}

        {/* Switch de modo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => { setMode("password"); setMessage(""); setInfo(""); setAuthError?.(""); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${mode === "password" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            disabled={submitting || loading}
          >
            Correo y contraseña
          </button>
          <button
            type="button"
            onClick={() => { setMode("otp"); setMessage(""); setInfo(""); setAuthError?.(""); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${mode === "otp" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            disabled={submitting || loading}
          >
            Código (OTP)
          </button>
        </div>

        {/* --- FORM: EMAIL/PASSWORD --- */}
        {mode === "password" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={form.email}
                onChange={onChange}
                disabled={submitting || loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={form.password}
                onChange={onChange}
                disabled={submitting || loading}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Ingresando…" : "Ingresar"}
            </button>

            {/* enlace para restablecer contraseña */}
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="text-muted-foreground">¿Olvidaste tu contraseña?</span>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={submitting || loading}
                className="underline underline-offset-2 hover:opacity-80 disabled:opacity-60"
                title="Te enviaremos un enlace al correo escrito arriba"
              >
                Enviar enlace
              </button>
            </div>
          </form>
        )}

        {/* --- FORM: OTP --- */}
        {mode === "otp" && (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground">
              Puedes recibir un código por <b>teléfono</b> (SMS) o por <b>correo</b>. Ingresa uno de los dos.
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="phone">
                Teléfono (con lada, opcional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+52XXXXXXXXXX"
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                value={form.phone}
                onChange={onChange}
                disabled={submitting || loading}
              />
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="otp_email">
                Correo (opcional si usas teléfono)
              </label>
              <input
                id="otp_email"
                name="email"
                type="email"
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                value={form.email}
                onChange={onChange}
                disabled={submitting || loading}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={submitting || loading}
                className="flex-1 rounded-lg border border-input px-3 py-2"
              >
                {submitting ? "Enviando…" : "Enviar código"}
              </button>
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="otp">
                Código recibido
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                value={form.otp}
                onChange={onChange}
                disabled={submitting || loading}
              />
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={submitting || loading}
              className="w-full rounded-lg bg-primary text-primary-foreground px-3 py-2 font-medium"
            >
              {submitting ? "Verificando…" : "Verificar y entrar"}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
