import React from 'react';

export interface LoadingProps {
  /**
   * Tamaño del componente de carga
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Color del spinner
   */
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  
  /**
   * Texto para mostrar junto al spinner
   */
  text?: string;
  
  /**
   * Posición del texto
   */
  textPosition?: 'left' | 'right' | 'top' | 'bottom';
  
  /**
   * Si se muestra un overlay de pantalla completa
   */
  overlay?: boolean;
  
  /**
   * Clases adicionales
   */
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  color = 'primary',
  text,
  textPosition = 'right',
  overlay = false,
  className = ''
}) => {
  // Mapeo de tamaños
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  };
  
  // Mapeo de colores
  const colorClasses = {
    primary: 'border-blue-500',
    secondary: 'border-gray-500',
    success: 'border-green-500',
    danger: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-cyan-500',
    light: 'border-gray-200',
    dark: 'border-gray-800'
  };
  
  // Mapeo de posiciones de texto
  const contentClasses = {
    left: 'flex-row-reverse items-center space-x-reverse space-x-2',
    right: 'flex-row items-center space-x-2',
    top: 'flex-col-reverse items-center space-y-reverse space-y-2',
    bottom: 'flex-col items-center space-y-2'
  };
  
  const spinnerElement = (
    <div 
      className={`
        animate-spin rounded-full 
        border-t-transparent
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
      `}
      role="status"
      aria-label="Cargando"
    />
  );
  
  const loadingContent = (
    <div className={`flex ${contentClasses[textPosition]}`}>
      {spinnerElement}
      {text && <div className="text-sm font-medium">{text}</div>}
    </div>
  );
  
  // Si es overlay, mostrar en pantalla completa
  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
        <div className={`${className}`}>
          {loadingContent}
        </div>
      </div>
    );
  }
  
  // Si no es overlay, mostrar inline
  return (
    <div className={`inline-flex ${className}`}>
      {loadingContent}
    </div>
  );
};

export default Loading;