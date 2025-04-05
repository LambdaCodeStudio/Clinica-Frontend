import React, { useState, useEffect, useRef } from 'react';
import { Tag, Plus, X, FileText, Eye, List } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import Tabs from '../ui/Tabs';
import apiService from '../../services/api';

interface DocumentTemplateField {
  nombre: string;
  tipo: 'texto' | 'fecha' | 'numero' | 'opcion' | 'checkbox';
  requerido: boolean;
  opciones?: string[];
}

interface DocumentTemplateFormData {
  titulo: string;
  tipo: string;
  contenido: string;
  campos: DocumentTemplateField[];
}

interface DocumentTemplateFormProps {
  templateId?: string;
  onSubmitSuccess?: () => void;
}

export const DocumentTemplateForm: React.FC<DocumentTemplateFormProps> = ({
  templateId,
  onSubmitSuccess
}) => {
  const [formData, setFormData] = useState<DocumentTemplateFormData>({
    titulo: '',
    tipo: 'consentimiento',
    contenido: '',
    campos: []
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [newField, setNewField] = useState<DocumentTemplateField>({
    nombre: '',
    tipo: 'texto',
    requerido: false,
    opciones: []
  });
  const [newOption, setNewOption] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  
  // Editor ref para insertar variables en el cursor
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
  const isEditing = !!templateId;

  // Default template content
  const defaultConsentContent = `
<h2>CONSENTIMIENTO INFORMADO</h2>

<p>En la ciudad de [lugar], a los [día] días del mes de [mes] del año [año], yo [nombre y apellido], con DNI [dni], doy mi consentimiento para someterme al siguiente procedimiento médico-estético:</p>

<h3>TRATAMIENTO: {{tratamiento}}</h3>

<p><strong>PROFESIONAL A CARGO:</strong> {{profesional}}</p>

<p>Por medio del presente documento declaro que he sido informado/a de manera clara y comprensible sobre:</p>

<ol>
  <li>La naturaleza y características del tratamiento</li>
  <li>Los beneficios razonablemente esperables</li>
  <li>Las alternativas de tratamiento</li>
  <li>Las consecuencias de no realizar el tratamiento</li>
  <li>Los riesgos, molestias y efectos secundarios posibles</li>
  <li>Los cuidados que debo seguir tras el procedimiento</li>
</ol>

<p>He tenido la oportunidad de realizar todas las preguntas que he considerado necesarias y he recibido respuestas satisfactorias a mis preguntas.</p>

<p>Comprendo que puedo retirar este consentimiento en cualquier momento antes de la realización del procedimiento sin necesidad de dar explicaciones.</p>

<p><strong>OBSERVACIONES ADICIONALES:</strong> {{observaciones}}</p>

<p>Firmo este documento de forma voluntaria y sin haber estado sujeto/a a ningún tipo de presión para hacerlo.</p>

<div style="margin-top: 40px; display: flex; justify-content: space-between;">
  <div style="width: 45%;">
    <p>______________________________<br>
    Firma del/la paciente</p>
  </div>
  <div style="width: 45%;">
    <p>______________________________<br>
    Firma y sello del profesional</p>
  </div>
</div>
  `;

  useEffect(() => {
    if (isEditing) {
      fetchTemplateData();
    } else {
      // Set default content for new templates
      setFormData(prev => ({
        ...prev,
        contenido: defaultConsentContent,
        campos: [
          {
            nombre: 'tratamiento',
            tipo: 'texto',
            requerido: true
          },
          {
            nombre: 'profesional',
            tipo: 'texto',
            requerido: true
          },
          {
            nombre: 'observaciones',
            tipo: 'texto',
            requerido: false
          }
        ]
      }));
    }
  }, [templateId]);

  const fetchTemplateData = async () => {
    try {
      setInitialLoading(true);
      const response = await apiService.get<{ template: any }>(`/api/documentos/templates/${templateId}`);
      const templateData = response.template;
      
      setFormData({
        titulo: templateData.titulo || '',
        tipo: templateData.tipo || 'consentimiento',
        contenido: templateData.contenido || '',
        campos: templateData.campos || []
      });
      
      setInitialLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de la plantilla');
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setNewField(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setNewField(prev => ({
        ...prev,
        [name]: value,
        // Reset options if type changes to something that doesn't use options
        ...(name === 'tipo' && value !== 'opcion' ? { opciones: [] } : {})
      }));
    }
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    
    setNewField(prev => ({
      ...prev,
      opciones: [...(prev.opciones || []), newOption.trim()]
    }));
    
    setNewOption('');
  };

  const removeOption = (index: number) => {
    setNewField(prev => ({
      ...prev,
      opciones: (prev.opciones || []).filter((_, i) => i !== index)
    }));
  };

  const addField = () => {
    if (!newField.nombre) return;
    
    // Add field to form data
    setFormData(prev => ({
      ...prev,
      campos: [...prev.campos, { ...newField }]
    }));
    
    // Reset the new field form
    setNewField({
      nombre: '',
      tipo: 'texto',
      requerido: false,
      opciones: []
    });
    
    setIsFieldModalOpen(false);
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      campos: prev.campos.filter((_, i) => i !== index)
    }));
  };

  const insertFieldAsVariable = (fieldName: string) => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const content = editor.value;
    
    const variable = `{{${fieldName}}}`;
    const newContent = content.substring(0, start) + variable + content.substring(end);
    
    setFormData(prev => ({
      ...prev,
      contenido: newContent
    }));
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      editor.focus();
      editor.selectionStart = start + variable.length;
      editor.selectionEnd = start + variable.length;
    }, 0);
  };

  const generatePreview = () => {
    let preview = formData.contenido;
    
    // Replace variables with placeholders
    formData.campos.forEach(campo => {
      const regex = new RegExp(`{{${campo.nombre}}}`, 'g');
      let replacement = '';
      
      switch (campo.tipo) {
        case 'texto':
          replacement = `<span class="bg-blue-100 text-blue-800 px-1 rounded">[${campo.nombre}]</span>`;
          break;
        case 'fecha':
          replacement = `<span class="bg-green-100 text-green-800 px-1 rounded">[${campo.nombre}: 01/01/2025]</span>`;
          break;
        case 'numero':
          replacement = `<span class="bg-amber-100 text-amber-800 px-1 rounded">[${campo.nombre}: 123]</span>`;
          break;
        case 'opcion':
          const option = campo.opciones && campo.opciones.length > 0 ? campo.opciones[0] : 'Opción';
          replacement = `<span class="bg-purple-100 text-purple-800 px-1 rounded">[${campo.nombre}: ${option}]</span>`;
          break;
        case 'checkbox':
          replacement = `<span class="bg-gray-100 text-gray-800 px-1 rounded">[${campo.nombre}: ✓]</span>`;
          break;
      }
      
      preview = preview.replace(regex, replacement);
    });
    
    setPreviewContent(preview);
    setIsPreviewModalOpen(true);
  };

  const validateForm = (): boolean => {
    if (!formData.titulo) {
      setError('El título es requerido');
      return false;
    }
    
    if (!formData.tipo) {
      setError('El tipo de documento es requerido');
      return false;
    }
    
    if (!formData.contenido) {
      setError('El contenido de la plantilla es requerido');
      return false;
    }
    
    // Verify that all variables in content have a corresponding field
    const contentVariables = extractVariablesFromContent(formData.contenido);
    const fieldNames = formData.campos.map(campo => campo.nombre);
    
    const missingFields = contentVariables.filter(variable => !fieldNames.includes(variable));
    
    if (missingFields.length > 0) {
      setError(`Las siguientes variables no tienen un campo definido: ${missingFields.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const extractVariablesFromContent = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.slice(2, -2));
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
      
      if (isEditing) {
        await apiService.put(`/api/documentos/templates/${templateId}`, formData);
        setSuccess('Plantilla actualizada con éxito');
      } else {
        await apiService.post('/api/documentos/templates', formData);
        setSuccess('Plantilla creada con éxito');
        
        // Reset form for a new template
        if (!isEditing) {
          setFormData({
            titulo: '',
            tipo: 'consentimiento',
            contenido: defaultConsentContent,
            campos: [
              {
                nombre: 'tratamiento',
                tipo: 'texto',
                requerido: true
              },
              {
                nombre: 'profesional',
                tipo: 'texto',
                requerido: true
              },
              {
                nombre: 'observaciones',
                tipo: 'texto',
                requerido: false
              }
            ]
          });
        }
      }
      
      setLoading(false);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar la plantilla');
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando datos de la plantilla..." />
      </div>
    );
  }

  const tabs = [
    {
      id: 'general',
      label: 'Información General',
      content: (
        <Card title="Información Básica de la Plantilla">
          <div className="space-y-4">
            <Input
              label="Título *"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="Ej: Consentimiento para tratamiento facial"
              required
            />
            
            <Select
              label="Tipo de Documento *"
              name="tipo"
              value={formData.tipo}
              onChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
              options={[
                { value: 'consentimiento', label: 'Consentimiento Informado' },
                { value: 'autorizacion', label: 'Autorización' },
                { value: 'informativo', label: 'Informativo' },
                { value: 'receta', label: 'Receta Médica' },
                { value: 'certificado', label: 'Certificado' },
                { value: 'otro', label: 'Otro' }
              ]}
              icon={<FileText className="h-5 w-5 text-gray-400" />}
              required
            />
          </div>
        </Card>
      )
    },
    {
      id: 'content',
      label: 'Contenido',
      content: (
        <div className="space-y-4">
          <Card title="Variables de la Plantilla">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  icon={<Plus className="h-5 w-5" />}
                  onClick={() => setIsFieldModalOpen(true)}
                >
                  Agregar Variable
                </Button>
              </div>
              
              {formData.campos.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No hay variables definidas para esta plantilla
                </div>
              ) : (
                <div className="mt-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requerido
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Insertar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.campos.map((campo, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {campo.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {campo.tipo}
                            {campo.tipo === 'opcion' && campo.opciones && campo.opciones.length > 0 && (
                              <span className="block text-xs text-gray-500">
                                Opciones: {campo.opciones.join(', ')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campo.requerido ? 'Sí' : 'No'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => insertFieldAsVariable(campo.nombre)}
                            >
                              Insertar
                            </Button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => removeField(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <p><strong>Nota:</strong> Use variables en el contenido del documento insertándolas como <code>&#123;&#123;nombre_variable&#125;&#125;</code></p>
                <p>Estas variables serán reemplazadas por los valores correspondientes al generar el documento.</p>
              </div>
            </div>
          </Card>
          
          <Card title="Editor de Contenido">
            <div className="space-y-4">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="light"
                  icon={<Eye className="h-5 w-5" />}
                  onClick={generatePreview}
                >
                  Vista Previa
                </Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido HTML *
                </label>
                <textarea
                  ref={editorRef}
                  name="contenido"
                  value={formData.contenido}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 font-mono text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={20}
                  required
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>El editor admite HTML para dar formato al documento.</p>
                <p>Para incluir una variable use la sintaxis: <code>&#123;&#123;nombre_variable&#125;&#125;</code></p>
              </div>
            </div>
          </Card>
        </div>
      )
    }
  ];

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
      
      <form onSubmit={handleSubmit}>
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />
        
        <div className="mt-8 flex justify-end space-x-4">
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
          >
            {isEditing ? 'Actualizar Plantilla' : 'Crear Plantilla'}
          </Button>
        </div>
      </form>
      
      {/* Modal para agregar variable */}
      <Modal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        title="Agregar Variable"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setIsFieldModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={addField}
              disabled={!newField.nombre}
            >
              Agregar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la Variable *"
            name="nombre"
            value={newField.nombre}
            onChange={handleNewFieldChange}
            placeholder="Ej: nombre_paciente"
            helperText="Este será el nombre usado en el contenido como {{nombre_variable}}"
            required
          />
          
          <Select
            label="Tipo de Variable *"
            name="tipo"
            value={newField.tipo}
            onChange={(value) => handleNewFieldChange({ target: { name: 'tipo', value } } as any)}
            options={[
              { value: 'texto', label: 'Texto' },
              { value: 'fecha', label: 'Fecha' },
              { value: 'numero', label: 'Número' },
              { value: 'opcion', label: 'Selección de opciones' },
              { value: 'checkbox', label: 'Casilla de verificación' }
            ]}
            icon={<Tag className="h-5 w-5 text-gray-400" />}
            required
          />
          
          <div className="flex items-center space-x-2">
            <input
              id="requerido"
              name="requerido"
              type="checkbox"
              checked={newField.requerido}
              onChange={handleNewFieldChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requerido" className="text-sm text-gray-700">
              Campo requerido
            </label>
          </div>
          
          {newField.tipo === 'opcion' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opciones
              </label>
              
              <div className="flex space-x-2 mb-2">
                <Input
                  placeholder="Nueva opción"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="light" 
                  onClick={addOption}
                  disabled={!newOption.trim()}
                >
                  Agregar
                </Button>
              </div>
              
              {newField.opciones && newField.opciones.length > 0 ? (
                <ul className="space-y-1 mt-2">
                  {newField.opciones.map((opcion, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span>{opcion}</span>
                      <button 
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No hay opciones definidas</p>
              )}
            </div>
          )}
        </div>
      </Modal>
      
      {/* Modal de vista previa */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Vista Previa del Documento"
        size="lg"
      >
        <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-white">
          <div dangerouslySetInnerHTML={{ __html: previewContent }} />
        </div>
      </Modal>
    </div>
  );
};

export default DocumentTemplateForm;