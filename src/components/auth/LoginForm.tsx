import React, { useState, useEffect } from 'react';
import { AtSign, Lock, ArrowRight } from 'lucide-react';
import { InputField, AuthLayout } from './shared/AuthComponents';
import { useAuth } from '../../hooks/useAuth';

export const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    // Check for remembered credentials
    const remembered = localStorage.getItem('rememberedUser');
    if (remembered) {
      try {
        const { email, password } = JSON.parse(remembered);
        setFormData(prev => ({
          ...prev,
          email,
          password,
          rememberMe: true
        }));
      } catch (err) {
        localStorage.removeItem('rememberedUser');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Handle remember me functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify({
          email: formData.email,
          password: formData.password
        }));
      } else {
        localStorage.removeItem('rememberedUser');
      }

      await login(formData.email, formData.password);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error al iniciar sesión');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle={
        <span>
          ¿No tienes una cuenta?{' '}
          <a 
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Regístrate aquí
          </a>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
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
        </div>

        {error && (
          <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Recuérdame
            </label>
          </div>

          <div className="text-sm">
            <a 
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

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
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
          </span>
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginForm;