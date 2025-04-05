import React, { useState, useEffect } from 'react';
import { Printer, Download, File, FileText, Camera } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Tabs from '../ui/Tabs';
import apiService from '../../services/api';

interface MedicalRecordViewerProps {
  recordId: string;
  onEditClick?: () => void;
}

export const MedicalRecordViewer: React.FC<MedicalRecordViewerProps> = ({
  recordId,
  onEditClick
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (recordId) {
      fetchMedicalRecord();
    }
  }, [recordId]);

  const fetchMedicalRecord = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/historias/${recordId}`);
      setRecord(response.historia);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la historia clínica');
      setLoading(false);
    }
  };

  const handlePrintRecord = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setGeneratingPdf(true);
      const response = await apiService.get(`/api/historias/${recordId}/pdf`, {
        responseType: 'blob'
      });
      
      // Crear un objeto URL para el blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `historia-clinica-${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpieza
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      setGeneratingPdf(false);
    } catch (err: any) {
      setError(err.message || 'Error al descargar el PDF');
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando historia clínica..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert 
        variant="error" 
        title="Error" 
        dismissible
        onDismiss={() => setError(null)}
      >
        {error}
      </Alert>
    );
  }

  if (!record) {
    return (
      <Alert 
        variant="warning" 
        title="No encontrada" 
      >
        No se encontró la historia clínica solicitada
      </Alert>
    );
  }

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

  const tabs = [
    {
      id: 'general',
      label: 'Información General',
      content: (
        <div className="space-y-6">
          {/* Información de la consulta */}
          <Card title="Información de la Consulta">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Paciente</div>
                <div className="font-medium">
                  {record.paciente.nombre} {record.paciente.apellido}
                </div>
                <div className="text-sm text-gray-500">DNI: {record.paciente.dni}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Médico</div>
                <div className="font-medium">
                  Dr. {record.medico.nombre} {record.medico.apellido}
                </div>
                <div className="text-sm text-gray-500">
                  {record.medico.especialidad}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Fecha y Hora</div>
                <div className="font-medium">
                  {formatDate(record.createdAt)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Tratamiento</div>
                <div className="font-medium">
                  {record.tratamientoRealizado?.nombre || 'No especificado'}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Motivo de Consulta y Diagnóstico */}
          <Card title="Motivo de Consulta y Diagnóstico">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Motivo de Consulta</div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {record.motivoConsulta || 'No especificado'}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Diagnóstico</div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {record.diagnostico || 'No especificado'}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Observaciones</div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {record.observaciones || 'Sin observaciones'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 'parameters',
      label: 'Parámetros',
      content: (
        <Card title="Parámetros Registrados">
          {record.parametrosRegistrados && record.parametrosRegistrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parámetro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unidad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {record.parametrosRegistrados.map((param: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {param.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {param.valor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {param.unidad || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No se han registrado parámetros
            </div>
          )}
        </Card>
      )
    },
    {
      id: 'results',
      label: 'Resultados e Indicaciones',
      content: (
        <div className="space-y-6">
          <Card title="Resultados del Tratamiento">
            <div className="p-3 bg-gray-50 rounded-lg">
              {record.resultados || 'No se han registrado resultados'}
            </div>
          </Card>
          
          <Card title="Indicaciones para el Paciente">
            <div className="p-3 bg-gray-50 rounded-lg">
              {record.indicaciones || 'No se han registrado indicaciones'}
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 'documents',
      label: 'Documentos',
      content: (
        <Card title="Documentos Asociados">
          {record.documentos && record.documentos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {record.documentos.map((doc: any, index: number) => (
                <div 
                  key={index}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col items-center">
                    {doc.tipo.includes('image') ? (
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Camera className="h-8 w-8 text-blue-500" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                        <FileText className="h-8 w-8 text-amber-500" />
                      </div>
                    )}
                    
                    <h3 className="font-medium text-center mb-1">{doc.titulo}</h3>
                    <p className="text-sm text-gray-500 capitalize text-center mb-2">{doc.tipo}</p>
                    
                    <a 
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Ver documento
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No hay documentos asociados
            </div>
          )}
          
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center">
              <div className="h-4 w-4 mr-2 rounded-full bg-green-500"></div>
              <span className="text-sm">
                {record.autorizacionDivulgacionImagenes 
                  ? 'El paciente ha autorizado el uso de imágenes con fines médicos y académicos' 
                  : 'El paciente NO ha autorizado el uso de imágenes con fines médicos y académicos'}
              </span>
            </div>
          </div>
        </Card>
      )
    },
    {
      id: 'followup',
      label: 'Seguimiento',
      content: (
        <div className="space-y-6">
          <Card title="Recomendaciones de Seguimiento">
            <div className="p-3 bg-gray-50 rounded-lg">
              {record.recomendacionesSeguimiento || 'No se han registrado recomendaciones de seguimiento'}
            </div>
          </Card>
          
          <Card title="Próxima Cita">
            {record.proximaCita && record.proximaCita.fecha ? (
              <div className="p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Fecha</div>
                    <div className="font-medium">
                      {formatDate(record.proximaCita.fecha)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Motivo</div>
                    <div className="font-medium">
                      {record.proximaCita.motivo || 'No especificado'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No se ha programado próxima cita
              </div>
            )}
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="print:bg-white print:text-black print:px-8 print:py-6">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h1 className="text-xl font-bold">Historia Clínica</h1>
        <div className="flex space-x-2">
          <Button
            variant="light"
            icon={<Printer className="h-5 w-5" />}
            onClick={handlePrintRecord}
          >
            Imprimir
          </Button>
          
          <Button
            variant="light"
            icon={<Download className="h-5 w-5" />}
            onClick={handleDownloadPdf}
            isLoading={generatingPdf}
          >
            Descargar PDF
          </Button>
          
          {onEditClick && (
            <Button
              variant="primary"
              onClick={onEditClick}
            >
              Editar
            </Button>
          )}
        </div>
      </div>
      
      <div className="print:hidden">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>
      
      {/* Versión imprimible */}
      <div className="hidden print:block">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Historia Clínica</h1>
          <p className="text-lg">
            {record.paciente.nombre} {record.paciente.apellido} - DNI: {record.paciente.dni}
          </p>
          <p>Fecha: {formatDate(record.createdAt)}</p>
        </div>
        
        {tabs.map(tab => (
          <div key={tab.id} className="mb-6">
            <h2 className="text-xl font-bold mb-3">{tab.label}</h2>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicalRecordViewer;