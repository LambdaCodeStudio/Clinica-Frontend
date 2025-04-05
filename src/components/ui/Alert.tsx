import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export interface AlertProps {
  /**
   * Contenido del mensaje de alerta
   */
  children: React.ReactNode;
  /**
   * Título opcional para la alerta
   */
  title?: string;
  /**
   * Variante que indica el tipo de alerta
   */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /**
   * Muestra un botón para cerrar la alerta
   */
  dismissible?: boolean;
  /**
   * Función llamada al cerrar la alerta
   */
  onDismiss?: () => void;
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * Componente Alert - Mensajes de alerta o notificación
 */
export const Alert: React.FC<AlertProps> = ({
  children,
  title,
  variant = 'info',
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  // Configuración de variantes
  const variantStyles = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    },
  };

  // Clases combinadas
  const alertClasses = `
    flex items-start p-4 rounded-lg border
    ${variantStyles[variant].container}
    ${className}
  `;

  return (
    <div className={alertClasses} role="alert">
      <div className="flex-shrink-0 mr-3 pt-0.5">
        {variantStyles[variant].icon}
      </div>
      
      <div className="flex-1">
        {title && (
          <h3 className="text-sm font-medium mb-1">{title}</h3>
        )}
        <div className="text-sm">{children}</div>
      </div>
      
      {dismissible && onDismiss && (
        <button
          type="button"
          className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-400"
          onClick={onDismiss}
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;