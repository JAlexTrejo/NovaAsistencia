import React from 'react';
import { MapPin, Building, User, Phone, AlertTriangle } from 'lucide-react';

export default function SiteInfoCard({ siteInfo, supervisor }) {
  if (!siteInfo) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Sitio de Trabajo
          </h3>
          <Building className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No hay sitio asignado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Sitio de Trabajo
        </h3>
        <Building className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {/* Site Information */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-1">
              {siteInfo?.name}
            </h4>
            {siteInfo?.description && (
              <p className="text-sm text-gray-600">
                {siteInfo?.description}
              </p>
            )}
          </div>

          {/* Location */}
          {siteInfo?.location && (
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <span className="text-sm text-gray-600">
                {siteInfo?.location}
              </span>
            </div>
          )}

          {/* Site Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Estado del Sitio</span>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              siteInfo?.is_active 
                ? 'bg-green-100 text-green-800' :'bg-red-100 text-red-800'
            }`}>
              {siteInfo?.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Supervisor Information */}
        {supervisor ? (
          <div className="border-t border-gray-100 pt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Supervisor Asignado
            </h5>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                {supervisor?.full_name}
              </p>
              
              {supervisor?.email && (
                <p className="text-sm text-gray-600">
                  {supervisor?.email}
                </p>
              )}
              
              {supervisor?.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {supervisor?.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Sin supervisor asignado
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-3">
            {supervisor?.phone && (
              <button
                onClick={() => window.open(`tel:${supervisor?.phone}`)}
                className="flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Phone className="h-4 w-4 mr-1" />
                Llamar
              </button>
            )}
            
            {siteInfo?.location && (
              <button
                onClick={() => {
                  const encodedLocation = encodeURIComponent(siteInfo?.location);
                  window.open(`https://maps.google.com?q=${encodedLocation}`, '_blank');
                }}
                className="flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <MapPin className="h-4 w-4 mr-1" />
                Ubicación
              </button>
            )}
          </div>
        </div>

        {/* Site Status Warning */}
        {!siteInfo?.is_active && (
          <div className="border-t border-gray-100 pt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h6 className="text-sm font-medium text-red-800 mb-1">
                    Sitio Inactivo
                  </h6>
                  <p className="text-xs text-red-700">
                    Este sitio de trabajo está marcado como inactivo. 
                    Contacta a tu supervisor para más información.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}