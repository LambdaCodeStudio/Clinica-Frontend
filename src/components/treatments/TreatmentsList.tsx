import React, { useState, useEffect } from 'react';
import { Search, Clock, Tag, DollarSign, Edit, Trash2, Filter, Check, X } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import apiService from '../../services/api';

interface Treatment {
  _id: string;
  nombre: string;
  descripcion: string;
  categoria: 'estetica_general' | 'medicina_estetica';
  subcategoria: string;
  precio: number;
  duracionEstimada: number;
  requiereConsulta: boolean;
  requiereConsentimiento: boolean;
  profesionalesHabilitados: Array<{
    _id: string;
    nombre: string;
    apellido: string;
  }>;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TreatmentsListProps {
  categoryFilter?: string;
  limit?: number;
  showAll?: boolean;
  onTreatmentSelect?: (treatment: Treatment) => void;
  isAdmin?: boolean;
}

export const TreatmentsList: React.FC<TreatmentsListProps> = ({
  categoryFilter,
  limit = 0,
  showAll = false,
  onTreatmentSelect,
  isAdmin = false
}) => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [filteredTreatments, setFilteredTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'todas');
  const [selectedStatus, setSelectedStatus] = useState('activos');
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmDeleteLoading, setIsConfirmDeleteLoading] = useState(false);

  useEffect(() => {
    fetchTreatments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [treatments, searchTerm, selectedCategory, selectedStatus]);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ tratamientos: Treatment[] }>('/api/tratamientos');
      setTreatments(response.tratamientos);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tratamientos');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...treatments];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(treatment => 
        treatment.nombre.toLowerCase().includes(search) ||
        treatment.descripcion.toLowerCase().includes(search) ||
        treatment.subcategoria.toLowerCase().includes(search)
      );
    }
    
    // Aplicar filtro de categoría
    if (selectedCategory !== 'todas') {
      filtered = filtered.filter(treatment => treatment.categoria === selectedCategory);
    }
    
    // Aplicar filtro de estado
    if (selectedStatus === 'activos') {
      filtered = filtered.filter(treatment => treatment.activo);
    } else if (selectedStatus === 'inactivos') {
      filtered = filtered.filter(treatment => !treatment.activo);
    }
    
    // Aplicar límite si es necesario
    if (limit > 0 && !showAll) {
      filtered = filtered.slice(0, limit);
    }
    
    setFilteredTreatments(filtered);
  };

  const handleDeleteTreatment = async () => {
    if (!selectedTreatment) return;
    
    try {
      setIsConfirmDeleteLoading(true);
      
      await apiService.delete(`/api/tratamientos/${selectedTreatment._id}`);
      
      // Actualizar la lista de tratamientos
      setTreatments(prevTreatments => 
        prevTreatments.map(treatment => 
          treatment._id === selectedTreatment._id
            ? { ...treatment, activo: false }
            : treatment
        )
      );
      
      setIsDeleteModalOpen(false);
      setIsConfirmDeleteLoading(false);
      setSelectedTreatment(null);
      
    } catch (err: any) {
      setError(err.message || 'Error al desactivar el tratamiento');
      setIsConfirmDeleteLoading(false);
    }
  };

  const handleReactivateTreatment = async (treatmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await apiService.put(`/api/tratamientos/${treatmentId}/activar`);
      
      // Actualizar la lista de tratamientos
      setTreatments(prevTreatments => 
        prevTreatments.map(treatment => 
          treatment._id === treatmentId
            ? { ...treatment, activo: true }
            : treatment
        )
      );
      
    } catch (err: any) {
      setError(err.message || 'Error al reactivar el tratamiento');
    }
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS'
    });
  };

  const getCategoryText = (category: string): string => {
    switch (category) {
      case 'estetica_general':
        return 'Estética General';
      case 'medicina_estetica':
        return 'Medicina Estética';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando tratamientos..." />
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
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          
          <div className="w-full sm:w-64">
            <Select
              options={[
                { value: 'todas', label: 'Todas las categorías' },
                { value: 'estetica_general', label: 'Estética General' },
                { value: 'medicina_estetica', label: 'Medicina Estética' }
              ]}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value)}
              icon={<Tag className="h-5 w-5 text-gray-400" />}
              placeholder="Categoría"
            />
          </div>
          
          {isAdmin && (
            <div className="w-full sm:w-64">
              <Select
                options={[
                  { value: 'todos', label: 'Todos los estados' },
                  { value: 'activos', label: 'Activos' },
                  { value: 'inactivos', label: 'Inactivos' }
                ]}
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value)}
                icon={<Filter className="h-5 w-5 text-gray-400" />}
                placeholder="Estado"
              />
            </div>
          )}
          
          {limit > 0 && !showAll && filteredTreatments.length >= limit && (
            <div className="ml-auto">
              <Button 
                variant="light"
                onClick={() => window.location.href = '/tratamientos'}
              >
                Ver todos
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      {filteredTreatments.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No se encontraron tratamientos con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTreatments.map((treatment) => (
            <Card
              key={treatment._id}
              className={`hover:shadow-md transition-shadow ${!treatment.activo ? 'opacity-70' : ''}`}
              onClick={() => onTreatmentSelect ? onTreatmentSelect(treatment) : window.location.href = `/tratamientos/${treatment._id}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold">{treatment.nombre}</h3>
                    {!treatment.activo && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Tag className="h-4 w-4 mr-1" />
                    <span>{getCategoryText(treatment.categoria)}</span>
                    {treatment.subcategoria && (
                      <span className="ml-1">- {treatment.subcategoria}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{treatment.duracionEstimada} minutos</span>
                  </div>
                  
                  <div className="flex items-center text-sm font-medium text-gray-900 mb-3">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>{formatPrice(treatment.precio)}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {treatment.descripcion}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {treatment.requiereConsulta && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        Requiere consulta previa
                      </span>
                    )}
                    
                    {treatment.requiereConsentimiento && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                        Requiere consentimiento
                      </span>
                    )}
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button 
                      variant="light" 
                      size="sm"
                      icon={<Edit className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/tratamientos/${treatment._id}/editar`;
                      }}
                    >
                      Editar
                    </Button>
                    
                    {treatment.activo ? (
                      <Button 
                        variant="danger" 
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTreatment(treatment);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        Desactivar
                      </Button>
                    ) : (
                      <Button 
                        variant="success" 
                        size="sm"
                        icon={<Check className="h-4 w-4" />}
                        onClick={(e) => handleReactivateTreatment(treatment._id, e)}
                      >
                        Reactivar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de confirmación para eliminar tratamiento */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Desactivación"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isConfirmDeleteLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteTreatment}
              isLoading={isConfirmDeleteLoading}
            >
              Desactivar Tratamiento
            </Button>
          </>
        }
      >
        <Alert variant="warning" title="Advertencia">
          Está a punto de desactivar el tratamiento <strong>{selectedTreatment?.nombre}</strong>. 
          Este tratamiento ya no estará disponible para nuevas citas, pero se mantendrá 
          en registros históricos. ¿Desea continuar?
        </Alert>
      </Modal>
    </div>
  );
};

export default TreatmentsList;