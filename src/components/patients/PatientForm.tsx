import React, { useState, useEffect } from 'react';
import { AtSign, Phone, User, CalendarDays, MapPin, Heart, AlertTriangle, Plus, X } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Tabs from '../ui/Tabs';
import apiService from '../../services/api';

interface Address {
  calle: string;
  numero: string;
  piso?: string;
  depto?: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais: string;
}

interface EmergencyContact {
  nombre: string;
  relacion: string;
  telefono: string;
}

interface PatientFormData {
  // Información personal
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  fechaNacimiento: string;
  genero: string;
  
  // Dirección
  direccion: Address;
  
  // Información médica
  grupoSanguineo: string;
  alergias: string[];
  condicionesMedicas: string[];
  medicacionActual: string[];
  
  // Contacto de emergencia
  contactoEmergencia: EmergencyContact;
  
  // Preferencias
  preferencias: {
    recibirRecordatoriosEmail: boolean;
    recibirRecordatoriosSMS: boolean;
    permitirFotos: boolean;
  };
}

const emptyPatient: PatientFormData = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  dni: '',
  fechaNacimiento: '',
  genero: 'no_especificado',
  direccion: {
    calle: '',
    numero: '',
    piso: '',
    depto: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
    pais: 'Argentina'
  },
  grupoSanguineo: '',
  alergias: [],
  condicionesMedicas: [],
  medicacionActual: [],
  contactoEmergencia: {
    nombre: '',
    relacion: '',
    telefono: ''
  },
  preferencias: {
    recibirRecordatoriosEmail: true,
    recibirRecordatoriosSMS: false,
    permitirFotos: true
  }
};

