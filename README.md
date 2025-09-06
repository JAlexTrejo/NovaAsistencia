# GY&ID CRM by Alejandro Trejo y Nova Axis

GY&ID CRM es un sistema integral de gestión de recursos humanos y nómina, diseñado específicamente para empresas de construcción con múltiples sitios de trabajo. El sistema incluye control de asistencia, cálculos de nómina automatizados, gestión de empleados y reportes avanzados.

## 🚀 Características Principales

- **Gestión de Empleados**: Control completo de perfiles, roles y asignaciones
- **Control de Asistencia**: Registro de entrada/salida con geolocalización
- **Cálculos de Nómina**: Automatización completa con soporte para aguinaldo y finiquito
- **RBAC Avanzado**: Control de acceso basado en roles (SuperAdmin, Admin, Supervisor, User)
- **Reportes y Analytics**: Dashboards ejecutivos y reportes detallados
- **Multi-sitio**: Gestión de múltiples obras de construcción
- **Tiempo Real**: Actualizaciones en tiempo real con Supabase

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Estado**: Redux Toolkit
- **Routing**: React Router v6
- **Testing**: Vitest, Testing Library
- **Build**: Vite con optimizaciones de producción
- **Deploy**: Docker + Nginx

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Docker (opcional, para deployment)

## ⚙️ Configuración del Entorno

### 1. Clonar el Repositorio

```bash
git clone [repository-url]
cd nova-hr
npm install
```

### 2. Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional API Keys
VITE_OPENAI_API_KEY=your-openai-api-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Configuración de Supabase

