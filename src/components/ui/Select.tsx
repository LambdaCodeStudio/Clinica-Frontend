import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  helperTextClassName?: string;
  errorClassName?: string;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  options,
  label,
  helperText,
  error,
  icon,
  fullWidth = true,
  containerClassName = '',
  labelClassName = '',
  selectClassName = '',
  helperTextClassName = '',
  errorClassName = '',
  className = '',
  placeholder,
  disabled = false,
  required = false,
  onChange,
  ...props
}, ref) => {
  // Clases para el contenedor
  const containerClasses = `mb-4 ${fullWidth ? 'w-full' : ''} ${containerClassName}`;
  
  // Clases para la etiqueta
  const labelClasses = `block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`;
  
  // Determinar si hay un icono
  const hasIcon = !!icon;
  
  // Clases base para el select
  const baseSelectClasses = `
    block rounded-lg border shadow-sm
    ${hasIcon ? 'pl-10' : ''}
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
    ${fullWidth ? 'w-full' : ''}
    ${selectClassName}
    ${className}
  `;
  
  // Clases para el texto de ayuda
  const helperTextClasses = `mt-1 text-sm text-gray-600 ${helperTextClassName}`;
  
  // Clases para el mensaje de error
  const errorClasses = `mt-1 text-sm text-red-600 ${errorClassName}`;

  // Manejador de cambios
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange && onChange(event.target.value);
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {hasIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <select
          ref={ref}
          className={baseSelectClasses}
          disabled={disabled}
          required={required}
          onChange={handleChange}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {error ? (
        <p className={errorClasses}>{error}</p>
      ) : helperText ? (
        <p className={helperTextClasses}>{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;