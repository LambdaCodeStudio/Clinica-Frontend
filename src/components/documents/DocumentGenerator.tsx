import React, { useState, useEffect, useRef } from 'react';
import { FileText, User, Check, Download, Eye, Save, Edit, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import apiService from '../../services/api';

interface DocumentTemplate {
  _id: string;
  titulo: string;
  tipo: string;
  contenido: string;
  campos: Array<{
    nombre: string;
    tipo: string;
    requerido: boolean;
    opciones?: string[];
  }>;
}

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
}

interface Doctor {
  _id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
}

interface DocumentFormData {
  templateId: string;
  pacienteId: string;
  medicoId: string;
  tratamientoId?: string;
  titulo: string;
  camposValores: Record<string, string | boolean>;
  firmaPaciente: boolean;
  firmaMedico: boolean;
}

interface SignatureData {
  dataUrl: string;
  signedBy: string;
  timestamp: string;
}

interface DocumentGeneratorProps {
  documentId?: string;
  initialTemplateId?: string;
  initialPatientId?: string;
  initialDoctorId?: string;
  initialTreatmentId?: string;
  onSubmitSuccess?: () => void;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  documentId,
  initialTemplateId,
  initialPatientId,
  initialDoctorId,
  initialTreatmentId,
  onSubmitSuccess
}) => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState<DocumentFormData>({
    templateId: initialTemplateId || '',
    pacienteId: initialPatientId || '',
    medicoId: initialDoctorId || '',
    tratamientoId: initialTreatmentId || '',
    titulo: '',
    camposValores: {},
    firmaPaciente: false,
    firmaMedico: false
  });
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const [showPatientSignatureModal, setShowPatientSignatureModal] = useState(false);
  const [showDoctorSignatureModal, setShowDoctorSignatureModal] = useState(false);
  const [patientSignature, setPatientSignature] = useState<SignatureData | null>(null);
  const [doctorSignature, setDoctorSignature] = useState<SignatureData | null>(null);
  
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentSignatureType, setCurrentSignatureType] = useState<'patient' | 'doctor'>('patient');
  
  const isEditing = !!documentId;

  useEffect(() => {
    fetchTemplates();
    fetchDoctors();
    
    if (initialPatientId) {
      fetchPatient(initialPatientId);
    }
    
    if (initialDoctorId) {
      const doctor = doctors.find(doc => doc._id === initialDoctorId);
      if (doctor) {
        setSelectedDoctor(doctor);
      }
    }
    
    if (isEditing) {
      fetchDocumentData();
    }
  }, [documentId, initialPatientId, initialDoctorId]);

  useEffect(() => {
    if (formData.templateId) {
      fetchTemplateDetails(formData.templateId);
    }
  }, [formData.templateId]);

  const fetchTemplates = async () => {
    try {
      const response = await apiService.get<{ templates: DocumentTemplate[] }>('/api/documentos/templates');
      setTemplates(response.templates);
    } catch (err: any) {
      setError(err.message || 'Error al cargar plantillas de documentos');
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await apiService.get<{ medicos: Doctor[] }>('/api/usuarios/medicos');
      setDoctors(response.medicos);
      
      if (initialDoctorId) {
        const doctor = response.medicos.find(doc => doc._id === initialDoctorId);
        if (doctor) {
          setSelectedDoctor(doctor);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar médicos');
    }
  };

  const fetchPatient = async (patientId: string) => {
    try {
      const response = await apiService.get<{ paciente: Patient }>(`/api/pacientes/${patientId}`);
      setSelectedPatient(response.paciente);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del paciente');
    }
  };

  const fetchTemplateDetails = async (templateId: string) => {
    try {
      setTemplateLoading(true);
      const response = await apiService.get<{ template: DocumentTemplate }>(`/api/documentos/templates/${templateId}`);
      const template = response.template;
      setSelectedTemplate(template);
      
      // Initialize form data with template fields
      const initialValues: Record<string, string | boolean> = {};
      template.campos.forEach(campo => {
        if (campo.tipo === 'checkbox') {
          initialValues[campo.nombre] = false;
        } else {
          initialValues[campo.nombre] = '';
        }
      });
      
      setFormData(prev => ({
        ...prev,
        titulo: isEditing ? prev.titulo : `${template.titulo} - ${new Date().toLocaleDateString()}`,
        camposValores: {
          ...initialValues,
          ...prev.camposValores // Preserve any values that were already set
        }
      }));
      
      setTemplateLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la plantilla');
      setTemplateLoading(false);
    }
  };

  const fetchDocumentData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ documento: any }>(`/api/documentos/${documentId}`);
      const documentData = response.documento;
      
      // Fetch template and patient data
      fetchTemplateDetails(documentData.template);
      if (documentData.paciente) {
        fetchPatient(documentData.paciente);
      }
      
      // Find doctor in the list
      const doctor = doctors.find(doc => doc._id === documentData.medico);
      if (doctor) {
        setSelectedDoctor(doctor);
      }
      
      // Set form data from document
      setFormData({
        templateId: documentData.template,
        pacienteId: documentData.paciente,
        medicoId: documentData.medico,
        tratamientoId: documentData.tratamiento || '',
        titulo: documentData.titulo,
        camposValores: documentData.camposValores || {},
        firmaPaciente: !!documentData.firmaPaciente,
        firmaMedico: !!documentData.firmaMedico
      });
      
      // Set signatures if available
      if (documentData.firmaPaciente) {
        setPatientSignature({
          dataUrl: documentData.firmaPaciente.imagen,
          signedBy: documentData.firmaPaciente.nombre,
          timestamp: documentData.firmaPaciente.fecha
        });
      }
      
      if (documentData.firmaMedico) {
        setDoctorSignature({
          dataUrl: documentData.firmaMedico.imagen,
          signedBy: documentData.firmaMedico.nombre,
          timestamp: documentData.firmaMedico.fecha
        });
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del documento');
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setFormData(prev => ({
      ...prev,
      templateId,
      camposValores: {} // Reset field values when template changes
    }));
  };

  const handleDoctorChange = (doctorId: string) => {
    setFormData(prev => ({
      ...prev,
      medicoId: doctorId
    }));
    
    const doctor = doctors.find(d => d._id === doctorId);
    if (doctor) {
      setSelectedDoctor(doctor);
    } else {
      setSelectedDoctor(null);
    }
  };

  const handlePatientChange = (patientId: string) => {
    setFormData(prev => ({
      ...prev,
      pacienteId: patientId
    }));
    
    // Ideally, we would fetch patient details here
    // but for simplicity, let's assume we already have the patient data
  };

  const handleFieldChange = (fieldName: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      camposValores: {
        ...prev.camposValores,
        [fieldName]: value
      }
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'titulo') {
      setFormData(prev => ({
        ...prev,
        titulo: value
      }));
    } else {
      // For checkbox fields
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        handleFieldChange(name, checked);
      } else {
        handleFieldChange(name, value);
      }
    }
  };

  const generatePreview = () => {
    if (!selectedTemplate) return;
    
    let content = selectedTemplate.contenido;
    
    // Replace variables with actual values
    Object.entries(formData.camposValores).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(value));
    });
    
    // Add patient signature if available
    if (patientSignature) {
      content = content.replace(
        '</div>',
        `<div style="margin-top: 20px;">
           <div style="border-bottom: 1px solid #000; display: inline-block;">
             <img src="${patientSignature.dataUrl}" alt="Firma del paciente" style="max-height: 80px;" />
           </div>
           <p style="margin-top: 5px; font-size: 12px;">
             Firmado por: ${patientSignature.signedBy}<br>
             Fecha: ${new Date(patientSignature.timestamp).toLocaleString()}
           </p>
         </div></div>`
      );
    }
    
    // Add doctor signature if available
    if (doctorSignature) {
      content = content.replace(
        '</div>',
        `<div style="margin-top: 20px;">
           <div style="border-bottom: 1px solid #000; display: inline-block;">
             <img src="${doctorSignature.dataUrl}" alt="Firma del médico" style="max-height: 80px;" />
           </div>
           <p style="margin-top: 5px; font-size: 12px;">
             Firmado por: Dr. ${doctorSignature.signedBy}<br>
             Fecha: ${new Date(doctorSignature.timestamp).toLocaleString()}
           </p>
         </div></div>`
      );
    }
    
    setPreviewContent(content);
    setShowPreviewModal(true);
  };

  const openSignatureModal = (type: 'patient' | 'doctor') => {
    setCurrentSignatureType(type);
    if (type === 'patient') {
      setShowPatientSignatureModal(true);
    } else {
      setShowDoctorSignatureModal(true);
    }
    
    // Clear the canvas when opening
    setTimeout(() => {
      const canvas = signaturePadRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 100);
  };

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signaturePadRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    
    if (e.type === 'mousedown') {
      const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
      const rect = canvas.getBoundingClientRect();
      const x = mouseEvent.clientX - rect.left;
      const y = mouseEvent.clientY - rect.top;
      ctx.moveTo(x, y);
    } else if (e.type === 'touchstart') {
      const touchEvent = e as React.TouchEvent<HTMLCanvasElement>;
      touchEvent.preventDefault(); // Prevent scrolling
      const rect = canvas.getBoundingClientRect();
      const touch = touchEvent.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      ctx.moveTo(x, y);
    }
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signaturePadRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    
    if (e.type === 'mousemove') {
      const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
      const rect = canvas.getBoundingClientRect();
      const x = mouseEvent.clientX - rect.left;
      const y = mouseEvent.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (e.type === 'touchmove') {
      const touchEvent = e as React.TouchEvent<HTMLCanvasElement>;
      touchEvent.preventDefault(); // Prevent scrolling
      const rect = canvas.getBoundingClientRect();
      const touch = touchEvent.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleEndDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signaturePadRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = signaturePadRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL();
    const timestamp = new Date().toISOString();
    
    if (currentSignatureType === 'patient') {
      setPatientSignature({
        dataUrl,
        signedBy: selectedPatient ? `${selectedPatient.nombre} ${selectedPatient.apellido}` : 'Paciente',
        timestamp
      });
      setFormData(prev => ({ ...prev, firmaPaciente: true }));
      setShowPatientSignatureModal(false);
    } else {
      setDoctorSignature({
        dataUrl,
        signedBy: selectedDoctor ? `${selectedDoctor.nombre} ${selectedDoctor.apellido}` : 'Médico',
        timestamp
      });
      setFormData(prev => ({ ...prev, firmaMedico: true }));
      setShowDoctorSignatureModal(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.templateId) {
      setError('Debe seleccionar una plantilla');
      return false;
    }
    
    if (!formData.pacienteId) {
      setError('Debe seleccionar un paciente');
      return false;
    }
    
    if (!formData.medicoId) {
      setError('Debe seleccionar un médico');
      return false;
    }
    
    if (!formData.titulo) {
      setError('Debe ingresar un título para el documento');
      return false;
    }
    
    // Validate required fields
    if (selectedTemplate) {
      for (const campo of selectedTemplate.campos) {
        if (campo.requerido && 
            (formData.camposValores[campo.nombre] === undefined || 
             formData.camposValores[campo.nombre] === '')) {
          setError(`El campo "${campo.nombre}" es requerido`);
          return false;
        }
      }
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
      
      // Prepare document data
      const documentData = {
        template: formData.templateId,
        paciente: formData.pacienteId,
        medico: formData.medicoId,
        tratamiento: formData.tratamientoId || undefined,
        titulo: formData.titulo,
        camposValores: formData.camposValores,
        firmaPaciente: patientSignature ? {
          imagen: patientSignature.dataUrl,
          nombre: patientSignature.signedBy,
          fecha: patientSignature.timestamp
        } : undefined,
        firmaMedico: doctorSignature ? {
          imagen: doctorSignature.dataUrl,
          nombre: doctorSignature.signedBy,
          fecha: doctorSignature.timestamp
        } : undefined
      };
      
      if (isEditing) {
        await apiService.put(`/api/documentos/${documentId}`, documentData);
        setSuccess('Documento actualizado con éxito');
      } else {
        await apiService.post('/api/documentos', documentData);
        setSuccess('Documento creado con éxito');
      }
      
      setLoading(false);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el documento');
      setLoading(false);
    }
  };

  const downloadDocument = async () => {
    if (!documentId) {
      setError('Primero debe guardar el documento');
      return;
    }
    
    try {
      // Trigger the PDF download
      window.location.href = `/api/documentos/${documentId}/pdf?download=true`;
    } catch (err: any) {
      setError(err.message || 'Error al descargar el documento');
    }
  };

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
        {/* Sección de Selección de Plantilla */}
        <Card title="1. Seleccionar Plantilla">
          <div className="space-y-4">
            <Select
              label="Plantilla de Documento"
              name="templateId"
              value={formData.templateId}
              onChange={handleTemplateChange}
              options={[
                { value: '', label: 'Seleccione una plantilla', disabled: true },
                ...templates.map(template => ({
                  value: template._id,
                  label: `${template.titulo} (${template.tipo})`
                }))
              ]}
              icon={<FileText className="h-5 w-5 text-gray-400" />}
              required
            />
            
            {templateLoading ? (
              <div className="p-4 flex justify-center">
                <Loading size="md" text="Cargando plantilla..." />
              </div>
            ) : selectedTemplate && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedTemplate.titulo}</h4>
                <p className="text-sm text-gray-600 capitalize mt-1">Tipo: {selectedTemplate.tipo}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Campos a completar: {selectedTemplate.campos.length}
                </p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Sección de Información Básica */}
        <Card title="2. Datos Básicos">
          <div className="space-y-4">
            <Input
              label="Título del Documento"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="Ej: Consentimiento Informado - Juan Pérez"
              icon={<FileText className="h-5 w-5 text-gray-400" />}
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Paciente"
                  name="pacienteId"
                  value={formData.pacienteId}
                  onChange={handlePatientChange}
                  options={[
                    { value: '', label: 'Seleccione un paciente', disabled: true },
                    ...patients.map(patient => ({
                      value: patient._id,
                      label: `${patient.nombre} ${patient.apellido} (${patient.dni})`
                    }))
                  ]}
                  icon={<User className="h-5 w-5 text-gray-400" />}
                  disabled={!!initialPatientId} // Disable if initial patient is provided
                  required
                />
                
                {selectedPatient && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">
                      {selectedPatient.nombre} {selectedPatient.apellido}
                    </h4>
                    <p className="text-sm text-gray-600">DNI: {selectedPatient.dni}</p>
                    <p className="text-sm text-gray-600">Email: {selectedPatient.email}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Select
                  label="Médico"
                  name="medicoId"
                  value={formData.medicoId}
                  onChange={handleDoctorChange}
                  options={[
                    { value: '', label: 'Seleccione un médico', disabled: true },
                    ...doctors.map(doctor => ({
                      value: doctor._id,
                      label: `Dr. ${doctor.nombre} ${doctor.apellido}`
                    }))
                  ]}
                  icon={<User className="h-5 w-5 text-gray-400" />}
                  disabled={!!initialDoctorId} // Disable if initial doctor is provided
                  required
                />
                
                {selectedDoctor && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">
                      Dr. {selectedDoctor.nombre} {selectedDoctor.apellido}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Especialidad: {selectedDoctor.especialidad}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Sección de Campos Variables */}
        {selectedTemplate && (
          <Card title="3. Completar Información del Documento">
            <div className="space-y-4">
              {selectedTemplate.campos.length === 0 ? (
                <p className="text-gray-500">Esta plantilla no tiene campos para completar.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.campos.map((campo, index) => (
                    <div key={index}>
                      {campo.tipo === 'texto' && (
                        <Input
                          label={`${campo.nombre}${campo.requerido ? ' *' : ''}`}
                          name={campo.nombre}
                          value={formData.camposValores[campo.nombre] as string || ''}
                          onChange={handleInputChange}
                          placeholder={`Ingrese ${campo.nombre}`}
                          required={campo.requerido}
                        />
                      )}
                      
                      {campo.tipo === 'fecha' && (
                        <Input
                          label={`${campo.nombre}${campo.requerido ? ' *' : ''}`}
                          name={campo.nombre}
                          type="date"
                          value={formData.camposValores[campo.nombre] as string || ''}
                          onChange={handleInputChange}
                          required={campo.requerido}
                        />
                      )}
                      
                      {campo.tipo === 'numero' && (
                        <Input
                          label={`${campo.nombre}${campo.requerido ? ' *' : ''}`}
                          name={campo.nombre}
                          type="number"
                          value={formData.camposValores[campo.nombre] as string || ''}
                          onChange={handleInputChange}
                          placeholder={`Ingrese ${campo.nombre}`}
                          required={campo.requerido}
                        />
                      )}
                      
                      {campo.tipo === 'opcion' && campo.opciones && (
                        <Select
                          label={`${campo.nombre}${campo.requerido ? ' *' : ''}`}
                          name={campo.nombre}
                          value={formData.camposValores[campo.nombre] as string || ''}
                          onChange={(value) => handleFieldChange(campo.nombre, value)}
                          options={[
                            { value: '', label: `Seleccione ${campo.nombre}`, disabled: true },
                            ...campo.opciones.map(opcion => ({
                              value: opcion,
                              label: opcion
                            }))
                          ]}
                          required={campo.requerido}
                        />
                      )}
                      
                      {campo.tipo === 'checkbox' && (
                        <div className="flex items-center space-x-2 p-2">
                          <input
                            type="checkbox"
                            id={campo.nombre}
                            name={campo.nombre}
                            checked={!!formData.camposValores[campo.nombre]}
                            onChange={(e) => handleFieldChange(campo.nombre, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={campo.nombre} className="text-sm text-gray-700">
                            {campo.nombre}
                            {campo.requerido && <span className="text-red-500 ml-1">*</span>}
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
        
        {/* Sección de Firmas */}
        <Card title="4. Firmas">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Firma del Paciente</h4>
                
                {patientSignature ? (
                  <div className="flex flex-col items-center mb-3">
                    <div className="border-b border-gray-300 pb-2">
                      <img 
                        src={patientSignature.dataUrl} 
                        alt="Firma del paciente" 
                        className="max-h-20"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Firmado por: {patientSignature.signedBy}<br />
                      Fecha: {new Date(patientSignature.timestamp).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">
                    El paciente aún no ha firmado este documento.
                  </p>
                )}
                
                <Button
                  variant={patientSignature ? "light" : "primary"}
                  icon={patientSignature ? <Edit className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  onClick={() => openSignatureModal('patient')}
                  type="button"
                  fullWidth
                >
                  {patientSignature ? 'Editar Firma' : 'Firmar como Paciente'}
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Firma del Médico</h4>
                
                {doctorSignature ? (
                  <div className="flex flex-col items-center mb-3">
                    <div className="border-b border-gray-300 pb-2">
                      <img 
                        src={doctorSignature.dataUrl} 
                        alt="Firma del médico" 
                        className="max-h-20"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Firmado por: Dr. {doctorSignature.signedBy}<br />
                      Fecha: {new Date(doctorSignature.timestamp).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">
                    El médico aún no ha firmado este documento.
                  </p>
                )}
                
                <Button
                  variant={doctorSignature ? "light" : "primary"}
                  icon={doctorSignature ? <Edit className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  onClick={() => openSignatureModal('doctor')}
                  type="button"
                  fullWidth
                >
                  {doctorSignature ? 'Editar Firma' : 'Firmar como Médico'}
                </Button>
              </div>
            </div>
            
            {!patientSignature || !doctorSignature ? (
              <Alert 
                variant="warning" 
                title="Información" 
              >
                <p>
                  {!patientSignature && !doctorSignature 
                    ? 'Este documento requiere la firma del paciente y del médico para estar completo.' 
                    : !patientSignature 
                      ? 'Este documento requiere la firma del paciente para estar completo.' 
                      : 'Este documento requiere la firma del médico para estar completo.'}
                </p>
                <p className="mt-1">
                  Puede guardar el documento sin firmas y completarlas más tarde.
                </p>
              </Alert>
            ) : (
              <Alert 
                variant="success" 
                title="Documento Completo" 
              >
                Este documento ha sido firmado por el paciente y el médico.
              </Alert>
            )}
          </div>
        </Card>
        
        {/* Botones de acción */}
        <div className="flex flex-wrap justify-end space-x-0 space-y-2 sm:space-x-4 sm:space-y-0">
          <Button 
            variant="light" 
            onClick={() => window.history.back()}
            type="button"
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          
          <Button 
            variant="secondary" 
            icon={<Eye className="h-5 w-5" />}
            onClick={generatePreview}
            type="button"
            className="w-full sm:w-auto"
            disabled={!selectedTemplate}
          >
            Vista Previa
          </Button>
          
          {isEditing && (
            <Button 
              variant="info" 
              icon={<Download className="h-5 w-5" />}
              onClick={downloadDocument}
              type="button"
              className="w-full sm:w-auto"
            >
              Descargar PDF
            </Button>
          )}
          
          <Button 
            variant="primary" 
            icon={<Save className="h-5 w-5" />}
            type="submit"
            isLoading={loading}
            className="w-full sm:w-auto"
          >
            {isEditing ? 'Actualizar Documento' : 'Guardar Documento'}
          </Button>
        </div>
      </form>
      
      {/* Modal de vista previa */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Vista Previa del Documento"
        size="lg"
      >
        <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-white">
          <div dangerouslySetInnerHTML={{ __html: previewContent }} />
        </div>
      </Modal>
      
      {/* Modal de firma para paciente */}
      <Modal
        isOpen={showPatientSignatureModal}
        onClose={() => setShowPatientSignatureModal(false)}
        title="Firma del Paciente"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={clearSignature}
              type="button"
            >
              Limpiar
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setShowPatientSignatureModal(false)}
              type="button"
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={saveSignature}
              type="button"
            >
              Guardar Firma
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Dibuje su firma en el recuadro a continuación:
          </p>
          
          <div className="border border-gray-300 rounded-lg p-1 bg-white">
            <canvas
              ref={signaturePadRef}
              width={550}
              height={200}
              className="w-full touch-none"
              onMouseDown={handleStartDrawing}
              onMouseMove={handleDrawing}
              onMouseUp={handleEndDrawing}
              onMouseLeave={handleEndDrawing}
              onTouchStart={handleStartDrawing}
              onTouchMove={handleDrawing}
              onTouchEnd={handleEndDrawing}
            />
          </div>
          
          <p className="text-xs text-gray-500">
            Al firmar este documento, acepta su contenido y todas las condiciones descritas en él.
          </p>
        </div>
      </Modal>
      
      {/* Modal de firma para médico */}
      <Modal
        isOpen={showDoctorSignatureModal}
        onClose={() => setShowDoctorSignatureModal(false)}
        title="Firma del Médico"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={clearSignature}
              type="button"
            >
              Limpiar
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setShowDoctorSignatureModal(false)}
              type="button"
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={saveSignature}
              type="button"
            >
              Guardar Firma
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Dibuje su firma en el recuadro a continuación:
          </p>
          
          <div className="border border-gray-300 rounded-lg p-1 bg-white">
            <canvas
              ref={signaturePadRef}
              width={550}
              height={200}
              className="w-full touch-none"
              onMouseDown={handleStartDrawing}
              onMouseMove={handleDrawing}
              onMouseUp={handleEndDrawing}
              onMouseLeave={handleEndDrawing}
              onTouchStart={handleStartDrawing}
              onTouchMove={handleDrawing}
              onTouchEnd={handleEndDrawing}
            />
          </div>
          
          <p className="text-xs text-gray-500">
            Al firmar este documento como médico, certifica la veracidad de la información contenida en él.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentGenerator;