interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date | string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Parsea cookies del navegador y devuelve el valor de una cookie específica
 */
export function parseCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

/**
 * Serializa un nombre y valor de cookie con opciones
 */
export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  let cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);
  
  if (options.path) {
    cookie += '; path=' + options.path;
  }
  
  if (options.domain) {
    cookie += '; domain=' + options.domain;
  }
  
  if (options.maxAge !== undefined) {
    cookie += '; max-age=' + options.maxAge;
  }
  
  if (options.expires) {
    const expires = typeof options.expires === 'string' 
      ? options.expires 
      : options.expires.toUTCString();
    cookie += '; expires=' + expires;
  }
  
  if (options.httpOnly) {
    cookie += '; HttpOnly';
  }
  
  if (options.secure) {
    cookie += '; Secure';
  }
  
  if (options.sameSite) {
    cookie += '; SameSite=' + options.sameSite;
  }
  
  return cookie;
}

/**
 * Obtiene todas las cookies como un objeto
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  
  const cookies: Record<string, string> = {};
  document.cookie.split(';').forEach(cookie => {
    const parts = cookie.trim().split('=');
    if (parts.length === 2) {
      const name = decodeURIComponent(parts[0]);
      const value = decodeURIComponent(parts[1]);
      cookies[name] = value;
    }
  });
  
  return cookies;
}

/**
 * Borra una cookie específica
 */
export function removeCookie(name: string, options: CookieOptions = {}): void {
  document.cookie = serializeCookie(name, '', {
    ...options,
    maxAge: -1
  });
}
