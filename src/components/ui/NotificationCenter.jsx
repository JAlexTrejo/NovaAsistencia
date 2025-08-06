import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';

const NotificationCenter = ({ 
  notifications = [],
  onNotificationClick = () => {},
  onMarkAsRead = () => {},
  onMarkAllAsRead = () => {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Mock notifications for demo
  const mockNotifications = [
    {
      id: 1,
      type: 'approval',
      title: 'Solicitud de Ausencia Pendiente',
      message: 'María González ha solicitado ausencia para el 15 de enero',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      isRead: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'alert',
      title: 'Registro de Asistencia Tardío',
      message: 'Carlos Ruiz registró entrada a las 8:45 AM',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'info',
      title: 'Reporte Semanal Generado',
      message: 'El reporte de asistencia semanal está listo para revisión',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      isRead: true,
      priority: 'low'
    },
    {
      id: 4,
      type: 'system',
      title: 'Mantenimiento Programado',
      message: 'El sistema estará en mantenimiento el domingo de 2:00 AM a 4:00 AM',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
      priority: 'medium'
    }
  ];

  const activeNotifications = notifications?.length > 0 ? notifications : mockNotifications;
  const unreadCount = activeNotifications?.filter(n => !n?.isRead)?.length;

  const getNotificationIcon = (type) => {
    const iconMap = {
      approval: 'UserCheck',
      alert: 'AlertTriangle',
      info: 'Info',
      system: 'Settings',
      default: 'Bell'
    };
    return iconMap?.[type] || iconMap?.default;
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'text-error';
    if (type === 'approval') return 'text-warning';
    if (type === 'alert') return 'text-warning';
    if (type === 'info') return 'text-primary';
    return 'text-muted-foreground';
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `hace ${minutes}m`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${days}d`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification?.isRead) {
      onMarkAsRead(notification?.id);
    }
    onNotificationClick(notification);
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-150 ease-out-cubic hover:scale-98 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <Icon name="Bell" size={20} />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-error-foreground text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 transition-all duration-200 ease-out-cubic">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-popover-foreground">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({unreadCount} nuevas)
                </span>
              )}
            </h3>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors duration-150 ease-out-cubic"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {activeNotifications?.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="Bell" size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No hay notificaciones</p>
              </div>
            ) : (
              <div className="py-2">
                {activeNotifications?.map((notification) => (
                  <button
                    key={notification?.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      w-full p-4 text-left hover:bg-muted transition-all duration-150 ease-out-cubic
                      border-l-4 ${notification?.isRead ? 'border-transparent' : 'border-primary'}
                      ${!notification?.isRead ? 'bg-muted/50' : ''}
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 mt-0.5 ${getNotificationColor(notification?.type, notification?.priority)}`}>
                        <Icon name={getNotificationIcon(notification?.type)} size={16} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium truncate ${!notification?.isRead ? 'text-popover-foreground' : 'text-muted-foreground'}`}>
                            {notification?.title}
                          </p>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {formatTimestamp(notification?.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification?.message}
                        </p>
                        
                        {notification?.priority === 'high' && (
                          <div className="flex items-center mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
                              <Icon name="AlertCircle" size={12} className="mr-1" />
                              Urgente
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {!notification?.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {activeNotifications?.length > 0 && (
            <div className="p-3 border-t border-border">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium transition-colors duration-150 ease-out-cubic"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;