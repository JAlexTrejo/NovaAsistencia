import React, { useState } from 'react';
import { Users, Phone, User, ChevronDown, ChevronUp } from 'lucide-react';

export default function CoworkersList({ coworkers, siteInfo }) {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!coworkers || coworkers?.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Compañeros de Trabajo
          </h3>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No hay compañeros en este sitio
          </p>
        </div>
      </div>
    );
  }

  const filteredCoworkers = coworkers?.filter(coworker =>
    coworker?.full_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    coworker?.position?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  ) || [];

  const displayedCoworkers = expanded ? filteredCoworkers : filteredCoworkers?.slice(0, 4);

  const getStatusColor = (lastSignIn) => {
    if (!lastSignIn) return 'bg-gray-100 text-gray-600';
    
    const now = new Date();
    const signInDate = new Date(lastSignIn);
    const diffHours = (now - signInDate) / (1000 * 60 * 60);
    
    if (diffHours <= 8) return 'bg-green-100 text-green-700';
    if (diffHours <= 24) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

  const getStatusText = (lastSignIn) => {
    if (!lastSignIn) return 'Sin actividad';
    
    const now = new Date();
    const signInDate = new Date(lastSignIn);
    const diffHours = (now - signInDate) / (1000 * 60 * 60);
    
    if (diffHours <= 1) return 'En línea';
    if (diffHours <= 8) return 'Activo hoy';
    if (diffHours <= 24) return 'Activo ayer';
    return 'Inactivo';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Compañeros de Trabajo
          </h3>
          {siteInfo?.name && (
            <p className="text-sm text-gray-600">
              en {siteInfo?.name}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {coworkers?.length} personas
          </span>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {/* Search */}
      {coworkers?.length > 4 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar compañeros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}
      {/* Coworkers List */}
      <div className="space-y-3">
        {displayedCoworkers?.map((coworker) => (
          <div 
            key={coworker?.id}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {coworker?.full_name}
                  </h4>
                  <p className="text-xs text-gray-600 capitalize">
                    {coworker?.position || 'Sin posición'}
                  </p>
                </div>
                
                {/* Status indicator */}
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    getStatusColor(coworker?.user_profiles?.last_sign_in_at)
                  }`}>
                    {getStatusText(coworker?.user_profiles?.last_sign_in_at)}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-2 flex items-center space-x-4">
                {coworker?.phone && (
                  <button
                    onClick={() => window.open(`tel:${coworker?.phone}`)}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <Phone className="h-3 w-3" />
                    <span>Llamar</span>
                  </button>
                )}
                
                {coworker?.user_profiles?.email && (
                  <button
                    onClick={() => window.open(`mailto:${coworker?.user_profiles?.email}`)}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    Email
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Show More/Less Button */}
      {filteredCoworkers?.length > 4 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Ver menos</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Ver todos ({filteredCoworkers?.length})</span>
              </>
            )}
          </button>
        </div>
      )}
      {/* No Results */}
      {searchTerm && filteredCoworkers?.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            No se encontraron compañeros con "{searchTerm}"
          </p>
        </div>
      )}
      {/* Team Collaboration Features */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">
          Colaboración Rápida
        </h5>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              const phones = coworkers
                ?.filter(c => c?.phone)
                ?.map(c => c?.phone)
                ?.join(',');
              if (phones) window.open(`sms:${phones}`);
            }}
            className="flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Phone className="h-4 w-4 mr-1" />
            Mensaje Grupal
          </button>
          
          <button
            onClick={() => {
              const message = encodeURIComponent(`Hola equipo de ${siteInfo?.name || 'trabajo'}, necesito coordinar algo importante.`);
              const phones = coworkers
                ?.filter(c => c?.phone)
                ?.map(c => c?.phone)
                ?.join(',');
              if (phones) window.open(`https://wa.me/?phone=${phones?.split(',')?.[0]}&text=${message}`);
            }}
            className="flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Users className="h-4 w-4 mr-1" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}