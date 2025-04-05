import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Calendar, CreditCard, Eye, Download, Filter, Edit, AlertCircle, X } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import apiService from '../../services/api';

interface Payment {
  _id: string;
  paciente: {
    _id: string;
    nombre: string;
    apellido: string;
    dni: string;
  };
  cita?: {
    _id: string;
    fechaInicio: string;
  };
  tratamiento: {
    _id: string;
    nombre: string;
    precio: number;
  };
  fecha: string;
  monto: number;
  descuento: number;
  montoTotal: number;
  metodoPago: string;
  concepto: string;
  estado: 'completado' | 'anulado';
  facturaGenerada: boolean;
  numeroFactura?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentsListProps {
  patientId?: string;
  limit?: number;
  showAll?: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  onPaymentSelect?: (payment: Payment) => void;
}

export const PaymentsList: React.FC<PaymentsListProps> = ({
  patientId,
  limit = 0,
  showAll = false,
  dateRange,
  onPaymentSelect
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState(dateRange ? 'personalizado' : 'todos');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [dateRangeStart, setDateRangeStart] = useState(dateRange?.startDate || '');
  const [dateRangeEnd, setDateRangeEnd] = useState(dateRange?.endDate || '');

  useEffect(() => {
    fetchPayments();
  }, [patientId, dateRange]);

  useEffect(() => {
    applyFilters();
  }, [payments, searchTerm, methodFilter, dateFilter, dateRangeStart, dateRangeEnd]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/pagos';
      
      // Apply filters based on props
      if (patientId) {
        endpoint = `/api/pagos/paciente/${patientId}`;
      }
      
      // Add date range filter if provided
      if (dateRange) {
        const { startDate, endDate } = dateRange;
        endpoint += `?inicio=${startDate}&fin=${endDate}`;
      }
      
      const response = await apiService.get<{ pagos: Payment[] }>(endpoint);
      setPayments(response.pagos);
      setFilteredPayments(response.pagos);
      
      // Calculate total amount
      const total = response.pagos.reduce((sum, payment) => {
        if (payment.estado === 'completado') {
          return sum + payment.montoTotal;
        }
        return sum;
      }, 0);
      
      setTotalAmount(total);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar pagos');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.paciente.nombre.toLowerCase().includes(search) ||
        payment.paciente.apellido.toLowerCase().includes(search) ||
        payment.paciente.dni.includes(search) ||
        payment.concepto.toLowerCase().includes(search) ||
        payment.tratamiento.nombre.toLowerCase().includes(search)
      );
    }
    
    // Apply payment method filter
    if (methodFilter !== 'todos') {
      filtered = filtered.filter(payment => payment.metodoPago === methodFilter);
    }
    
    // Apply date filter
    if (dateFilter !== 'todos') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'hoy') {
        filtered = filtered.filter(payment => {
          const paymentDate = new Date(payment.fecha);
          paymentDate.setHours(0, 0, 0, 0);
          return paymentDate.getTime() === today.getTime();
        });
      } else if (dateFilter === 'semana') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        
        filtered = filtered.filter(payment => {
          const paymentDate = new Date(payment.fecha);
          return paymentDate >= weekStart;
        });
      } else if (dateFilter === 'mes') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        filtered = filtered.filter(payment => {
          const paymentDate = new Date(payment.fecha);
          return paymentDate >= monthStart;
        });
      } else if (dateFilter === 'personalizado' && dateRangeStart && dateRangeEnd) {
        const start = new Date(dateRangeStart);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(dateRangeEnd);
        end.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(payment => {
          const paymentDate = new Date(payment.fecha);
          return paymentDate >= start && paymentDate <= end;
        });
      }
    }
    
    // Apply limit if necessary
    if (limit > 0 && !showAll) {
      filtered = filtered.slice(0, limit);
    }
    
    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    setFilteredPayments(filtered);
    
    // Calculate total amount for filtered payments
    const total = filtered.reduce((sum, payment) => {
      if (payment.estado === 'completado') {
        return sum + payment.montoTotal;
      }
      return sum;
    }, 0);
    
    setTotalAmount(total);
  };

  const handleCancelPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      setLoading(true);
      
      await apiService.post(`/api/pagos/${selectedPayment._id}/anular`);
      
      // Update payments list
      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment._id === selectedPayment._id 
            ? { ...payment, estado: 'anulado' } 
            : payment
        )
      );
      
      setIsDeleteModalOpen(false);
      setSelectedPayment(null);
      setLoading(false);
      
    } catch (err: any) {
      setError(err.message || 'Error al anular el pago');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS'
    });
  };

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

  const getPaymentStatusBadge = (status: string) => {
    if (status === 'completado') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completado
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Anulado
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando pagos..." />
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
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por paciente, concepto o tratamiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'todos', label: 'Todos los métodos' },
                { value: 'efectivo', label: 'Efectivo' },
                { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
                { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
                { value: 'transferencia', label: 'Transferencia' },
                { value: 'otro', label: 'Otro' }
              ]}
              value={methodFilter}
              onChange={setMethodFilter}
              icon={<CreditCard className="h-5 w-5 text-gray-400" />}
              placeholder="Método de Pago"
            />
          </div>
          
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'todos', label: 'Todas las fechas' },
                { value: 'hoy', label: 'Hoy' },
                { value: 'semana', label: 'Esta semana' },
                { value: 'mes', label: 'Este mes' },
                { value: 'personalizado', label: 'Rango personalizado' }
              ]}
              value={dateFilter}
              onChange={setDateFilter}
              icon={<Calendar className="h-5 w-5 text-gray-400" />}
              placeholder="Fecha"
            />
          </div>
          
          {dateFilter === 'personalizado' && (
            <>
              <div className="w-full sm:w-auto">
                <Input
                  label="Desde"
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-auto">
                <Input
                  label="Hasta"
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                />
              </div>
            </>
          )}
          
          {limit > 0 && !showAll && filteredPayments.length >= limit && (
            <div className="ml-auto">
              <Button 
                variant="light"
                onClick={() => window.location.href = patientId 
                  ? `/pacientes/${patientId}/pagos` 
                  : '/pagos'
                }
              >
                Ver todos
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Card */}
      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Resumen de Pagos</h3>
            <p className="text-gray-600">
              {filteredPayments.length} {filteredPayments.length === 1 ? 'pago encontrado' : 'pagos encontrados'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Recaudado:</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No se encontraron pagos con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card
              key={payment._id}
              className={`hover:shadow-md transition-shadow ${payment.estado === 'anulado' ? 'opacity-70' : ''}`}
              onClick={() => onPaymentSelect ? onPaymentSelect(payment) : window.location.href = `/pagos/${payment._id}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-lg font-semibold">
                      {formatCurrency(payment.montoTotal)}
                    </span>
                    <span className="ml-3">
                      {getPaymentStatusBadge(payment.estado)}
                    </span>
                    {payment.facturaGenerada && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Factura: {payment.numeroFactura || 'N/A'}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm mb-1">
                    <span className="text-gray-500">Paciente:</span> {payment.paciente.nombre} {payment.paciente.apellido}
                  </div>
                  
                  <div className="text-sm mb-1">
                    <span className="text-gray-500">Concepto:</span> {payment.concepto}
                  </div>
                  
                  <div className="text-sm mb-1">
                    <span className="text-gray-500">Tratamiento:</span> {payment.tratamiento.nombre}
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 mb-1">
                    <span>
                      <Calendar className="inline-block h-4 w-4 mr-1" />
                      {formatDate(payment.fecha)}
                    </span>
                    <span>
                      <CreditCard className="inline-block h-4 w-4 mr-1" />
                      {getPaymentMethodText(payment.metodoPago)}
                    </span>
                    {payment.descuento > 0 && (
                      <span className="text-green-600">
                        Descuento: {payment.descuento}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 mt-4 md:mt-0">
                  <Button 
                    variant="primary" 
                    size="sm"
                    icon={<Eye className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/pagos/${payment._id}`;
                    }}
                  >
                    Ver
                  </Button>
                  
                  {payment.facturaGenerada && (
                    <Button 
                      variant="light" 
                      size="sm"
                      icon={<Download className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/api/pagos/${payment._id}/factura/pdf?download=true`;
                      }}
                    >
                      Factura
                    </Button>
                  )}
                  
                  {payment.estado === 'completado' && (
                    <>
                      <Button 
                        variant="light" 
                        size="sm"
                        icon={<Edit className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/pagos/${payment._id}/editar`;
                        }}
                      >
                        Editar
                      </Button>
                      
                      <Button 
                        variant="danger" 
                        size="sm"
                        icon={<X className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(payment);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        Anular
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Confirmation modal for payment cancellation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Anulación de Pago"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleCancelPayment}
              isLoading={loading}
            >
              Anular Pago
            </Button>
          </>
        }
      >
        <Alert variant="warning" title="Advertencia">
          <p>
            Está a punto de anular el pago por <strong>{formatCurrency(selectedPayment?.montoTotal || 0)}</strong> del paciente <strong>{selectedPayment?.paciente.nombre} {selectedPayment?.paciente.apellido}</strong>.
          </p>
          <p className="mt-2">
            Esta acción:
          </p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Marcará el pago como anulado en el sistema</li>
            <li>Invalidará cualquier factura generada asociada a este pago</li>
            <li>No puede ser revertida</li>
          </ul>
          <p className="mt-2">
            ¿Está seguro de que desea continuar?
          </p>
        </Alert>
      </Modal>
    </div>
  );
};

export default PaymentsList;