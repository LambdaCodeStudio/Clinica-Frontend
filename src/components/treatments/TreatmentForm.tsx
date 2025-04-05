import React, { useState, useEffect } from 'react';
import { Tag, DollarSign, Clock, FileText, User, Plus, X } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import apiService from '../../services/api';

interface Doctor {
  _id: string;
  nombre: string;
  apellido: string;
  especialidad?: string;
}

interface DocumentTemplate {
  _id: string;
  titulo: string;
  tipo: string;
}

interface TreatmentFormData {
  nombre: string;
  descripcion: string;
  categoria: 'estetica_general' | 'medicina_estetica';
  subcategoria: string;
  precio: number;
  duracionEstimada: number;
  requiereConsulta: boolean;
  requiereConsentimiento: boolean;
  consentimientoTemplate?: string;
  profesionalesHabilitados: string[];
  activo: boolean;
}

interface TreatmentFormProps {
  treatmentId?: string;
  onSubmitSuccess?: () => void;
}

export const TreatmentForm: React.FC<TreatmentFormProps> = ({
  treatmentId,
  onSubmitSuccess
}) => {
  const [formData, setFormData] = useState<TreatmentFormData>({
    nombre: '',
    descripcion: '',
    categoria: 'estetica_general',
    subcategoria: '',
    precio: 0,
    duracionEstimada: 60,
    requiereConsulta: false,
    requiereConsentimiento: false,
    profesionalesHabilitados: [],
    activo: true
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  
  const isEditing = !!treatmentId;

  useEffect(() => {
    fetchDoctors();
    fetchDocumentTemplates();
    
    if (isEditing) {
      fetchTreatmentData();
    }
  }, [treatmentId]);

  const fetchDoctors = async () => {
    try {
      const response = await apiService.get<{ medicos: Doctor[] }>('/api/usuarios/medicos');
      setDoctors(response.medicos);
    } catch (err: any) {
      setError(err.message || 'Error al cargar médicos');
    }
  };

  const fetchDocumentTemplates = async () => {
    try {
      const response = await apiService.get<{ templates: DocumentTemplate[] }>('/api/documentos/templates');
      // Filtrar solo plantillas de consentimiento
      const consentTemplates = response.templates.filter(template => template.tipo === 'consentimiento');
      setDocumentTemplates(consentTemplates);
    } catch (err: any) {
      setError(err.message || 'Error al cargar plantillas de documentos');
    }
  };

  const fetchTreatmentData = async () => {
    try {
      setInitialLoading(true);
      const response = await apiService.get<{ tratamiento: any }>(`/api/tratamientos/${treatmentId}`);
      const treatmentData = response.tratamiento;
      
      setFormData({
        nombre: treatmentData.nombre || '',
        descripcion: treatmentData.descripcion || '',
        categoria: treatmentData.categoria || 'estetica_general',
        subcategoria: treatmentData.subcategoria || '',
        precio: treatmentData.precio || 0,
        duracionEstimada: treatmentData.duracionEstimada || 60,
        requiereConsulta: treatmentData.requiereConsulta || false,
        requiereConsentimiento: treatmentData.requiereConsentimiento || false,
        consentimientoTemplate: treatmentData.consentimientoTemplate || undefined,
        profesionalesHabilitados: treatmentData.profesionalesHabilitados.map((p: any) => p._id) || [],
        activo: treatmentData.activo
      });
      
      setInitialLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del tratamiento');
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      categoria: value as 'estetica_general' | 'medicina_estetica'
    }));
  };

  const handleConsentTemplateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      consentimientoTemplate: value
    }));
  };

  const updateAvailableDoctors = () => {
    // Filtrar médicos que aún no han sido seleccionados
    const availableDocs = doctors.filter(doctor => 
      !formData.profesionalesHabilitados.includes(doctor._id)
    );
    
    setAvailableDoctors(availableDocs);
  };

  const handleAddDoctor = () => {
    if (!selectedDoctor) return;
    
    setFormData(prev => ({
      ...prev,
      profesionalesHabilitados: [...prev.profesionalesHabilitados, selectedDoctor]
    }));
    
    setSelectedDoctor('');
    setShowDoctorModal(false);
  };

  const handleRemoveDoctor = (doctorId: string) => {
    setFormData(prev => ({
      ...prev,
      profesionalesHabilitados: prev.profesionalesHabilitados.filter(id => id !== doctorId)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.nombre) {
      setError('El nombre del tratamiento es requerido');
      return false;
    }
    
    if (!formData.categoria) {
      setError('La categoría del tratamiento es requerida');
      return false;
    }
    
    if (formData.precio <= 0) {
      setError('El precio debe ser mayor a 0');
      return false;
    }
    
    if (formData.duracionEstimada <= 0) {
      setError('La duración estimada debe ser mayor a 0');
      return false;
    }
    
    if (formData.requiereConsentimiento && !formData.consentimientoTemplate) {
      setError('Debe seleccionar una plantilla de consentimiento');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const treatmentData = {
        ...formData,
        // Si no requiere consentimiento, no enviar la plantilla
        consentimientoTemplate: formData.requiereConsentimiento ? formData.consentimientoTemplate : undefined
      };
      
      if (isEditing) {
        await apiService.put(`/api/tratamientos/${treatmentId}`, treatmentData);
        setSuccess('Tratamiento actualizado con éxito');
      } else {
        await apiService.post('/api/tratamientos', treatmentData);
        setSuccess('Tratamiento creado con éxito');
        
        // Limpiar formulario si es una creación
        if (!isEditing) {
          setFormData({
            nombre: '',
            descripcion: '',
            categoria: 'estetica_general',
            subcategoria: '',
            precio: 0,
            duracionEstimada: 60,
            requiereConsulta: false,
            requiereConsentimiento: false,
            profesionalesHabilitados: [],
            activo: true
          });
        }
      }
      
      setLoading(false);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el tratamiento');
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando datos del tratamiento..." />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert 
          variant="error" 
          title="Error" 
          className="mb-4"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert 
          variant="success" 
          title="Éxito" 
          className="mb-4"
          dismissible
          onDismiss={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card title="Información Básica del Tratamiento">
          <div className="space-y-4">
            <Input
              label="Nombre del Tratamiento *"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Tratamiento Facial Completo"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Descripción detallada del tratamiento..."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Categoría *"
                name="categoria"
                value={formData.categoria}
                onChange={handleCategoryChange}
                options={[
                  { value: 'estetica_general', label: 'Estética General' },
                  { value: 'medicina_estetica', label: 'Medicina Estética' }
                ]}
                icon={<Tag className="h-5 w-5 text-gray-400" />}
                required
              />
              
              <Input
                label="Subcategoría"
                name="subcategoria"
                value={formData.subcategoria}
                onChange={handleInputChange}
                placeholder="Ej: Facial, Corporal, etc."
                icon={<Tag className="h-5 w-5 text-gray-400" />}
              />
            </div>
          </div>
        </Card>
        
        {/* Detalles del Tratamiento */}
        <Card title="Detalles del Tratamiento">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Precio (ARS) *"
                name="precio"
                type="number"
                value={formData.precio.toString()}
                onChange={handleInputChange}
                placeholder="0.00"
                icon={<DollarSign className="h-5 w-5 text-gray-400" />}
                min="0"
                step="0.01"
                required
              />
              
              <Input
                label="Duración Estimada (minutos) *"
                name="duracionEstimada"
                type="number"
                value={formData.duracionEstimada.toString()}
                onChange={handleInputChange}
                placeholder="60"
                icon={<Clock className="h-5 w-5 text-gray-400" />}
                min="1"
                required
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  id="requiereConsulta"
                  name="requiereConsulta"
                  type="checkbox"
                  checked={formData.requiereConsulta}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requiereConsulta" className="text-sm text-gray-700">
                  Requiere consulta previa
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  id="requiereConsentimiento"
                  name="requiereConsentimiento"
                  type="checkbox"
                  checked={formData.requiereConsentimiento}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requiereConsentimiento" className="text-sm text-gray-700">
                  Requiere consentimiento informado
                </label>
              </div>
            </div>
            
            {formData.requiereConsentimiento && (
              <div className="mt-2">
                <Select
                  label="Plantilla de Consentimiento *"
                  name="consentimientoTemplate"
                  value={formData.consentimientoTemplate || ''}
                  onChange={handleConsentTemplateChange}
                  options={[
                    { value: '', label: 'Seleccionar plantilla', disabled: true },
                    ...documentTemplates.map(template => ({
                      value: template._id,
                      label: template.titulo
                    }))
                  ]}
                  icon={<FileText className="h-5 w-5 text-gray-400" />}
                  required
                />
                
                {documentTemplates.length === 0 && (
                  <div className="mt-2 text-sm text-amber-600">
                    No hay plantillas de consentimiento disponibles. 
                    <a 
                      href="/documentos/templates/nuevo" 
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      Crear una nueva plantilla
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
        
        {/* Profesionales Habilitados */}
        <Card title="Profesionales Habilitados">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="primary"
                icon={<Plus className="h-5 w-5" />}
                onClick={() => {
                  updateAvailableDoctors();
                  setShowDoctorModal(true);
                }}
                disabled={doctors.length === formData.profesionalesHabilitados.length}
              >
                Agregar Profesional
              </Button>
            </div>
            
            {formData.profesionalesHabilitados.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No hay profesionales habilitados para este tratamiento
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.profesionalesHabilitados.map((doctorId) => {
                  const doctor = doctors.find(d => d._id === doctorId);
                  
                  if (!doctor) return null;
                  
                  return (
                    <div 
                      key={doctorId}
                      className="p-4 bg-gray-50 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">
                          Dr. {doctor.nombre} {doctor.apellido}
                        </div>
                        {doctor.especialidad && (
                          <div className="text-sm text-gray-500">
                            {doctor.especialidad}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoctor(doctorId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
        
        {/* Estado del Tratamiento (solo en edición) */}
        {isEditing && (
          <Card title="Estado del Tratamiento">
            <div className="flex items-center space-x-2">
              <input
                id="activo"
                name="activo"
                type="checkbox"
                checked={formData.activo}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="activo" className="text-sm text-gray-700">
                Tratamiento activo (disponible para agendar citas)
              </label>
            </div>
          </Card>
        )}
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Button 
            variant="light" 
            onClick={() => window.history.back()}
            type="button"
          >
            Cancelar
          </Button>
          
          <Button 
            variant="primary" 
            type="submit"
            isLoading={loading}
          >
            {isEditing ? 'Actualizar Tratamiento' : 'Crear Tratamiento'}
          </Button>
        </div>
      </form>
      
      {/* Modal para agregar profesionales */}
      <Modal
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        title="Agregar Profesional"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setShowDoctorModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddDoctor}
              disabled={!selectedDoctor}
            >
              Agregar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {availableDoctors.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Todos los profesionales ya han sido agregados
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Seleccione un profesional para habilitar en este tratamiento:
              </p>
              
              <Select
                options={[
                  { value: '', label: 'Seleccionar profesional', disabled: true },
                  ...availableDoctors.map(doctor => ({
                    value: doctor._id,
                    label: `Dr. ${doctor.nombre} ${doctor.apellido}${doctor.especialidad ? ` - ${doctor.especialidad}` : ''}`
                  }))
                ]}
                value={selectedDoctor}
                onChange={setSelectedDoctor}
                icon={<User className="h-5 w-5 text-gray-400" />}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TreatmentForm;