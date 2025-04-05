import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Card from '../ui/Card';
import Select from '../ui/Select';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Tabs from '../ui/Tabs';
import apiService from '../../services/api';

// Interfaces
interface FinancialSummary {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  ingresosHoy: number;
  ingresosSemana: number;
  ingresosMes: number;
  pendientesCobro: number;
  tratamientosMasVendidos: Array<{
    tratamiento: string;
    cantidad: number;
    total: number;
  }>;
  medicosMasIngresos: Array<{
    medico: string;
    total: number;
  }>;
  ingresosPorPeriodo: Array<{
    periodo: string;
    ingresos: number;
    gastos: number;
  }>;
  ingresosPorMetodoPago: Array<{
    metodo: string;
    total: number;
  }>;
}

interface PaymentDashboardProps {
  startDate?: string;
  endDate?: string;
  doctorId?: string;
}

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const PaymentDashboard: React.FC<PaymentDashboardProps> = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
  doctorId: initialDoctorId
}) => {
  // Estados
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [period, setPeriod] = useState('mes');
  const [startDate, setStartDate] = useState<string>(initialStartDate || getDefaultStartDate('mes'));
  const [endDate, setEndDate] = useState<string>(initialEndDate || new Date().toISOString().split('T')[0]);
  const [doctorId, setDoctorId] = useState<string>(initialDoctorId || '');
  
  // Lista de médicos para el filtro
  const [doctors, setDoctors] = useState<Array<{_id: string, nombre: string, apellido: string}>>([]);
  
  // Pestaña activa
  const [activeTab, setActiveTab] = useState('resumen');

  // Cargar datos al iniciar
  useEffect(() => {
    fetchDoctors();
    fetchFinancialData();
  }, []);

  // Actualizar datos cuando cambian los filtros
  useEffect(() => {
    fetchFinancialData();
  }, [period, startDate, endDate, doctorId]);

  // Función para obtener fecha de inicio predeterminada según el período
  function getDefaultStartDate(selectedPeriod: string): string {
    const today = new Date();
    
    switch (selectedPeriod) {
      case 'semana':
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        return lastWeek.toISOString().split('T')[0];
        
      case 'mes':
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        return lastMonth.toISOString().split('T')[0];
        
      case 'trimestre':
        const lastQuarter = new Date(today);
        lastQuarter.setMonth(today.getMonth() - 3);
        return lastQuarter.toISOString().split('T')[0];
        
      case 'año':
        const lastYear = new Date(today);
        lastYear.setFullYear(today.getFullYear() - 1);
        return lastYear.toISOString().split('T')[0];
        
      default:
        return today.toISOString().split('T')[0];
    }
  }

  // Función para cargar lista de médicos
  const fetchDoctors = async () => {
    try {
      const response = await apiService.get<{ medicos: Array<{_id: string, nombre: string, apellido: string}> }>('/api/usuarios/medicos');
      setDoctors(response.medicos);
    } catch (err: any) {
      console.error('Error al cargar médicos:', err);
    }
  };

  // Función para cargar datos financieros
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Construir la URL con parámetros de consulta
      let url = `/api/pagos/dashboard?desde=${startDate}&hasta=${endDate}`;
      if (doctorId) {
        url += `&medico=${doctorId}`;
      }
      
      const response = await apiService.get<{ datos: FinancialSummary }>(url);
      setSummary(response.datos);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos financieros');
      setLoading(false);
    }
  };

  // Manejador para cambio de período
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setStartDate(getDefaultStartDate(newPeriod));
    setEndDate(new Date().toISOString().split('T')[0]);
  };

  // Formatear moneda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  // Formatear porcentaje
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando datos financieros..." />
      </div>
    );
  }

  // Si hay error, mostrar alerta
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

  // Si no hay datos
  if (!summary) {
    return (
      <Alert variant="info" title="Sin datos">
        No hay datos financieros disponibles para el período seleccionado.
      </Alert>
    );
  }

  // Tabs para la visualización
  const tabs = [
    {
      id: 'resumen',
      label: 'Resumen',
      content: (
        <div className="space-y-6">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ingresos Totales</h3>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalIngresos)}</p>
                  <div className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+{summary.ingresosMes > 0 ? formatPercentage(summary.ingresosMes / summary.totalIngresos * 100) : '0%'} este mes</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Gastos Totales</h3>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalGastos)}</p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Balance</h3>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.balance)}</p>
                  <div className="text-xs text-red-600 flex items-center">
                    <CreditCard className="h-3 w-3 mr-1" />
                    <span>Pendiente: {formatCurrency(summary.pendientesCobro)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Gráficos de ingresos por período */}
          <Card title="Evolución de Ingresos y Gastos">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={summary.ingresosPorPeriodo}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#4f46e5" strokeWidth={2} />
                  <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          {/* Gráficos de tratamientos más vendidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Tratamientos más vendidos">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.tratamientosMasVendidos}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tratamiento" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="total" name="Ingresos" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card title="Método de Pago">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.ingresosPorMetodoPago}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                      nameKey="metodo"
                    >
                      {summary.ingresosPorMetodoPago.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'medicosRendimiento',
      label: 'Rendimiento por Médico',
      content: (
        <Card title="Ingresos por Médico">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.medicosMasIngresos}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="medico" type="category" width={150} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="total" name="Ingresos" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'semana', label: 'Última semana' },
                { value: 'mes', label: 'Último mes' },
                { value: 'trimestre', label: 'Último trimestre' },
                { value: 'año', label: 'Último año' },
                { value: 'personalizado', label: 'Personalizado' }
              ]}
              value={period}
              onChange={handlePeriodChange}
              icon={<Calendar className="h-5 w-5 text-gray-400" />}
              placeholder="Período"
            />
          </div>
          
          {period === 'personalizado' && (
            <>
              <div className="w-full sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="w-full sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}
          
          {doctors.length > 0 && (
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: '', label: 'Todos los médicos' },
                  ...doctors.map(doc => ({
                    value: doc._id,
                    label: `Dr. ${doc.nombre} ${doc.apellido}`
                  }))
                ]}
                value={doctorId}
                onChange={(value) => setDoctorId(value)}
                icon={<Filter className="h-5 w-5 text-gray-400" />}
                placeholder="Médico"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Contenido principal */}
      <Tabs 
        tabs={tabs} 
        activeTab={activeTab}
        onChange={setActiveTab}
      />
    </div>
  );
};

export default PaymentDashboard;