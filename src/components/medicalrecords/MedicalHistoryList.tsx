import React, { useState, useEffect } from 'react';
import { Calendar, User, FileText, Printer, Download, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Select from '../ui/Select';
import apiService from '../../services/api';

interface MedicalHistory {
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
  cita: {
    _id: string;
    fechaInicio: string;
  };
  tratamientoRealizado: {
    _id: string;
    nombre: string;
  };
  motivoConsulta: string;
  diagnostico: string;
  observaciones: string;
  indicaciones: string;
  parametrosRegistrados: Array<{
    nombre: string;
    valor: string;
    unidad?: string;
  }>;
  resultados: string;
  documentos: Array<{
    _id: string;
    titulo: string;
    tipo: string;
  }>;
  recomendacionesSeguimiento: string;
  proximaCita?: {
    fecha: string;
    motivo: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MedicalHistoryListProps {
  patientId?: string;
  doctorId?: string;
  limit?: number;
  showAll?: boolean;
  onRecordSelect?: (record: MedicalHistory) => void;
}

export const MedicalHistoryList: React.FC<MedicalHistoryListProps> = ({
  patientId,
  doctorId,
  limit = 0,
  showAll = false,
  onRecordSelect
}) => {
  const [records, setRecords] = useState<MedicalHistory[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treatmentFilter, setTreatmentFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('recientes');
  const [expandedRecords, setExpandedRecords] = useState<string[]>([]);
  const [treatments, setTreatments] = useState<Array<{ id: string, name: string }>>([]);

  useEffect(() => {
    fetchRecords();
  }, [patientId, doctorId]);

  useEffect(() => {
    applyFilters();
  }, [records, treatmentFilter, dateFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/historias';
      
      // Aplicar filtros según los props
      if (patientId) {
        endpoint = `/api/historias/paciente/${patientId}`;
      } else if (doctorId) {
        endpoint = `/api/historias/medico/${doctorId}`;
      }
      
      const response = await apiService.get<{ historias: MedicalHistory[] }>(endpoint);
      setRecords(response.historias);
      
      // Extraer tipos de tratamientos únicos para el filtro
      const uniqueTreatments = Array.from(new Set(
        response.historias.map(record => record.tratamientoRealizado._id)
      )).map(id => {
        const treatment = response.historias.find(r => r.tratamientoRealizado._id === id)?.tratamientoRealizado;
        return {
          id: id,
          name: treatment?.nombre || 'Desconocido'
        };
      });
      
      setTreatments(uniqueTreatments);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar historias clínicas');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];
    
    // Filtro por tratamiento
    if (treatmentFilter !== 'todos') {
      filtered = filtered.filter(record => record.tratamientoRealizado._id === treatmentFilter);
    }
    
    // Filtro por fecha
    if (dateFilter === 'recientes') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (dateFilter === 'antiguos') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    
    // Aplicar límite si es necesario
    if (limit > 0 && !showAll) {
      filtered = filtered.slice(0, limit);
    }
    
    setFilteredRecords(filtered);
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

  const toggleRecordExpansion = (recordId: string) => {
    setExpandedRecords(prev => 
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleRecordSelect = (record: MedicalHistory) => {
    if (onRecordSelect) {
      onRecordSelect(record);
    } else {
      window.location.href = `/historias/${record._id}`;
    }
  };

  const handlePrintRecord = (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/historias/${recordId}/pdf`, '_blank');
  };

  const handleDownloadRecord = (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/api/historias/${recordId}/pdf?download=true`;
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando historias clínicas..." />
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
          <div className="w-full sm:w-64">
            <Select
              options={[
                { value: 'todos', label: 'Todos los tratamientos' },
                ...treatments.map(treatment => ({
                  value: treatment.id,
                  label: treatment.name
                }))
              ]}
              value={treatmentFilter}
              onChange={setTreatmentFilter}
              placeholder="Filtrar por tratamiento"
            />
          </div>
          
          <div className="w-full sm:w-64">
            <Select
              options={[
                { value: 'recientes', label: 'Más recientes primero' },
                { value: 'antiguos', label: 'Más antiguos primero' }
              ]}
              value={dateFilter}
              onChange={setDateFilter}
              placeholder="Ordenar por fecha"
            />
          </div>
          
          {limit > 0 && !showAll && filteredRecords.length >= limit && (
            <div className="ml-auto">
              <Button 
                variant="light"
                onClick={() => window.location.href = patientId 
                  ? `/pacientes/${patientId}/historias` 
                  : doctorId 
                    ? `/medicos/${doctorId}/historias`
                    : '/historias'
                }
              >
                Ver todas
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No se encontraron historias clínicas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const isExpanded = expandedRecords.includes(record._id);
            
            return (
              <Card
                key={record._id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRecordSelect(record)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="font-medium">{formatDate(record.cita.fechaInicio)}</span>
                    </div>
                    
                    {!patientId && (
                      <div className="flex items-center mb-2">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <span>
                          Paciente: {record.paciente.nombre} {record.paciente.apellido}
                        </span>
                      </div>
                    )}
                    
                    {!doctorId && (
                      <div className="flex items-center mb-2">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <span>
                          Médico: Dr. {record.medico.nombre} {record.medico.apellido}
                        </span>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <span className="block text-sm text-gray-600">Tratamiento:</span>
                      <span className="font-medium">{record.tratamientoRealizado.nombre}</span>
                    </div>
                    
                    <div className="mb-2">
                      <span className="block text-sm text-gray-600">Motivo de consulta:</span>
                      <p className="text-sm line-clamp-2">{record.motivoConsulta}</p>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        {record.diagnostico && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600">Diagnóstico:</span>
                            <p className="text-sm">{record.diagnostico}</p>
                          </div>
                        )}
                        
                        {record.observaciones && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600">Observaciones:</span>
                            <p className="text-sm">{record.observaciones}</p>
                          </div>
                        )}
                        
                        {record.parametrosRegistrados && record.parametrosRegistrados.length > 0 && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600">Parámetros registrados:</span>
                            <ul className="text-sm mt-1 space-y-1">
                              {record.parametrosRegistrados.map((param, index) => (
                                <li key={index}>
                                  {param.nombre}: {param.valor} {param.unidad || ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {record.indicaciones && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600">Indicaciones:</span>
                            <p className="text-sm">{record.indicaciones}</p>
                          </div>
                        )}
                        
                        {record.resultados && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600">Resultados:</span>
                            <p className="text-sm">{record.resultados}</p>
                          </div>
                        )}
                        
                        {record.documentos && record.documentos.length > 0 && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600">Documentos asociados:</span>
                            <ul className="text-sm mt-1 space-y-1">
                              {record.documentos.map((doc) => (
                                <li key={doc._id}>
                                  <a 
                                    href={`/documentos/${doc._id}`}
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {doc.titulo} ({doc.tipo})
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {record.recomendacionesSeguimiento && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600">Recomendaciones de seguimiento:</span>
                            <p className="text-sm">{record.recomendacionesSeguimiento}</p>
                          </div>
                        )}
                        
                        {record.proximaCita && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600">Próxima cita:</span>
                            <p className="text-sm">
                              {formatDate(record.proximaCita.fecha)} - {record.proximaCita.motivo}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 mt-4 md:mt-0">
                    <Button
                      variant="light"
                      size="sm"
                      icon={<FileText className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecordSelect(record);
                      }}
                    >
                      Ver
                    </Button>
                    
                    <Button
                      variant="light"
                      size="sm"
                      icon={<Printer className="h-4 w-4" />}
                      onClick={(e) => handlePrintRecord(record._id, e)}
                    >
                      Imprimir
                    </Button>
                    
                    <Button
                      variant="light"
                      size="sm"
                      icon={<Download className="h-4 w-4" />}
                      onClick={(e) => handleDownloadRecord(record._id, e)}
                    >
                      Descargar
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRecordExpansion(record._id);
                      }}
                    >
                      {isExpanded ? 'Menos' : 'Más'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryList;