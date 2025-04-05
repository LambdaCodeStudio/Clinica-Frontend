# Clinica-Frontend

Aplicación frontend para el sistema de gestión de clínica odontológica.

## Tecnologías
- Astro v5.3.0
- React v19.0.0
- TypeScript
- Tailwind CSS v3.4.17

## Dependencias principales
- @astrojs/react: ^4.2.0
- @tailwindcss/vite: ^4.0.6
- axios: ^1.7.9
- jwt-decode: ^4.0.0
- lucide-react: ^0.475.0
- recharts: ^2.15.2

## Estructura
- `/src`: Código fuente
  - `/assets`: Archivos estáticos
  - `/components`: Componentes organizados por funcionalidad
    - `/appointments`: Gestión de citas
    - `/auth`: Componentes de autenticación
    - `/common`: Componentes comunes reutilizables
    - `/dashboard`: Componentes del panel principal
    - `/documents`: Gestión de documentos
    - `/layout`: Componentes de diseño
    - `/patients`: Gestión de pacientes
    - `/profile`: Perfil de usuario
    - `/treatments`: Tratamientos
    - `/ui`: Componentes de interfaz de usuario
  - `/hooks`: Hooks personalizados
  - `/layouts`: Diseños principales
  - `/pages`: Rutas de la aplicación
  - `/services`: Servicios para comunicación con el backend
  - `/styles`: Estilos globales
  - `/utils`: Utilidades y funciones auxiliares

## Características
- Sistema de autenticación completo con JWT
- Protección CSRF (Double Submit Cookie Pattern)
- Gestión avanzada de cookies con opciones de seguridad
- Renovación automática de tokens
- Detección de sesiones inactivas
- Gestión de pacientes y citas
- Generación de documentos
- Sistema de pago e historial médico
- Dashboard con métricas
- Comparación de imágenes antes/después

## Configuración
La aplicación está configurada para funcionar en modo servidor (SSR) con:
- Puerto de desarrollo: 3000
- Colores personalizados en Tailwind:
  - primary: #007AFF
  - secondary: #6B7280

## Instalación
```
npm install
```

## Comandos disponibles
```
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Construir para producción
npm run preview  # Previsualizar la construcción
```