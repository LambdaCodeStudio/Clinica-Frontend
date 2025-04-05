import React, { useState } from 'react';
import { AtSign, Lock, ArrowRight, User, Calendar, Phone, IdCard } from 'lucide-react';
import { 
  InputField, 
  AuthLayout, 
  PasswordRequirements,
  validatePassword,
  validateEmail 
} from './shared/AuthComponents';
import api from '../../services/api';
import axios from 'axios';

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    // Datos de paciente
    dni: '',
    fechaNacimiento: '',
    telefono: '',
    genero: 'no especificado'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  const handleNextStep = () => {
    // Validaciones del primer paso
    // Validar email
    if (!validateEmail(formData.email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    // Validar nombre y apellido
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!formData.apellido.trim()) {
      setError('El apellido es obligatorio');
      return;
    }

    // Validar contraseña
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setError('');
    setShowAdditionalFields(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Si no hemos mostrado los campos adicionales, mostrarlos
    if (!showAdditionalFields) {
      handleNextStep();
      return;
    }

    // Validar campos adicionales
    if (!formData.dni) {
      setError('El DNI es obligatorio');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/register', {
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellido: formData.apellido,
        rol: 'paciente', // Por defecto, registramos como paciente
        datosPaciente: {
          dni: formData.dni,
          fechaNacimiento: formData.fechaNacimiento || null,
          genero: formData.genero,
          direccion: '', // Campo vacío por defecto
          telefono: formData.telefono || '',
          // Otros campos opcionales
          grupoSanguineo: 'desconocido',
          alergias: [],
          condicionesMedicas: [],
          medicacionActual: [],
          contactoEmergencia: {},
          preferencias: {
            recordatoriosSMS: true,
            recordatoriosEmail: true,
            recibirPromociones: false
          }
        }
      });
      console.log('Registro exitoso:', response);
      window.location.href = '/login?registered=true';
    } catch (err: any) {
      console.error('Error de registro:', err);
      
      // Manejo específico de errores Axios
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // El servidor respondió con un código de error
          const responseData = err.response.data;
          
          if (responseData.errors && Array.isArray(responseData.errors)) {
            // Mostrar el primer error de validación
            setError(responseData.errors[0].message || 'Error de validación');
          } else if (responseData.message) {
            setError(responseData.message);
          } else {
            setError(`Error ${err.response.status}: ${err.response.statusText}`);
          }
        } else if (err.request) {
          // La petición fue hecha pero no se recibió respuesta
          setError('No se recibió respuesta del servidor. Intenta de nuevo más tarde.');
        } else {
          // Error al configurar la petición
          setError(err.message || 'Error al configurar la solicitud');
        }
      } else {
        // Error no relacionado con Axios
        setError(err.message || 'Error inesperado al registrar usuario');
      }
      
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crear nueva cuenta"
      subtitle={
        <span>
          ¿Ya tienes una cuenta?{' '}
          <a 
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Inicia sesión aquí
          </a>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          {!showAdditionalFields ? (
            // Step 1: Basic user information
            <>
              <InputField
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Nombre"
                icon={User}
                error={error}
              />

              <InputField
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                placeholder="Apellido"
                icon={User}
                error={error}
              />

              <InputField
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Correo electrónico"
                icon={AtSign}
                error={error}
              />

              <InputField
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Contraseña"
                icon={Lock}
                error={error}
                showPasswordToggle
                onPasswordToggle={() => setShowPassword(!showPassword)}
              />

              <InputField
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Confirmar contraseña"
                icon={Lock}
                error={error}
                showPasswordToggle
                onPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </>
          ) : (
            // Step 2: Patient information
            <>
              <InputField
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value})}
                placeholder="DNI (requerido)"
                icon={IdCard}
                error={error}
              />

              <InputField
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({...formData, fechaNacimiento: e.target.value})}
                placeholder="Fecha de nacimiento"
                icon={Calendar}
                error={error}
              />

              <InputField
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                placeholder="Teléfono"
                icon={Phone}
                error={error}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Género
                </label>
                <select
                  value={formData.genero}
                  onChange={(e) => setFormData({...formData, genero: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="no especificado">No especificado</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        {!showAdditionalFields && (
          <PasswordRequirements password={formData.password} />
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 
            border border-transparent rounded-lg text-white bg-blue-600 
            hover:bg-blue-700 focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-blue-500 transition-all
            duration-200 ease-in-out transform hover:-translate-y-0.5
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center">
            {isLoading ? 'Creando cuenta...' : showAdditionalFields ? 'Completar registro' : 'Continuar'}
            {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
          </span>
        </button>
        
        {showAdditionalFields && (
          <button
            type="button"
            onClick={() => setShowAdditionalFields(false)}
            className="mt-2 w-full text-center text-sm text-blue-600 hover:text-blue-500"
          >
            Volver atrás
          </button>
        )}
      </form>
    </AuthLayout>
  );
};

export default RegisterForm;