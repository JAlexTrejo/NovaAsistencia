import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';

const UserContextHeader = ({ 
  user = null,
  onLogout = null,
  onProfileClick = null,
  onSiteChange = () => {}
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user: authUser, userProfile, signOut } = useAuth();

  // Use auth context user if no user prop provided
  const currentUser = user || {
    name: userProfile?.full_name || authUser?.email?.split('@')?.[0] || 'Usuario',
    role: userProfile?.role || 'user',
    site: userProfile?.site || 'Sin asignar',
    avatar: null
  };

  const availableSites = [
    { id: 1, name: 'Obra Central', status: 'active' },
    { id: 2, name: 'Proyecto Norte', status: 'active' },
    { id: 3, name: 'Edificio Sur', status: 'maintenance' }
  ];

  const roleColors = {
    'superadmin': 'bg-error text-error-foreground',
    'admin': 'bg-warning text-warning-foreground',
    'supervisor': 'bg-primary text-primary-foreground',
    'user': 'bg-secondary text-secondary-foreground'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      await signOut();
      navigate('/login');
    }
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile-center');
    }
  };

  const handleSiteChange = (site) => {
    setIsDropdownOpen(false);
    onSiteChange(site);
  };

  const handleHomeNavigation = () => {
    setIsDropdownOpen(false);
    // Navigate to appropriate home based on user role
    const role = currentUser?.role?.toLowerCase();
    switch (role) {
      case 'superadmin': navigate('/admin/system');
        break;
      case 'admin': navigate('/admin/employees');
        break;
      case 'supervisor': navigate('/supervisor/sites');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')?.map(word => word?.charAt(0))?.join('')?.toUpperCase()?.slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Info Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-all duration-150 ease-out-cubic hover:scale-98 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {currentUser?.avatar ? (
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              {getInitials(currentUser?.name)}
            </div>
          )}
        </div>

        {/* User Details - Hidden on mobile */}
        <div className="hidden md:block text-left">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">{currentUser?.name}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleColors?.[currentUser?.role] || roleColors?.user}`}>
              {currentUser?.role}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Icon name="MapPin" size={12} />
            <span>{currentUser?.site}</span>
          </div>
        </div>

        {/* Dropdown Arrow */}
        <Icon 
          name={isDropdownOpen ? 'ChevronUp' : 'ChevronDown'} 
          size={16} 
          className="text-muted-foreground transition-transform duration-150 ease-out-cubic"
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 transition-all duration-200 ease-out-cubic">
          {/* User Info Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser?.avatar}
                    alt={currentUser?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {getInitials(currentUser?.name)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-popover-foreground truncate">{currentUser?.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleColors?.[currentUser?.role] || roleColors?.user}`}>
                    {currentUser?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Site Selection */}
          <div className="p-2 border-b border-border">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sitio Actual
            </div>
            {availableSites?.map((site) => (
              <button
                key={site?.id}
                onClick={() => handleSiteChange(site)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-sm rounded-md
                  transition-all duration-150 ease-out-cubic hover:bg-muted
                  ${site?.name === currentUser?.site ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}
                `}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="MapPin" size={14} />
                  <span>{site?.name}</span>
                </div>
                {site?.name === currentUser?.site && (
                  <Icon name="Check" size={14} className="text-success" />
                )}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={handleHomeNavigation}
              className="w-full flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-all duration-150 ease-out-cubic"
            >
              <Icon name="Home" size={16} className="mr-3 text-muted-foreground" />
              Inicio
            </button>

            <button
              onClick={handleProfileClick}
              className="w-full flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-all duration-150 ease-out-cubic"
            >
              <Icon name="User" size={16} className="mr-3 text-muted-foreground" />
              Mi Perfil
            </button>
            
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                navigate('/admin/system');
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-all duration-150 ease-out-cubic"
            >
              <Icon name="Settings" size={16} className="mr-3 text-muted-foreground" />
              Configuración
            </button>

            <div className="border-t border-border my-2"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-error hover:bg-error hover:text-error-foreground rounded-md transition-all duration-150 ease-out-cubic"
            >
              <Icon name="LogOut" size={16} className="mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserContextHeader;