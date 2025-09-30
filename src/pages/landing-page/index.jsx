import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { 
  Users, 
  Clock, 
  DollarSign, 
  MapPin, 
  Shield, 
  BarChart3,
  CheckCircle2,
  ArrowRight 
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Clock,
      title: "Control de Asistencia",
      description: "Registro GPS en tiempo real para entrada y salida de empleados en cada obra"
    },
    {
      icon: DollarSign,
      title: "Cálculo de Nómina",
      description: "Automatización completa de nómina con aguinaldo, finiquito y deducciones"
    },
    {
      icon: Users,
      title: "Gestión de Personal",
      description: "Administración centralizada de empleados con perfiles detallados"
    },
    {
      icon: MapPin,
      title: "Multi-Obra",
      description: "Control de múltiples sitios de construcción desde una sola plataforma"
    },
    {
      icon: Shield,
      title: "Seguridad y Roles",
      description: "Control de acceso basado en roles: SuperAdmin, Admin, Supervisor y Usuario"
    },
    {
      icon: BarChart3,
      title: "Reportes Avanzados",
      description: "Análisis y reportes completos de asistencia, nómina y productividad"
    }
  ];

  const benefits = [
    "Reduce el tiempo de cálculo de nómina en un 80%",
    "Elimina errores manuales en el control de asistencia",
    "Mejora la transparencia con los trabajadores",
    "Optimiza la gestión de recursos en múltiples obras",
    "Genera reportes profesionales en segundos"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>GY&ID Corporativo App - Sistema de Gestión de Recursos Humanos</title>
        <meta name="description" content="Plataforma integral para gestión de personal, asistencia y nómina en empresas constructoras" />
      </Helmet>

      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">GY</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                GY&ID Corporativo
              </span>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Bienvenido a{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              GY&ID Corporativo App
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            La plataforma integral para gestión de recursos humanos, control de asistencia 
            y nómina diseñada especialmente para empresas constructoras
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center gap-2 text-lg"
            >
              Comenzar ahora
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Funcionalidades principales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white/50 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                ¿Por qué elegir GY&ID Corporativo?
              </h2>
              <p className="text-gray-600 mb-8">
                Nuestra plataforma está diseñada específicamente para las necesidades 
                de empresas constructoras, integrando todas las herramientas necesarias 
                para una gestión eficiente de recursos humanos.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">Características clave</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Registro de asistencia con geolocalización GPS</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Cálculo automático de nómina y prestaciones</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Gestión de incidencias y aprobaciones</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Control de acceso por roles y permisos</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Reportes y análisis en tiempo real</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Auditoría completa de actividades</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para optimizar tu gestión de recursos humanos?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a las empresas que ya confían en GY&ID Corporativo para 
            administrar su personal de manera eficiente y profesional
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-10 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors duration-200 shadow-xl text-lg"
          >
            Acceder al sistema
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2025 GY&ID Corporativo App. Sistema de gestión de recursos humanos para empresas constructoras.
          </p>
        </div>
      </footer>
    </div>
  );
}
