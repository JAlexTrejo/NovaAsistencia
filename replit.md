# Nova HR - GY&ID CRM System

## Project Overview
Nova HR is a comprehensive human resources and payroll management system designed for construction companies with multiple work sites. Built with React 18, Vite, and Supabase, it provides attendance control, automated payroll calculations, employee management, and advanced reporting.

## Recent Changes
- **September 29, 2025**: Replit environment setup and comprehensive testing
  - Configured Vite to run on port 5000 for Replit compatibility
  - Enabled `allowedHosts: true` for proxy support (Replit serves via iframe)
  - Set up Frontend workflow for development server
  - Updated .gitignore with Node.js patterns
  - Fixed branding service (added missing `getPublicBrandingSettings`, `applyBrandingSettings`, `formatCurrency` methods)
  - Fixed EmployeeAttendanceDashboard component (was incorrectly exporting service instead of React component)
  - Verified all forms are functional:
    - Employee registration/management with multi-step validation
    - Attendance check-in/out with GPS geolocation
    - Payroll calculation and management
    - Sites/obras creation and configuration
    - Incident registration and approval workflow
  - All navigation, buttons, and forms tested and working correctly

## Tech Stack
- **Frontend**: React 18, Vite 5.4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Testing**: Vitest
- **Build Tool**: Vite

## Project Architecture

### Directory Structure
```
nova-hr/
├── src/
│   ├── auth/              # Authentication components
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (AuthContext, etc.)
│   ├── pages/             # Application pages/routes
│   ├── services/          # API services for data operations
│   ├── utils/             # Utility functions (payroll calculations, etc.)
│   └── lib/               # Library configurations
├── supabase/
│   └── migrations/        # Database migration files
└── public/                # Static assets
```

### Key Features
- Role-Based Access Control (RBAC): SuperAdmin, Admin, Supervisor, User
- Real-time attendance tracking with geolocation
- Automated payroll calculations (aguinaldo, finiquito support)
- Multi-site construction management
- Comprehensive reporting and analytics
- Activity logging and security monitoring

## Configuration

### Environment Variables
The project uses `.env` file with the following variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- Optional API keys for OpenAI, Gemini, Anthropic, etc.

### Development Server
- Port: 5000 (configured for Replit)
- Host: 0.0.0.0 (accepts all connections)
- HMR: Enabled via WebSocket
- Proxy Support: Enabled (`allowedHosts: true`)

### Supabase Integration
The application connects to Supabase for:
- User authentication and authorization
- PostgreSQL database operations
- Real-time data subscriptions
- Row Level Security (RLS) policies

Database migrations are located in `supabase/migrations/` and should be applied in chronological order.

## Development Workflow

### Available Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run test`: Run tests with Vitest

### Running the Application
The Frontend workflow is configured to automatically run `npm run dev` on port 5000. The application will be accessible through the Replit webview.

### Code Conventions
- Use optional chaining for safe property access
- Handle Supabase errors by displaying user-friendly messages
- Follow existing component patterns and file structure
- Use Tailwind CSS for styling
- Implement proper error boundaries

## Database Schema
Main tables include:
- `usuarios`: User management and profiles
- `obras`: Construction sites
- `asistencias`: Attendance records
- `incidencias`: Incident reports
- `logs_actividad`: Activity audit logs

All tables have Row Level Security (RLS) policies configured.

## User Roles & Permissions
1. **SuperAdmin**: Full system control
2. **Admin**: Employee and payroll management
3. **Supervisor**: Site and team management
4. **User**: Personal dashboard access

## Testing
- Unit tests for utilities and services
- Component tests with React Testing Library
- Payroll calculation tests with comprehensive coverage

## Deployment
The application is configured for deployment with:
- Docker support (Dockerfile and docker-compose.yml included)
- Nginx configuration for production
- Build optimizations and code splitting
- Cache control headers for SPA routing
