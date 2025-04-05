import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  helperTextClassName?: string;
  errorClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  helperTextClassName = '',
  errorClassName = '',
  className = '',
  disabled = false,
  required = false,
  ...props
}, ref) => {
  // Clases para el contenedor
  const containerClasses = `mb-4 ${fullWidth ? 'w-full' : ''} ${containerClassName}`;
  
  // Clases para la etiqueta
  const labelClasses = `block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`;
  
  // Determinar si hay un icono y ajustar los padding del input
  const hasLeftIcon = icon && iconPosition === 'left';
  const hasRightIcon = icon && iconPosition === 'right';
  
  // Clases base para el input
  const baseInputClasses = `
    block rounded-lg border-gray-300 shadow-sm
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${hasLeftIcon ? 'pl-10' : ''}
    ${hasRightIcon ? 'pr-10' : ''}
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
    ${fullWidth ? 'w-full' : ''}
    ${inputClassName}
    ${className}
  `;
  
  // Clases para el texto de ayuda
  const helperTextClasses = `mt-1 text-sm text-gray-600 ${helperTextClassName}`;
  
  // Clases para el mensaje de error
  const errorClasses = `mt-1 text-sm text-red-600 ${errorClassName}`;

  return (
    <div className={containerClasses}>
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {hasLeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          className={baseInputClasses}
          disabled={disabled}
          required={required}
          {...props}
        />
        
        {hasRightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
      </div>
      
      {error ? (
        <p className={errorClasses}>{error}</p>
      ) : helperText ? (
        <p className={helperTextClasses}>{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;