1. Crear un nuevo proyecto en [Supabase](https://supabase.io)
2. Ejecutar las migraciones SQL desde `supabase/migrations/`
3. Configurar las variables de entorno con tu URL y clave anónima
4. Configurar las políticas RLS según la documentación

### 4. Base de Datos

El sistema incluye migraciones SQL completas:

```bash
# Las migraciones se encuentran en supabase/migrations/
# Ejecutar en orden cronológico en tu proyecto Supabase
```

**Estructura Principal:**
- `usuarios` - Gestión de usuarios y roles
- `obras` - Sitios de construcción
- `asistencias` - Registros de asistencia
- `incidencias` - Sistema de reportes
- `logs_actividad` - Auditoría del sistema

## 🚀 Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Build
npm run build        # Construir para producción
npm run preview      # Previsualizar build de producción

# Calidad de Código
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Corregir errores de ESLint automáticamente
npm run format       # Formatear código con Prettier
npm run format:check # Verificar formato de código

# Testing
npm run test         # Ejecutar pruebas
npm run test:ui      # Interfaz visual de pruebas
npm run test:coverage # Generar reporte de cobertura
```

### Estructura del Proyecto

```
nova-hr/
├── src/
│   ├── auth/                    # Componentes de autenticación
│   ├── components/              # Componentes reutilizables
│   ├── contexts/               # Contextos de React
│   ├── data/                   # Servicios de datos
│   ├── pages/                  # Páginas de la aplicación
│   ├── services/               # Servicios de API
│   ├── utils/                  # Utilidades (payroll, helpers)
│   └── lib/                    # Configuración de librerías
├── supabase/migrations/        # Migraciones SQL
├── public/                     # Archivos estáticos
└── docker/                     # Configuración Docker
```

### Patrones de Desarrollo

**Componentes:**
```jsx
// Usar hooks de contexto para auth
const { user, userProfile, hasRole } = useAuth();

// Optional chaining obligatorio
const userName = user?.profile?.full_name ?? 'Usuario';

// Manejo de errores sin console.error para operaciones Supabase
if (error) {
  setErrorMessage(error.message); // Mostrar al usuario
  return;
}
```

**Servicios:**
```javascript
// Patrón de servicios de datos
export const employeeDataService = {
  async getEmployees(filters = {}) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
```

## 🧪 Testing

### Ejecutar Pruebas

```bash
# Pruebas unitarias
npm run test

# Cobertura de código
npm run test:coverage

# Interfaz visual
npm run test:ui
```

### Pruebas Incluidas

- **Utilidades de Nómina**: Pruebas completas para cálculos salariales
- **Servicios de Datos**: Pruebas de integración con Supabase
- **Componentes**: Pruebas unitarias de componentes React
- **Helpers**: Pruebas de funciones auxiliares

**Estructura de Tests:**
```
src/
├── utils/payroll.test.js       # Pruebas de cálculos de nómina
├── data/employeeService.test.js # Pruebas de servicios
└── test/setup.js               # Configuración global de tests
```

## 🐳 Deployment con Docker

### Build Local

```bash
# Construir imagen
docker build -t nova-hr .

# Ejecutar contenedor
docker run -p 8080:80 nova-hr
```

### Docker Compose

```bash
# Desarrollo
docker-compose up -d

# Producción
docker-compose -f docker-compose.prod.yml up -d
```

### Configuración Nginx

El sistema incluye configuración optimizada de Nginx:

- **Compresión**: Gzip y Brotli habilitados
- **Cache**: Headers de cache para assets estáticos
- **SPA**: Fallback para client-side routing
- **Security**: Headers de seguridad configurados
- **Health Check**: Endpoint `/health` para monitoreo

## 🔐 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS configuradas:

```sql
-- Ejemplo: Usuarios pueden ver solo sus datos
CREATE POLICY "users_manage_own_data" ON public.usuarios
FOR ALL TO authenticated
USING (id = auth.uid());

-- Admins pueden ver todos los datos
CREATE POLICY "admins_view_all" ON public.usuarios
FOR SELECT TO authenticated
USING (public.is_admin_from_auth());
```

### Roles del Sistema

1. **SuperAdmin**: Control total del sistema
2. **Admin**: Gestión de empleados y nómina
3. **Supervisor**: Gestión de sitios y equipos
4. **User**: Acceso a dashboard personal

### Variables de Entorno

**⚠️ NUNCA exponer claves de servicio en el cliente**

```env
# ✅ Correcto - Solo clave anónima en cliente
VITE_SUPABASE_ANON_KEY=eyJhbG...

```

## 📊 Monitoreo y Analytics

### Health Checks

```bash
# Verificar estado de la aplicación
curl http://localhost:8080/health

# Respuesta esperada
healthy
```

### Métricas Incluidas

- Performance de queries a base de datos
- Tiempo de respuesta de la aplicación  
- Uso de memoria y recursos
- Errores y excepciones
- Actividad de usuarios

## 🔧 Configuración Avanzada

### Vite Configuration

```javascript
// vite.config.js - Optimizaciones incluidas
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          // ... más optimizaciones
        }
      }
    }
  }
});
```

### ESLint y Prettier

```json
// Configuración incluida en package.json
{
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

## 📚 Documentación Adicional

- [Guía de Contribución](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md) 
- [Documentación API](docs/API.md)
- [Guía de Deployment](docs/DEPLOYMENT.md)

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código

- Usar ESLint y Prettier configurados
- Mantener cobertura de tests > 80%
- Documentar funciones complejas
- Usar optional chaining para acceso a propiedades
- Seguir patrones establecidos en el proyecto

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para reportar bugs o solicitar nuevas funcionalidades:

1. Revisar [Issues existentes](../../issues)
2. Crear nuevo Issue con template correspondiente
3. Incluir información detallada y pasos para reproducir

## 🎯 Roadmap

### v1.1.0 (Q2 2025)
- [ ] Notificaciones push
- [ ] Generación automática de reportes
- [ ] Integración con servicios de nómina externos
- [ ] Dashboard móvil optimizado

### v1.2.0 (Q3 2025)
- [ ] API RESTful pública
- [ ] Integración con sistemas contables
- [ ] Análisis predictivo de asistencia
- [ ] Multi-idioma

---

**Nova HR** - Transformando la gestión de recursos humanos con tecnología moderna 🚀