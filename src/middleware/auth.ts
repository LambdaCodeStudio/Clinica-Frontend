import { defineMiddleware } from 'astro/middleware';
import { getCookie } from '../utils/cookies';

// Función de utilidad para validar tokens JWT
const isJwtValid = (token: string): boolean => {
  try {
    // Decodificamos el token para verificar estructura y expiración
    // sin verificar la firma (esto es sólo validación básica del cliente)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    
    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

export const authMiddleware = defineMiddleware(async ({ request, cookies, redirect, locals }) => {
  // Obtener token de cookies
  const token = cookies.get('token')?.value;
  
  // Almacenar estado de autenticación en locals para acceso en componentes Astro
  locals.isAuthenticated = !!token && isJwtValid(token);
  
  // Definir rutas protegidas y públicas
  const protectedPaths = ['/dashboard', '/profile', '/settings', '/account'];
  const publicOnlyPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  
  const url = new URL(request.url);
  const isProtectedPath = protectedPaths.some(path => url.pathname.startsWith(path));
  const isPublicOnlyPath = publicOnlyPaths.some(path => url.pathname.startsWith(path));
  
  // Manejar parámetro de sesión expirada
  const sessionExpired = url.searchParams.get('session_expired') === 'true';
  
  // Si estamos en página de login y hay flag de sesión expirada,
  // guardar esta información en una cookie para mostrar el mensaje adecuado
  if (url.pathname === '/login' && sessionExpired) {
    url.searchParams.delete('session_expired');
    cookies.set('session_expired', 'true', {
      path: '/',
      maxAge: 60, // Sólo válida por 1 minuto
      secure: import.meta.env.PROD,
      httpOnly: false, // Debe ser accesible por JS
      sameSite: 'strict'
    });
    return redirect(url.pathname + url.search);
  }

  // Comprobar si hay mensaje de error genérico en las URL
  const errorMessage = url.searchParams.get('error');
  if (errorMessage) {
    cookies.set('errorMessage', errorMessage, {
      path: '/',
      maxAge: 60, // Sólo válida por 1 minuto
      secure: import.meta.env.PROD,
      httpOnly: false, // Debe ser accesible por JS
      sameSite: 'strict'
    });
    url.searchParams.delete('error');
    return redirect(url.pathname + url.search);
  }

  // Redirigir usuarios no autenticados intentando acceder a rutas protegidas
  if (isProtectedPath && !locals.isAuthenticated) {
    // Guardar URL original para redireccionar después del login
    const redirectUrl = encodeURIComponent(url.pathname + url.search);
    return redirect(`/login?redirect=${redirectUrl}`);
  }

  // Redirigir usuarios autenticados intentando acceder a login/registro
  if (isPublicOnlyPath && locals.isAuthenticated) {
    // Comprobar si hay parámetro de redirección
    const redirectTo = url.searchParams.get('redirect');
    if (redirectTo) {
      try {
        const decodedUrl = decodeURIComponent(redirectTo);
        // Validar que la URL sea local (empieza con /)
        if (decodedUrl.startsWith('/')) {
          return redirect(decodedUrl);
        }
      } catch (e) {
        // Si falla la decodificación, redirigir a dashboard
        console.error('URL de redirección inválida:', e);
      }
    }
    return redirect('/dashboard');
  }

  // Detectar timeout de inactividad (opcional, si se implementa control de inactividad)
  const lastActivity = cookies.get('last_activity')?.value;
  if (locals.isAuthenticated && lastActivity) {
    const inactivityLimit = 30 * 60 * 1000; // 30 minutos en ms
    const now = Date.now();
    const lastActivityTime = parseInt(lastActivity, 10);
    
    if (now - lastActivityTime > inactivityLimit) {
      // Sesión inactiva por demasiado tiempo
      cookies.delete('token', { path: '/' });
      cookies.delete('last_activity', { path: '/' });
      
      return redirect('/login?session_expired=true&reason=inactivity');
    }
    
    // Actualizar timestamp de última actividad
    cookies.set('last_activity', now.toString(), {
      path: '/',
      secure: import.meta.env.PROD,
      httpOnly: true,
      sameSite: 'strict'
    });
  } else if (locals.isAuthenticated) {
    // Inicializar timestamp de actividad si no existe
    cookies.set('last_activity', Date.now().toString(), {
      path: '/',
      secure: import.meta.env.PROD,
      httpOnly: true,
      sameSite: 'strict'
    });
  }

  // Si el usuario está autenticado, añadir datos básicos a locals
  if (locals.isAuthenticated) {
    try {
      // Extraer información básica del token para uso en templates
      const base64Url = token!.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      
      locals.userId = payload.userId;
      locals.userEmail = payload.email;
      locals.userRoles = payload.roles || [];
    } catch (error) {
      console.error('Error al decodificar token JWT:', error);
    }
  }
});