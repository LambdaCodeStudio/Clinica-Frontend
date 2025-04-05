import React, { useState, useEffect } from 'react';
import  Header  from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export interface DashboardLayoutProps {
  /**
   * Contenido principal del dashboard
   */
  children: React.ReactNode;
  
  /**
   * Título de la página actual
   */
  pageTitle?: string;
  
  /**
   * Si se debe mostrar el footer
   */
  showFooter?: boolean;
  
  /**
   * Usar footer mínimo
   */
  minimalFooter?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  pageTitle = 'Dashboard',
  showFooter = true,
  minimalFooter = true
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Cerrar sidebar en responsive al cambiar de tamaño
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isMobileOpen={sidebarOpen} onToggleMobile={toggleSidebar} />
      
      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header pageTitle={pageTitle} onToggleSidebar={toggleSidebar} />
        
        {/* Área de contenido con scroll */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        
        {/* Footer opcional */}
        {showFooter && (
          <Footer minimal={minimalFooter} />
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;