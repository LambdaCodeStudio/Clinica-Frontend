import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  bordered?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  bordered = true,
  shadow = 'md',
  onClick
}) => {
  // Mapeo de sombras a clases de Tailwind
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  // Clases base para la tarjeta
  const cardClasses = `
    bg-white rounded-lg overflow-hidden
    ${bordered ? 'border border-gray-200' : ''}
    ${shadowClasses[shadow]}
    ${onClick ? 'cursor-pointer transition-transform hover:-translate-y-1' : ''}
    ${className}
  `;

  // Clases para el cuerpo de la tarjeta
  const bodyClasses = `p-6 ${bodyClassName}`;

  // Clases para el encabezado
  const headerClasses = `px-6 py-4 border-b border-gray-200 ${headerClassName}`;

  // Clases para el pie de la tarjeta
  const footerClasses = `px-6 py-4 bg-gray-50 border-t border-gray-200 ${footerClassName}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || subtitle) && (
        <div className={headerClasses}>
          {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      
      <div className={bodyClasses}>
        {children}
      </div>
      
      {footer && (
        <div className={footerClasses}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;