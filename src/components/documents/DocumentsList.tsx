import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Eye, Edit, Filter, AlertCircle, CheckCircle, X } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import apiService from '../../services/api';

interface Document {
  _id: string;
  titulo: string;
  template: {
    _id: string;
    titulo: string;
    tipo: string;
  };
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
  firmaPaciente?: {
    imagen: string;
    nombre: string;
    fecha: string;
  };
  firmaMedico?: {
    imagen: string;
    nombre: string;
    fecha: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface DocumentsListProps {
  patientId?: string;
  doctorId?: string;
  templateType?: string;
  limit?: number;
  showAll?: boolean;
  onDocumentSelect?: (document: Document) => void;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({
  patientId,
  doctorId,
  templateType,
  limit = 0,
  showAll = false,
  onDocumentSelect
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(templateType || 'todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [patientId, doctorId, templateType]);

  useEffect(() => {
    applyFilters();
  }, [documents, searchTerm, typeFilter, statusFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/documentos';
      
      // Apply filters based on props
      if (patientId) {
        endpoint = `/api/documentos/paciente/${patientId}`;
      } else if (doctorId) {
        endpoint = `/api/documentos/medico/${doctorId}`;
      }
      
      // Add type filter if provided
      if (templateType) {
        endpoint += `?tipo=${templateType}`;
      }
      
      const response = await apiService.get<{ documentos: Document[] }>(endpoint);
      setDocuments(response.documentos);
      setFilteredDocuments(response.documentos);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar documentos');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.titulo.toLowerCase().includes(search) ||
        doc.template.titulo.toLowerCase().includes(search) ||
        doc.paciente.nombre.toLowerCase().includes(search) ||
        doc.paciente.apellido.toLowerCase().includes(search) ||
        doc.medico.nombre.toLowerCase().includes(search) ||
        doc.medico.apellido.toLowerCase().includes(search)
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'todos') {
      filtered = filtered.filter(doc => doc.template.tipo === typeFilter);
    }
    
    // Apply status filter
    if (statusFilter === 'firmado_completo') {
      filtered = filtered.filter(doc => doc.firmaPaciente && doc.firmaMedico);
    } else if (statusFilter === 'pendiente_firmas') {
      filtered = filtered.filter(doc => !doc.firmaPaciente || !doc.firmaMedico);
    } else if (statusFilter === 'pendiente_paciente') {
      filtered = filtered.filter(doc => !doc.firmaPaciente);
    } else if (statusFilter === 'pendiente_medico') {
      filtered = filtered.filter(doc => !doc.firmaMedico);
    }
    
    // Apply limit if necessary
    if (limit > 0 && !showAll) {
      filtered = filtered.slice(0, limit);
    }
    
    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    setFilteredDocuments(filtered);
  };

  const handleDocumentDelete = async () => {
    if (!selectedDocument) return;
    
    try {
      setLoading(true);
      
      await apiService.delete(`/api/documentos/${selectedDocument._id}`);
      
      // Update documents list
      setDocuments(prevDocuments => 
        prevDocuments.filter(doc => doc._id !== selectedDocument._id)
      );
      
      setIsDeleteModalOpen(false);
      setSelectedDocument(null);
      setLoading(false);
      
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el documento');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getDocumentTypeText = (type: string): string => {
    switch (type) {
      case 'consentimiento':
        return 'Consentimiento';
      case 'autorizacion':
        return 'Autorización';
      case 'informativo':
        return 'Informativo';
      case 'receta':
        return 'Receta';
      case 'certificado':
        return 'Certificado';
      case 'otro':
        return 'Otro';
      default:
        return type;
    }
  };

  const getDocumentStatusBadge = (document: Document) => {
    if (document.firmaPaciente && document.firmaMedico) {
      return (
        <span className="flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completamente firmado
        </span>
      );
    } else if (!document.firmaPaciente && !document.firmaMedico) {
      return (
        <span className="flex items-center text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Sin firmas
        </span>
      );
    } else if (!document.firmaPaciente) {
      return (
        <span className="flex items-center text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pendiente firma paciente
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pendiente firma médico
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando documentos..." />
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
              placeholder="Buscar por título, paciente o médico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          
          <div className="w-full sm:w-64">
            <Select
              options={[
                { value: 'todos', label: 'Todos los tipos' },
                { value: 'consentimiento', label: 'Consentimientos' },
                { value: 'autorizacion', label: 'Autorizaciones' },
                { value: 'informativo', label: 'Informativos' },
                { value: 'receta', label: 'Recetas' },
                { value: 'certificado', label: 'Certificados' },
                { value: 'otro', label: 'Otros' }
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              icon={<Filter className="h-5 w-5 text-gray-400" />}
              placeholder="Tipo de Documento"
            />
          </div>
          
          <div className="w-full sm:w-64">
            <Select
              options={[
                { value: 'todos', label: 'Todos los estados' },
                { value: 'firmado_completo', label: 'Completamente firmados' },
                { value: 'pendiente_firmas', label: 'Pendientes de firmas' },
                { value: 'pendiente_paciente', label: 'Pendiente firma paciente' },
                { value: 'pendiente_medico', label: 'Pendiente firma médico' }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              icon={<Filter className="h-5 w-5 text-gray-400" />}
              placeholder="Estado"
            />
          </div>
          
          {limit > 0 && !showAll && filteredDocuments.length >= limit && (
            <div className="ml-auto">
              <Button 
                variant="light"
                onClick={() => window.location.href = patientId 
                  ? `/pacientes/${patientId}/documentos` 
                  : '/documentos'
                }
              >
                Ver todos
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No se encontraron documentos con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <Card
              key={document._id}
              className="hover:shadow-md transition-shadow"
              onClick={() => onDocumentSelect ? onDocumentSelect(document) : window.location.href = `/documentos/${document._id}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold truncate">{document.titulo}</h3>
                  </div>
                  
                  <div className="mb-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {getDocumentTypeText(document.template.tipo)}
                    </span>
                    {getDocumentStatusBadge(document)}
                  </div>
                  
                  <div className="text-sm mb-1">
                    <span className="text-gray-500">Paciente:</span> {document.paciente.nombre} {document.paciente.apellido}
                  </div>
                  
                  <div className="text-sm mb-1">
                    <span className="text-gray-500">Médico:</span> Dr. {document.medico.nombre} {document.medico.apellido}
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-3">
                    Actualizado: {formatDate(document.updatedAt)}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <Button 
                    variant="light" 
                    size="sm"
                    icon={<Eye className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/documentos/${document._id}`;
                    }}
                  >
                    Ver
                  </Button>
                  
                  <Button 
                    variant="light" 
                    size="sm"
                    icon={<Edit className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/documentos/${document._id}/editar`;
                    }}
                  >
                    Editar
                  </Button>
                  
                  <Button 
                    variant="light" 
                    size="sm"
                    icon={<Download className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/api/documentos/${document._id}/pdf?download=true`;
                    }}
                  >
                    PDF
                  </Button>
                  
                  <Button 
                    variant="danger" 
                    size="sm"
                    icon={<X className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDocument(document);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Confirmation modal for document deletion */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
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
              onClick={handleDocumentDelete}
              isLoading={loading}
            >
              Eliminar Documento
            </Button>
          </>
        }
      >
        <Alert variant="warning" title="Advertencia">
          Está a punto de eliminar el documento <strong>{selectedDocument?.titulo}</strong>. 
          Esta acción es irreversible y eliminará permanentemente el documento del sistema.
          ¿Desea continuar?
        </Alert>
      </Modal>
    </div>
  );
};

export default DocumentsList;