interface PatientFormProps {
  patientId?: string;
  onSubmitSuccess?: () => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ patientId, onSubmitSuccess }) => {
  const [formData, setFormData] = useState<PatientFormData>(emptyPatient);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ alergia: '', condicion: '', medicacion: '' });
  const [activeTab, setActiveTab] = useState('personal');
  
  const isEditing = !!patientId;

  useEffect(() => {
    if (isEditing) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ paciente: any }>(`/api/pacientes/${patientId}`);
      
      // Adaptar la respuesta del API a nuestro formato de estado
      const patient = response.paciente;
      
      setFormData({
        nombre: patient.nombre || '',
        apellido: patient.apellido || '',
        email: patient.email || '',
        telefono: patient.telefono || '',
        dni: patient.dni || '',
        fechaNacimiento: patient.fechaNacimiento ? new Date(patient.fechaNacimiento).toISOString().split('T')[0] : '',
        genero: patient.genero || 'no_especificado',
        direccion: patient.direccion || emptyPatient.direccion,
        grupoSanguineo: patient.grupoSanguineo || '',
        alergias: patient.alergias || [],
        condicionesMedicas: patient.condicionesMedicas || [],
        medicacionActual: patient.medicacionActual || [],
        contactoEmergencia: patient.contactoEmergencia || emptyPatient.contactoEmergencia,
        preferencias: {
          recibirRecordatoriosEmail: patient.preferencias?.recibirRecordatoriosEmail ?? true,
          recibirRecordatoriosSMS: patient.preferencias?.recibirRecordatoriosSMS ?? false,
          permitirFotos: patient.preferencias?.permitirFotos ?? true
        }
      });
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del paciente');
      setLoading(false);
    }
  };

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      direccion: {
        ...prev.direccion,
        [name]: value
      }
    }));
  };

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      contactoEmergencia: {
        ...prev.contactoEmergencia,
        [name]: value
      }
    }));
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      preferencias: {
        ...prev.preferencias,
        [name]: checked
      }
    }));
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addAlergia = () => {
    if (newItem.alergia.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      alergias: [...prev.alergias, newItem.alergia.trim()]
    }));
    
    setNewItem(prev => ({
      ...prev,
      alergia: ''
    }));
  };

  const removeAlergia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      alergias: prev.alergias.filter((_, i) => i !== index)
    }));
  };

  const addCondicion = () => {
    if (newItem.condicion.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      condicionesMedicas: [...prev.condicionesMedicas, newItem.condicion.trim()]
    }));
    
    setNewItem(prev => ({
      ...prev,
      condicion: ''
    }));
  };

  const removeCondicion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      condicionesMedicas: prev.condicionesMedicas.filter((_, i) => i !== index)
    }));
  };

  const addMedicacion = () => {
    if (newItem.medicacion.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      medicacionActual: [...prev.medicacionActual, newItem.medicacion.trim()]
    }));
    
    setNewItem(prev => ({
      ...prev,
      medicacion: ''
    }));
  };

  const removeMedicacion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicacionActual: prev.medicacionActual.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    // Requerimientos mínimos para crear/actualizar un paciente
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    
    if (!formData.apellido.trim()) {
      setError('El apellido es requerido');
      return false;
    }
    
    if (!formData.dni.trim()) {
      setError('El DNI es requerido');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('El email no es válido');
      return false;
    }
    
    if (!formData.telefono.trim()) {
      setError('El teléfono es requerido');
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
      
      if (isEditing) {
        // Actualizar paciente existente
        await apiService.put(`/api/pacientes/${patientId}`, formData);
        setSuccess('Paciente actualizado con éxito');
      } else {
        // Crear nuevo paciente
        await apiService.post('/api/pacientes', formData);
        setSuccess('Paciente creado con éxito');
        setFormData(emptyPatient); // Limpiar formulario
      }
      
      setLoading(false);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el paciente');
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'personal',
      label: 'Información Personal',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handlePersonalInfoChange}
              placeholder="Nombre"
              icon={<User className="h-5 w-5 text-gray-400" />}
              required
            />
            
            <Input
              label="Apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handlePersonalInfoChange}
              placeholder="Apellido"
              icon={<User className="h-5 w-5 text-gray-400" />}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="DNI"
              name="dni"
              value={formData.dni}
              onChange={handlePersonalInfoChange}
              placeholder="12345678"
              required
            />
            
            <Input
              label="Fecha de Nacimiento"
              name="fechaNacimiento"
              type="date"
              value={formData.fechaNacimiento}
              onChange={handlePersonalInfoChange}
              icon={<CalendarDays className="h-5 w-5 text-gray-400" />}
            />
            
            <Select
              label="Género"
              name="genero"
              value={formData.genero}
              onChange={(value) => setFormData(prev => ({ ...prev, genero: value }))}
              options={[
                { value: 'masculino', label: 'Masculino' },
                { value: 'femenino', label: 'Femenino' },
                { value: 'otro', label: 'Otro' },
                { value: 'no_especificado', label: 'No especificado' }
              ]}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handlePersonalInfoChange}
              placeholder="correo@ejemplo.com"
              icon={<AtSign className="h-5 w-5 text-gray-400" />}
              required
            />
            
            <Input
              label="Teléfono"
              name="telefono"
              value={formData.telefono}
              onChange={handlePersonalInfoChange}
              placeholder="+54 11 1234-5678"
              icon={<Phone className="h-5 w-5 text-gray-400" />}
              required
            />
          </div>
        </div>
      )
    },
    {
      id: 'address',
      label: 'Dirección',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-4">
              <Input
                label="Calle"
                name="calle"
                value={formData.direccion.calle}
                onChange={handleAddressChange}
                placeholder="Nombre de la calle"
                icon={<MapPin className="h-5 w-5 text-gray-400" />}
              />
            </div>
            
            <div className="md:col-span-2">
              <Input
                label="Número"
                name="numero"
                value={formData.direccion.numero}
                onChange={handleAddressChange}
                placeholder="123"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Piso"
              name="piso"
              value={formData.direccion.piso}
              onChange={handleAddressChange}
              placeholder="1"
            />
            
            <Input
              label="Departamento"
              name="depto"
              value={formData.direccion.depto}
              onChange={handleAddressChange}
              placeholder="A"
            />
            
            <Input
              label="Código Postal"
              name="codigoPostal"
              value={formData.direccion.codigoPostal}
              onChange={handleAddressChange}
              placeholder="1234"
            />
            
            <Input
              label="Ciudad"
              name="ciudad"
              value={formData.direccion.ciudad}
              onChange={handleAddressChange}
              placeholder="Ciudad"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Provincia"
              name="provincia"
              value={formData.direccion.provincia}
              onChange={handleAddressChange}
              placeholder="Provincia"
            />
            
            <Select
              label="País"
              name="pais"
              value={formData.direccion.pais}
              onChange={(value) => 
                setFormData(prev => ({
                  ...prev,
                  direccion: {
                    ...prev.direccion,
                    pais: value
                  }
                }))
              }
              options={[
                { value: 'Argentina', label: 'Argentina' },
                { value: 'Chile', label: 'Chile' },
                { value: 'Uruguay', label: 'Uruguay' },
                { value: 'Paraguay', label: 'Paraguay' },
                { value: 'Bolivia', label: 'Bolivia' },
                { value: 'Brasil', label: 'Brasil' },
                { value: 'Otro', label: 'Otro' }
              ]}
            />
          </div>
        </div>
      )
    },
    {
      id: 'medical',
      label: 'Información Médica',
      content: (
        <div className="space-y-6">
          <div>
            <Select
              label="Grupo Sanguíneo"
              name="grupoSanguineo"
              value={formData.grupoSanguineo}
              onChange={(value) => setFormData(prev => ({ ...prev, grupoSanguineo: value }))}
              icon={<Heart className="h-5 w-5 text-gray-400" />}
              options={[
                { value: '', label: 'Seleccionar grupo sanguíneo' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
                { value: 'Desconocido', label: 'Desconocido' }
              ]}
            />
          </div>
          
          <Card title="Alergias" className="overflow-visible">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  name="alergia"
                  value={newItem.alergia}
                  onChange={handleNewItemChange}
                  placeholder="Agregar alergia"
                  icon={<AlertTriangle className="h-5 w-5 text-gray-400" />}
                  className="flex-1"
                />
                <Button 
                  variant="primary" 
                  onClick={addAlergia}
                  icon={<Plus className="h-5 w-5" />}
                >
                  Agregar
                </Button>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto p-2">
                {formData.alergias.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No hay alergias registradas</p>
                ) : (
                  formData.alergias.map((alergia, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{alergia}</span>
                      <button 
                        onClick={() => removeAlergia(index)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Eliminar alergia"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
          
          <Card title="Condiciones Médicas" className="overflow-visible">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  name="condicion"
                  value={newItem.condicion}
                  onChange={handleNewItemChange}
                  placeholder="Agregar condición médica"
                  icon={<AlertTriangle className="h-5 w-5 text-gray-400" />}
                  className="flex-1"
                />
                <Button 
                  variant="primary" 
                  onClick={addCondicion}
                  icon={<Plus className="h-5 w-5" />}
                >
                  Agregar
                </Button>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto p-2">
                {formData.condicionesMedicas.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No hay condiciones médicas registradas</p>
                ) : (
                  formData.condicionesMedicas.map((condicion, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{condicion}</span>
                      <button 
                        onClick={() => removeCondicion(index)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Eliminar condición"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
          
          <Card title="Medicación Actual" className="overflow-visible">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  name="medicacion"
                  value={newItem.medicacion}
                  onChange={handleNewItemChange}
                  placeholder="Agregar medicación"
                  icon={<AlertTriangle className="h-5 w-5 text-gray-400" />}
                  className="flex-1"
                />
                <Button 
                  variant="primary" 
                  onClick={addMedicacion}
                  icon={<Plus className="h-5 w-5" />}
                >
                  Agregar
                </Button>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto p-2">
                {formData.medicacionActual.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No hay medicación registrada</p>
                ) : (
                  formData.medicacionActual.map((medicacion, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{medicacion}</span>
                      <button 
                        onClick={() => removeMedicacion(index)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Eliminar medicación"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 'emergency',
      label: 'Contacto de Emergencia',
      content: (
        <Card title="Contacto de Emergencia">
          <div className="space-y-4">
            <Input
              label="Nombre Completo"
              name="nombre"
              value={formData.contactoEmergencia.nombre}
              onChange={handleEmergencyContactChange}
              placeholder="Nombre del contacto de emergencia"
              icon={<User className="h-5 w-5 text-gray-400" />}
            />
            
            <Input
              label="Relación con el paciente"
              name="relacion"
              value={formData.contactoEmergencia.relacion}
              onChange={handleEmergencyContactChange}
              placeholder="Ej: Familiar, Cónyuge, Amigo"
            />
            
            <Input
              label="Teléfono de Contacto"
              name="telefono"
              value={formData.contactoEmergencia.telefono}
              onChange={handleEmergencyContactChange}
              placeholder="+54 11 1234-5678"
              icon={<Phone className="h-5 w-5 text-gray-400" />}
            />
          </div>
        </Card>
      )
    },
    {
      id: 'preferences',
      label: 'Preferencias',
      content: (
        <Card title="Preferencias de Comunicación y Consentimientos">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recibirRecordatoriosEmail"
                name="recibirRecordatoriosEmail"
                checked={formData.preferencias.recibirRecordatoriosEmail}
                onChange={handlePreferenceChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="recibirRecordatoriosEmail" className="text-sm text-gray-700">
                Recibir recordatorios por email
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recibirRecordatoriosSMS"
                name="recibirRecordatoriosSMS"
                checked={formData.preferencias.recibirRecordatoriosSMS}
                onChange={handlePreferenceChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="recibirRecordatoriosSMS" className="text-sm text-gray-700">
                Recibir recordatorios por SMS
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="permitirFotos"
                name="permitirFotos"
                checked={formData.preferencias.permitirFotos}
                onChange={handlePreferenceChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="permitirFotos" className="text-sm text-gray-700">
                Autorizo el uso de fotografías con fines médicos
              </label>
            </div>
          </div>
        </Card>
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
            {isEditing ? 'Actualizar Paciente' : 'Crear Paciente'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;