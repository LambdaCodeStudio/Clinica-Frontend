import React, { useState, useEffect } from 'react';
import { Clock, Calendar, User, Edit, FileText, X, ChevronDown, Check, Filter } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
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
    especialidad: string;
  };
  tratamiento: {
    _id: string;
    nombre: string;
    duracionEstimada: number;
    categoria: string;
  };
  fechaInicio: string;
  fechaFin: string;
  estado: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'reprogramada' | 'no_asistio';
  notas?: string;
  citaOriginal?: string;
  recordatoriosEnviados?: string[];
  canceladoPor?: string;
  motivoCancelacion?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentsListProps {
  patientId?: string;
  doctorId?: string;
  limit?: number;
  showAll?: boolean;
  onAppointmentSelect?: (appointment: Appointment) => void;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({
  patientId,
  doctorId,
  limit = 0,
  showAll = false,
  onAppointmentSelect
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('todas');
  const [dateFilter, setDateFilter] = useState('todas');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [patientId, doctorId]);

  useEffect(() => {
    applyFilters();
  }, [appointments, statusFilter, dateFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/citas';
      
      // Aplicar filtros según los props
      if (patientId) {
        endpoint = `/api/citas/paciente/${patientId}`;
      } else if (doctorId) {
        endpoint = `/api/citas/medico/${doctorId}`;
      }
      
      const response = await apiService.get<{ citas: Appointment[] }>(endpoint);
      setAppointments(response.citas);
      setFilteredAppointments(response.citas);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar citas');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];
    
    // Filtro por estado
    if (statusFilter !== 'todas') {
      filtered = filtered.filter(appointment => appointment.estado === statusFilter);
    }
    
    // Filtro por fecha
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    switch (dateFilter) {
      case 'hoy':
        filtered = filtered.filter(appointment => {
          const appointmentDate = new Date(appointment.fechaInicio);
          appointmentDate.setHours(0, 0, 0, 0);
          return appointmentDate.getTime() === today.getTime();
        });
        break;
      case 'manana':
        filtered = filtered.filter(appointment => {
          const appointmentDate = new Date(appointment.fechaInicio);
          appointmentDate.setHours(0, 0, 0, 0);
          return appointmentDate.getTime() === tomorrow.getTime();
        });
        break;
      case 'semana':
        filtered = filtered.filter(appointment => {
          const appointmentDate = new Date(appointment.fechaInicio);
          return appointmentDate >= today && appointmentDate < nextWeek;
        });
        break;
      case 'mes':
        filtered = filtered.filter(appointment => {
          const appointmentDate = new Date(appointment.fechaInicio);
          return appointmentDate >= today && appointmentDate < nextMonth;
        });
        break;
      case 'pasadas':
        filtered = filtered.filter(appointment => {
          const appointmentDate = new Date(appointment.fechaInicio);
          return appointmentDate < today;
        });
        break;
      case 'futuras':
        filtered = filtered.filter(appointment => {
          const appointmentDate = new Date(appointment.fechaInicio);
          return appointmentDate >= today;
        });
        break;
    }
    
    // Aplicar límite si es necesario
    if (limit > 0 && !showAll) {
      filtered = filtered.slice(0, limit);
    }
    
    // Ordenar por fecha (más recientes primero para citas pasadas, más cercanas primero para citas futuras)
    filtered.sort((a, b) => {
      const dateA = new Date(a.fechaInicio);
      const dateB = new Date(b.fechaInicio);
      
      if (dateFilter === 'pasadas') {
        return dateB.getTime() - dateA.getTime(); // Más recientes primero
      } else {
        return dateA.getTime() - dateB.getTime(); // Más cercanas primero
      }
    });
    
    setFilteredAppointments(filtered);
  };

  const handleStatusChange = async () => {
    if (!selectedAppointment || !newStatus) return;
    
    try {
      setActionLoading(true);
      
      await apiService.put(`/api/citas/${selectedAppointment._id}/estado`, {
        estado: newStatus
      });
      
      // Actualizar la cita en el estado local
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment._id === selectedAppointment._id 
            ? { ...appointment, estado: newStatus as Appointment['estado'] } 
            : appointment
        )
      );
      
      setIsStatusModalOpen(false);
      setActionLoading(false);
      setNewStatus('');
      
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el estado de la cita');
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      setActionLoading(true);
      
      await apiService.post(`/api/citas/${selectedAppointment._id}/cancelar`, {
        motivoCancelacion: cancelReason
      });
      
      // Actualizar la cita en el estado local
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment._id === selectedAppointment._id 
            ? { 
                ...appointment, 
                estado: 'cancelada',
                motivoCancelacion: cancelReason,
                canceladoPor: 'usuario' // En un caso real, dependerá del rol del usuario
              } 
            : appointment
        )
      );
      
      setIsCancelModalOpen(false);
      setActionLoading(false);
      setCancelReason('');
      
    } catch (err: any) {
      setError(err.message || 'Error al cancelar la cita');
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
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

  const formatTimeRange = (start: string, end: string): string => {
    if (!start || !end) return 'N/A';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const formatTime = (date: Date): string => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    return `${formatTime(startDate)} - ${formatTime(endDate)}`;
  };

  const getStatusBadgeClass = (status: Appointment['estado']): string => {
    switch (status) {
      case 'programada':
        return 'bg-blue-100 text-blue-800';
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'en_curso':
        return 'bg-yellow-100 text-yellow-800';
      case 'completada':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      case 'reprogramada':
        return 'bg-purple-100 text-purple-800';
      case 'no_asistio':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Appointment['estado']): string => {
    switch (status) {
      case 'programada':
        return 'Programada';
      case 'confirmada':
        return 'Confirmada';
      case 'en_curso':
        return 'En curso';
      case 'completada':
        return 'Completada';
      case 'cancelada':
        return 'Cancelada';
      case 'reprogramada':
        return 'Reprogramada';
      case 'no_asistio':
        return 'No asistió';
      default:
        return status;
    }
  };

  const openStatusModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNewStatus(appointment.estado);
    setIsStatusModalOpen(true);
  };

  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsCancelModalOpen(true);
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando citas..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert 
        variant="error" 
        title="Error" 
        onDismiss={() => setError(null)}
        dismissible
      >
        {error}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'todas', label: 'Todas las citas' },
                { value: 'programada', label: 'Programadas' },
                { value: 'confirmada', label: 'Confirmadas' },
                { value: 'en_curso', label: 'En curso' },
                { value: 'completada', label: 'Completadas' },
                { value: 'cancelada', label: 'Canceladas' },
                { value: 'reprogramada', label: 'Reprogramadas' },
                { value: 'no_asistio', label: 'No asistió' }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              icon={<Filter className="h-5 w-5 text-gray-400" />}
              placeholder="Estado"
            />
          </div>
          
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'todas', label: 'Todas las fechas' },
                { value: 'hoy', label: 'Hoy' },
                { value: 'manana', label: 'Mañana' },
                { value: 'semana', label: 'Próxima semana' },
                { value: 'mes', label: 'Próximo mes' },
                { value: 'pasadas', label: 'Citas pasadas' },
                { value: 'futuras', label: 'Citas futuras' }
              ]}
              value={dateFilter}
              onChange={setDateFilter}
              icon={<Calendar className="h-5 w-5 text-gray-400" />}
              placeholder="Fecha"
            />
          </div>
          
          {limit > 0 && !showAll && filteredAppointments.length >= limit && (
            <div className="ml-auto">
              <Button 
                variant="light"
                onClick={() => window.location.href = patientId ? `/pacientes/${patientId}/citas` : '/citas'}
              >
                Ver todas
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No se encontraron citas con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <Card
              key={appointment._id}
              className="hover:shadow-md transition-shadow"
              onClick={() => onAppointmentSelect && onAppointmentSelect(appointment)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="font-medium">{formatDate(appointment.fechaInicio)}</span>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-gray-400 mr-2" />
                    <span>{formatTimeRange(appointment.fechaInicio, appointment.fechaFin)}</span>
                  </div>
                  
                  {!patientId && (
                    <div className="flex items-center mb-2">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <span>
                        Paciente: {appointment.paciente.nombre} {appointment.paciente.apellido}
                      </span>
                    </div>
                  )}
                  
                  {!doctorId && (
                    <div className="flex items-center mb-2">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <span>
                        Médico: Dr. {appointment.medico.nombre} {appointment.medico.apellido}
                      </span>
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <span className="block text-sm text-gray-600">Tratamiento:</span>
                    <span className="font-medium">{appointment.tratamiento.nombre}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({appointment.tratamiento.duracionEstimada} min)
                    </span>
                  </div>
                  
                  {appointment.notas && (
                    <div className="mb-2">
                      <span className="block text-sm text-gray-600">Notas:</span>
                      <span className="text-sm">{appointment.notas}</span>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <span 
                      className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(appointment.estado)}`}
                    >
                      {getStatusText(appointment.estado)}
                    </span>
                    
                    {appointment.estado === 'cancelada' && appointment.motivoCancelacion && (
                      <span className="text-xs text-gray-500 ml-2">
                        Motivo: {appointment.motivoCancelacion}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 mt-4 md:mt-0">
                  <Button
                    variant="light"
                    size="sm"
                    icon={<Edit className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/citas/${appointment._id}/editar`;
                    }}
                  >
                    Editar
                  </Button>
                  
                  {['programada', 'confirmada'].includes(appointment.estado) && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Check className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openStatusModal(appointment);
                        }}
                      >
                        Estado
                      </Button>
                      
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<X className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openCancelModal(appointment);
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                  
                  {['completada', 'en_curso'].includes(appointment.estado) && (
                    <Button
                      variant="info"
                      size="sm"
                      icon={<FileText className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/historias/nueva?cita=${appointment._id}`;
                      }}
                    >
                      Historia
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal para cambiar estado */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Cambiar Estado de la Cita"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setIsStatusModalOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleStatusChange}
              isLoading={actionLoading}
            >
              Guardar Cambios
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Seleccione el nuevo estado para la cita:
          </p>
          
          <Select
            options={[
              { value: 'programada', label: 'Programada' },
              { value: 'confirmada', label: 'Confirmada' },
              { value: 'en_curso', label: 'En curso' },
              { value: 'completada', label: 'Completada' },
              { value: 'no_asistio', label: 'No asistió' }
            ]}
            value={newStatus}
            onChange={setNewStatus}
          />
        </div>
      </Modal>
      
      {/* Modal para cancelar cita */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Cita"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setIsCancelModalOpen(false)}
              disabled={actionLoading}
            >
              Volver
            </Button>
            <Button 
              variant="danger" 
              onClick={handleCancelAppointment}
              isLoading={actionLoading}
            >
              Confirmar Cancelación
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Por favor, indique el motivo de la cancelación:
          </p>
          
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Motivo de cancelación"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
          
          <Alert variant="warning" title="Aviso">
            Esta acción no se puede deshacer. La cita será cancelada permanentemente.
          </Alert>
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentsList;