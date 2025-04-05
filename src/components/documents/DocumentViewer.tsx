import React, { useState, useEffect } from 'react';
import { FileText, User, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import apiService from '../../services/api';

interface DocumentViewerProps {
  documentId: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentId }) => {
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ documento: any }>(`/api/documentos/${documentId}`);
      setDocument(response.documento);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el documento');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando documento..." />
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

  if (!document) {
    return (
      <Alert variant="warning" title="Documento no encontrado">
        No se pudo encontrar el documento solicitado.
      </Alert>
    );
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Process document content with field values
  const processContent = (): string => {
    let content = document.template.contenido;
    
    // Replace variables with actual values
    if (document.camposValores) {
      Object.entries(document.camposValores).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, String(value));
      });
    }
    
    // Add patient signature if available
    if (document.firmaPaciente) {
      content = content.replace(
        '</div>',
        `<div style="margin-top: 20px;">
           <div style="border-bottom: 1px solid #000; display: inline-block;">
             <img src="${document.firmaPaciente.imagen}" alt="Firma del paciente" style="max-height: 80px;" />
           </div>
           <p style="margin-top: 5px; font-size: 12px;">
             Firmado por: ${document.firmaPaciente.nombre}<br>
             Fecha: ${new Date(document.firmaPaciente.fecha).toLocaleString()}
           </p>
         </div></div>`
      );
    }
    
    // Add doctor signature if available
    if (document.firmaMedico) {
      content = content.replace(
        '</div>',
        `<div style="margin-top: 20px;">
           <div style="border-bottom: 1px solid #000; display: inline-block;">
             <img src="${document.firmaMedico.imagen}" alt="Firma del médico" style="max-height: 80px;" />
           </div>
           <p style="margin-top: 5px; font-size: 12px;">
             Firmado por: Dr. ${document.firmaMedico.nombre}<br>
             Fecha: ${new Date(document.firmaMedico.fecha).toLocaleString()}
           </p>
         </div></div>`
      );
    }
    
    return content;
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex items-start mb-2">
              <FileText className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <span className="text-sm text-gray-600">Tipo de Documento:</span>
                <p className="font-medium">{document.template.tipo.charAt(0).toUpperCase() + document.template.tipo.slice(1)}</p>
              </div>
            </div>
            
            <div className="flex items-start mb-2">
              <User className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <span className="text-sm text-gray-600">Paciente:</span>
                <p className="font-medium">{document.paciente.nombre} {document.paciente.apellido}</p>
              </div>
            </div>
            
            <div className="flex items-start mb-2">
              <User className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <span className="text-sm text-gray-600">Médico:</span>
                <p className="font-medium">Dr. {document.medico.nombre} {document.medico.apellido}</p>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-start mb-2">
              <Calendar className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <span className="text-sm text-gray-600">Fecha de Creación:</span>
                <p className="font-medium">{formatDate(document.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-start mb-2">
              <Calendar className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <span className="text-sm text-gray-600">Última Actualización:</span>
                <p className="font-medium">{formatDate(document.updatedAt)}</p>
              </div>
            </div>
            
            <div className="flex items-start mb-2">
              <div className="w-5 h-5 mr-2 mt-0.5 flex items-center justify-center">
                {document.firmaPaciente && document.firmaMedico ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <span className="text-sm text-gray-600">Estado:</span>
                <p className="font-medium">
                  {document.firmaPaciente && document.firmaMedico 
                    ? 'Completamente firmado' 
                    : document.firmaPaciente 
                      ? 'Firmado por paciente' 
                      : document.firmaMedico 
                        ? 'Firmado por médico' 
                        : 'Pendiente de firmas'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Contenido del Documento</h3>
          
          <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4">
            <div dangerouslySetInnerHTML={{ __html: processContent() }} />
          </div>
        </div>
      </Card>
      
      <div className="flex justify-between mt-4">
        <div className="space-x-4">
          {!document.firmaPaciente && (
            <div className="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded">
              <span className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Pendiente firma del paciente
              </span>
            </div>
          )}
          
          {!document.firmaMedico && (
            <div className="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded">
              <span className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Pendiente firma del médico
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;