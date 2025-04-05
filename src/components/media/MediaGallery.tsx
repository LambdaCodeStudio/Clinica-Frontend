import React, { useState, useEffect } from 'react';
import { Camera, Upload, Trash2, Search, Filter, Eye, ArrowLeft, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import apiService from '../../services/api';

interface MediaItem {
  _id: string;
  titulo: string;
  descripcion: string;
  tipo: 'foto_antes' | 'foto_despues' | 'documento' | 'otro';
  url: string;
  miniaturaUrl: string;
  fechaCreacion: string;
  tratamientoId?: string;
  tratamientoNombre?: string;
  tags: string[];
}

interface MediaGalleryProps {
  patientId?: string;
  treatmentId?: string;
  showUploadButton?: boolean;
  maxItems?: number;
  showAll?: boolean;
  onSelect?: (item: MediaItem) => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  patientId,
  treatmentId,
  showUploadButton = true,
  maxItems = 0,
  showAll = false,
  onSelect
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('todos');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [uploadData, setUploadData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'foto_antes',
    tratamientoId: treatmentId || '',
    tags: [] as string[],
    newTag: ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Lista de tratamientos para el select
  const [treatments, setTreatments] = useState<{_id: string, nombre: string}[]>([]);

  useEffect(() => {
    fetchMediaItems();
    if (showUploadButton) {
      fetchTreatments();
    }
  }, [patientId, treatmentId]);

  useEffect(() => {
    applyFilters();
  }, [mediaItems, searchTerm, typeFilter, dateFilter]);

  const fetchMediaItems = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/archivos';
      
      if (patientId) {
        endpoint = `/api/archivos/paciente/${patientId}`;
      } else if (treatmentId) {
        endpoint = `/api/archivos/tratamiento/${treatmentId}`;
      }
      
      const response = await apiService.get<{ archivos: MediaItem[] }>(endpoint);
      setMediaItems(response.archivos);
      setFilteredItems(response.archivos);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar archivos multimedia');
      setLoading(false);
    }
  };
  
  const fetchTreatments = async () => {
    try {
      const response = await apiService.get<{ tratamientos: {_id: string, nombre: string}[] }>('/api/tratamientos/listar');
      setTreatments(response.tratamientos);
    } catch (err: any) {
      console.error('Error al cargar tratamientos:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...mediaItems];
    
    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.titulo.toLowerCase().includes(term) || 
        item.descripcion.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // Filtro por tipo
    if (typeFilter !== 'todos') {
      filtered = filtered.filter(item => item.tipo === typeFilter);
    }
    
    // Filtro por fecha
    if (dateFilter !== 'todos') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.fechaCreacion);
        
        if (dateFilter === 'hoy') {
          return itemDate >= today;
        } else if (dateFilter === 'semana') {
          return itemDate >= lastWeek;
        } else if (dateFilter === 'mes') {
          return itemDate >= lastMonth;
        }
        return true;
      });
    }
    
    // Aplicar límite si es necesario
    if (maxItems > 0 && !showAll) {
      filtered = filtered.slice(0, maxItems);
    }
    
    setFilteredItems(filtered);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    // Crear vista previa
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUploadDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUploadData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = () => {
    if (!uploadData.newTag.trim()) return;
    
    setUploadData(prev => ({
      ...prev,
      tags: [...prev.tags, prev.newTag.trim()],
      newTag: ''
    }));
  };

  const handleRemoveTag = (index: number) => {
    setUploadData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleUpload = async () => {
    if (!file || !uploadData.titulo || !uploadData.tipo) {
      setError('Por favor complete todos los campos requeridos y seleccione un archivo');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simular progreso (en un caso real, esto vendría del API)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('file', file);
      formData.append('titulo', uploadData.titulo);
      formData.append('descripcion', uploadData.descripcion || '');
      formData.append('tipo', uploadData.tipo);
      if (patientId) {
        formData.append('pacienteId', patientId);
      }
      if (uploadData.tratamientoId) {
        formData.append('tratamientoId', uploadData.tratamientoId);
      }
      uploadData.tags.forEach(tag => {
        formData.append('tags[]', tag);
      });
      
      // Subir archivo
      const response = await apiService.post('/api/archivos/upload', formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Agregar el nuevo archivo a la lista
      setMediaItems(prev => [response.archivo, ...prev]);
      
      // Limpiar formulario
      setFile(null);
      setPreview(null);
      setUploadData({
        titulo: '',
        descripcion: '',
        tipo: 'foto_antes',
        tratamientoId: treatmentId || '',
        tags: [],
        newTag: ''
      });
      
      setIsUploading(false);
      setShowUploadModal(false);
      
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo');
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este archivo? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await apiService.delete(`/api/archivos/${id}`);
      
      // Actualizar la lista de archivos
      setMediaItems(prev => prev.filter(item => item._id !== id));
      
      if (selectedItem && selectedItem._id === id) {
        setSelectedItem(null);
        setShowPreviewModal(false);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el archivo');
    }
  };

  const openPreview = (item: MediaItem, index: number) => {
    setSelectedItem(item);
    setCurrentIndex(index);
    setShowPreviewModal(true);
    
    if (onSelect) {
      onSelect(item);
    }
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (filteredItems.length <= 1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? filteredItems.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === filteredItems.length - 1 ? 0 : currentIndex + 1;
    }
    
    setCurrentIndex(newIndex);
    setSelectedItem(filteredItems[newIndex]);
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

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando archivos multimedia..." />
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
      {/* Filtros y botón de carga */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por título, descripción o etiquetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'todos', label: 'Todos los tipos' },
                { value: 'foto_antes', label: 'Fotos antes' },
                { value: 'foto_despues', label: 'Fotos después' },
                { value: 'documento', label: 'Documentos' },
                { value: 'otro', label: 'Otros' }
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
              icon={<Filter className="h-5 w-5 text-gray-400" />}
              placeholder="Tipo"
            />
          </div>
          
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'todos', label: 'Todas las fechas' },
                { value: 'hoy', label: 'Hoy' },
                { value: 'semana', label: 'Última semana' },
                { value: 'mes', label: 'Último mes' }
              ]}
              value={dateFilter}
              onChange={(value) => setDateFilter(value)}
              icon={<Filter className="h-5 w-5 text-gray-400" />}
              placeholder="Fecha"
            />
          </div>
          
          {showUploadButton && (
            <Button
              variant="primary"
              icon={<Upload className="h-5 w-5" />}
              onClick={() => setShowUploadModal(true)}
            >
              Subir
            </Button>
          )}
        </div>
      </div>

      {/* Galería de imágenes */}
      {filteredItems.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No se encontraron archivos multimedia</p>
          {showUploadButton && (
            <Button
              variant="primary"
              icon={<Upload className="h-5 w-5" />}
              onClick={() => setShowUploadModal(true)}
              className="mt-4"
            >
              Subir archivo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item, index) => (
            <div 
              key={item._id}
              className="group relative overflow-hidden rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer h-48"
              onClick={() => openPreview(item, index)}
            >
              <img 
                src={item.miniaturaUrl} 
                alt={item.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="text-white text-sm font-medium truncate">
                  {item.titulo}
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                    {item.tipo === 'foto_antes' ? 'Antes' : 
                     item.tipo === 'foto_despues' ? 'Después' :
                     item.tipo === 'documento' ? 'Doc' : 'Otro'}
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item._id);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de carga de archivos */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Subir archivo multimedia"
        size="lg"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setShowUploadModal(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={!file || !uploadData.titulo}
            >
              Subir Archivo
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Título *"
              name="titulo"
              value={uploadData.titulo}
              onChange={handleUploadDataChange}
              placeholder="Título del archivo"
              required
            />
            
            <Select
              label="Tipo *"
              name="tipo"
              value={uploadData.tipo}
              onChange={handleUploadDataChange}
              options={[
                { value: 'foto_antes', label: 'Foto antes del tratamiento' },
                { value: 'foto_despues', label: 'Foto después del tratamiento' },
                { value: 'documento', label: 'Documento' },
                { value: 'otro', label: 'Otro' }
              ]}
              required
            />
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={uploadData.descripcion}
                onChange={handleUploadDataChange}
                placeholder="Descripción del archivo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            {treatments.length > 0 && (
              <Select
                label="Tratamiento relacionado"
                name="tratamientoId"
                value={uploadData.tratamientoId}
                onChange={handleUploadDataChange}
                options={[
                  { value: '', label: 'Sin tratamiento asociado' },
                  ...treatments.map(t => ({ value: t._id, label: t.nombre }))
                ]}
              />
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Etiquetas
            </label>
            <div className="flex space-x-2">
              <Input
                name="newTag"
                value={uploadData.newTag}
                onChange={handleUploadDataChange}
                placeholder="Agregar etiqueta"
                className="flex-1"
              />
              <Button 
                variant="light" 
                onClick={handleAddTag}
                disabled={!uploadData.newTag.trim()}
              >
                Agregar
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {uploadData.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(index)}
                    className="ml-1 text-blue-800 hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {uploadData.tags.length === 0 && (
                <span className="text-sm text-gray-500 italic">
                  Agregue etiquetas para facilitar la búsqueda
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo *
            </label>
            
            {preview ? (
              <div className="relative rounded-lg overflow-hidden mb-2">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="w-full max-h-64 object-contain bg-gray-100"
                />
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  aria-label="Eliminar archivo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Camera className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-500">Haga clic o arrastre un archivo aquí</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF hasta 10MB</p>
              </div>
            )}
            
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,application/pdf"
            />
          </div>
          
          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-1">{uploadProgress}%</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de vista previa */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={selectedItem?.titulo || 'Vista previa'}
        size="xl"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="relative bg-black flex justify-center items-center">
              <img
                src={selectedItem.url}
                alt={selectedItem.titulo}
                className="max-h-96 object-contain"
              />
              
              {filteredItems.length > 1 && (
                <>
                  <button
                    onClick={() => navigatePreview('prev')}
                    className="absolute left-2 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-70"
                    aria-label="Anterior"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  
                  <button
                    onClick={() => navigatePreview('next')}
                    className="absolute right-2 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-70"
                    aria-label="Siguiente"
                  >
                    <ArrowRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
            
            <div className="space-y-2 p-2">
              <h3 className="font-medium text-lg">{selectedItem.titulo}</h3>
              
              {selectedItem.descripcion && (
                <p className="text-gray-600">{selectedItem.descripcion}</p>
              )}
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs capitalize">
                    {selectedItem.tipo === 'foto_antes' ? 'Foto antes' : 
                     selectedItem.tipo === 'foto_despues' ? 'Foto después' :
                     selectedItem.tipo === 'documento' ? 'Documento' : 'Otro'}
                  </span>
                  
                  {selectedItem.tratamientoNombre && (
                    <span className="ml-2">
                      Tratamiento: {selectedItem.tratamientoNombre}
                    </span>
                  )}
                </div>
                
                <span>{formatDate(selectedItem.fechaCreacion)}</span>
              </div>
              
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Etiquetas:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedItem.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
              <Button
                variant="danger"
                icon={<Trash2 className="h-5 w-5" />}
                onClick={() => handleDeleteItem(selectedItem._id)}
              >
                Eliminar
              </Button>
              
              <Button
                variant="primary"
                icon={<Eye className="h-5 w-5" />}
                onClick={() => window.open(selectedItem.url, '_blank')}
              >
                Ver original
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MediaGallery;