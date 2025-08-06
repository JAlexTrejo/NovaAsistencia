import React from 'react';
import { useBranding } from '../BrandingProvider';
import AppIcon from '../AppIcon';

const BrandedHeader = ({ className = '', showLogo = true, showAppName = true }) => {
  const { branding, loading } = useBranding();

  if (loading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="w-8 h-8 bg-muted animate-pulse rounded"></div>
        <div className="w-32 h-6 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  const logo = branding?.logo_url;
  const appName = branding?.nombre_empresa || 'AsistenciaPro';

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showLogo && (
        <div className="flex-shrink-0">
          {logo ? (
            <img
              src={logo}
              alt={`${appName} Logo`}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <AppIcon name="Building" size={32} className="text-primary" />
          )}
        </div>
      )}
      
      {showAppName && (
        <h1 className="text-xl font-bold text-foreground truncate">
          {appName}
        </h1>
      )}
    </div>
  );
};

export default BrandedHeader;