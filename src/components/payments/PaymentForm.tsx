import React, { useState, useEffect } from 'react';
import { Calendar, User, DollarSign, CreditCard, FileText, Tag, Info, Check, X } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import apiService from '../../services/api';

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
}

interface Treatment {
  _id: string;
  nombre: string;
  precio: number;
  duracionEstimada: number;
}

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
    precio: number;
  };
  fechaInicio: string;
  estado: string;
}

interface PaymentFormData {
  pacienteId: string;
  citaId?: string;
  tratamientoId: string;
  fecha: string;
  monto: number;
  metodoPago: 'efectivo' | 'tarjeta_credito' | 'tarjeta_debito' | 'transferencia' | 'otro';
  detalleMetodoPago?: string;
  numeroCuotas?: number;
  descuento: number;
  montoTotal: number;
  concepto: string;
  observaciones?: string;
  emitirFactura: boolean;
  datosFacturacion?: {
    nombreFiscal: string;
    documentoFiscal: string;
    direccionFiscal: string;
  };
}

interface PaymentFormProps {
  paymentId?: string;
  initialPatientId?: string;
  initialAppointmentId?: string;
  onSubmitSuccess?: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentId,
  initialPatientId,
  initialAppointmentId,
  onSubmitSuccess
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    pacienteId: initialPatientId || '',
    citaId: initialAppointmentId || '',
    tratamientoId: '',
    fecha: new Date().toISOString().split('T')[0],
    monto: 0,
    metodoPago: 'efectivo',
    descuento: 0,
    montoTotal: 0,
    concepto: '',
    emitirFactura: false
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [showAppointmentSelect, setShowAppointmentSelect] = useState(false);
  const [showInvoiceFields, setShowInvoiceFields] = useState(false);
  
  const isEditing = !!paymentId;

  useEffect(() => {
    fetchPatients();
    fetchTreatments();
    
    if (isEditing) {
      fetchPaymentData();
    } else if (initialPatientId) {
      fetchPatientData(initialPatientId);
    }
    
    if (initialAppointmentId) {
      fetchAppointmentData(initialAppointmentId);
    }
  }, [paymentId, initialPatientId, initialAppointmentId]);

  useEffect(() => {
    // Calculate total amount based on price, discount, and extras
    if (selectedTreatment) {
      const basePrice = selectedTreatment.precio;
      const discountAmount = (basePrice * formData.descuento) / 100;
      const totalAmount = basePrice - discountAmount;
      
      setFormData(prev => ({
        ...prev,
        monto: basePrice,
        montoTotal: totalAmount
      }));
    }
  }, [selectedTreatment, formData.descuento]);

  useEffect(() => {
    // Fetch patient appointments when patient changes
    if (formData.pacienteId && !initialAppointmentId) {
      fetchPatientAppointments(formData.pacienteId);
      setShowAppointmentSelect(true);
    } else {
      setShowAppointmentSelect(false);
    }
  }, [formData.pacienteId, initialAppointmentId]);

  const fetchPatients = async () => {
    try {
      const response = await apiService.get<{ pacientes: Patient[] }>('/api/pacientes');
      setPatients(response.pacientes);
    } catch (err: any) {
      setError(err.message || 'Error al cargar pacientes');
    }
  };

  const fetchTreatments = async () => {
    try {
      const response = await apiService.get<{ tratamientos: Treatment[] }>('/api/tratamientos');
      setTreatments(response.tratamientos);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tratamientos');
    }
  };

  const fetchPatientData = async (patientId: string) => {
    try {
      const response = await apiService.get<{ paciente: Patient }>(`/api/pacientes/${patientId}`);
      setSelectedPatient(response.paciente);
      setFormData(prev => ({
        ...prev,
        pacienteId: patientId
      }));
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del paciente');
    }
  };

