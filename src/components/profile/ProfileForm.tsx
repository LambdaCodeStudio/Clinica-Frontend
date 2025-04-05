import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Camera, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Tabs from '../ui/Tabs';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api';

interface UserProfile {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  especialidad?: string;
  biografia?: string;
  fotoPerfil?: string;
  roles: string[];
  ultimoAcceso?: string;
}

interface ProfileFormProps {
  userId?: string;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ userId }) => {
  const { user, updateProfile } = useAuth();
  
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    // Si tenemos un ID de usuario específico o el usuario autenticado
    if (userId || user?.userId) {
      fetchUserProfile(userId || user?.userId);
    }
  }, [userId, user]);

  const fetchUserProfile = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiService.get<{ usuario: UserProfile }>(`/api/usuarios/${id}/perfil`);
      setProfileData(response.usuario);
      
      // Si el usuario tiene foto de perfil, establecer la vista previa
      if (response.usuario.fotoPerfil) {
        setPhotoPreview(response.usuario.fotoPerfil);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del perfil');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (profileData) {
      setProfileData({
        ...profileData,
        [name]: value
      });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setChangePassword({
      ...changePassword,
      [name]: value
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setNewPhoto(file);
    
    // Crear vista previa
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setNewPhoto(null);
    
    // Si el usuario ya tenía una foto, aquí podríamos eliminarla en el backend
    if (profileData?.fotoPerfil) {
      // Marcamos que queremos eliminar la foto (en el envío del formulario)
      setProfileData({
        ...profileData,
        fotoPerfil: ''
      });
    }
  };

  const validateProfileForm = (): boolean => {
    if (!profileData) return false;
    
    if (!profileData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    
    if (!profileData.apellido.trim()) {
      setError('El apellido es requerido');
      return false;
    }
    
    if (!profileData.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      setError('El formato del email no es válido');
      return false;
    }
    
    return true;
  };

  const validatePasswordForm = (): boolean => {
    if (!changePassword.currentPassword) {
      setError('La contraseña actual es requerida');
      return false;
    }
    
    if (!changePassword.newPassword) {
      setError('La nueva contraseña es requerida');
      return false;
    }
    
    if (changePassword.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return false;
    }
    
    if (!/\d/.test(changePassword.newPassword)) {
      setError('La nueva contraseña debe contener al menos un número');
      return false;
    }
    
    if (!/[a-z]/.test(changePassword.newPassword)) {
      setError('La nueva contraseña debe contener al menos una letra minúscula');
      return false;
    }
    
    if (!/[A-Z]/.test(changePassword.newPassword)) {
      setError('La nueva contraseña debe contener al menos una letra mayúscula');
      return false;
    }
    
    if (changePassword.newPassword !== changePassword.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    return true;
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validateProfileForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Si hay una nueva foto, subirla primero
      if (newPhoto) {
        const formData = new FormData();
        formData.append('file', newPhoto);
        formData.append('tipo', 'perfil');
        
        const uploadResponse = await apiService.post('/api/archivos/upload', formData);
        
        // Actualizar la URL de la foto en los datos del perfil
        if (profileData) {
          setProfileData({
            ...profileData,
            fotoPerfil: uploadResponse.archivo.url
          });
        }
      }
      
      // Enviar datos del perfil actualizados
      if (profileData) {
        // Seleccionar solo los campos que queremos actualizar
        const updateData = {
          nombre: profileData.nombre,
          apellido: profileData.apellido,
          telefono: profileData.telefono,
          especialidad: profileData.especialidad,
          biografia: profileData.biografia,
          fotoPerfil: profileData.fotoPerfil
        };
        
        await updateProfile(updateData);
        setSuccess('Perfil actualizado correctamente');
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { changePassword: changePasswordFn } = useAuth();
      await changePasswordFn(changePassword.currentPassword, changePassword.newPassword);
      
      // Limpiar formulario
      setChangePassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccess('Contraseña actualizada correctamente');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar la contraseña');
      setLoading(false);
    }
  };

  if (!profileData && !loading) {
    return (
      <Alert variant="warning" title="Perfil no encontrado">
        No se pudo encontrar la información del perfil.
      </Alert>
    );
  }

  const tabs = [
    {
      id: 'personal',
      label: 'Información Personal',
      content: (
        <form onSubmit={handleSubmitProfile} className="space-y-6">
          <Card title="Datos Personales">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-1/2">
                  <Input
                    label="Nombre"
                    name="nombre"
                    value={profileData?.nombre || ''}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    icon={<User className="h-5 w-5 text-gray-400" />}
                    required
                  />
                </div>
                
                <div className="w-full sm:w-1/2">
                  <Input
                    label="Apellido"
                    name="apellido"
                    value={profileData?.apellido || ''}
                    onChange={handleInputChange}
                    placeholder="Tu apellido"
                    icon={<User className="h-5 w-5 text-gray-400" />}
                    required
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-1/2">
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData?.email || ''}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    icon={<Mail className="h-5 w-5 text-gray-400" />}
                    required
                    disabled
                    helperText="El email no se puede cambiar"
                  />
                </div>
                
                <div className="w-full sm:w-1/2">
                  <Input
                    label="Teléfono"
                    name="telefono"
                    value={profileData?.telefono || ''}
                    onChange={handleInputChange}
                    placeholder="+54 11 1234-5678"
                    icon={<Phone className="h-5 w-5 text-gray-400" />}
                  />
                </div>
              </div>
              
              {profileData?.roles.includes('medico') && (
                <>
                  <div className="w-full">
                    <Input
                      label="Especialidad"
                      name="especialidad"
                      value={profileData?.especialidad || ''}
                      onChange={handleInputChange}
                      placeholder="Tu especialidad médica"
                    />
                  </div>
                  
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Biografía profesional
                    </label>
                    <textarea
                      name="biografia"
                      value={profileData?.biografia || ''}
                      onChange={handleInputChange}
                      placeholder="Cuéntanos sobre tu experiencia profesional..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  </div>
                </>
              )}
            </div>
          </Card>
          
          <Card title="Foto de Perfil">
            <div className="flex items-center space-x-6">
              <div className="shrink-0">
                {photoPreview ? (
                  <div className="relative w-24 h-24">
                    <img
                      src={photoPreview}
                      alt="Foto de perfil"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      aria-label="Eliminar foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Cambiar foto de perfil
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <Button
                    variant="light"
                    icon={<Camera className="h-5 w-5" />}
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    type="button"
                  >
                    Subir foto
                  </Button>
                  <input
                    id="photo-upload"
                    type="file"
                    className="hidden"
                    onChange={handlePhotoChange}
                    accept="image/jpeg,image/png,image/gif"
                  />
                  
                  {photoPreview && (
                    <Button
                      variant="danger"
                      icon={<Trash2 className="h-5 w-5" />}
                      onClick={handleRemovePhoto}
                      type="button"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  JPG, PNG o GIF. Tamaño máximo 2MB.
                </p>
              </div>
            </div>
          </Card>
          
          <div className="flex justify-end space-x-4">
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
              Guardar Cambios
            </Button>
          </div>
        </form>
      )
    },
    {
      id: 'password',
      label: 'Cambiar Contraseña',
      content: (
        <form onSubmit={handleSubmitPassword} className="space-y-6">
          <Card title="Cambiar Contraseña">
            <div className="space-y-4">
              <Input
                label="Contraseña Actual"
                name="currentPassword"
                type="password"
                value={changePassword.currentPassword}
                onChange={handlePasswordChange}
                icon={<Lock className="h-5 w-5 text-gray-400" />}
                required
              />
              
              <Input
                label="Nueva Contraseña"
                name="newPassword"
                type="password"
                value={changePassword.newPassword}
                onChange={handlePasswordChange}
                icon={<Lock className="h-5 w-5 text-gray-400" />}
                required
                helperText="Mínimo 8 caracteres, una mayúscula, una minúscula y un número"
              />
              
              <Input
                label="Confirmar Nueva Contraseña"
                name="confirmPassword"
                type="password"
                value={changePassword.confirmPassword}
                onChange={handlePasswordChange}
                icon={<Lock className="h-5 w-5 text-gray-400" />}
                required
              />
            </div>
          </Card>
          
          <div className="flex justify-end space-x-4">
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
              Actualizar Contraseña
            </Button>
          </div>
        </form>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {error && (
        <Alert 
          variant="error" 
          title="Error" 
          onDismiss={() => setError(null)}
          dismissible
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert 
          variant="success" 
          title="Éxito" 
          onDismiss={() => setSuccess(null)}
          dismissible
        >
          {success}
        </Alert>
      )}
      
      <Tabs 
        tabs={tabs} 
        activeTab={activeTab}
        onChange={setActiveTab}
      />
    </div>
  );
};

export default ProfileForm;