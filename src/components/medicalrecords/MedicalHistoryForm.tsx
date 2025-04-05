import React, { useState, useEffect } from 'react';
import { Calendar, User, FileText, Plus, X, Upload, Camera } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import Tabs from '../ui/Tabs';
import apiService from '../../services/api';

interface Appointment {
  _id: string;
  paciente: {
    _id: string;
    nombre: string;
    apellido: string;
    dni: string;
  };
  medico: {
    _id: string;
    nombre: string;
    apellido: string;
  };
  fechaInicio: string;
  tratamiento: {
    _id: string;
    nombre: string;
  };
}

interface Parameter {
  nombre: string;
  valor: string;
  unidad?: string;
}

interface Document {
  _id?: string;
  titulo: string;
  tipo: string;
  archivo?: File;
  url?: string;
}

interface MedicalHistoryFormData {
  pacienteId: string;
  medicoId: string;
  citaId: string;
  tratamientoRealizadoId: string;
  motivoConsulta: string;
  diagnostico: string;
  observaciones: string;
  indicaciones: string;
  parametrosRegistrados: Parameter[];
  resultados: string;
  documentos: Document[];
  autorizacionDivulgacionImagenes: boolean;
  recomendacionesSeguimiento: string;
  proximaCita: {
    fecha: string;
    motivo: string;
  };
}

interface MedicalHistoryFormProps {
  medicalHistoryId?: string;
  appointmentId?: string;
  onSubmitSuccess?: () => void;
}

