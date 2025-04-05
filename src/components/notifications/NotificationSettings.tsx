import React, { useState, useEffect } from 'react';
import { Bell, Mail, Phone, Info } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Loading from '../ui/Loading';
import apiService from '../../services/api';

interface NotificationSettings {
  email: {
    citas: boolean;
    recordatorios: boolean;
    pagos: boolean;
    documentos: boolean;
    sistema: boolean;
  };
  sms: {
    citas: boolean;
    recordatorios: boolean;
  };
  app: {
    citas: boolean;
    recordatorios: boolean;
    pagos: boolean;
    documentos: boolean;
    sistema: boolean;
  };
}

interface NotificationSettingsProps {
  userId?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ userId }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      citas: true,
      recordatorios: true,
      pagos: true,
      documentos: true,
      sistema: true
    },
    sms: {
      citas: false,
      recordatorios: false
    },
    app: {
      citas: true,
      recordatorios: true,
      pagos: true,
      documentos: true,
      sistema: true
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ configuracion: NotificationSettings }>('/api/notificaciones/configuracion');
      setSettings(response.configuracion);
      setLoading(false);
    } catch (err: any) {
      console.error('Error al cargar configuración de notificaciones:', err);
      setError(err.message || 'Error al cargar configuración de notificaciones');
      setLoading(false);
    }
  };

  const handleChange = (channel: 'email' | 'sms' | 'app', type: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: checked
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      setSaving(true);
      await apiService.put('/api/notificaciones/configuracion', { settings });
      setSuccess('Configuración de notificaciones actualizada correctamente');
      setSaving(false);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración de notificaciones');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loading size="lg" text="Cargando configuración..." />
      </div>
    );
  }

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
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notificaciones por Email */}
          <Card title="Notificaciones por Email" icon={<Mail className="h-5 w-5 text-blue-500" />}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="email-citas"
                    type="checkbox"
                    checked={settings.email.citas}
                    onChange={(e) => handleChange('email', 'citas', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-citas" className="ml-2 block text-sm text-gray-900">
                    Confirmaciones de citas
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="email-recordatorios"
                    type="checkbox"
                    checked={settings.email.recordatorios}
                    onChange={(e) => handleChange('email', 'recordatorios', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-recordatorios" className="ml-2 block text-sm text-gray-900">
                    Recordatorios de citas
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="email-pagos"
                    type="checkbox"
                    checked={settings.email.pagos}
                    onChange={(e) => handleChange('email', 'pagos', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-pagos" className="ml-2 block text-sm text-gray-900">
                    Facturas y pagos
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="email-documentos"
                    type="checkbox"
                    checked={settings.email.documentos}
                    onChange={(e) => handleChange('email', 'documentos', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-documentos" className="ml-2 block text-sm text-gray-900">
                    Documentos y firma
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="email-sistema"
                    type="checkbox"
                    checked={settings.email.sistema}
                    onChange={(e) => handleChange('email', 'sistema', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-sistema" className="ml-2 block text-sm text-gray-900">
                    Sistema y seguridad
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </Card>
          
          {/* Notificaciones por SMS */}
          <Card title="Notificaciones por SMS" icon={<Phone className="h-5 w-5 text-green-500" />}>
            <div className="space-y-4">
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-700">
                  Las notificaciones SMS pueden generar costos adicionales. Se recomienda activar sólo las más importantes.
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="sms-citas"
                    type="checkbox"
                    checked={settings.sms.citas}
                    onChange={(e) => handleChange('sms', 'citas', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sms-citas" className="ml-2 block text-sm text-gray-900">
                    Confirmaciones de citas
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="sms-recordatorios"
                    type="checkbox"
                    checked={settings.sms.recordatorios}
                    onChange={(e) => handleChange('sms', 'recordatorios', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sms-recordatorios" className="ml-2 block text-sm text-gray-900">
                    Recordatorios de citas
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </Card>
          
          {/* Notificaciones en la App */}
          <Card title="Notificaciones en la App" icon={<Bell className="h-5 w-5 text-purple-500" />}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="app-citas"
                    type="checkbox"
                    checked={settings.app.citas}
                    onChange={(e) => handleChange('app', 'citas', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="app-citas" className="ml-2 block text-sm text-gray-900">
                    Citas y cambios
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="app-recordatorios"
                    type="checkbox"
                    checked={settings.app.recordatorios}
                    onChange={(e) => handleChange('app', 'recordatorios', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="app-recordatorios" className="ml-2 block text-sm text-gray-900">
                    Recordatorios
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="app-pagos"
                    type="checkbox"
                    checked={settings.app.pagos}
                    onChange={(e) => handleChange('app', 'pagos', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="app-pagos" className="ml-2 block text-sm text-gray-900">
                    Pagos y facturas
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="app-documentos"
                    type="checkbox"
                    checked={settings.app.documentos}
                    onChange={(e) => handleChange('app', 'documentos', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="app-documentos" className="ml-2 block text-sm text-gray-900">
                    Documentos pendientes
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="app-sistema"
                    type="checkbox"
                    checked={settings.app.sistema}
                    onChange={(e) => handleChange('app', 'sistema', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="app-sistema" className="ml-2 block text-sm text-gray-900">
                    Sistema y seguridad
                  </label>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </Card>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            variant="primary" 
            type="submit"
            isLoading={saving}
          >
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings;