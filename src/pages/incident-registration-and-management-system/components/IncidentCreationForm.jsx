import React, { useState, useRef } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { AlertCircle, Upload, X, FileText, Image } from 'lucide-react';
import { incidentService } from '../../../services/incidentService';
import { useAuth } from '../../../contexts/AuthContext';

export function IncidentCreationForm({ onIncidentCreated, onCancel, targetEmployeeId = null }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    type: '',
    date: new Date()?.toISOString()?.split('T')?.[0],
    description: '',
    employee_id: targetEmployeeId || user?.id
  })
  
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const incidentTypes = [
    { value: 'falta', label: 'Falta' },
    { value: 'permiso', label: 'Permiso' },
    { value: 'retardo', label: 'Retardo' },
    { value: 'incapacidad', label: 'Incapacidad Médica' }
  ]

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event?.target?.files || [])
    
    if (attachments?.length + files?.length > 5) {
      setMessage('Máximo 5 archivos permitidos')
      return
    }

    // Validate file types and sizes
    const validFiles = []
    const maxSize = 50 * 1024 * 1024 // 50MB

    for (const file of files) {
      if (file?.size > maxSize) {
        setMessage(`Archivo ${file?.name} es demasiado grande (máximo 50MB)`)
        continue
      }

      const validTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic',
        'application/pdf'
      ]

      if (!validTypes?.includes(file?.type)) {
        setMessage(`Tipo de archivo no permitido: ${file?.name}`)
        continue
      }

      validFiles?.push(file)
    }

    if (validFiles?.length > 0) {
      setAttachments(prev => [...prev, ...validFiles])
      setMessage('')
    }

    // Clear file input
    if (fileInputRef?.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev?.filter((_, i) => i !== index))
  }

  const getFileIcon = (file) => {
    if (file?.type?.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-600" />
    }
    return <FileText className="h-4 w-4 text-red-600" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i]
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    
    if (!formData?.type || !formData?.date || !formData?.description?.trim()) {
      setMessage('Por favor complete todos los campos requeridos')
      return
    }

    if (attachments?.length === 0 && formData?.type === 'incapacidad') {
      setMessage('Para incapacidades médicas debe adjuntar documentos de respaldo')
      return
    }

    setLoading(true)
    setMessage('')
    setUploadProgress(0)

    try {
      const result = await incidentService?.createIncident(formData, attachments)

      if (result?.success) {
        setMessage('✅ Incidencia creada exitosamente')
        
        // Reset form
        setFormData({
          type: '',
          date: new Date()?.toISOString()?.split('T')?.[0],
          description: '',
          employee_id: targetEmployeeId || user?.id
        })
        setAttachments([])
        
        // Notify parent component
        onIncidentCreated?.(result?.incident)
        
        setTimeout(() => {
          setMessage('')
          onCancel?.()
        }, 2000)
      } else {
        setMessage(`❌ Error: ${result?.error}`)
      }
    } catch (error) {
      setMessage('❌ Error al crear la incidencia')
      console.error('Incident creation error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Registrar Nueva Incidencia
        </h3>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            iconName="X"
            iconPosition="left"
          >
            Cancelar
          </Button>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message?.includes('❌') 
            ? 'bg-red-50 border border-red-200' :'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm ${
            message?.includes('❌') ? 'text-red-800' : 'text-blue-800'
          }`}>
            {message}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Incident Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Incidencia *
          </label>
          <Select
            options={incidentTypes}
            value={formData?.type}
            onChange={(value) => handleInputChange('type', value)}
            placeholder="Seleccionar tipo de incidencia"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha *
          </label>
          <Input
            type="date"
            value={formData?.date}
            onChange={(e) => handleInputChange('date', e?.target?.value)}
            required
            max={new Date()?.toISOString()?.split('T')?.[0]}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción / Justificación *
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            value={formData?.description}
            onChange={(e) => handleInputChange('description', e?.target?.value)}
            placeholder="Describe los detalles de la incidencia..."
            required
          />
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documentos de Respaldo
            {formData?.type === 'incapacidad' && <span className="text-red-500"> *</span>}
          </label>
          
          <div className="space-y-3">
            {/* Upload Button */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef?.current?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Haz clic para subir archivos o arrastra aquí
              </p>
              <p className="text-xs text-gray-500">
                Imágenes (JPG, PNG, HEIC) y PDFs hasta 50MB cada uno
              </p>
              <p className="text-xs text-gray-500">
                Máximo 5 archivos por incidencia
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Selected Files */}
            {attachments?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Archivos seleccionados ({attachments?.length}/5):
                </p>
                
                {attachments?.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {file?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file?.size)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File requirements by type */}
          {formData?.type && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  {formData?.type === 'incapacidad' && (
                    <p>
                      <strong>Incapacidad médica:</strong> Debe adjuntar receta médica, 
                      certificado de incapacidad o documento oficial del médico.
                    </p>
                  )}
                  {formData?.type === 'permiso' && (
                    <p>
                      <strong>Permiso:</strong> Se recomienda adjuntar documentos de respaldo 
                      si el permiso es por motivos médicos o legales.
                    </p>
                  )}
                  {formData?.type === 'retardo' && (
                    <p>
                      <strong>Retardo:</strong> Puede adjuntar documentos que justifiquen 
                      el motivo del retardo (médicos, tráfico, etc.).
                    </p>
                  )}
                  {formData?.type === 'falta' && (
                    <p>
                      <strong>Falta:</strong> Se recomienda adjuntar documentos que 
                      justifiquen la ausencia.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={loading || !formData?.type || !formData?.description?.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creando incidencia...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>Registrar Incidencia</span>
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Información importante:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Solo supervisores y administradores pueden registrar incidencias</li>
              <li>• Las incapacidades médicas requieren documentos de respaldo obligatorios</li>
              <li>• Los archivos se almacenan de forma segura y solo son visibles para el equipo autorizado</li>
              <li>• Una vez creada la incidencia, será revisada por el administrador</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncidentCreationForm;