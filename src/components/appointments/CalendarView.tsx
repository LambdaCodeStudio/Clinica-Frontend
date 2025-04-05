import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter, User } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Select from '../ui/Select';
import apiService from '../../services/api';

interface Appointment {
  _id: string;
  paciente: {
    _id: string;
    nombre: string;
    apellido: string;
  };
  medico: {
    _id: string;
    nombre: string;
    apellido: string;
  };
  tratamiento: {
    _id: string;
    nombre: string;
  };
  fechaInicio: string;
  fechaFin: string;
  estado: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'reprogramada' | 'no_asistio';
}

interface Doctor {
  _id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
}

interface CalendarViewProps {
  doctorId?: string;
  onDateSelect?: (date: Date) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({
  doctorId: initialDoctorId,
  onDateSelect
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('active');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [currentDate, viewMode, selectedDoctorId, statusFilter]);

  const fetchDoctors = async () => {
    try {
      const response = await apiService.get<{ medicos: Doctor[] }>('/api/usuarios/medicos');
      setDoctors(response.medicos);
    } catch (err: any) {
      setError(err.message || 'Error al cargar médicos');
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Determinar el rango de fechas a consultar según la vista
      const startDate = getDateRangeStart(currentDate, viewMode);
      const endDate = getDateRangeEnd(currentDate, viewMode);
      
      // Construir parámetros de consulta
      let queryParams = `?start=${startDate.toISOString()}&end=${endDate.toISOString()}`;
      
      if (selectedDoctorId) {
        queryParams += `&medico=${selectedDoctorId}`;
      }
      
      if (statusFilter !== 'all') {
        // Si el filtro es 'active', incluir citas programadas, confirmadas y en curso
        if (statusFilter === 'active') {
          queryParams += '&estados=programada,confirmada,en_curso';
        } else {
          queryParams += `&estados=${statusFilter}`;
        }
      }
      
      const response = await apiService.get<{ citas: Appointment[] }>(`/api/citas/rango${queryParams}`);
      setAppointments(response.citas);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar citas');
      setLoading(false);
    }
  };

  const getDateRangeStart = (date: Date, mode: CalendarViewMode): Date => {
    const result = new Date(date);
    
    if (mode === 'month') {
      result.setDate(1);
      // Ajustar al primer día de la semana (domingo = 0, lunes = 1, etc.)
      const dayOfWeek = result.getDay();
      result.setDate(result.getDate() - dayOfWeek);
    } else if (mode === 'week') {
      // Ajustar al inicio de la semana (domingo)
      const dayOfWeek = result.getDay();
      result.setDate(result.getDate() - dayOfWeek);
    }
    
    // Establecer a las 00:00:00
    result.setHours(0, 0, 0, 0);
    
    return result;
  };

  const getDateRangeEnd = (date: Date, mode: CalendarViewMode): Date => {
    const result = new Date(date);
    
    if (mode === 'month') {
      // Ir al próximo mes
      result.setMonth(result.getMonth() + 1, 0);
      // Ajustar al último día de la semana
      const dayOfWeek = result.getDay();
      result.setDate(result.getDate() + (6 - dayOfWeek));
    } else if (mode === 'week') {
      // Ajustar al fin de la semana (sábado)
      const dayOfWeek = result.getDay();
      result.setDate(result.getDate() + (6 - dayOfWeek));
    }
    
    // Establecer a las 23:59:59
    result.setHours(23, 59, 59, 999);
    
    return result;
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthYearTitle = (): string => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = getDateRangeStart(currentDate, 'week');
      const endOfWeek = getDateRangeEnd(currentDate, 'week');
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${startOfWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
      } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
        return `${startOfWeek.getDate()} de ${startOfWeek.toLocaleDateString('es-ES', { month: 'long' })} - ${endOfWeek.getDate()} de ${endOfWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
      } else {
        return `${startOfWeek.getDate()} de ${startOfWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} - ${endOfWeek.getDate()} de ${endOfWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
      }
    } else {
      return currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    
    // Filtrar citas para este día
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const filteredAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.fechaInicio);
      return appointmentDate >= dayStart && appointmentDate <= dayEnd;
    });
    
    setDayAppointments(filteredAppointments);
    setShowAppointmentModal(true);
    
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleAppointmentClick = (appointmentId: string) => {
    window.location.href = `/citas/${appointmentId}`;
  };

  const handleNewAppointment = () => {
    const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    let url = '/citas/nueva';
    
    if (dateStr) {
      url += `?fecha=${dateStr}`;
      
      if (selectedDoctorId) {
        url += `&medico=${selectedDoctorId}`;
      }
    } else if (selectedDoctorId) {
      url += `?medico=${selectedDoctorId}`;
    }
    
    window.location.href = url;
  };

  const getAppointmentsForDay = (date: Date): Appointment[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.fechaInicio);
      return appointmentDate >= dayStart && appointmentDate <= dayEnd;
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'programada':
        return 'bg-blue-500';
      case 'confirmada':
        return 'bg-green-500';
      case 'en_curso':
        return 'bg-yellow-500';
      case 'completada':
        return 'bg-emerald-500';
      case 'cancelada':
        return 'bg-red-500';
      case 'reprogramada':
        return 'bg-purple-500';
      case 'no_asistio':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderMonthView = () => {
    const startDate = getDateRangeStart(currentDate, 'month');
    const endDate = getDateRangeEnd(currentDate, 'month');
    
    const days = [];
    const currentDateValue = new Date();
    let day = new Date(startDate);
    
    // Headers de día de la semana
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 border-b">
          {dayNames.map((name, index) => (
            <div 
              key={index} 
              className="py-2 text-center text-sm font-medium text-gray-500"
            >
              {name}
            </div>
          ))}
        </div>
        
        {/* Grilla del calendario */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {Array.from({ length: 42 }).map((_, index) => {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + index);
            
            const isCurrentMonth = currentDay.getMonth() === currentDate.getMonth();
            const isToday = 
              currentDay.getDate() === currentDateValue.getDate() &&
              currentDay.getMonth() === currentDateValue.getMonth() &&
              currentDay.getFullYear() === currentDateValue.getFullYear();
            
            const dayAppointments = getAppointmentsForDay(currentDay);
            
            return (
              <div 
                key={index} 
                className={`min-h-[100px] border-b border-r p-1 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                } ${isToday ? 'bg-blue-50' : ''}`}
                onClick={() => handleDayClick(currentDay)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-blue-600' : ''
                  }`}>
                    {currentDay.getDate()}
                  </span>
                  {dayAppointments.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                      {dayAppointments.length}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 max-h-[80px] overflow-y-auto">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <div 
                      key={appointment._id}
                      className="text-xs p-1 rounded truncate cursor-pointer hover:bg-gray-100"
                      style={{ borderLeft: `3px solid ${getStatusColor(appointment.estado)}` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(appointment._id);
                      }}
                    >
                      <div className="font-medium truncate">
                        {new Date(appointment.fechaInicio).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="truncate">
                        {appointment.paciente.nombre} {appointment.paciente.apellido}
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-center text-gray-500">
                      +{dayAppointments.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = getDateRangeStart(currentDate, 'week');
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const currentDateValue = new Date();
    
    // Horas de la jornada laboral
    const workHours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am a 8pm
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 border-b">
          {/* Cabecera de horarios */}
          <div className="border-r py-2 text-center text-sm font-medium text-gray-500">
            Hora
          </div>
          
          {/* Cabecera de días */}
          {Array.from({ length: 7 }).map((_, index) => {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + index);
            
            const isToday = 
              day.getDate() === currentDateValue.getDate() &&
              day.getMonth() === currentDateValue.getMonth() &&
              day.getFullYear() === currentDateValue.getFullYear();
            
            return (
              <div 
                key={index} 
                className={`py-2 text-center text-sm font-medium ${
                  isToday ? 'bg-blue-50 text-blue-600' : 'text-gray-500'
                }`}
              >
                <div>{dayNames[day.getDay()]}</div>
                <div className="font-bold">{day.getDate()}</div>
              </div>
            );
          })}
        </div>
        
        {/* Grilla de horas y citas */}
        {workHours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b">
            {/* Columna de hora */}
            <div className="border-r p-2 text-center text-sm text-gray-500">
              {hour}:00
            </div>
            
            {/* Columnas de días */}
            {Array.from({ length: 7 }).map((_, index) => {
              const day = new Date(startDate);
              day.setDate(startDate.getDate() + index);
              
              // Establecer la hora 
              day.setHours(hour, 0, 0, 0);
              
              // Obtener citas que empiezan en esta hora
              const hourAppointments = appointments.filter(appointment => {
                const appointmentDate = new Date(appointment.fechaInicio);
                return (
                  appointmentDate.getDate() === day.getDate() &&
                  appointmentDate.getMonth() === day.getMonth() &&
                  appointmentDate.getFullYear() === day.getFullYear() &&
                  appointmentDate.getHours() === hour
                );
              });
              
              const isCurrentHour = 
                currentDateValue.getDate() === day.getDate() &&
                currentDateValue.getMonth() === day.getMonth() &&
                currentDateValue.getFullYear() === day.getFullYear() &&
                currentDateValue.getHours() === hour;
              
              return (
                <div 
                  key={index}
                  className={`p-1 min-h-[80px] ${isCurrentHour ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    const clickedDate = new Date(day);
                    handleDayClick(clickedDate);
                  }}
                >
                  <div className="space-y-1 h-full overflow-y-auto">
                    {hourAppointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="text-xs p-1 rounded cursor-pointer hover:bg-gray-100"
                        style={{ borderLeft: `3px solid ${getStatusColor(appointment.estado)}` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAppointmentClick(appointment._id);
                        }}
                      >
                        <div className="font-medium">
                          {new Date(appointment.fechaInicio).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          -{new Date(appointment.fechaFin).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="truncate">
                          {appointment.paciente.nombre} {appointment.paciente.apellido}
                        </div>
                        <div className="truncate text-gray-500">
                          {appointment.tratamiento.nombre}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    // Horas de la jornada laboral
    const workHours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am a 9pm
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-1 gap-0">
          {workHours.map((hour, index) => {
            // Establecer la hora 
            const timeSlot = new Date(currentDate);
            timeSlot.setHours(hour, 0, 0, 0);
            
            // Obtener citas que empiezan en esta hora
            const hourAppointments = appointments.filter(appointment => {
              const appointmentDate = new Date(appointment.fechaInicio);
              return (
                appointmentDate.getHours() === hour
              );
            });
            
            const isCurrentHour = new Date().getHours() === hour;
            
            return (
              <div 
                key={index}
                className={`p-2 border-b ${isCurrentHour ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span className="font-medium">{hour}:00</span>
                </div>
                
                <div className="space-y-2">
                  {hourAppointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="p-2 rounded-lg border cursor-pointer hover:bg-gray-50"
                      style={{ borderLeft: `4px solid ${getStatusColor(appointment.estado)}` }}
                      onClick={() => handleAppointmentClick(appointment._id)}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">
                          {new Date(appointment.fechaInicio).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} - 
                          {new Date(appointment.fechaFin).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          appointment.estado === 'programada' ? 'bg-blue-100 text-blue-800' :
                          appointment.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                          appointment.estado === 'en_curso' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.estado === 'completada' ? 'bg-emerald-100 text-emerald-800' :
                          appointment.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                          appointment.estado === 'reprogramada' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.estado}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm mb-1">
                        <User className="w-4 h-4 mr-1 text-gray-500" />
                        <span>{appointment.paciente.nombre} {appointment.paciente.apellido}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {appointment.tratamiento.nombre}
                      </div>
                      
                      <div className="text-sm text-gray-500 mt-1">
                        Dr. {appointment.medico.nombre} {appointment.medico.apellido}
                      </div>
                    </div>
                  ))}
                  
                  {hourAppointments.length === 0 && (
                    <div 
                      className="h-8 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-400 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        const clickedDate = new Date(currentDate);
                        clickedDate.setHours(hour, 0, 0, 0);
                        setSelectedDate(clickedDate);
                        setShowAppointmentModal(true);
                      }}
                    >
                      Disponible
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando calendario..." />
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
    <>
      <div className="space-y-4">
        {/* Cabecera del calendario */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="flex space-x-1 mb-4 sm:mb-0">
              <Button
                variant="light"
                size="sm"
                onClick={() => setViewMode('month')}
                className={viewMode === 'month' ? 'bg-blue-100 text-blue-700' : ''}
              >
                Mes
              </Button>
              <Button
                variant="light"
                size="sm"
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'bg-blue-100 text-blue-700' : ''}
              >
                Semana
              </Button>
              <Button
                variant="light"
                size="sm"
                onClick={() => setViewMode('day')}
                className={viewMode === 'day' ? 'bg-blue-100 text-blue-700' : ''}
              >
                Día
              </Button>
            </div>
            
            <div className="flex space-x-4">
              <div className="flex items-center">
                <button
                  onClick={navigatePrevious}
                  className="p-1 rounded-full hover:bg-gray-100"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="mx-2 font-medium">{getMonthYearTitle()}</span>
                <button
                  onClick={navigateNext}
                  className="p-1 rounded-full hover:bg-gray-100"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <Button 
                variant="light" 
                size="sm"
                onClick={navigateToday}
              >
                Hoy
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-64">
              <Select
                options={[
                  { value: '', label: 'Todos los médicos' },
                  ...doctors.map(doctor => ({
                    value: doctor._id,
                    label: `Dr. ${doctor.nombre} ${doctor.apellido}`
                  }))
                ]}
                value={selectedDoctorId}
                onChange={handleDoctorChange}
                icon={<User className="h-5 w-5 text-gray-400" />}
                placeholder="Filtrar por médico"
              />
            </div>
            
            <div className="w-full sm:w-64">
              <Select
                options={[
                  { value: 'all', label: 'Todas las citas' },
                  { value: 'active', label: 'Citas activas' },
                  { value: 'programada', label: 'Programadas' },
                  { value: 'confirmada', label: 'Confirmadas' },
                  { value: 'en_curso', label: 'En curso' },
                  { value: 'completada', label: 'Completadas' },
                  { value: 'cancelada', label: 'Canceladas' }
                ]}
                value={statusFilter}
                onChange={handleStatusFilterChange}
                icon={<Filter className="h-5 w-5 text-gray-400" />}
                placeholder="Filtrar por estado"
              />
            </div>
          </div>
        </div>
        
        {/* Vista del calendario */}
        <div className="overflow-x-auto">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      </div>
      
      {/* Modal de citas del día */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        title={selectedDate ? `Citas del ${selectedDate.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}` : 'Citas del día'}
        size="lg"
        footer={
          <Button 
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
            onClick={handleNewAppointment}
          >
            Nueva Cita
          </Button>
        }
      >
        {dayAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay citas programadas para este día
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {dayAppointments.sort((a, b) => 
              new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
            ).map((appointment) => (
              <div
                key={appointment._id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                style={{ borderLeft: `4px solid ${getStatusColor(appointment.estado)}` }}
                onClick={() => handleAppointmentClick(appointment._id)}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-medium">
                    {new Date(appointment.fechaInicio).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - 
                    {new Date(appointment.fechaFin).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    appointment.estado === 'programada' ? 'bg-blue-100 text-blue-800' :
                    appointment.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                    appointment.estado === 'en_curso' ? 'bg-yellow-100 text-yellow-800' :
                    appointment.estado === 'completada' ? 'bg-emerald-100 text-emerald-800' :
                    appointment.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                    appointment.estado === 'reprogramada' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.estado}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-sm text-gray-500">Paciente:</div>
                    <div>{appointment.paciente.nombre} {appointment.paciente.apellido}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Médico:</div>
                    <div>Dr. {appointment.medico.nombre} {appointment.medico.apellido}</div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500">Tratamiento:</div>
                    <div>{appointment.tratamiento.nombre}</div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-2">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/citas/${appointment._id}`;
                    }}
                  >
                    Ver Detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
};

export default CalendarView;