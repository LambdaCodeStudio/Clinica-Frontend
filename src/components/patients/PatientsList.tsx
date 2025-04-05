import React, { useState, useEffect } from 'react';
import { Search, Edit, Calendar, FileText, Eye, Trash2, Filter } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import apiService from '../../services/api';

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  genero: string;
  ultimaVisita?: string;
  proximaCita?: string;
  estado: 'activo' | 'inactivo';
}

export const PatientsList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [genderFilter, setGenderFilter] = useState('todos');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ pacientes: Patient[] }>('/api/pacientes');
      setPatients(response.pacientes);
      setFilteredPatients(response.pacientes);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar pacientes');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Aplicar filtros
    let result = patients;
    
    // Filtro por texto (nombre, apellido, dni o email)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(patient => 
        patient.nombre.toLowerCase().includes(search) || 
        patient.apellido.toLowerCase().includes(search) || 
        patient.dni.includes(search) || 
        patient.email.toLowerCase().includes(search)
      );
    }
    
    // Filtro por estado
    if (statusFilter !== 'todos') {
      result = result.filter(patient => patient.estado === statusFilter);
    }
    
    // Filtro por género
    if (genderFilter !== 'todos') {
      result = result.filter(patient => patient.genero === genderFilter);
    }
    
    setFilteredPatients(result);
  }, [searchTerm, statusFilter, genderFilter, patients]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleGenderChange = (value: string) => {
    setGenderFilter(value);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando pacientes..." />
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
              placeholder="Buscar por nombre, apellido, DNI o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'todos', label: 'Todos los estados' },
                { value: 'activo', label: 'Activos' },
                { value: 'inactivo', label: 'Inactivos' }
              ]}
              value={statusFilter}
              onChange={handleStatusChange}
              icon={<Filter className="h-5 w-5 text-gray-400" />}
              placeholder="Estado"
            />
          </div>
          
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'todos', label: 'Todos los géneros' },
                { value: 'masculino', label: 'Masculino' },
                { value: 'femenino', label: 'Femenino' },
                { value: 'otro', label: 'Otro' },
                { value: 'no_especificado', label: 'No especificado' }
              ]}
              value={genderFilter}
              onChange={handleGenderChange}
              icon={<Filter className="h-5 w-5 text-gray-400" />}
              placeholder="Género"
            />
          </div>
        </div>
      </div>

      {/* Resultados */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No se encontraron pacientes con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Card
              key={patient._id}
              className="hover:shadow-md transition-shadow"
              onClick={() => window.location.href = `/pacientes/${patient._id}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {patient.nombre} {patient.apellido}
                  </h3>
                  <p className="text-sm text-gray-600">DNI: {patient.dni}</p>
                  <p className="text-sm text-gray-600">Email: {patient.email}</p>
                  <p className="text-sm text-gray-600">Teléfono: {patient.telefono}</p>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span 
                      className={`text-xs px-2 py-1 rounded-full ${
                        patient.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {patient.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {patient.genero === 'masculino' ? 'Masculino' : 
                       patient.genero === 'femenino' ? 'Femenino' : 
                       patient.genero === 'otro' ? 'Otro' : 'No especificado'}
                    </span>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    {patient.ultimaVisita && (
                      <p>Última visita: {formatDate(patient.ultimaVisita)}</p>
                    )}
                    {patient.proximaCita && (
                      <p>Próxima cita: {formatDate(patient.proximaCita)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="primary" 
                    size="sm"
                    icon={<Eye className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/pacientes/${patient._id}`;
                    }}
                  >
                    Ver
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    icon={<Edit className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/pacientes/${patient._id}/editar`;
                    }}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="info" 
                    size="sm"
                    icon={<Calendar className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/citas/nueva?paciente=${patient._id}`;
                    }}
                  >
                    Cita
                  </Button>
                  <Button 
                    variant="light" 
                    size="sm"
                    icon={<FileText className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/pacientes/${patient._id}/historias`;
                    }}
                  >
                    Historia
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientsList;