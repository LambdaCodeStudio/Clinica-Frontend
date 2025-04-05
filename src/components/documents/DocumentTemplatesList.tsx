import React, { useState, useEffect } from 'react';
import { Search, FileText, Edit, Trash2, Copy, Filter, Eye } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import apiService from '../../services/api';

interface DocumentTemplate {
  _id: string;
  titulo: string;
  tipo: string;
  contenido: string;
  campos: Array<{
    nombre: string;
    tipo: string;
    requerido: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface DocumentTemplatesListProps {
  typeFilter?: string;
  limit?: number;
  showAll?: boolean;
  onTemplateSelect?: (template: DocumentTemplate) => void;
}

export const DocumentTemplatesList: React.FC<DocumentTemplatesListProps> = ({
  typeFilter,
  limit = 0,
  showAll = false,
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(typeFilter || 'todos');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [templates, searchTerm, selectedType]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ templates: DocumentTemplate[] }>('/api/documentos/templates');
      setTemplates(response.templates);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar plantillas de documentos');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...templates];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(template => 
        template.titulo.toLowerCase().includes(search)
      );
    }
    
    // Aplicar filtro de tipo
    if (selectedType !== 'todos') {
      filtered = filtered.filter(template => template.tipo === selectedType);
    }
    
    // Aplicar límite si es necesario
    if (limit > 0 && !showAll) {
      filtered = filtered.slice(0, limit);
    }
    
    setFilteredTemplates(filtered);
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      setIsActionLoading(true);
      
      await apiService.delete(`/api/documentos/templates/${selectedTemplate._id}`);
      
      // Actualizar la lista de plantillas
      setTemplates(prevTemplates => 
        prevTemplates.filter(template => template._id !== selectedTemplate._id)
      );
      
      setIsDeleteModalOpen(false);
      setIsActionLoading(false);
      setSelectedTemplate(null);
      
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la plantilla de documento');
      setIsActionLoading(false);
    }
  };

  const handleDuplicateTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setIsActionLoading(true);
      
      // Obtener la plantilla completa
      const response = await apiService.get<{ template: DocumentTemplate }>(`/api/documentos/templates/${templateId}`);
      const template = response.template;
      
      // Crear una copia de la plantilla
      const duplicateData = {
        titulo: `${template.titulo} (Copia)`,
        tipo: template.tipo,
        contenido: template.contenido,
        campos: template.campos
      };
      
      const newTemplate = await apiService.post<{ template: DocumentTemplate }>('/api/documentos/templates', duplicateData);
      
      // Agregar la nueva plantilla a la lista
      setTemplates(prevTemplates => [...prevTemplates, newTemplate.template]);
      
      setIsActionLoading(false);
      
    } catch (err: any) {
      setError(err.message || 'Error al duplicar la plantilla de documento');
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    
    return date.toLocaleDateString('es-ES', options);
  };

  const getDocumentTypeText = (type: string): string => {
    switch (type) {
      case 'consentimiento':
        return 'Consentimiento Informado';
      case 'autorizacion':
        return 'Autorización';
      case 'informativo':
        return 'Informativo';
      case 'receta':
        return 'Receta Médica';
      case 'certificado':
        return 'Certificado';
      case 'otro':
        return 'Otro';
      default:
        return type;
    }
  };

  const countVariables = (content: string): number => {
    const matches = content.match(/\{\{[^}]+\}\}/g);
    return matches ? matches.length : 0;
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando plantillas de documentos..." />
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
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          
          <div className="w-full sm:w-64">
            <Select
              options={[
                { value: 'todos', label: 'Todos los tipos' },
                { value: 'consentimiento', label: 'Consentimiento Informado' },
                { value: 'autorizacion', label: 'Autorización' },
                { value: 'informativo', label: 'Informativo' },
                { value: 'receta', label: 'Receta Médica' },
                { value: 'certificado', label: 'Certificado' },
                { value: 'otro', label: 'Otro' }
              ]}
              value={selectedType}
              onChange={(value) => setSelectedType(value)}
              icon={<Filter className="h-5 w-5 text-gray-400" />}
              placeholder="Tipo de Documento"
            />
          </div>
          
          {limit > 0 && !showAll && filteredTemplates.length >= limit && (
            <div className="ml-auto">
              <Button 
                variant="light"
                onClick={() => window.location.href = '/documentos/templates'}
              >
                Ver todas
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No se encontraron plantillas de documentos con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template._id}
              className="hover:shadow-md transition-shadow"
              onClick={() => onTemplateSelect ? onTemplateSelect(template) : window.location.href = `/documentos/templates/${template._id}`}
            >
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold">{template.titulo}</h3>
                  </div>
                  
                  <div className="mb-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {getDocumentTypeText(template.tipo)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    Creado: {formatDate(template.createdAt)}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Variables: {countVariables(template.contenido)}
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between">
                  <div className="flex space-x-2">
                    <Button
                      variant="light"
                      size="sm"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                        setIsPreviewModalOpen(true);
                      }}
                    >
                      Vista previa
                    </Button>
                    
                    <Button
                      variant="light"
                      size="sm"
                      icon={<Copy className="h-4 w-4" />}
                      onClick={(e) => handleDuplicateTemplate(template._id, e)}
                      disabled={isActionLoading}
                    >
                      Duplicar
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="light"
                      size="sm"
                      icon={<Edit className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/documentos/templates/${template._id}/editar`;
                      }}
                    >
                      Editar
                    </Button>
                    
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de confirmación para eliminar plantilla */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isActionLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteTemplate}
              isLoading={isActionLoading}
            >
              Eliminar Plantilla
            </Button>
          </>
        }
      >
        <Alert variant="warning" title="Advertencia">
          Está a punto de eliminar la plantilla <strong>{selectedTemplate?.titulo}</strong>. 
          Esta acción es irreversible y eliminará permanentemente la plantilla del sistema.
          ¿Desea continuar?
        </Alert>
        
        <p className="mt-4 text-sm text-gray-600">
          Nota: Si esta plantilla está siendo utilizada por algún tratamiento, su eliminación 
          podría causar problemas. Asegúrese de que no está asociada a ningún tratamiento antes de continuar.
        </p>
      </Modal>
      
      {/* Modal de vista previa */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={selectedTemplate?.titulo || 'Vista Previa'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Tipo: {selectedTemplate ? getDocumentTypeText(selectedTemplate.tipo) : ''}
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50 prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: selectedTemplate?.contenido || '' }} />
          </div>
          
          {selectedTemplate?.campos && selectedTemplate.campos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Variables del documento:
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                {selectedTemplate.campos.map((campo, index) => (
                  <li key={index}>
                    <span className="font-medium">{campo.nombre}</span>
                    <span className="text-gray-600"> ({campo.tipo})</span>
                    {campo.requerido && <span className="text-red-500"> *</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DocumentTemplatesList;