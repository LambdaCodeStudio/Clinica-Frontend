import React, { useState, useEffect } from 'react';
import { Bell, Check, Calendar, Clock, FileText, CreditCard, Settings, X, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Loading from '../ui/Loading';
import Alert from '../ui/Alert';
import apiService from '../../services/api';

interface Notification {
  _id: string;
  titulo: string;
  mensaje: string;
  tipo: 'cita' | 'documento' | 'pago' | 'sistema' | 'recordatorio';
  leida: boolean;
  entidadId?: string;
  entidadTipo?: string;
  fecha: string;
  enlace?: string;
  icono?: string;
}

interface NotificationCenterProps {
  userId?: string;
  showHeader?: boolean;
  limit?: number;
  asDrawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  showHeader = true,
  limit = 0,
  asDrawer = false,
  isOpen = false,
  onClose
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  useEffect(() => {
    fetchNotifications();
    
    // Configurar polling cada 2 minutos para mantener notificaciones actualizadas
    const intervalId = setInterval(fetchNotifications, 120000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/notificaciones';
      
      if (limit > 0) {
        endpoint += `?limit=${limit}`;
      }
      
      const response = await apiService.get<{ notificaciones: Notification[] }>(endpoint);
      setNotifications(response.notificaciones);
      
      // Contar notificaciones no leídas
      const unread = response.notificaciones.filter(n => !n.leida).length;
      setUnreadCount(unread);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error al cargar notificaciones:', err);
      setError(err.message || 'Error al cargar notificaciones');
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.put(`/api/notificaciones/${notificationId}/leer`);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, leida: true } 
            : n
        )
      );
      
      // Actualizar contador de no leídas
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error al marcar notificación como leída:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.put('/api/notificaciones/leer-todas');
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, leida: true }))
      );
      
      // Actualizar contador de no leídas
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error al marcar todas las notificaciones como leídas:', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída
    if (!notification.leida) {
      await markAsRead(notification._id);
    }
    
    // Si tiene enlace, navegar a él
    if (notification.enlace) {
      window.location.href = notification.enlace;
      if (asDrawer && onClose) {
        onClose();
      }
    } else {
      // Mostrar modal con detalles
      setSelectedNotification(notification);
      setShowModal(true);
    }
  };

  const formatDate = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    
    // Diferencia en milisegundos
    const diff = now.getTime() - date.getTime();
    
    // Convertir a minutos, horas, días
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) {
      return `Hace ${minutes} min`;
    } else if (hours < 24) {
      return `Hace ${hours} h`;
    } else if (days < 7) {
      return `Hace ${days} días`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short'
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'cita':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'documento':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'pago':
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      case 'recordatorio':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'sistema':
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderNotificationList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-4">
          <Loading size="md" text="Cargando notificaciones..." />
        </div>
      );
    }

    if (error) {
      return (
        <Alert 
          variant="error" 
          title="Error"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p>No tienes notificaciones</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              notification.leida 
                ? 'bg-white hover:bg-gray-50' 
                : 'bg-blue-50 hover:bg-blue-100'
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                {getNotificationIcon(notification.tipo)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-medium ${notification.leida ? 'text-gray-900' : 'text-blue-800'}`}>
                    {notification.titulo}
                  </h4>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatDate(notification.fecha)}
                  </span>
                </div>
                <p className={`text-sm ${notification.leida ? 'text-gray-600' : 'text-blue-700'}`}>
                  {notification.mensaje}
                </p>
              </div>
              {!notification.leida && (
                <div className="ml-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Para componente independiente (no drawer)
  if (!asDrawer) {
    return (
      <Card 
        title={showHeader ? "Notificaciones" : undefined}
        headerClassName={showHeader ? undefined : 'hidden'}
      >
        {showHeader && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-700">
                {unreadCount > 0 
                  ? `Tienes ${unreadCount} notificacion${unreadCount !== 1 ? 'es' : ''} sin leer` 
                  : 'No hay notificaciones sin leer'}
              </span>
            </div>
            
            {unreadCount > 0 && (
              <Button 
                variant="light" 
                size="sm"
                onClick={markAllAsRead}
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>
        )}
        
        {renderNotificationList()}
        
        {limit > 0 && notifications.length > 0 && (
          <div className="mt-4 text-center">
            <Button
              variant="light"
              onClick={() => window.location.href = '/notificaciones'}
            >
              Ver todas las notificaciones
            </Button>
          </div>
        )}
        
        {/* Modal para mostrar detalles de la notificación */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedNotification?.titulo || 'Notificación'}
        >
          {selectedNotification && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                {getNotificationIcon(selectedNotification.tipo)}
                <div>
                  <p className="text-gray-800">{selectedNotification.mensaje}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(selectedNotification.fecha).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
              
              {selectedNotification.enlace && (
                <div className="mt-4">
                  <Button
                    variant="primary"
                    onClick={() => {
                      window.location.href = selectedNotification.enlace!;
                      setShowModal(false);
                    }}
                  >
                    Ver detalles
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </Card>
    );
  }
  
  // Para versión drawer (lateral)
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        ></div>
      )}
      
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button 
                variant="light" 
                size="sm"
                icon={<Check className="h-4 w-4" />}
                onClick={markAllAsRead}
              />
            )}
            
            <Button 
              variant="light" 
              size="sm"
              icon={<X className="h-4 w-4" />}
              onClick={onClose}
            />
          </div>
        </div>
        
        <div className="p-4">
          {renderNotificationList()}
        </div>
        
        <div className="p-4 border-t">
          <Button
            variant="light"
            size="sm"
            className="w-full"
            icon={<Settings className="h-4 w-4" />}
            onClick={() => window.location.href = '/perfil/notificaciones'}
          >
            Configurar notificaciones
          </Button>
        </div>
      </div>
      
      {/* Modal para mostrar detalles de la notificación */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedNotification?.titulo || 'Notificación'}
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              {getNotificationIcon(selectedNotification.tipo)}
              <div>
                <p className="text-gray-800">{selectedNotification.mensaje}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(selectedNotification.fecha).toLocaleString('es-ES')}
                </p>
              </div>
            </div>
            
            {selectedNotification.enlace && (
              <div className="mt-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    window.location.href = selectedNotification.enlace!;
                    setShowModal(false);
                    if (onClose) onClose();
                  }}
                >
                  Ver detalles
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default NotificationCenter;