  const fetchAppointmentData = async (appointmentId: string) => {
    try {
      const response = await apiService.get<{ cita: Appointment }>(`/api/citas/${appointmentId}`);
      const appointment = response.cita;
      setSelectedAppointment(appointment);
      
      // If we have an appointment, we can pre-fill more data
      if (appointment) {
        // Find the treatment
        const treatment = treatments.find(t => t._id === appointment.tratamiento._id);
        if (treatment) {
          setSelectedTreatment(treatment);
        }
        
        setFormData(prev => ({
          ...prev,
          pacienteId: appointment.paciente._id,
          citaId: appointmentId,
          tratamientoId: appointment.tratamiento._id,
          monto: appointment.tratamiento.precio,
          montoTotal: appointment.tratamiento.precio,
          concepto: `Pago por ${appointment.tratamiento.nombre}`
        }));
        
        // Also fetch the patient data
        fetchPatientData(appointment.paciente._id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos de la cita');
    }
  };

  const fetchPatientAppointments = async (patientId: string) => {
    try {
      const response = await apiService.get<{ citas: Appointment[] }>(`/api/citas/paciente/${patientId}?estado=completada,en_curso`);
      setPatientAppointments(response.citas);
    } catch (err: any) {
      console.error('Error al cargar citas del paciente:', err);
      // Not showing this error to the user as it's not critical
    }
  };

  const fetchPaymentData = async () => {
    try {
      setFormLoading(true);
      const response = await apiService.get<{ pago: any }>(`/api/pagos/${paymentId}`);
      const paymentData = response.pago;
      
      // Get patient data
      await fetchPatientData(paymentData.paciente);
      
      // Get appointment data if available
      if (paymentData.cita) {
        await fetchAppointmentData(paymentData.cita);
      }
      
      // Get treatment data
      const treatment = treatments.find(t => t._id === paymentData.tratamiento);
      if (treatment) {
        setSelectedTreatment(treatment);
      }
      
      // Set form data
      setFormData({
        pacienteId: paymentData.paciente,
        citaId: paymentData.cita || undefined,
        tratamientoId: paymentData.tratamiento,
        fecha: new Date(paymentData.fecha).toISOString().split('T')[0],
        monto: paymentData.monto,
        metodoPago: paymentData.metodoPago,
        detalleMetodoPago: paymentData.detalleMetodoPago,
        numeroCuotas: paymentData.numeroCuotas,
        descuento: paymentData.descuento,
        montoTotal: paymentData.montoTotal,
        concepto: paymentData.concepto,
        observaciones: paymentData.observaciones,
        emitirFactura: !!paymentData.datosFacturacion,
        datosFacturacion: paymentData.datosFacturacion
      });
      
      // Show invoice fields if needed
      setShowInvoiceFields(!!paymentData.datosFacturacion);
      
      setFormLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del pago');
      setFormLoading(false);
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
    setIsPatientModalOpen(false);
  };

  const handleAppointmentChange = (appointmentId: string) => {
    if (!appointmentId) {
      setSelectedAppointment(null);
      setFormData(prev => ({
        ...prev,
        citaId: undefined,
        tratamientoId: ''
      }));
      return;
    }
    
    const appointment = patientAppointments.find(a => a._id === appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
      
      // Find the treatment
      const treatment = treatments.find(t => t._id === appointment.tratamiento._id);
      if (treatment) {
        setSelectedTreatment(treatment);
      }
      
      setFormData(prev => ({
        ...prev,
        citaId: appointmentId,
        tratamientoId: appointment.tratamiento._id,
        monto: appointment.tratamiento.precio,
        montoTotal: appointment.tratamiento.precio,
        concepto: `Pago por ${appointment.tratamiento.nombre}`
      }));
    }
  };

  const handleTreatmentChange = (treatmentId: string) => {
    if (!treatmentId) {
      setSelectedTreatment(null);
      setFormData(prev => ({
        ...prev,
        tratamientoId: '',
        monto: 0,
        montoTotal: 0
      }));
      return;
    }
    
    const treatment = treatments.find(t => t._id === treatmentId);
    if (treatment) {
      setSelectedTreatment(treatment);
      setFormData(prev => ({
        ...prev,
        tratamientoId: treatmentId,
        monto: treatment.precio,
        montoTotal: treatment.precio,
        concepto: prev.concepto || `Pago por ${treatment.nombre}`
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      
      if (name === 'emitirFactura') {
        setShowInvoiceFields(checked);
      }
    } else if (name === 'metodoPago') {
      setFormData(prev => ({
        ...prev,
        metodoPago: value as any,
        // Reset payment details when changing method
        detalleMetodoPago: undefined,
        numeroCuotas: value === 'tarjeta_credito' ? 1 : undefined
      }));
    } else if (name === 'monto' || name === 'descuento') {
      // Update price calculations
      const newValue = parseFloat(value) || 0;
      
      if (name === 'monto') {
        const discountAmount = (newValue * formData.descuento) / 100;
        const totalAmount = newValue - discountAmount;
        
        setFormData(prev => ({
          ...prev,
          monto: newValue,
          montoTotal: totalAmount
        }));
      } else if (name === 'descuento') {
        const discountAmount = (formData.monto * newValue) / 100;
        const totalAmount = formData.monto - discountAmount;
        
        setFormData(prev => ({
          ...prev,
          descuento: newValue,
          montoTotal: totalAmount
        }));
      }
    } else if (name.startsWith('datosFacturacion.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        datosFacturacion: {
          ...prev.datosFacturacion,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS'
    });
  };

  const validateForm = (): boolean => {
    if (!formData.pacienteId) {
      setError('Debe seleccionar un paciente');
      return false;
    }
    
    if (!formData.tratamientoId) {
      setError('Debe seleccionar un tratamiento');
      return false;
    }
    
    if (!formData.fecha) {
      setError('Debe ingresar una fecha de pago');
      return false;
    }
    
    if (formData.montoTotal <= 0) {
      setError('El monto total debe ser mayor a 0');
      return false;
    }
    
    if (!formData.concepto) {
      setError('Debe ingresar un concepto para el pago');
      return false;
    }
    
    if (formData.emitirFactura) {
      if (!formData.datosFacturacion?.nombreFiscal) {
        setError('Debe ingresar el nombre fiscal para la factura');
        return false;
      }
      
      if (!formData.datosFacturacion?.documentoFiscal) {
        setError('Debe ingresar el documento fiscal para la factura');
        return false;
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
      
      // Prepare data for submission
      const paymentData = {
        paciente: formData.pacienteId,
        cita: formData.citaId || undefined,
        tratamiento: formData.tratamientoId,
        fecha: new Date(formData.fecha).toISOString(),
        monto: formData.monto,
        metodoPago: formData.metodoPago,
        detalleMetodoPago: formData.detalleMetodoPago,
        numeroCuotas: formData.numeroCuotas,
        descuento: formData.descuento,
        montoTotal: formData.montoTotal,
        concepto: formData.concepto,
        observaciones: formData.observaciones,
        datosFacturacion: formData.emitirFactura ? formData.datosFacturacion : undefined
      };
      
      if (isEditing) {
        await apiService.put(`/api/pagos/${paymentId}`, paymentData);
        setSuccess('Pago actualizado con éxito');
      } else {
        const response = await apiService.post('/api/pagos', paymentData);
        setSuccess('Pago registrado con éxito');
        
        // Optionally redirect to receipt page
        if (response && response.pago && response.pago._id) {
          setTimeout(() => {
            window.location.href = `/pagos/${response.pago._id}`;
          }, 1500);
        }
      }
      
      setLoading(false);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el pago');
      setLoading(false);
    }
  };

  // Function to get the payment method text
  const getPaymentMethodText = (method: string): string => {
    switch (method) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta_credito': return 'Tarjeta de Crédito';
      case 'tarjeta_debito': return 'Tarjeta de Débito';
      case 'transferencia': return 'Transferencia Bancaria';
      case 'otro': return 'Otro';
      default: return method;
    }
  };

  if (formLoading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando datos del pago..." />
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
        {/* Patient Section */}
        <Card title="Paciente">
          <div className="space-y-4">
            {selectedPatient ? (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h3 className="font-medium">{selectedPatient.nombre} {selectedPatient.apellido}</h3>
                  <p className="text-sm text-gray-600">DNI: {selectedPatient.dni}</p>
                  <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                </div>
                {!initialPatientId && (
                  <Button 
                    variant="light" 
                    className="mt-2 sm:mt-0"
                    onClick={() => setIsPatientModalOpen(true)}
                  >
                    Cambiar Paciente
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <Button 
                  variant="primary" 
                  icon={<User className="h-5 w-5" />}
                  onClick={() => setIsPatientModalOpen(true)}
                >
                  Seleccionar Paciente
                </Button>
              </div>
            )}
          </div>
        </Card>
        
        {/* Appointment Section - Show only if a patient is selected and no initial appointment */}
        {showAppointmentSelect && (
          <Card title="Cita Relacionada (Opcional)">
            <div className="space-y-4">
              <Select
                label="Seleccione una cita relacionada"
                name="citaId"
                value={formData.citaId || ''}
                onChange={handleAppointmentChange}
                options={[
                  { value: '', label: 'Ninguna cita relacionada' },
                  ...patientAppointments.map(appointment => ({
                    value: appointment._id,
                    label: `${new Date(appointment.fechaInicio).toLocaleDateString()} - ${appointment.tratamiento.nombre}`
                  }))
                ]}
                icon={<Calendar className="h-5 w-5 text-gray-400" />}
              />
              
              {selectedAppointment && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Información de la cita:</h4>
                  <p className="text-sm">Fecha: {new Date(selectedAppointment.fechaInicio).toLocaleString()}</p>
                  <p className="text-sm">Tratamiento: {selectedAppointment.tratamiento.nombre}</p>
                  <p className="text-sm">Médico: Dr. {selectedAppointment.medico.nombre} {selectedAppointment.medico.apellido}</p>
                  <p className="text-sm">Estado: {selectedAppointment.estado}</p>
                </div>
              )}
            </div>
          </Card>
        )}
        
        {/* Treatment Section */}
        <Card title="Tratamiento y Monto">
          <div className="space-y-4">
            <Select
              label="Tratamiento"
              name="tratamientoId"
              value={formData.tratamientoId}
              onChange={handleTreatmentChange}
              options={[
                { value: '', label: 'Seleccione un tratamiento', disabled: true },
                ...treatments.map(treatment => ({
                  value: treatment._id,
                  label: `${treatment.nombre} - ${formatCurrency(treatment.precio)}`
                }))
              ]}
              icon={<FileText className="h-5 w-5 text-gray-400" />}
              required
              disabled={!!formData.citaId} // Disable if a related appointment is selected
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de Pago"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleInputChange}
                icon={<Calendar className="h-5 w-5 text-gray-400" />}
                required
              />
              
              <Input
                label="Monto Base"
                name="monto"
                type="number"
                value={formData.monto.toString()}
                onChange={handleInputChange}
                icon={<DollarSign className="h-5 w-5 text-gray-400" />}
                step="0.01"
                min="0"
                required
                disabled={!!selectedTreatment} // Disable if a treatment is selected
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Descuento (%)"
                name="descuento"
                type="number"
                value={formData.descuento.toString()}
                onChange={handleInputChange}
                icon={<Tag className="h-5 w-5 text-gray-400" />}
                min="0"
                max="100"
                step="0.01"
              />
              
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Total
                </label>
                <div className="p-2 bg-gray-100 rounded-lg border border-gray-300 text-lg font-medium">
                  {formatCurrency(formData.montoTotal)}
                </div>
                {formData.descuento > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Descuento aplicado: {formData.descuento}% ({formatCurrency((formData.monto * formData.descuento) / 100)})
                  </p>
                )}
              </div>
            </div>
            
            <Input
              label="Concepto"
              name="concepto"
              value={formData.concepto}
              onChange={handleInputChange}
              placeholder="Ej: Pago por tratamiento facial"
              required
            />
          </div>
        </Card>
        
        {/* Payment Method */}
        <Card title="Método de Pago">
          <div className="space-y-4">
            <Select
              label="Forma de Pago"
              name="metodoPago"
              value={formData.metodoPago}
              onChange={handleInputChange}
              options={[
                { value: 'efectivo', label: 'Efectivo' },
                { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
                { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
                { value: 'transferencia', label: 'Transferencia Bancaria' },
                { value: 'otro', label: 'Otro' }
              ]}
              icon={<CreditCard className="h-5 w-5 text-gray-400" />}
              required
            />
            
            {/* Conditional fields based on payment method */}
            {formData.metodoPago === 'tarjeta_credito' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Últimos 4 dígitos de la tarjeta"
                  name="detalleMetodoPago"
                  value={formData.detalleMetodoPago || ''}
                  onChange={handleInputChange}
                  placeholder="Ej: 1234"
                  maxLength={4}
                />
                
                <Input
                  label="Número de Cuotas"
                  name="numeroCuotas"
                  type="number"
                  value={formData.numeroCuotas?.toString() || '1'}
                  onChange={handleInputChange}
                  min="1"
                  max="24"
                />
              </div>
            )}
            
            {formData.metodoPago === 'tarjeta_debito' && (
              <Input
                label="Últimos 4 dígitos de la tarjeta"
                name="detalleMetodoPago"
                value={formData.detalleMetodoPago || ''}
                onChange={handleInputChange}
                placeholder="Ej: 1234"
                maxLength={4}
              />
            )}
            
            {formData.metodoPago === 'transferencia' && (
              <Input
                label="Referencia de la transferencia"
                name="detalleMetodoPago"
                value={formData.detalleMetodoPago || ''}
                onChange={handleInputChange}
                placeholder="Ej: Número de operación"
              />
            )}
            
            {formData.metodoPago === 'otro' && (
              <Input
                label="Detalle del método de pago"
                name="detalleMetodoPago"
                value={formData.detalleMetodoPago || ''}
                onChange={handleInputChange}
                placeholder="Especifique el método de pago"
                required
              />
            )}
          </div>
        </Card>
        
        {/* Observations */}
        <Card title="Observaciones">
          <div>
            <textarea
              name="observaciones"
              value={formData.observaciones || ''}
              onChange={handleInputChange}
              placeholder="Observaciones adicionales sobre el pago..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </Card>
        
        {/* Billing Section */}
        <Card title="Facturación">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emitirFactura"
                name="emitirFactura"
                checked={formData.emitirFactura}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emitirFactura" className="text-sm">
                Emitir factura para este pago
              </label>
            </div>
            
            {showInvoiceFields && (
              <div className="space-y-4 pt-3 mt-3 border-t border-gray-200">
                <Input
                  label="Nombre o Razón Social"
                  name="datosFacturacion.nombreFiscal"
                  value={formData.datosFacturacion?.nombreFiscal || ''}
                  onChange={handleInputChange}
                  placeholder="Nombre completo o razón social"
                  required
                />
                
                <Input
                  label="CUIT/DNI"
                  name="datosFacturacion.documentoFiscal"
                  value={formData.datosFacturacion?.documentoFiscal || ''}
                  onChange={handleInputChange}
                  placeholder="Número de CUIT o DNI"
                  required
                />
                
                <Input
                  label="Dirección Fiscal"
                  name="datosFacturacion.direccionFiscal"
                  value={formData.datosFacturacion?.direccionFiscal || ''}
                  onChange={handleInputChange}
                  placeholder="Dirección completa"
                />
                
                <Alert 
                  variant="info" 
                  title="Información" 
                >
                  <p className="text-sm">
                    La factura será generada automáticamente y podrá ser descargada una vez registrado el pago.
                  </p>
                </Alert>
              </div>
            )}
          </div>
        </Card>
        
        {/* Summary Section */}
        <Card title="Resumen del Pago" className="bg-gray-50">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Paciente:</p>
                <p className="font-medium">
                  {selectedPatient 
                    ? `${selectedPatient.nombre} ${selectedPatient.apellido}` 
                    : 'No seleccionado'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Fecha:</p>
                <p className="font-medium">
                  {formData.fecha ? new Date(formData.fecha).toLocaleDateString() : 'No establecida'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Tratamiento:</p>
                <p className="font-medium">
                  {selectedTreatment 
                    ? selectedTreatment.nombre
                    : 'No seleccionado'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Método de Pago:</p>
                <p className="font-medium">
                  {getPaymentMethodText(formData.metodoPago)}
                  {formData.numeroCuotas && formData.numeroCuotas > 1 
                    ? ` (${formData.numeroCuotas} cuotas)` 
                    : ''}
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-300 pt-4 mt-4">
              <div className="flex justify-between">
                <p className="text-gray-600">Monto Base:</p>
                <p className="font-medium">{formatCurrency(formData.monto)}</p>
              </div>
              
              {formData.descuento > 0 && (
                <div className="flex justify-between text-green-600">
                  <p>Descuento ({formData.descuento}%):</p>
                  <p>-{formatCurrency((formData.monto * formData.descuento) / 100)}</p>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-300">
                <p>Total a Pagar:</p>
                <p>{formatCurrency(formData.montoTotal)}</p>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Buttons */}
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
            icon={<Check className="h-5 w-5" />}
          >
            {isEditing ? 'Actualizar Pago' : 'Registrar Pago'}
          </Button>
        </div>
      </form>
      
      {/* Patient Selection Modal */}
      <Modal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        title="Seleccionar Paciente"
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
              variant="light"
              onClick={() => window.location.href = '/pacientes/nuevo'}
            >
              Crear Nuevo Paciente
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsPatientModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentForm;