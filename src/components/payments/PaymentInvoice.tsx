import React, { useState, useEffect } from 'react';
import { Download, Printer, Send, Check, Clock, X, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import apiService from '../../services/api';

interface PaymentDetail {
  _id: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Payment {
  _id: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaVencimiento: string;
  paciente: {
    _id: string;
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    direccion?: {
      calle: string;
      numero: string;
      codigoPostal: string;
      ciudad: string;
      provincia: string;
      pais: string;
    }
  };
  cita?: {
    _id: string;
    fechaInicio: string;
    medico: {
      nombre: string;
      apellido: string;
    }
  };
  tratamiento?: {
    _id: string;
    nombre: string;
    precio: number;
  };
  metodoPago: string;
  estado: 'pendiente' | 'pagada' | 'vencida' | 'cancelada' | 'reembolsada';
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  detalles: PaymentDetail[];
  notasInternas?: string;
  notasCliente?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentInvoiceProps {
  paymentId?: string;
  payment?: Payment;
  companyInfo?: {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    sitioWeb: string;
    logo?: string;
    cuitCif: string;
  };
  showActions?: boolean;
  isPrint?: boolean;
}

export const PaymentInvoice: React.FC<PaymentInvoiceProps> = ({
  paymentId,
  payment: initialPayment,
  companyInfo: initialCompanyInfo,
  showActions = true,
  isPrint = false
}) => {
  const [payment, setPayment] = useState<Payment | null>(initialPayment || null);
  const [companyInfo, setCompanyInfo] = useState(initialCompanyInfo || {
    nombre: 'Clínica Estética',
    direccion: 'Av. Corrientes 1234, CABA',
    telefono: '+54 11 1234-5678',
    email: 'info@clinicaestetica.com',
    sitioWeb: 'www.clinicaestetica.com',
    cuitCif: '30-12345678-9'
  });
  const [loading, setLoading] = useState(!!paymentId);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (paymentId && !initialPayment) {
      fetchPaymentData();
    }
  }, [paymentId, initialPayment]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ pago: Payment }>(`/api/pagos/${paymentId}`);
      setPayment(response.pago);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del pago');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!payment) return;
    
    try {
      const response = await apiService.get(`/api/pagos/${payment._id}/pdf`, { responseType: 'blob' });
      
      // Crear un objeto URL para el blob
      const url = window.URL.createObjectURL(new Blob([response as BlobPart]));
      
      // Crear un enlace temporal y hacer clic en él
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Factura-${payment.numeroFactura}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Error al descargar la factura');
    }
  };

  const handleSendEmail = async () => {
    if (!payment) return;
    
    try {
      setSendingEmail(true);
      await apiService.post(`/api/pagos/${payment._id}/enviar-email`);
      setEmailSent(true);
      setSendingEmail(false);
    } catch (err: any) {
      setError(err.message || 'Error al enviar la factura por email');
      setSendingEmail(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pagada':
        return (
          <div className="flex items-center space-x-1 text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm">
            <Check className="h-4 w-4" />
            <span>Pagada</span>
          </div>
        );
      case 'pendiente':
        return (
          <div className="flex items-center space-x-1 text-amber-600 bg-amber-100 px-2 py-1 rounded-full text-sm">
            <Clock className="h-4 w-4" />
            <span>Pendiente</span>
          </div>
        );
      case 'vencida':
        return (
          <div className="flex items-center space-x-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-sm">
            <Clock className="h-4 w-4" />
            <span>Vencida</span>
          </div>
        );
      case 'cancelada':
        return (
          <div className="flex items-center space-x-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-sm">
            <X className="h-4 w-4" />
            <span>Cancelada</span>
          </div>
        );
      case 'reembolsada':
        return (
          <div className="flex items-center space-x-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-sm">
            <RefreshCw className="h-4 w-4" />
            <span>Reembolsada</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-sm">
            <span>{status}</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando factura..." />
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

  if (!payment) {
    return (
      <Alert variant="warning" title="Factura no encontrada">
        No se pudo encontrar la información de la factura solicitada.
      </Alert>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${isPrint ? 'p-8' : 'p-6'} max-w-4xl mx-auto`}>
      {/* Acciones */}
      {showActions && !isPrint && (
        <div className="flex justify-end space-x-2 mb-6">
          <Button
            variant="light"
            icon={<Printer className="h-5 w-5" />}
            onClick={handlePrint}
          >
            Imprimir
          </Button>
          
          <Button
            variant="light"
            icon={<Download className="h-5 w-5" />}
            onClick={handleDownload}
          >
            Descargar PDF
          </Button>
          
          <Button
            variant="primary"
            icon={<Send className="h-5 w-5" />}
            onClick={handleSendEmail}
            isLoading={sendingEmail}
            disabled={emailSent}
          >
            {emailSent ? 'Email Enviado' : 'Enviar por Email'}
          </Button>
        </div>
      )}
      
      {/* Cabecera */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{companyInfo.nombre}</h1>
          <p className="text-gray-600">{companyInfo.direccion}</p>
          <p className="text-gray-600">{companyInfo.telefono}</p>
          <p className="text-gray-600">{companyInfo.email}</p>
          <p className="text-gray-600">{companyInfo.sitioWeb}</p>
          <p className="text-gray-600">CUIT/CIF: {companyInfo.cuitCif}</p>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-800 mb-2">FACTURA</div>
          <div className="text-xl text-gray-600 mb-1">#{payment.numeroFactura}</div>
          <div className="mb-2">{getStatusBadge(payment.estado)}</div>
          <div className="text-gray-600 mb-1">
            <span className="font-medium">Fecha de emisión:</span> {formatDate(payment.fechaEmision)}
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Fecha de vencimiento:</span> {formatDate(payment.fechaVencimiento)}
          </div>
        </div>
      </div>
      
      {/* Información del cliente */}
      <div className="mt-8 border-t border-b py-4 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Cliente</h2>
            <p className="font-medium">{payment.paciente.nombre} {payment.paciente.apellido}</p>
            <p className="text-gray-600">DNI: {payment.paciente.dni}</p>
            <p className="text-gray-600">{payment.paciente.email}</p>
            {payment.paciente.direccion && (
              <p className="text-gray-600">
                {payment.paciente.direccion.calle} {payment.paciente.direccion.numero}, 
                {payment.paciente.direccion.ciudad}, {payment.paciente.direccion.provincia}
              </p>
            )}
          </div>
          
          {payment.cita && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Detalles de la Cita</h2>
              <p className="text-gray-600">
                <span className="font-medium">Fecha:</span> {formatDate(payment.cita.fechaInicio)}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Médico:</span> Dr. {payment.cita.medico.nombre} {payment.cita.medico.apellido}
              </p>
              {payment.tratamiento && (
                <p className="text-gray-600">
                  <span className="font-medium">Tratamiento:</span> {payment.tratamiento.nombre}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Detalles del pago */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Detalles del Pago</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Unitario
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payment.detalles.map((detalle, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {detalle.concepto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {detalle.cantidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(detalle.precioUnitario)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(detalle.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Resumen */}
      <div className="mt-6 flex justify-end">
        <div className="w-full md:w-64">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(payment.subtotal)}</span>
          </div>
          
          {payment.descuento > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Descuento:</span>
              <span className="font-medium">-{formatCurrency(payment.descuento)}</span>
            </div>
          )}
          
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Impuestos:</span>
            <span className="font-medium">{formatCurrency(payment.impuestos)}</span>
          </div>
          
          <div className="flex justify-between py-2 border-t border-gray-200 font-bold text-lg">
            <span>Total:</span>
            <span>{formatCurrency(payment.total)}</span>
          </div>
        </div>
      </div>
      
      {/* Método de pago */}
      <div className="mt-6">
        <p className="text-gray-600">
          <span className="font-medium">Método de pago:</span> {payment.metodoPago}
        </p>
      </div>
      
      {/* Notas */}
      {payment.notasCliente && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Notas</h3>
          <p className="text-sm text-gray-600">{payment.notasCliente}</p>
        </div>
      )}
      
      {/* Pie de página */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Gracias por confiar en nosotros</p>
        <p>Para cualquier consulta, contáctenos a {companyInfo.email}</p>
      </div>
    </div>
  );
};

export default PaymentInvoice;