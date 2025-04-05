import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  CreditCard, 
  Settings, 
  Menu, 
  X, 
  ChevronDown, 
  LogOut 
} from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  hasSubMenu?: boolean;
  children?: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon, 
  label, 
  href, 
  isActive = false, 
  hasSubMenu = false,
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSubmenu = (e: React.MouseEvent) => {
    if (hasSubMenu) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <li>
      <a 
        href={href} 
        onClick={toggleSubmenu}
        className={`
          flex items-center p-2 rounded-lg 
          ${isActive 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-700 hover:bg-gray-100'}
          transition-colors
        `}
      >
        <span className="mr-3">{icon}</span>
        <span className="flex-1">{label}</span>
        {hasSubMenu && (
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        )}
      </a>
      
      {hasSubMenu && isOpen && (
        <ul className="pl-8 mt-1 space-y-1">
          {children}
        </ul>
      )}
    </li>
  );
};

interface SidebarProps {
  /**
   * Estado que controla si el sidebar está contraído en móviles
   */
  isMobileOpen: boolean;
  
  /**
   * Función para controlar la apertura/cierre en móviles
   */
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isMobileOpen, 
  onToggleMobile 
}) => {
  const { user, logout, hasRole } = useAuth();
  
  // Rutas según el rol del usuario
  const isAdmin = hasRole('administrador');
  const isMedico = hasRole('medico');
  const isSecretaria = hasRole('secretaria');
  const isPaciente = hasRole('paciente');

  return (
    <>
      {/* Overlay móvil */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-50 lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 w-64 h-full bg-white border-r border-gray-200 
          transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header del sidebar */}
        <div className="flex items-center justify-between p-4 border-b">
          <a href="/" className="flex items-center">
            <img src="/logo.svg" alt="Clínica Logo" className="h-8 mr-2" />
            <span className="text-lg font-semibold">Clínica Estética</span>
          </a>
          <button
            onClick={onToggleMobile}
            className="p-1 rounded-full hover:bg-gray-100 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="p-4 overflow-y-auto h-[calc(100%-64px)]">
          <ul className="space-y-2">
            {/* Dashboard - Todos los usuarios */}
            <NavItem 
              icon={<Home className="w-5 h-5" />} 
              label="Dashboard" 
              href="/dashboard" 
            />

            {/* Administrador */}
            {isAdmin && (
              <>
                <NavItem 
                  icon={<Users className="w-5 h-5" />} 
                  label="Usuarios" 
                  href="/admin/usuarios" 
                  hasSubMenu
                >
                  <NavItem 
                    icon={<Users className="w-4 h-4" />} 
                    label="Todos los usuarios" 
                    href="/admin/usuarios" 
                  />
                  <NavItem 
                    icon={<Users className="w-4 h-4" />} 
                    label="Médicos" 
                    href="/admin/usuarios/medicos" 
                  />
                </NavItem>
                
                <NavItem 
                  icon={<FileText className="w-5 h-5" />} 
                  label="Tratamientos" 
                  href="/admin/tratamientos" 
                />
                
                <NavItem 
                  icon={<CreditCard className="w-5 h-5" />} 
                  label="Reportes" 
                  href="/admin/reportes" 
                />
              </>
            )}

            {/* Médico */}
            {isMedico && (
              <>
                <NavItem 
                  icon={<Calendar className="w-5 h-5" />} 
                  label="Agenda" 
                  href="/medicos/agenda" 
                />
                <NavItem 
                  icon={<Users className="w-5 h-5" />} 
                  label="Pacientes" 
                  href="/medicos/pacientes" 
                />
                <NavItem 
                  icon={<FileText className="w-5 h-5" />} 
                  label="Historias Clínicas" 
                  href="/medicos/historias" 
                />
              </>
            )}

            {/* Secretaria */}
            {isSecretaria && (
              <>
                <NavItem 
                  icon={<Calendar className="w-5 h-5" />} 
                  label="Citas" 
                  href="/secretaria/citas" 
                />
                <NavItem 
                  icon={<Users className="w-5 h-5" />} 
                  label="Pacientes" 
                  href="/secretaria/pacientes" 
                />
                <NavItem 
                  icon={<CreditCard className="w-5 h-5" />} 
                  label="Pagos" 
                  href="/secretaria/pagos" 
                />
              </>
            )}

            {/* Paciente */}
            {isPaciente && (
              <>
                <NavItem 
                  icon={<Calendar className="w-5 h-5" />} 
                  label="Mis Citas" 
                  href="/pacientes/citas" 
                />
                <NavItem 
                  icon={<FileText className="w-5 h-5" />} 
                  label="Mis Documentos" 
                  href="/pacientes/documentos" 
                />
                <NavItem 
                  icon={<CreditCard className="w-5 h-5" />} 
                  label="Mis Pagos" 
                  href="/pacientes/pagos" 
                />
              </>
            )}

            {/* Configuración para todos */}
            <NavItem 
              icon={<Settings className="w-5 h-5" />} 
              label="Configuración" 
              href="/perfil" 
            />
            
            {/* Salir */}
            <li>
              <button 
                onClick={logout}
                className="flex items-center w-full p-2 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Cerrar Sesión</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;