export const MedicalHistoryForm: React.FC<MedicalHistoryFormProps> = ({
  medicalHistoryId,
  appointmentId,
  onSubmitSuccess
}) => {
  const [formData, setFormData] = useState<MedicalHistoryFormData>({
    pacienteId: '',
    medicoId: '',
    citaId: '',
    tratamientoRealizadoId: '',
    motivoConsulta: '',
    diagnostico: '',
    observaciones: '',
    indicaciones: '',
    parametrosRegistrados: [],
    resultados: '',
    documentos: [],
    autorizacionDivulgacionImagenes: false,
    recomendacionesSeguimiento: '',
    proximaCita: {
      fecha: '',
      motivo: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [newParam, setNewParam] = useState<Parameter>({ nombre: '', valor: '', unidad: '' });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocument, setNewDocument] = useState<Document>({ titulo: '', tipo: 'consentimiento' });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const isEditing = !!medicalHistoryId;

  useEffect(() => {
    if (isEditing) {
      fetchMedicalHistoryData();
    } else if (appointmentId) {
      fetchAppointmentData();
    }
  }, [medicalHistoryId, appointmentId]);

  const fetchMedicalHistoryData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ historia: any }>(`/api/historias/${medicalHistoryId}`);
      const historyData = response.historia;
      
      // Obtener datos de la cita
      await fetchAppointmentData(historyData.cita._id);
      
      // Completar el formulario con los datos de la historia
      setFormData({
        pacienteId: historyData.paciente._id,
        medicoId: historyData.medico._id,
        citaId: historyData.cita._id,
        tratamientoRealizadoId: historyData.tratamientoRealizado._id,
        motivoConsulta: historyData.motivoConsulta || '',
        diagnostico: historyData.diagnostico || '',
        observaciones: historyData.observaciones || '',
        indicaciones: historyData.indicaciones || '',
        parametrosRegistrados: historyData.parametrosRegistrados || [],
        resultados: historyData.resultados || '',
        documentos: (historyData.documentos || []).map((doc: any) => ({
          _id: doc._id,
          titulo: doc.titulo,
          tipo: doc.tipo,
          url: doc.url
        })),
        autorizacionDivulgacionImagenes: historyData.autorizacionDivulgacionImagenes || false,
        recomendacionesSeguimiento: historyData.recomendacionesSeguimiento || '',
        proximaCita: historyData.proximaCita || {
          fecha: '',
          motivo: ''
        }
      });
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de la historia clínica');
      setLoading(false);
    }
  };

  const fetchAppointmentData = async (appointmentIdToFetch = appointmentId) => {
    if (!appointmentIdToFetch) return;
    
    try {
      setAppointmentLoading(true);
      const response = await apiService.get<{ cita: Appointment }>(`/api/citas/${appointmentIdToFetch}`);
      const appointmentData = response.cita;
      
      setAppointment(appointmentData);
      
      // Completar los campos básicos del formulario con los datos de la cita
      setFormData(prev => ({
        ...prev,
        pacienteId: appointmentData.paciente._id,
        medicoId: appointmentData.medico._id,
        citaId: appointmentData._id,
        tratamientoRealizadoId: appointmentData.tratamiento._id
      }));
      
      setAppointmentLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de la cita');
      setAppointmentLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleProximaCitaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      proximaCita: {
        ...prev.proximaCita,
        [name]: value
      }
    }));
  };

  const handleNewParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewParam(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addParameter = () => {
    if (!newParam.nombre || !newParam.valor) return;
    
    setFormData(prev => ({
      ...prev,
      parametrosRegistrados: [...prev.parametrosRegistrados, { ...newParam }]
    }));
    
    setNewParam({ nombre: '', valor: '', unidad: '' });
  };

  const removeParameter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parametrosRegistrados: prev.parametrosRegistrados.filter((_, i) => i !== index)
    }));
  };

  const handleNewDocumentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDocument(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setNewDocument(prev => ({
      ...prev,
      archivo: file
    }));
    
    // Crear una URL para la vista previa
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadDocument = async () => {
    if (!newDocument.titulo || !newDocument.tipo || !newDocument.archivo) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Crear FormData para subir el archivo
      const formData = new FormData();
      formData.append('file', newDocument.archivo);
      formData.append('tipo', 'documento');
      formData.append('categoria', newDocument.tipo);
      formData.append('paciente', formData.pacienteId);
      formData.append('descripcion', newDocument.titulo);
      
      // Simular progreso de carga (en un caso real, esto vendría del API)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      // Subir el archivo
      const response = await apiService.post('/api/archivos/upload', formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Agregar el documento al formulario
      setFormData(prev => ({
        ...prev,
        documentos: [...prev.documentos, {
          _id: response.archivo._id,
          titulo: newDocument.titulo,
          tipo: newDocument.tipo,
          url: response.archivo.url
        }]
      }));
      
      // Limpiar el formulario de carga
      setNewDocument({ titulo: '', tipo: 'consentimiento' });
      setFilePreview(null);
      setIsUploading(false);
      setShowUploadModal(false);
      
    } catch (err: any) {
      setError(err.message || 'Error al subir el documento');
      setIsUploading(false);
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documentos: prev.documentos.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.pacienteId) {
      setError('Se requiere un paciente');
      return false;
    }
    
    if (!formData.medicoId) {
      setError('Se requiere un médico');
      return false;
    }
    
    if (!formData.citaId) {
      setError('Se requiere una cita');
      return false;
    }
    
    if (!formData.tratamientoRealizadoId) {
      setError('Se requiere un tratamiento');
      return false;
    }
    
    if (!formData.motivoConsulta) {
      setError('El motivo de consulta es requerido');
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
      
      const historyData = {
        paciente: formData.pacienteId,
        medico: formData.medicoId,
        cita: formData.citaId,
        tratamientoRealizado: formData.tratamientoRealizadoId,
        motivoConsulta: formData.motivoConsulta,
        diagnostico: formData.diagnostico,
        observaciones: formData.observaciones,
        indicaciones: formData.indicaciones,
        parametrosRegistrados: formData.parametrosRegistrados,
        resultados: formData.resultados,
        documentos: formData.documentos.map(doc => doc._id),
        autorizacionDivulgacionImagenes: formData.autorizacionDivulgacionImagenes,
        recomendacionesSeguimiento: formData.recomendacionesSeguimiento,
        proximaCita: formData.proximaCita.fecha 
          ? formData.proximaCita 
          : undefined
      };
      
      if (isEditing) {
        await apiService.put(`/api/historias/${medicalHistoryId}`, historyData);
        setSuccess('Historia clínica actualizada con éxito');
      } else {
        await apiService.post('/api/historias', historyData);
        setSuccess('Historia clínica creada con éxito');
        
        // También actualizar el estado de la cita a 'completada'
        await apiService.put(`/api/citas/${formData.citaId}/estado`, {
          estado: 'completada'
        });
      }
      
      setLoading(false);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar la historia clínica');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('es-ES', options);
  };

  if (loading || appointmentLoading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando datos..." />
      </div>
    );
  }

  const tabs = [
    {
      id: 'general',
      label: 'Información General',
      content: (
        <div className="space-y-6">
          {/* Información de la cita */}
          <Card title="Información de la Cita">
            <div className="space-y-4">
              {appointment ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Paciente</div>
                    <div className="font-medium">
                      {appointment.paciente.nombre} {appointment.paciente.apellido}
                    </div>
                    <div className="text-sm text-gray-500">DNI: {appointment.paciente.dni}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Médico</div>
                    <div className="font-medium">
                      Dr. {appointment.medico.nombre} {appointment.medico.apellido}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Fecha y Hora</div>
                    <div className="font-medium">
                      {formatDate(appointment.fechaInicio)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Tratamiento</div>
                    <div className="font-medium">
                      {appointment.tratamiento.nombre}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No se ha seleccionado una cita
                </div>
              )}
            </div>
          </Card>
          
          {/* Datos clínicos básicos */}
          <Card title="Datos Clínicos Básicos">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de Consulta *
                </label>
                <textarea
                  name="motivoConsulta"
                  value={formData.motivoConsulta}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnóstico
                </label>
                <textarea
                  name="diagnostico"
                  value={formData.diagnostico}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 'parameters',
      label: 'Parámetros',
      content: (
        <Card title="Parámetros Registrados">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Nombre del Parámetro"
                name="nombre"
                value={newParam.nombre}
                onChange={handleNewParamChange}
                placeholder="Ej: Presión Arterial"
              />
              
              <Input
                label="Valor"
                name="valor"
                value={newParam.valor}
                onChange={handleNewParamChange}
                placeholder="Ej: 120/80"
              />
              
              <Input
                label="Unidad (opcional)"
                name="unidad"
                value={newParam.unidad || ''}
                onChange={handleNewParamChange}
                placeholder="Ej: mmHg"
              />
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="primary"
                icon={<Plus className="h-5 w-5" />}
                onClick={addParameter}
                disabled={!newParam.nombre || !newParam.valor}
              >
                Agregar Parámetro
              </Button>
            </div>
            
            {formData.parametrosRegistrados.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No se han registrado parámetros
              </div>
            ) : (
              <div className="mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parámetro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.parametrosRegistrados.map((param, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {param.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {param.valor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {param.unidad || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => removeParameter(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )
    },
    {
      id: 'results',
      label: 'Resultados e Indicaciones',
      content: (
        <div className="space-y-6">
          <Card title="Resultados del Tratamiento">
            <div>
              <textarea
                name="resultados"
                value={formData.resultados}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Describa los resultados obtenidos con el tratamiento..."
              />
            </div>
          </Card>
          
          <Card title="Indicaciones para el Paciente">
            <div>
              <textarea
                name="indicaciones"
                value={formData.indicaciones}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Indique las recomendaciones y cuidados que debe seguir el paciente..."
              />
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 'documents',
      label: 'Documentos',
      content: (
        <Card title="Documentos Asociados">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="primary"
                icon={<Upload className="h-5 w-5" />}
                onClick={() => setShowUploadModal(true)}
              >
                Subir Documento
              </Button>
            </div>
            
            {formData.documentos.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No hay documentos asociados
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.documentos.map((doc, index) => (
                  <div 
                    key={index}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{doc.titulo}</h3>
                        <p className="text-sm text-gray-500 capitalize">{doc.tipo}</p>
                      </div>
                      <div className="flex space-x-2">
                        {doc.url && (
                          <a 
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Ver
                          </a>
                        )}
                        <button
                          onClick={() => removeDocument(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autorizacionDivulgacionImagenes"
                  name="autorizacionDivulgacionImagenes"
                  checked={formData.autorizacionDivulgacionImagenes}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autorizacionDivulgacionImagenes" className="ml-2 block text-sm text-gray-900">
                  El paciente autoriza el uso de imágenes con fines médicos y académicos
                </label>
              </div>
            </div>
          </div>
        </Card>
      )
    },
    {
      id: 'followup',
      label: 'Seguimiento',
      content: (
        <div className="space-y-6">
          <Card title="Recomendaciones de Seguimiento">
            <div>
              <textarea
                name="recomendacionesSeguimiento"
                value={formData.recomendacionesSeguimiento}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Indique las recomendaciones para el seguimiento del paciente..."
              />
            </div>
          </Card>
          
          <Card title="Próxima Cita">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha"
                  name="fecha"
                  type="date"
                  value={formData.proximaCita.fecha}
                  onChange={handleProximaCitaChange}
                  icon={<Calendar className="h-5 w-5 text-gray-400" />}
                  min={new Date().toISOString().split('T')[0]}
                />
                
                <Input
                  label="Motivo"
                  name="motivo"
                  value={formData.proximaCita.motivo}
                  onChange={handleProximaCitaChange}
                  placeholder="Ej: Control, Seguimiento, etc."
                />
              </div>
            </div>
          </Card>
        </div>
      )
    }
  ];

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
      
      <form onSubmit={handleSubmit}>
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />
        
        <div className="mt-8 flex justify-end space-x-4">
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
            {isEditing ? 'Actualizar Historia Clínica' : 'Guardar Historia Clínica'}
          </Button>
        </div>
      </form>
      
      {/* Modal para subir documentos */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Subir Documento"
        size="lg"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setShowUploadModal(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={uploadDocument}
              isLoading={isUploading}
              disabled={!newDocument.titulo || !newDocument.tipo || !newDocument.archivo}
            >
              Subir Documento
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Título del Documento"
              name="titulo"
              value={newDocument.titulo}
              onChange={handleNewDocumentChange}
              placeholder="Ej: Consentimiento para tratamiento"
              required
            />
            
            <Select
              label="Tipo de Documento"
              name="tipo"
              value={newDocument.tipo}
              onChange={handleNewDocumentChange}
              options={[
                { value: 'consentimiento', label: 'Consentimiento' },
                { value: 'autorizacion', label: 'Autorización' },
                { value: 'informativo', label: 'Informativo' },
                { value: 'receta', label: 'Receta' },
                { value: 'certificado', label: 'Certificado' },
                { value: 'otro', label: 'Otro' }
              ]}
              required
            />
          </div>
          
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
            <Camera className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">Arrastre un archivo o haga clic para seleccionar</p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <Button
              variant="light"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isUploading}
            >
              Seleccionar Archivo
            </Button>
          </div>
          
          {filePreview && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-1">Vista previa:</p>
              {newDocument.archivo?.type.startsWith('image/') ? (
                <img src={filePreview} alt="Preview" className="max-h-48 mx-auto" />
              ) : (
                <div className="flex items-center p-2 bg-gray-100 rounded">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700 truncate">
                    {newDocument.archivo?.name}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-sm mt-1">{uploadProgress}%</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MedicalHistoryForm;