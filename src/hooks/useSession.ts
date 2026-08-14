'use client';
import { useEffect, useState } from 'react';
import { getStoredUser, type UsuarioSesion } from '@/lib/api';

// Devuelve la sesión del usuario SOLO después del montaje en el cliente.
// En el servidor (SSR) no existe localStorage, así que arranca en null y el
// HTML renderizado por el servidor nunca contiene contenido dependiente de
// la sesión. Esto evita el error de hidratación "server rendered HTML didn't
// match the client" al comparar el render del servidor con el del cliente.
export function useSession(): UsuarioSesion | null {
  const [user, setUser] = useState<UsuarioSesion | null>(null);

  useEffect(() => {
    // Se difiere la lectura para evitar setState síncrono en el efecto y
    // asegurar que el primer render (servidor y cliente) sea idéntico.
    const t = window.setTimeout(() => setUser(getStoredUser()), 0);
    return () => window.clearTimeout(t);
  }, []);

  return user;
}
