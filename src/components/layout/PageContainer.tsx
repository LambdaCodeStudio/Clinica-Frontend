import React from 'react';

export interface PageContainerProps {
  /**
   * Contenido de la página
   */
  children: React.ReactNode;
  
  /**
   * Título de la página (opcional)
   */
  title?: string;
  
  /**
   * Subtítulo o descripción (opcional)
   */
  description?: string;
  
  /**
   * Botones o acciones para mostrar en la cabecera
   */
  actions?: React.ReactNode;
  
  /**
   * Usar padding reducido
   */
  tight?: boolean;
  
  /**
   * Clases adicionales para el contenedor
   */
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  description,
  actions,
  tight = false,
  className = ''
}) => {
  return (
    <div className={`bg-gray-50 min-h-[calc(100vh-64px)] ${className}`}>
      {/* Cabecera de la página con título y acciones */}
      {(title || actions) && (
        <div className="bg-white border-b border-gray-200 px-4 py-6">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                {title && (
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                )}
                {description && (
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                )}
              </div>
              {actions && (
                <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 justify-start sm:justify-end">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido principal */}
      <div className={`container mx-auto ${tight ? 'py-4 px-2' : 'py-6 px-4'}`}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;