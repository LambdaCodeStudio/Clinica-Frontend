import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, Info, Search } from 'lucide-react';
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
  especialidad: string;
  email: string;
}

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
}

interface Treatment {
  _id: string;
  nombre: string;
  descripcion: string;
  duracionEstimada: number;
  precio: number;
  categoria: string;
  requiereConsulta: boolean;
  requiereConsentimiento: boolean;
}

interface AppointmentFormData {
  pacienteId: string;
  medicoId: string;
  tratamientoId: string;
  fecha: string;
  hora: string;
  duracion: number;
  notas: string;
}

interface AppointmentFormProps {
  appointmentId?: string;
  initialPatientId?: string;
  initialDoctorId?: string;
  initialTreatmentId?: string;
  onSubmitSuccess?: () => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointmentId,
  initialPatientId,
  initialDoctorId,
  initialTreatmentId,
  onSubmitSuccess
}) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    pacienteId: initialPatientId || '',
    medicoId: initialDoctorId || '',
    tratamientoId: initialTreatmentId || '',
    fecha: '',
    hora: '',
    duracion: 30,
    notas: ''
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [isSearchPatientModalOpen, setIsSearchPatientModalOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const isEditing = !!appointmentId;

  useEffect(() => {
    fetchDoctors();
    fetchTreatments();
    
    if (isEditing) {
      fetchAppointmentData();
    } else if (initialPatientId) {
      fetchPatientData(initialPatientId);
    }
  }, [appointmentId, initialPatientId]);

  useEffect(() => {
    // Check if we have all necessary data to fetch available slots
    if (formData.medicoId && formData.fecha && formData.tratamientoId) {
      fetchAvailableSlots();
    }
  }, [formData.medicoId, formData.fecha, formData.tratamientoId]);

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

  const fetchTreatments = async () => {
    try {
      const response = await apiService.get<{ tratamientos: Treatment[] }>('/api/tratamientos');
      setTreatments(response.tratamientos);
      
      if (initialTreatmentId) {
        const treatment = response.tratamientos.find(treat => treat._id === initialTreatmentId);
        if (treatment) {
          setSelectedTreatment(treatment);
          setFormData(prev => ({
            ...prev,
            duracion: treatment.duracionEstimada
          }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar tratamientos');
    }
  };

  const fetchPatientData = async (patientId: string) => {
    try {
      const response = await apiService.get<{ paciente: Patient }>(`/api/pacientes/${patientId}`);
      setSelectedPatient(response.paciente);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del paciente');
    }
  };

  const fetchAppointmentData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ cita: any }>(`/api/citas/${appointmentId}`);
      const appointmentData = response.cita;
      
      // Fetch patient data
      await fetchPatientData(appointmentData.paciente._id);
      
      // Find doctor in the list
      const doctor = doctors.find(doc => doc._id === appointmentData.medico._id);
      if (doctor) {
        setSelectedDoctor(doctor);
      }
      
      // Find treatment in the list
      const treatment = treatments.find(treat => treat._id === appointmentData.tratamiento._id);
      if (treatment) {
        setSelectedTreatment(treatment);
      }
      
      // Parse date and time
      const appointmentDate = new Date(appointmentData.fechaInicio);
      const formattedDate = appointmentDate.toISOString().split('T')[0];
      const formattedTime = appointmentDate.toTimeString().slice(0, 5);
      
      setFormData({
        pacienteId: appointmentData.paciente._id,
        medicoId: appointmentData.medico._id,
        tratamientoId: appointmentData.tratamiento._id,
        fecha: formattedDate,
        hora: formattedTime,
        duracion: treatment?.duracionEstimada || 30,
        notas: appointmentData.notas || ''
      });
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos de la cita');
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setSlotsLoading(true);
      
      const response = await apiService.get<{ horarios: string[] }>(
        `/api/citas/horarios-disponibles?medico=${formData.medicoId}&fecha=${formData.fecha}&duracion=${formData.duracion}`
      );
      
      setAvailableSlots(response.horarios);
      setSlotsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar horarios disponibles');
      setSlotsLoading(false);
    }
  };

  const searchPatients = async () => {
    if (patientSearchTerm.trim().length < 3) {
      setError('Ingrese al menos 3 caracteres para buscar');
      return;
    }
    
    try {
      setSearchLoading(true);
      const response = await apiService.get<{ pacientes: Patient[] }>(
        `/api/pacientes/buscar?q=${patientSearchTerm}`
      );
      setSearchResults(response.pacientes);
      setSearchLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al buscar pacientes');
      setSearchLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      pacienteId: patient._id
    }));
    setIsSearchPatientModalOpen(false);
  };

  const handleTreatmentChange = (treatmentId: string) => {
    setFormData(prev => ({
      ...prev,
      tratamientoId: treatmentId
    }));
    
    const treatment = treatments.find(t => t._id === treatmentId);
    if (treatment) {
      setSelectedTreatment(treatment);
      setFormData(prev => ({
        ...prev,
        duracion: treatment.duracionEstimada
      }));
    } else {
      setSelectedTreatment(null);
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.pacienteId) {
      setError('Debe seleccionar un paciente');
      return false;
    }
    
    if (!formData.medicoId) {
      setError('Debe seleccionar un médico');
      return false;
    }
    
    if (!formData.tratamientoId) {
      setError('Debe seleccionar un tratamiento');
      return false;
    }
    
    if (!formData.fecha) {
      setError('Debe seleccionar una fecha');
      return false;
    }
    
    if (!formData.hora) {
      setError('Debe seleccionar una hora');
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
      
      // Construir la fecha y hora de inicio
      const fechaInicio = new Date(`${formData.fecha}T${formData.hora}`);
      
      // Calcular fecha y hora de fin basado en la duración
      const fechaFin = new Date(fechaInicio.getTime() + formData.duracion * 60000);
      
      const appointmentData = {
        paciente: formData.pacienteId,
        medico: formData.medicoId,
        tratamiento: formData.tratamientoId,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        notas: formData.notas
      };
      
      if (isEditing) {
        await apiService.put(`/api/citas/${appointmentId}`, appointmentData);
        setSuccess('Cita actualizada con éxito');
      } else {
        await apiService.post('/api/citas', appointmentData);
        setSuccess('Cita creada con éxito');
        
        // Limpiar formulario para nueva cita, pero mantener paciente y médico
        setFormData(prev => ({
          ...prev,
          fecha: '',
          hora: '',
          notas: ''
        }));
      }
      
      setLoading(false);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar la cita');
      setLoading(false);
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
        {/* Sección de Paciente */}
        <Card title="Paciente">
          <div className="space-y-4">
            {selectedPatient ? (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h3 className="font-medium">{selectedPatient.nombre} {selectedPatient.apellido}</h3>
                  <p className="text-sm text-gray-600">DNI: {selectedPatient.dni}</p>
                  <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                  <p className="text-sm text-gray-600">{selectedPatient.telefono}</p>
                </div>
                <Button 
                  variant="light" 
                  className="mt-2 sm:mt-0"
                  onClick={() => setIsSearchPatientModalOpen(true)}
                >
                  Cambiar Paciente
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button 
                  variant="primary" 
                  icon={<Search className="h-5 w-5" />}
                  onClick={() => setIsSearchPatientModalOpen(true)}
                >
                  Buscar Paciente
                </Button>
              </div>
            )}
          </div>
        </Card>
        
        {/* Sección del Médico */}
        <Card title="Médico">
          <div className="space-y-4">
            <Select
              label="Seleccione un médico"
              name="medicoId"
              value={formData.medicoId}
              onChange={handleDoctorChange}
              options={[
                { value: '', label: 'Seleccione un médico', disabled: true },
                ...doctors.map(doctor => ({
                  value: doctor._id,
                  label: `Dr. ${doctor.nombre} ${doctor.apellido} - ${doctor.especialidad}`
                }))
              ]}
              icon={<User className="h-5 w-5 text-gray-400" />}
              required
            />
            
            {selectedDoctor && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium">Información del médico:</h4>
                <p className="text-sm">Especialidad: {selectedDoctor.especialidad}</p>
                <p className="text-sm">Email: {selectedDoctor.email}</p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Sección del Tratamiento */}
        <Card title="Tratamiento">
          <div className="space-y-4">
            <Select
              label="Seleccione un tratamiento"
              name="tratamientoId"
              value={formData.tratamientoId}
              onChange={handleTreatmentChange}
              options={[
                { value: '', label: 'Seleccione un tratamiento', disabled: true },
                ...treatments.map(treatment => ({
                  value: treatment._id,
                  label: treatment.nombre
                }))
              ]}
              icon={<FileText className="h-5 w-5 text-gray-400" />}
              required
            />
            
            {selectedTreatment && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedTreatment.nombre}</h4>
                <p className="text-sm">{selectedTreatment.descripcion}</p>
                <div className="flex justify-between mt-2">
                  <p className="text-sm">Duración: {selectedTreatment.duracionEstimada} min</p>
                  <p className="text-sm">Precio: ${selectedTreatment.precio.toFixed(2)}</p>
                </div>
                {selectedTreatment.requiereConsentimiento && (
                  <p className="text-sm text-amber-600 mt-2">
                    Este tratamiento requiere documento de consentimiento informado.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
        
        {/* Sección de Fecha y Hora */}
        <Card title="Fecha y Hora">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleInputChange}
                icon={<Calendar className="h-5 w-5 text-gray-400" />}
                min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                required
              />
              
              {formData.fecha && formData.medicoId && formData.tratamientoId ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    {slotsLoading ? (
                      <div className="pl-10 py-2">
                        <Loading size="sm" text="Cargando horarios..." />
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <select
                        name="hora"
                        value={formData.hora}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                        required
                      >
                        <option value="">Seleccione una hora</option>
                        {availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="pl-10 py-2 text-red-500">
                        No hay horarios disponibles para esta fecha
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Input
                  label="Hora"
                  name="hora"
                  type="time"
                  value={formData.hora}
                  onChange={handleInputChange}
                  icon={<Clock className="h-5 w-5 text-gray-400" />}
                  disabled={!formData.fecha || !formData.medicoId || !formData.tratamientoId}
                  helperText={!formData.fecha || !formData.medicoId || !formData.tratamientoId ? 
                    "Seleccione médico, tratamiento y fecha primero" : ""}
                  required
                />
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (minutos)
              </label>
              <div className="mt-1">
                <input
                  name="duracion"
                  type="number"
                  value={formData.duracion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="15"
                  max="240"
                  step="15"
                  required
                  disabled={!!selectedTreatment} // Deshabilitar si hay un tratamiento seleccionado
                />
              </div>
              {selectedTreatment && (
                <p className="text-xs text-gray-500 mt-1">
                  La duración está definida por el tratamiento seleccionado.
                </p>
              )}
            </div>
          </div>
        </Card>
        
        {/* Sección de Notas */}
        <Card title="Notas Adicionales">
          <div>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              placeholder="Ingrese cualquier información adicional relevante para la cita..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
        </Card>
        
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
            {isEditing ? 'Actualizar Cita' : 'Crear Cita'}
          </Button>
        </div>
      </form>
      
      {/* Modal de búsqueda de pacientes */}
      <Modal
        isOpen={isSearchPatientModalOpen}
        onClose={() => setIsSearchPatientModalOpen(false)}
        title="Buscar Paciente"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Buscar por nombre, apellido o DNI"
              value={patientSearchTerm}
              onChange={(e) => setPatientSearchTerm(e.target.value)}
              className="flex-1"
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
            <Button 
              variant="primary" 
              onClick={searchPatients}
              isLoading={searchLoading}
            >
              Buscar
            </Button>
          </div>
          
          {searchLoading ? (
            <div className="flex justify-center py-4">
              <Loading size="md" text="Buscando pacientes..." />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((patient) => (
                    <tr key={patient._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.nombre} {patient.apellido}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.dni}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.telefono}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleSelectPatient(patient)}
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : patientSearchTerm.length > 0 ? (
            <div className="text-center py-4 text-gray-500">
              No se encontraron pacientes con los criterios de búsqueda
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Ingrese al menos 3 caracteres para buscar pacientes
            </div>
          )}
          
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="info"
              onClick={() => window.location.href = '/pacientes/nuevo'}
            >
              Crear Nuevo Paciente
            </Button>
            <Button
              variant="light"
              onClick={() => setIsSearchPatientModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentForm;