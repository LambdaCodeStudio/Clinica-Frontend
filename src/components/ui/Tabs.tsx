import React, { useState } from 'react';

export interface TabItem {
  /**
   * ID único para el tab
   */
  id: string;
  
  /**
   * Etiqueta o título del tab
   */
  label: React.ReactNode;
  
  /**
   * Contenido asociado al tab
   */
  content: React.ReactNode;
  
  /**
   * Si el tab está deshabilitado
   */
  disabled?: boolean;
  
  /**
   * Ícono opcional para el tab
   */
  icon?: React.ReactNode;
}

export interface TabsProps {
  /**
   * Arreglo de elementos de tab
   */
  tabs: TabItem[];
  
  /**
   * ID del tab inicialmente activo
   */
  defaultActiveTab?: string;
  
  /**
   * ID del tab activo (para control externo)
   */
  activeTab?: string;
  
  /**
   * Función ejecutada al cambiar de tab
   */
  onChange?: (tabId: string) => void;
  
  /**
   * Orientación de los tabs
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Variante de estilo
   */
  variant?: 'default' | 'pills' | 'bordered';
  
  /**
   * Clases adicionales
   */
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultActiveTab,
  activeTab: controlledActiveTab,
  onChange,
  orientation = 'horizontal',
  variant = 'default',
  className = ''
}) => {
  // Usar estado interno si no se controla externamente
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultActiveTab || (tabs.length > 0 ? tabs[0].id : '')
  );
  
  // Determinar el tab activo (controlado o no controlado)
  const activeTab = controlledActiveTab !== undefined 
    ? controlledActiveTab 
    : internalActiveTab;
  
  // Manejar cambio de tab
  const handleTabChange = (tabId: string) => {
    if (onChange) {
      onChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };
  
  // Mapeo de variantes a clases
  const getTabItemClasses = (tabId: string, disabled: boolean = false) => {
    const isActive = tabId === activeTab;
    const baseClasses = 'inline-flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
    const disabledClasses = 'opacity-50 cursor-not-allowed';
    
    // Variantes
    const variantClasses = {
      default: `px-4 py-2 text-sm font-medium border-b-2 ${
        isActive 
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`,
      pills: `px-4 py-2 text-sm font-medium rounded-full ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
      }`,
      bordered: `px-4 py-2 text-sm font-medium ${
        isActive
          ? 'bg-white border-t border-l border-r text-blue-600 rounded-t-lg'
          : 'border border-transparent text-gray-500 hover:text-gray-700'
      }`
    };
    
    return `
      ${baseClasses}
      ${variantClasses[variant]}
      ${disabled ? disabledClasses : ''}
    `;
  };
  
  // Clases del contenedor principal
  const containerClasses = `
    ${orientation === 'vertical' ? 'flex space-x-4' : ''}
    ${className}
  `;
  
  // Clases de la lista de tabs
  const listClasses = `
    ${orientation === 'horizontal' ? 'flex space-x-1 overflow-x-auto' : 'flex-col space-y-2'}
    ${variant === 'bordered' ? 'border-b' : ''}
  `;
  
  return (
    <div className={containerClasses}>
      {/* Lista de tabs */}
      <div role="tablist" className={listClasses} aria-orientation={orientation}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            className={getTabItemClasses(tab.id, tab.disabled)}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Contenido del tab activo */}
      <div className="mt-4 flex-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`tabpanel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            className={activeTab === tab.id ? 'block' : 'hidden'}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;