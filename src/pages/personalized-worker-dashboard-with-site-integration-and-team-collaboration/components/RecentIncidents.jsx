import React, { useState } from 'react';
import { AlertTriangle, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { enhancedAttendanceService } from '../../../services/enhancedAttendanceService';

export default function RecentIncidents({ incidents, employeeId, onIncidentSubmitted }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    type: 'falta',
    date: new Date()?.toISOString()?.split('T')?.[0],
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitIncident = async () => {
    if (!newIncident?.description?.trim()) {
      setError('La descripción es requerida');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const result = await enhancedAttendanceService?.submitIncident(employeeId, newIncident);
      
      if (result?.success) {
        setShowCreateModal(false);
        setNewIncident({
          type: 'falta',
          date: new Date()?.toISOString()?.split('T')?.[0],
          description: ''
        });
        onIncidentSubmitted?.();
      } else {
        setError(result?.error || 'Error al enviar la incidencia');
      }
    } catch (error) {
      setError(`Error: ${error?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getIncidentTypeLabel = (type) => {
    const types = {
      falta: 'Falta',
      permiso: 'Permiso',
      retardo: 'Retardo',
      incapacidad: 'Incapacidad',
      accidente: 'Accidente'
    };
    return types?.[type] || type;
  };

  const getIncidentTypeColor = (type) => {
    const colors = {
      falta: 'bg-red-100 text-red-800',
      permiso: 'bg-blue-100 text-blue-800',
      retardo: 'bg-yellow-100 text-yellow-800',
      incapacidad: 'bg-purple-100 text-purple-800',
      accidente: 'bg-red-100 text-red-800'
    };
    return colors?.[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'aprobado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rechazado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pendiente: 'Pendiente',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado'
    };
    return labels?.[status] || status;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Incidencias Recientes
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Nueva</span>
          </button>
        </div>

        {/* Incidents List */}
        {incidents && incidents?.length > 0 ? (
          <div className="space-y-3">
            {incidents?.map((incident) => (
              <div 
                key={incident?.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getIncidentTypeColor(incident?.type)}`}>
                      {getIncidentTypeLabel(incident?.type)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(incident?.date)?.toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(incident?.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(incident?.status)}`}>
                      {getStatusLabel(incident?.status)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  {incident?.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Creada: {new Date(incident?.created_at)?.toLocaleDateString('es-ES')}
                  </span>
                  
                  {incident?.approved_at && incident?.approved_by_user?.full_name && (
                    <span>
                      {incident?.status === 'aprobado' ? 'Aprobada' : 'Rechazada'} por: {incident?.approved_by_user?.full_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No hay incidencias registradas
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Las incidencias incluyen faltas, permisos, retardos e incapacidades
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {incidents && incidents?.length > 0 && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-medium text-yellow-600">
                  {incidents?.filter(i => i?.status === 'pendiente')?.length}
                </div>
                <div className="text-xs text-gray-600">Pendientes</div>
              </div>
              <div>
                <div className="text-sm font-medium text-green-600">
                  {incidents?.filter(i => i?.status === 'aprobado')?.length}
                </div>
                <div className="text-xs text-gray-600">Aprobadas</div>
              </div>
              <div>
                <div className="text-sm font-medium text-red-600">
                  {incidents?.filter(i => i?.status === 'rechazado')?.length}
                </div>
                <div className="text-xs text-gray-600">Rechazadas</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nueva Incidencia
            </h3>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Incident Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Incidencia
                </label>
                <select
                  value={newIncident?.type}
                  onChange={(e) => setNewIncident({ ...newIncident, type: e?.target?.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="falta">Falta</option>
                  <option value="permiso">Permiso</option>
                  <option value="retardo">Retardo</option>
                  <option value="incapacidad">Incapacidad</option>
                  <option value="accidente">Accidente</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={newIncident?.date}
                  onChange={(e) => setNewIncident({ ...newIncident, date: e?.target?.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={newIncident?.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e?.target?.value })}
                  placeholder="Describe la incidencia y el motivo..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitIncident}
                disabled={submitting || !newIncident?.description?.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}