/**
 * Utilidades para manejo seguro de cookies en el cliente
 */

/**
 * Obtiene el valor de una cookie por su nombre
 * @param name Nombre de la cookie
 * @returns Valor de la cookie o undefined si no existe
 */
export const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1];
};

/**
 * Establece una cookie con opciones de seguridad
 * @param name Nombre de la cookie
 * @param value Valor de la cookie
 * @param options Opciones adicionales (maxAge, secure, etc.)
 */
export const setCookie = (name: string, value: string, options: { [key: string]: any } = {}): void => {
  if (typeof document === 'undefined') return;
  
  // Valores predeterminados para seguridad
  const cookieOptions = {
    path: '/',
    secure: window.location.protocol === 'https:' || import.meta.env.DEV,
    sameSite: 'strict',
    ...options
  };
  
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  if (cookieOptions.maxAge) cookieString += `; max-age=${cookieOptions.maxAge}`;
  if (cookieOptions.expires) cookieString += `; expires=${cookieOptions.expires.toUTCString()}`;
  if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
  if (cookieOptions.domain) cookieString += `; domain=${cookieOptions.domain}`;
  if (cookieOptions.secure) cookieString += '; secure';
  if (cookieOptions.sameSite) cookieString += `; samesite=${cookieOptions.sameSite}`;
  if (cookieOptions.httpOnly) cookieString += '; httponly';
  
  document.cookie = cookieString;
};

/**
 * Elimina una cookie estableciendo su fecha de expiración en el pasado
 * @param name Nombre de la cookie a eliminar
 * @param path Ruta de la cookie (debe ser la misma utilizada al crearla)
 */
export const deleteCookie = (name: string, path: string = '/'): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=strict`;
};

/**
 * Verifica si una cookie existe
 * @param name Nombre de la cookie
 * @returns true si la cookie existe, false en caso contrario
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== undefined;
};

/**
 * Obtiene todas las cookies como un objeto
 * @returns Objeto con todas las cookies (nombre: valor)
 */
export const getAllCookies = (): Record<string, string> => {
  if (typeof document === 'undefined') return {};
  
  const cookies: Record<string, string> = {};
  document.cookie.split('; ').forEach(cookie => {
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  
  return cookies;
};

/**
 * Sanitiza un valor antes de almacenarlo en una cookie para prevenir ataques XSS
 * @param value Valor a sanitizar
 * @returns Valor sanitizado
 */
export const sanitizeCookieValue = (value: string): string => {
  // Reemplazar caracteres potencialmente problemáticos
  return value
    .replace(/[;=]/g, '') // Eliminar ; y = que podrían romper la estructura de la cookie
    .replace(/["'<>]/g, ''); // Eliminar caracteres que podrían usarse en XSS
};

/**
 * Crea una cookie segura con token JWT
 * @param token Token JWT
 * @param maxAge Tiempo de vida en segundos
 */
export const setAuthCookie = (token: string, maxAge: number = 86400): void => {
  setCookie('token', sanitizeCookieValue(token), {
    maxAge,
    secure: true,
    sameSite: 'strict'
  });
};

/**
 * Elimina la cookie de autenticación
 */
export const clearAuthCookie = (): void => {
  deleteCookie('token');
};