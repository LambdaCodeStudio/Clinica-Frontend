import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Calendar, MapPin, AlertTriangle, Heart, FileText, Camera, CreditCard } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';
import Alert from '../ui/Alert';
import Loading from '../ui/Loading';
import { AppointmentsList } from '../appointments/AppointmentsList';
import { MedicalHistoryList } from '../medicalrecords/MedicalHistoryList';
import { DocumentsList } from '../documents/DocumentsList';
import { PaymentsList } from '../payments/PaymentsList';
import { MediaGallery } from '../media/MediaGallery';
import apiService from '../../services/api';

interface PatientDetailProps {
  patientId: string;
}

interface PatientData {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  fechaNacimiento: string;
  genero: string;
  direccion: {
    calle: string;
    numero: string;
    piso?: string;
    depto?: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
  };
  grupoSanguineo: string;
  alergias: string[];
  condicionesMedicas: string[];
  medicacionActual: string[];
  contactoEmergencia: {
    nombre: string;
    relacion: string;
    telefono: string;
  };
  preferencias: {
    recibirRecordatoriosEmail: boolean;
    recibirRecordatoriosSMS: boolean;
    permitirFotos: boolean;
  };
  estado: 'activo' | 'inactivo';
  ultimaVisita?: string;
  proximaCita?: string;
  totalCitas?: number;
  createdAt: string;
  updatedAt: string;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ patientId }) => {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ paciente: PatientData }>(`/api/pacientes/${patientId}`);
      setPatient(response.paciente);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del paciente');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando datos del paciente..." />
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

  if (!patient) {
    return (
      <Alert variant="warning" title="Paciente no encontrado">
        No se pudo encontrar la información del paciente.
      </Alert>
    );
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatAddress = (direccion: PatientData['direccion']): string => {
    let address = `${direccion.calle} ${direccion.numero}`;
    if (direccion.piso) address += `, Piso ${direccion.piso}`;
    if (direccion.depto) address += `, Depto ${direccion.depto}`;
    address += `, ${direccion.ciudad}, ${direccion.provincia}, ${direccion.pais} (${direccion.codigoPostal})`;
    return address;
  };

  const getGenderText = (genero: string): string => {
    switch (genero) {
      case 'masculino': return 'Masculino';
      case 'femenino': return 'Femenino';
      case 'otro': return 'Otro';
      default: return 'No especificado';
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Resumen',
      icon: <User className="w-4 h-4" />,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Personal */}
          <Card title="Información Personal" className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex flex-wrap -mx-2">
                <div className="px-2 w-full sm:w-1/2 mb-4">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Nombre Completo</div>
                      <div className="font-medium">{patient.nombre} {patient.apellido}</div>
                    </div>
                  </div>
                </div>
                
                <div className="px-2 w-full sm:w-1/2 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Fecha de Nacimiento</div>
                      <div className="font-medium">
                        {patient.fechaNacimiento ? formatDate(patient.fechaNacimiento) : 'No registrada'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-2 w-full sm:w-1/2 mb-4">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{patient.email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="px-2 w-full sm:w-1/2 mb-4">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Teléfono</div>
                      <div className="font-medium">{patient.telefono}</div>
                    </div>
                  </div>
                </div>
                
                <div className="px-2 w-full sm:w-1/2 mb-4">
                  <div className="flex items-center">
                    <div className="w-5 h-5 text-gray-400 mr-2 flex items-center justify-center">DNI</div>
                    <div>
                      <div className="text-sm text-gray-500">Documento</div>
                      <div className="font-medium">{patient.dni}</div>
                    </div>
                  </div>
                </div>
                
                <div className="px-2 w-full sm:w-1/2 mb-4">
                  <div className="flex items-center">
                    <div className="w-5 h-5 text-gray-400 mr-2 flex items-center justify-center">G</div>
                    <div>
                      <div className="text-sm text-gray-500">Género</div>
                      <div className="font-medium">{getGenderText(patient.genero)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Dirección</div>
                    <div className="font-medium">
                      {patient.direccion.calle ? formatAddress(patient.direccion) : 'No registrada'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Estadísticas del Paciente */}
          <Card title="Estadísticas" className="lg:col-span-1">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="text-sm text-gray-500">Estado del Paciente</div>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    patient.estado === 'activo' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="font-medium">
                    {patient.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Última visita</div>
                <div className="font-medium">
                  {patient.ultimaVisita ? formatDate(patient.ultimaVisita) : 'Sin visitas'}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Próxima cita</div>
                <div className="font-medium">
                  {patient.proximaCita ? formatDate(patient.proximaCita) : 'Sin citas programadas'}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Total de citas</div>
                <div className="font-medium">
                  {patient.totalCitas || 0}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Fecha de registro</div>
                <div className="font-medium">
                  {formatDate(patient.createdAt)}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Información Médica */}
          <Card title="Información Médica" className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-start">
                <Heart className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Grupo Sanguíneo</div>
                  <div className="font-medium">
                    {patient.grupoSanguineo || 'No registrado'}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-2">Alergias</div>
                    {patient.alergias.length === 0 ? (
                      <div className="italic text-gray-500">No se han registrado alergias</div>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        {patient.alergias.map((alergia, index) => (
                          <li key={index} className="text-sm">{alergia}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-2">Condiciones Médicas</div>
                    {patient.condicionesMedicas.length === 0 ? (
                      <div className="italic text-gray-500">No se han registrado condiciones médicas</div>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        {patient.condicionesMedicas.map((condicion, index) => (
                          <li key={index} className="text-sm">{condicion}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-2">Medicación Actual</div>
                    {patient.medicacionActual.length === 0 ? (
                      <div className="italic text-gray-500">No se ha registrado medicación actual</div>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        {patient.medicacionActual.map((medicacion, index) => (
                          <li key={index} className="text-sm">{medicacion}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Contacto de Emergencia */}
          <Card title="Contacto de Emergencia" className="lg:col-span-1">
            {patient.contactoEmergencia && patient.contactoEmergencia.nombre ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Nombre</div>
                    <div className="font-medium">{patient.contactoEmergencia.nombre}</div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center">
                    <div className="w-5 h-5 text-gray-400 mr-2 flex items-center justify-center">R</div>
                    <div>
                      <div className="text-sm text-gray-500">Relación</div>
                      <div className="font-medium">{patient.contactoEmergencia.relacion}</div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Teléfono</div>
                      <div className="font-medium">{patient.contactoEmergencia.telefono}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="italic text-gray-500">No se ha registrado contacto de emergencia</div>
            )}
          </Card>
          
          {/* Preferencias */}
          <Card title="Preferencias" className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={patient.preferencias?.recibirRecordatoriosEmail}
                  readOnly
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Recibir recordatorios por email
                </span>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={patient.preferencias?.recibirRecordatoriosSMS}
                  readOnly
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Recibir recordatorios por SMS
                </span>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={patient.preferencias?.permitirFotos}
                  readOnly
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Permite el uso de fotografías con fines médicos
                </span>
              </div>
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 'appointments',
      label: 'Citas',
      icon: <Calendar className="w-4 h-4" />,
      content: (
        <AppointmentsList patientId={patientId} />
      )
    },
    {
      id: 'medical-history',
      label: 'Historia Clínica',
      icon: <FileText className="w-4 h-4" />,
      content: (
        <MedicalHistoryList patientId={patientId} />
      )
    },
    {
      id: 'documents',
      label: 'Documentos',
      icon: <FileText className="w-4 h-4" />,
      content: (
        <DocumentsList patientId={patientId} />
      )
    },
    {
      id: 'payments',
      label: 'Pagos',
      icon: <CreditCard className="w-4 h-4" />,
      content: (
        <PaymentsList patientId={patientId} />
      )
    },
    {
      id: 'media',
      label: 'Imágenes',
      icon: <Camera className="w-4 h-4" />,
      content: (
        <MediaGallery patientId={patientId} />
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Tabs 
        tabs={tabs} 
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />
    </div>
  );
};

export default PatientDetail;