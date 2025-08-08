import React from 'react';
import { User, Phone, Mail, Calendar, Badge, MapPin } from 'lucide-react';

export default function PersonalInfoCard({ workerProfile, userProfile }) {
  if (!workerProfile) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Información Personal
        </h3>
        <User className="h-5 w-5 text-gray-400" />
      </div>
      <div className="space-y-4">
        {/* Profile Photo and Name */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {workerProfile?.profile_picture_url ? (
              <img
                className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                src={workerProfile?.profile_picture_url}
                alt={workerProfile?.full_name}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-200">
                <User className="h-8 w-8 text-blue-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xl font-semibold text-gray-900 truncate">
              {workerProfile?.full_name}
            </h4>
            <p className="text-sm text-gray-600">
              ID: {workerProfile?.employee_id}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          {userProfile?.email && (
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{userProfile?.email}</span>
            </div>
          )}
          
          {workerProfile?.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{workerProfile?.phone}</span>
            </div>
          )}

          {/* Position */}
          <div className="flex items-center space-x-3">
            <Badge className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 capitalize">
              {workerProfile?.position || 'No asignado'}
            </span>
          </div>

          {/* Hire Date */}
          {workerProfile?.hire_date && (
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Inicio: {new Date(workerProfile?.hire_date)?.toLocaleDateString('es-ES')}
              </span>
            </div>
          )}

          {/* Address */}
          {workerProfile?.address && (
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <span className="text-sm text-gray-600">
                {workerProfile?.address}
              </span>
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        {workerProfile?.emergency_contact && (
          <div className="border-t border-gray-100 pt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Contacto de Emergencia
            </h5>
            <p className="text-sm text-gray-600">
              {workerProfile?.emergency_contact}
            </p>
          </div>
        )}

        {/* Employment Status */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Estado</span>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              workerProfile?.status === 'active' ?'bg-green-100 text-green-800' :'bg-red-100 text-red-800'
            }`}>
              {workerProfile?.status === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {/* Salary Information */}
          <div className="mt-3 space-y-2">
            {workerProfile?.salary_type === 'hourly' ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tarifa por Hora</span>
                <span className="font-medium text-gray-900">
                  ${parseFloat(workerProfile?.hourly_rate || 0)?.toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Salario Diario</span>
                <span className="font-medium text-gray-900">
                  ${parseFloat(workerProfile?.daily_salary || 0)?.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}