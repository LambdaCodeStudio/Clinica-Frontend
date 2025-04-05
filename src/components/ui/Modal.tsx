import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  /**
   * Título del modal
   */
  title?: string;
  /**
   * Controla si el modal está abierto o cerrado
   */
  isOpen: boolean;
  /**
   * Función para cerrar el modal
   */
  onClose: () => void;
  /**
   * Contenido del modal
   */
  children: React.ReactNode;
  /**
   * Tamaño del modal
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Botones o acciones en el pie del modal
   */
  footer?: React.ReactNode;
  /**
   * Cierra el modal al hacer clic fuera de él
   */
  closeOnOutsideClick?: boolean;
  /**
   * Cierra el modal al presionar la tecla Escape
   */
  closeOnEsc?: boolean;
  /**
   * Muestra un botón para cerrar el modal en la esquina superior derecha
   */
  showCloseButton?: boolean;
  /**
   * Clases CSS adicionales para el contenedor principal
   */
  containerClassName?: string;
  /**
   * Clases CSS adicionales para el modal
   */
  modalClassName?: string;
}

/**
 * Componente Modal - Ventana modal/diálogo
 */
export const Modal: React.FC<ModalProps> = ({
  title,
  isOpen,
  onClose,
  children,
  size = 'md',
  footer,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  containerClassName = '',
  modalClassName = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Manejar cierre con tecla Escape
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden'; // Prevenir scroll en el body
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = ''; // Restaurar scroll
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Manejar clic fuera del modal
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Configuración de tamaños
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  // No renderizar nada si el modal está cerrado
  if (!isOpen) return null;

  // Crear portal para renderizar fuera del flujo normal
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ${containerClassName}`}
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div 
        ref={modalRef}
        className={`
          w-full ${sizeClasses[size]} bg-white rounded-lg shadow-xl 
          overflow-hidden transform transition-all
          ${modalClassName}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del modal */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            {title && (
              <h3 id="modal-title" className="text-lg font-medium text-gray-900">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Contenido del modal */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* Pie del modal con acciones */}
        {footer && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;