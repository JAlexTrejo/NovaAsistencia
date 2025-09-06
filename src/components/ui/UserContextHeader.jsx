import React, { useState } from 'react';
import Icon from '../AppIcon';
import { useAuth } from '../../contexts/AuthContext';

const UserContextHeader = ({ onLogout }) => {
  const { getCurrentUserContext, signOut, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userContext = getCurrentUserContext();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await signOut();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setIsDropdownOpen(false);
    }
  };

  // Show loading state if user context is still loading
  if (loading || !userContext) {
    return (
      <div className="flex items-center space-x-3">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div className="hidden md:block">
            <div className="w-24 h-4 bg-gray-300 rounded mb-1"></div>
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'superadmin': 'Super Admin',
      'admin': 'Administrador',
      'supervisor': 'Supervisor',
      'user': 'Empleado'
    };
    return roleMap?.[role] || role;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      'superadmin': 'text-purple-600',
      'admin': 'text-red-600',
      'supervisor': 'text-blue-600',
      'user': 'text-green-600'
    };
    return colorMap?.[role] || 'text-gray-600';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
          {userContext?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>

        {/* User Info - Hidden on mobile */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {userContext?.name || 'Usuario'}
          </div>
          <div className={`text-xs font-medium ${getRoleColor(userContext?.role)}`}>
            {getRoleDisplayName(userContext?.role)}
            {userContext?.isEmployee && userContext?.site && (
              <span className="text-gray-500 ml-1">• {userContext?.site}</span>
            )}
          </div>
        </div>

        {/* Dropdown Icon */}
        <Icon 
          name={isDropdownOpen ? "ChevronUp" : "ChevronDown"} 
          size={16} 
          className="text-gray-400 hidden md:block" 
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-medium">
                  {userContext?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {userContext?.name || 'Usuario'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {userContext?.email}
                  </div>
                  <div className={`text-xs font-medium ${getRoleColor(userContext?.role)}`}>
                    {getRoleDisplayName(userContext?.role)}
                  </div>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="p-4 space-y-3 text-sm">
              {userContext?.isEmployee && (
                <>
                  <div className="flex items-center space-x-2">
                    <Icon name="Building2" size={16} className="text-gray-400" />
                    <span className="text-gray-600">Obra:</span>
                    <span className="font-medium">{userContext?.site}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Icon name="User" size={16} className="text-gray-400" />
                    <span className="text-gray-600">Supervisor:</span>
                    <span className="font-medium">{userContext?.supervisor}</span>
                  </div>

                  {userContext?.position && (
                    <div className="flex items-center space-x-2">
                      <Icon name="Briefcase" size={16} className="text-gray-400" />
                      <span className="text-gray-600">Puesto:</span>
                      <span className="font-medium capitalize">{userContext?.position?.replace('_', ' ')}</span>
                    </div>
                  )}

                  {userContext?.employeeId && (
                    <div className="flex items-center space-x-2">
                      <Icon name="Hash" size={16} className="text-gray-400" />
                      <span className="text-gray-600">ID Empleado:</span>
                      <span className="font-medium">{userContext?.employeeId}</span>
                    </div>
                  )}
                </>
              )}

              {userContext?.phone && (
                <div className="flex items-center space-x-2">
                  <Icon name="Phone" size={16} className="text-gray-400" />
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="font-medium">{userContext?.phone}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    <span>Cerrando sesión...</span>
                  </>
                ) : (
                  <>
                    <Icon name="LogOut" size={16} />
                    <span>Cerrar Sesión</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserContextHeader;